import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FileUp, Send, Trash2, Settings, Loader2, Bot, User, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function App() {
  const [messages, setMessages] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [file, setFile] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pdfProcessed, setPdfProcessed] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let sid = localStorage.getItem('pdf_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('pdf_session_id', sid);
    }
    setSessionId(sid);
    
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    // Fetch history
    axios.get(`http://localhost:5000/api/history/${sid}`)
      .then(res => {
        if (res.data.messages && res.data.messages.length > 0) {
          setMessages(res.data.messages);
          setPdfProcessed(true); // Assume processed if history exists
        }
      })
      .catch(err => console.error("Error fetching history:", err));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleApiKeyChange = (e) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('sessionId', sessionId);
    formData.append('apiKey', apiKey);

    try {
      await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPdfProcessed(true);
      setMessages([]);
      alert("PDF processed successfully!");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Error uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setPdfProcessed(false);
    setFile(null);
    // Optionally trigger a backend clear
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || !pdfProcessed) return;

    const userMessage = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsTyping(true);

    try {
      const res = await axios.post('http://localhost:5000/api/chat', {
        sessionId,
        prompt: userMessage.content,
        apiKey
      });
      
      setMessages(res.data.history);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Error: " + (error.response?.data?.error || error.message) 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div className="w-80 glass-panel border-r border-slate-700/50 flex flex-col z-10">
        <div className="p-6 border-b border-slate-700/50 flex items-center gap-3">
          <div className="bg-violet-600/20 p-2 rounded-xl">
            <Bot className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
              PDF Agent
            </h1>
            <p className="text-xs text-slate-400">Strictly grounded chat</p>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Config Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Configuration
            </h2>
            
            <div className="space-y-2">
              <label className="text-xs text-slate-500 block">Gemini API Key</label>
              <input 
                type="password" 
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter API Key"
                className="w-full glass-input px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </div>

          <div className="h-px bg-slate-700/50 w-full my-4"></div>

          {/* Upload Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
              <FileUp className="w-4 h-4" /> Document Source
            </h2>
            
            <div className="relative group cursor-pointer">
              <input 
                type="file" 
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="glass-input border-dashed border-2 border-slate-600 rounded-xl p-6 text-center group-hover:border-violet-500/50 transition-colors">
                <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-violet-400" />
                <p className="text-sm font-medium text-slate-300">
                  {file ? file.name : "Drag & drop or click to upload PDF"}
                </p>
              </div>
            </div>

            <button 
              onClick={handleUpload}
              disabled={!file || isUploading || !apiKey}
              className="w-full glass-button py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isUploading ? 'Processing...' : 'Process PDF'}
            </button>
            
            {pdfProcessed && (
              <p className="text-xs text-emerald-400 flex items-center justify-center gap-1 mt-2">
                <CheckCircle2 className="w-3 h-3" /> PDF Loaded & Ready
              </p>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-slate-700/50">
          <button 
            onClick={handleClear}
            className="w-full glass-button-secondary py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
          >
            <Trash2 className="w-4 h-4" />
            Clear Chat & PDF
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-slate-900/50">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Bot className="w-16 h-16 mb-4 opacity-50 text-violet-400" />
              <h2 className="text-xl font-medium text-slate-400">Ready to Answer</h2>
              <p className="text-sm mt-2 max-w-md text-center">
                Upload a PDF document and ask any questions. Answers will be strictly grounded in the document with page citations.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-violet-500/20 text-violet-400'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`glass-panel rounded-2xl p-5 ${msg.role === 'user' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-50' : 'bg-slate-800/50'}`}>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex gap-4 max-w-4xl mx-auto">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-violet-500/20 text-violet-400">
                <Bot className="w-4 h-4" />
              </div>
              <div className="glass-panel rounded-2xl p-5 bg-slate-800/50 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                <span className="text-sm text-slate-400">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 pb-8 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
            <input 
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={pdfProcessed ? "Ask a question about the PDF..." : "Please process a PDF first..."}
              disabled={!pdfProcessed || isTyping}
              className="w-full glass-input px-6 py-4 rounded-2xl pr-16 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={!prompt.trim() || !pdfProcessed || isTyping}
              className="absolute right-2 p-2.5 rounded-xl glass-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
