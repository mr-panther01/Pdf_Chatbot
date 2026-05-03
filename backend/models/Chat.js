import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'] },
      content: { type: String }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Chat', chatSchema);
