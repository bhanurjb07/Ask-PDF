import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    chunkIndex:{
      type: Number,
      required: true,
      min: 0,
    },
    chunkText:{
      type: String,
      required: true,
      trim: true,
    },
    wordCount:{
      type: Number,
      required: true,
      min: 1,
    },
    characterCount: {
      type: Number,
      required: true,
      min: 1,
    },
    startWord:{
      type: Number,
      required: true,
      min: 0,
    },
    endWord:{
      type: Number,
      required: true,
      min: 0,
    },
    pageStart:{
      type: Number,
      default: null,
    },
    pageEnd:{
      type: Number,
      default: null,
    },
    tokenEstimate:{
      type: Number,
      required: true,
      min: 0,
    },
    embedding:{
      type: [Number],
      default: undefined,
      select: false,
    },
    embeddingModel:{
      type: String,
      default: null,
    },
    embeddingDimensions: {
      type: Number,
      default: null,
    },
    embeddedAt: {
      type: Date,
      default: null,
    },
    embeddingVersion: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

//prevent duplicate chunk indexes in same doc.
chunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });

//speed up queries for document chunks sorted by creation time
chunkSchema.index({ documentId: 1, createdAt: -1 });

//Speed up queries for document chunks by embedding status
chunkSchema.index({ documentId: 1, embeddedAt: 1 });

const Chunk = mongoose.model('Chunk', chunkSchema);

export default Chunk;