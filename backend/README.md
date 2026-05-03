# PDF AI - Backend

The server-side logic for the PDF AI application, powered by Node.js, Express, and LangChain.

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Configuration
Create a `.env` file:
```env
PORT=5000
GOOGLE_API_KEY=your_gemini_api_key_here
```

### Run Server
```bash
node server.js
```

## 🛠️ Key Components
- **Server (`server.js`)**: Main entry point, handles PDF processing, vector store creation, and RAG-based chat.
- **Models (`models/Chat.js`)**: Mongoose schema for storing chat sessions and history.
- **RAG Pipeline**: Uses LangChain to split documents, generate embeddings (Gemini), and retrieve relevant context for answering.

## 📡 API Endpoints
- `POST /api/upload`: Accepts a PDF file and processes it.
- `POST /api/chat`: Takes a user prompt and returns a grounded AI response with citations.
- `GET /api/history/:sessionId`: Retrieves chat history for a specific session.
