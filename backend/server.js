import express from 'express';
import cors from 'cors';
import multer from 'multer';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import Chat from './models/Chat.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Set up in-memory MongoDB to avoid requiring a local MongoDB installation
async function startDB() {
    try {
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log(`Connected to in-memory MongoDB at ${mongoUri}`);
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
}
startDB();

const upload = multer({ dest: 'uploads/' });

// In-memory store for vector stores per session
const vectorStores = {};

app.post('/api/upload', upload.single('pdf'), async (req, res) => {
    try {
        const { sessionId, apiKey } = req.body;
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        if (!sessionId) return res.status(400).json({ error: 'Session ID required' });
        
        const loader = new PDFLoader(req.file.path);
        const docs = await loader.load();
        
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        
        const splits = await splitter.splitDocuments(docs);
        
        // Add 1 to page numbers as 1-indexed pages
        splits.forEach(split => {
            if (split.metadata.loc && split.metadata.loc.pageNumber) {
                split.metadata.page = split.metadata.loc.pageNumber;
            } else if (split.metadata.page !== undefined) {
                 // Some loaders might use just page
                 split.metadata.page += 1;
            } else {
                 split.metadata.page = 1;
            }
        });

        console.log('Starting local embedding processing...');
        const embeddings = new HuggingFaceTransformersEmbeddings({
            modelName: 'Xenova/all-MiniLM-L6-v2',
            // Render has a read-only filesystem in some areas, so we use /tmp for caching the model
            cacheDir: '/tmp/huggingface-cache'
        });
        
        console.log('Generating vector store...');
        const vectorStore = await MemoryVectorStore.fromDocuments(splits, embeddings);
        vectorStores[sessionId] = vectorStore;
        console.log('Vector store created successfully.');
        
        // Delete uploaded file
        fs.unlinkSync(req.file.path);
        
        // Clear previous chat history for this session
        await Chat.findOneAndDelete({ sessionId });
        await Chat.create({ sessionId, messages: [] });

        res.json({ message: 'PDF processed successfully' });
    } catch (error) {
        console.error('UPLOAD ERROR DETAILED:', error);
        res.status(500).json({ error: `Upload failed: ${error.message}` });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { sessionId, prompt, apiKey } = req.body;
        
        if (!vectorStores[sessionId]) {
            return res.status(400).json({ error: 'Please upload a PDF first.' });
        }
        
        let chat = await Chat.findOne({ sessionId });
        if (!chat) {
            chat = new Chat({ sessionId, messages: [] });
        }
        
        chat.messages.push({ role: 'user', content: prompt });
        await chat.save();
        
        const llm = new ChatGoogleGenerativeAI({
            model: 'gemini-2.5-flash',
            temperature: 0,
            apiKey: apiKey || process.env.GOOGLE_API_KEY
        });
        
        const systemPrompt = `You are an assistant for question-answering tasks.
You must strictly use the provided context to answer the user's question.
If you don't know the answer or the answer is not present in the context, you MUST explicitly say 'I cannot answer this question based on the provided document'.
Do not attempt to answer questions outside the scope of the document.
When you answer, you MUST include citations to the specific page number(s) where the information was found, like '(Page X)' or '[Page X]'.

Context:
{context}`;

        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", systemPrompt],
            ["human", "{input}"]
        ]);
        
        const retriever = vectorStores[sessionId].asRetriever({ k: 4 });
        
        const questionAnswerChain = await createStuffDocumentsChain({
            llm,
            prompt: promptTemplate
        });
        
        const chain = await createRetrievalChain({
            retriever,
            combineDocsChain: questionAnswerChain
        });
        
        const response = await chain.invoke({ input: prompt });
        let answer = response.answer;
        
        const sources = new Set();
        response.context.forEach(doc => {
            if (doc.metadata && doc.metadata.page) {
                sources.add(doc.metadata.page.toString());
            }
        });
        
        if (sources.size > 0 && !answer.includes("I cannot answer")) {
            const sortedSources = Array.from(sources).sort((a,b) => parseInt(a) - parseInt(b));
            answer += `\n\n*Sources: Pages ${sortedSources.join(', ')}*`;
        }
        
        chat.messages.push({ role: 'assistant', content: answer });
        await chat.save();
        
        res.json({ answer, history: chat.messages });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/history/:sessionId', async (req, res) => {
    try {
        const chat = await Chat.findOne({ sessionId: req.params.sessionId });
        res.json({ messages: chat ? chat.messages : [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
