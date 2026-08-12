declare global{
  namespace Express{
    interface Request{
      file?: {
        originalname: string;
        filename: string;
        path?: string;
        mimetype: string;
        size: number;
      };
    }
  }
}

export {};