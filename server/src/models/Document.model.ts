import mongoose,{ Schema, Document as MongooseDocument } from 'mongoose';
import { DOCUMENT_STATUS } from '../constants/index.js';

export interface IDocument extends MongooseDocument{
  originalName: string;
  storedName: string;
  filePath: string;
  mimeType: 'application/pdf';
  fileSize: number;
  status: string;
  rawText?: string | null;
  pageCount?: number | null;
  wordCount?: number | null;
  characterCount?: number | null;
  averageWordsPerPage?: number | null;
  pdfMetadata?: Record<string, any> | null;
  processingStartedAt?: Date | null;
  processingCompletedAt?: Date | null;
  processingDuration?: number | null;
  failureReason?: string | null;
  chunkCount: number;
  embeddedChunkCount: number;
  uploadedAt: Date;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    storedName: {
      type: String,
      required: [true, 'Stored file name is required'],
      unique: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['application/pdf'],
    },
    fileSize: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: Object.values(DOCUMENT_STATUS),
      default: DOCUMENT_STATUS.UPLOADED,
      index: true,
    },
    rawText: {
      type: String,
      default: null,
      select: false,
    },
    pageCount: {
      type: Number,
      default: null,
    },
    wordCount: {
      type: Number,
      default: null,
    },
    characterCount: {
      type: Number,
      default: null,
    },
    averageWordsPerPage: {
      type: Number,
      default: null,
    },
    pdfMetadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    processingStartedAt: {
      type: Date,
      default: null,
    },
    processingCompletedAt: {
      type: Date,
      default: null,
    },
    processingDuration: {
      type: Number,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
    chunkCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    embeddedChunkCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdBy: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

documentSchema.index({ status: 1, uploadedAt: -1 });
documentSchema.index({ originalName: 1 });

const Document = mongoose.model<IDocument>('Document', documentSchema);

export default Document;