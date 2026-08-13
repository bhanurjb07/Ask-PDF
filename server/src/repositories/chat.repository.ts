import Chat from '../models/Chat.model.js';

const chatRepository = {
  create(payload: any) {
    return Chat.create(payload);
  },

  findByDocumentId(documentId: string, { skip = 0, limit = 50 } = {}) {
    return Chat.find({ documentId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  },

  deleteByDocumentId(documentId: string) {
    return Chat.deleteMany({ documentId }).exec();
  },
};

export default chatRepository;