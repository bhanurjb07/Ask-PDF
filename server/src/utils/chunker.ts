import { CHUNKING } from '../constants/index.js';
import { cleanExtractedText, countWords } from '../helper/text.helper.js';

// Normalize extracted text before chunking.
export const normalizeText = (input: string = '') => cleanExtractedText(input);

// Estimate token count from word count.
export const estimateTokens = (wordCount: number) => {
  const words = Number(wordCount) || 0;
  if (words <= 0) {
    return 0;
  }

  return Math.ceil(words / CHUNKING.WORDS_PER_TOKEN);
};

// Calculate statistics for generated chunks.
export const calculateStatistics = (chunks: any[] = []) => {
  const chunkCount = chunks.length;
  const totalWords = chunks.reduce((sum, c) => sum + (c.wordCount || 0), 0);
  const totalCharacters = chunks.reduce(
    (sum, c) => sum + (c.characterCount || 0),
    0,
  );
  const totalTokens = chunks.reduce((sum, c) => sum + (c.tokenEstimate || 0), 0);

  return {
    chunkCount,
    totalWords,
    totalCharacters,
    totalTokens,
    averageWordsPerChunk:
      chunkCount > 0 ? Number((totalWords / chunkCount).toFixed(2)) : 0,
  };
};

// Split text into individual sentences.
const splitIntoSentences = (text: string) => {
  const normalized = String(text).trim();
  if (!normalized) {
    return [];
  }

  // Keep sentence-ending punctuation with the sentence.
  const parts = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return (parts || [normalized]).map((s) => s.trim()).filter(Boolean);
};

// Get individual words from text.
const wordsOf = (text: string) => String(text).trim().split(/\s+/).filter(Boolean);

// Split long sentences into smaller word windows.
const splitLongSentence = (sentence: string, maxWords: number) => {
  const words = wordsOf(sentence);
  if (words.length <= maxWords) {
    return [sentence];
  }

  const pieces: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    pieces.push(words.slice(i, i + maxWords).join(' '));
  }
  return pieces;
};

// Estimate the page number for a word position.
const estimatePage = (
  wordPosition: number,
  totalWords: number,
  pageCount: number | null,
) => {
  if (!pageCount || pageCount < 1 || !totalWords) {
    return null;
  }

  const wordsPerPage = totalWords / pageCount;
  const page = Math.floor(wordPosition / wordsPerPage) + 1;
  return Math.min(Math.max(page, 1), pageCount);
};

// Split normalized text into overlapping chunks.
export const splitIntoChunks = (
  text: string,
  options: {
    chunkSizeWords?: number;
    overlapWords?: number;
    pageCount?: number | null;
  } = {},
) => {
  const chunkSize = options.chunkSizeWords ?? CHUNKING.CHUNK_SIZE_WORDS;
  const overlap = options.overlapWords ?? CHUNKING.OVERLAP_WORDS;
  const pageCount = options.pageCount ?? null;

  if (chunkSize <= 0) {
    const error = new Error('Chunk size must be greater than 0') as Error & {
      code?: string;
    };
    error.code = 'INVALID_CHUNK_SIZE';
    throw error;
  }

  if (overlap < 0 || overlap >= chunkSize) {
    const error = new Error('Overlap must be >= 0 and smaller than chunk size') as Error & {
      code?: string;
    };
    error.code = 'INVALID_OVERLAP';
    throw error;
  }

  const normalized = normalizeText(text);
  if (!normalized) {
    const error = new Error('No text available for chunking') as Error & {
      code?: string;
    };
    error.code = 'NO_TEXT_FOR_CHUNKING';
    throw error;
  }

  // Expand long sentences into word-bounded pieces first.
  const sentenceUnits = splitIntoSentences(normalized).flatMap((sentence) =>
    splitLongSentence(sentence, chunkSize),
  );

  const allWords = wordsOf(normalized);
  const totalWords = allWords.length;

  const chunks: any[] = [];
  let currentSentences: string[] = [];
  let currentWordCount = 0;
  let cursorWord = 0; // absolute start word index of current chunk

  const flush = () => {
    if (!currentSentences.length || currentWordCount === 0) {
      return;
    }

    const chunkText = currentSentences.join(' ').replace(/\s+/g, ' ').trim();
    if (!chunkText) {
      return;
    }

    const wordCount = wordsOf(chunkText).length;
    if (wordCount === 0) {
      return;
    }

    const startWord = cursorWord;
    const endWord = startWord + wordCount - 1;

    chunks.push({
      chunkIndex: chunks.length,
      chunkText,
      wordCount,
      characterCount: chunkText.length,
      startWord,
      endWord,
      pageStart: estimatePage(startWord, totalWords, pageCount),
      pageEnd: estimatePage(endWord, totalWords, pageCount),
      tokenEstimate: estimateTokens(wordCount),
    });
  };

  for (const unit of sentenceUnits) {
    const unitWords = wordsOf(unit).length;

    if (currentWordCount > 0 && currentWordCount + unitWords > chunkSize) {
      flush();

      // Overlap: keep last N words from previous chunk as the next start.
      const prev = chunks[chunks.length - 1];
      const prevWords = wordsOf(prev.chunkText);
      const overlapWordsList = prevWords.slice(-overlap);
      const overlapText = overlapWordsList.join(' ');

      currentSentences = overlapText ? [overlapText] : [];
      currentWordCount = overlapWordsList.length;
      cursorWord = Math.max(prev.endWord + 1 - overlapWordsList.length, 0);
    }

    // If a single unit still exceeds capacity (edge case), force-split by words.
    if (unitWords > chunkSize && currentWordCount === 0) {
      const forced = splitLongSentence(unit, chunkSize);
      for (const piece of forced) {
        currentSentences = [piece];
        currentWordCount = wordsOf(piece).length;
        flush();
        const prev = chunks[chunks.length - 1];
        const prevWords = wordsOf(prev.chunkText);
        const overlapWordsList = prevWords.slice(-overlap);
        currentSentences = overlapWordsList.length
          ? [overlapWordsList.join(' ')]
          : [];
        currentWordCount = overlapWordsList.length;
        cursorWord = Math.max(prev.endWord + 1 - overlapWordsList.length, 0);
      }
      continue;
    }

    currentSentences.push(unit);
    currentWordCount += unitWords;
  }

  flush();

  // Drop empty chunks (safety)
  const nonEmpty = chunks.filter((c) => c.chunkText && c.wordCount > 0);

  if (!nonEmpty.length) {
    const error = new Error('Chunking produced no chunks') as Error & {
      code?: string;
    };
    error.code = 'EMPTY_CHUNKS';
    throw error;
  }

  // Re-index after filtering
  return nonEmpty.map((chunk, index) => ({
    ...chunk,
    chunkIndex: index,
  }));
};

export default {
  normalizeText,
  splitIntoChunks,
  estimateTokens,
  calculateStatistics,
};