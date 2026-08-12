import mongoose from 'mongoose';

interface IRetrievedChunk{
  chunkIndex: number;
  similarity: number;
  pageStart: number;
  pageEnd: number;
  preview: string;
}

interface IChat{
  documentId: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  retrievedChunks: IRetrievedChunk[];
  responseTime: number | null;
  tokenUsage: {
    promptTokens: number | null;
    candidatesTokens: number | null;
    totalTokens: number | null;
  };
  model: string | null;
  usedGemini: boolean;
}

const retrievedChunkSchema = new mongoose.Schema<IRetrievedChunk>(
  {
    chunkIndex: Number,
    similarity: Number,
    pageStart: Number,
    pageEnd: Number,
    preview: String,
  },
  { _id: false },
);

const chatSchema =new mongoose.Schema<IChat>(
  {
    documentId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },

    question:{
      type: String,
      required: true,
      trim: true,
    },

    answer:{
      type: String,
      required: true,
    },

    retrievedChunks:{
      type: [retrievedChunkSchema],
      default: [],
    },

    responseTime:{
      type: Number,
      default: null,
    },

    tokenUsage:{
      promptTokens: {
        type: Number,
        default: null,
      },
      candidatesTokens: {
        type: Number,
        default: null,
      },
      totalTokens: {
        type: Number,
        default: null,
      },
    },

    model:{
      type: String,
      default: null,
    },

    usedGemini: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

chatSchema.index({ documentId: 1, createdAt: -1 });
const Chat = mongoose.model<IChat>('Chat', chatSchema);

export default Chat;