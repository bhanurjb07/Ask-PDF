import Document from "../models/Document.model";

interface FindAllOptions{
    limit?: number;
}

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

    findAll(filter = {}, options: FindAllOptions = {}) {
        const query = Document.find(filter).sort({ uploadedAt: -1 });

        if(options.limit) {
            query.limit(options.limit);
        }
        return query.exec();
    },

    findByIdWithText(id: string){
        return Document.findById(id).select('+rawText').exec();
    },

};

export default documentRepository;