import Document from "../models/Document.model";


const documentRepository={
    create(payload: any){
        return Document.create(payload);
    },

    findById(id: string){
        return Document.findById(id).exec();
    },

    updateById(id: string, payload:any){
        return Document.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        }).exec();
    },

};

export default documentRepository;