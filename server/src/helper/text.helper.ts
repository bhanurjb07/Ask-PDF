//pagination for long text ()
export const paginateText=(text='', limit=2000, offset=0)=>{         //full document text, how many characters to return, where to start
    const safeLimit= Math.min(Math.max(Number(limit) || 2000, 1), 20000);

    const safeOffset= Math.max(Number(offset) || 0, 0);
    
    const full = String(text);
    
    const slice= full.slice(safeOffset, safeOffset+safeLimit);

    return{
        text: slice,
        limit: safeLimit,
        offset: safeOffset,
        totalCharacters: full.length,
        hasMore: safeOffset + safeLimit < full.length,
    };
};
