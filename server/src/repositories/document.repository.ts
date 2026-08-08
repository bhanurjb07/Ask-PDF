import Document from "../models/Document.model";


const documentRepository={
    create(payload: any){
        return Document.create(payload);
    },

    findById(id: string){
        return Document.findById(id).exec();
    },

};

export default documentRepository;