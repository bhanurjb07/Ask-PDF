import Chunk from '../models/Chunk.model.js';

//chunk data-access only. No business rules.
const chunkRepository = {
  //insert multiple chunks
  insertMany(chunks: any[]) {
    if (!chunks?.length) {
      return [];
    }

    return Chunk.insertMany(chunks, { ordered: true });
  },

  //delete chunks by document ID
  deleteByDocumentId(documentId: string) {
    return Chunk.deleteMany({ documentId }).exec();
  },

  //find chunks by document ID
  findByDocumentId(documentId: string, { skip = 0, limit = 20 } = {}) {
    return Chunk.find({ documentId })
      .sort({ chunkIndex: 1 })
      .skip(skip)
      .limit(limit)
      .select(
        'documentId chunkIndex chunkText wordCount characterCount startWord endWord pageStart pageEnd tokenEstimate embeddingModel embeddingDimensions embeddedAt embeddingVersion createdAt updatedAt',
      )
      .exec();
  },

  //count chunks by document ID
  countByDocumentId(documentId: string) {
    return Chunk.countDocuments({ documentId }).exec();
  },

  // Count embedded chunks
  countEmbeddedByDocumentId(documentId: string) {
    return Chunk.countDocuments({
      documentId,
      embedding: { $exists: true, $ne: [] },
      embeddedAt: { $ne: null },
    }).exec();
  },

  // Find chunks without embeddings
  findWithoutEmbeddings(documentId: string) {
    return Chunk.find({
      documentId,
      $or: [
        { embeddedAt: null },
        { embeddedAt: { $exists: false } },
      ],
    })
      .sort({ chunkIndex: 1 })
      .select('+embedding chunkText chunkIndex documentId')
      .exec();
  },

  // Find embedded chunks
  findEmbeddedByDocumentId(documentId: string) {
    return Chunk.find({
      documentId,
      embeddedAt: { $ne: null },
      embedding: { $exists: true, $type: 'array', $not: { $size: 0 } },
    })
      .sort({ chunkIndex: 1 })
      .select(
        '+embedding chunkIndex chunkText wordCount pageStart pageEnd characterCount',
      )
      .lean()
      .exec();
  },

  // Update embeddings in bulk
  bulkUpdateEmbeddings(updates: any[]) {
    if (!updates?.length) {
      return { modifiedCount: 0 };
    }

    const ops = updates.map((item) => ({
      updateOne: {
        filter: { _id: item.chunkId },
        update: {
          $set: {
            embedding: item.embedding,
            embeddingModel: item.embeddingModel,
            embeddingDimensions: item.embeddingDimensions,
            embeddedAt: item.embeddedAt,
            embeddingVersion: item.embeddingVersion,
          },
        },
      },
    }));

    return Chunk.bulkWrite(ops, { ordered: false });
  },
};

export default chunkRepository;