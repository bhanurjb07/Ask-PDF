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

//word count 
export const countWords =(text = '') =>{
  const trimmed = String(text).trim();
  if(!trimmed){
    return 0;
  }

  return trimmed.split(/\s+/).filter(Boolean).length;
};

//
export const cleanExtractedText = (input = '') => {
  let text = String(input);

  // Normalize line endings to \n
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  //collapse runs of spaces/tabs inside a line (keep newlines)
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trimEnd())
    .join('\n');

  //remove excessive blank lines (keep at most one empty line)
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
};