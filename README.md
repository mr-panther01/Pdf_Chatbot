# PDF AI - Conversational PDF Assistant

PDF AI is a modern web application that allows users to upload PDF documents and engage in a grounded conversation with an AI assistant. The AI strictly answers based on the document's content and provides page-level citations for every response.

![PDF AI Demo](https://raw.githubusercontent.com/yourusername/pdf-ai/main/demo-screenshot.png) *(Placeholder for demo image)*

## 🚀 Features

- **PDF Upload & Processing**: Seamlessly upload and process PDF documents.
- **Grounded AI Responses**: The assistant only answers using the information provided in the PDF, preventing hallucinations.
- **Page Citations**: Every answer includes the specific page numbers where the information was found.
- **Chat History**: Maintains conversation context within a session.
- **Glassmorphism UI**: A stunning, modern interface with smooth animations and dark mode.
- **Session-Based Isolation**: Uploaded documents and vector stores are isolated per session.

## 🛠️ Tech Stack

### Frontend
- **React** (Vite)
- **Tailwind CSS** (Modern Styling)
- **Glassmorphism UI** (Custom Design)
- **Lucide React** (Icons)

### Backend
- **Node.js & Express**
- **LangChain** (RAG Framework)
- **Google Gemini API** (LLM & Embeddings)
- **MongoDB** (In-memory via `mongodb-memory-server`)
- **Multer** (File uploads)

## 📋 Prerequisites

- Node.js (v18 or higher)
- Google Gemini API Key (get one at [Google AI Studio](https://aistudio.google.com/))

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/pdf-ai.git
cd pdf-ai
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
GOOGLE_API_KEY=your_gemini_api_key_here
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

## 🏃 Running the Application

### Start the Backend
```bash
cd backend
node server.js
```
The server will run on `http://localhost:5000`.

### Start the Frontend
```bash
cd frontend
npm run dev
```
The application will be available at `http://localhost:5173`.

## 📖 Usage

1. Open the application in your browser.
2. Enter your **Google API Key** (optional if set in backend `.env`).
3. Click on the upload area to select a **PDF file**.
4. Once processed, start asking questions about the document in the chat interface.
5. View citations at the bottom of each AI response.

## 🔒 Security & Privacy

- **In-Memory Storage**: PDF content and vector embeddings are stored in memory and are not persisted across server restarts.
- **Session Isolation**: Each user session is unique, ensuring your data remains private.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ by Aditya Sharma
