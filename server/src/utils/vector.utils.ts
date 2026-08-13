
export const dotProduct = (a: number[] = [], b: number[] = []) => {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    throw new Error('Vectors must be arrays');
  }

  if (a.length === 0 || b.length === 0) {
    throw new Error('Vectors must be non-empty');
  }

  if (a.length !== b.length) {
    const error = new Error(
      `Vector dimension mismatch: ${a.length} vs ${b.length}`,
    ) as Error & { code?: string };
    error.code = 'DIMENSION_MISMATCH';
    throw error;
  }

  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i] * b[i];
  }

  return sum;
};

// Calculate the L2 magnitude of a vector.
export const vectorMagnitude = (vector: number[] = []) => {
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error('Vector must be a non-empty array');
  }

  let sumSquares = 0;
  for (let i = 0; i < vector.length; i += 1) {
    sumSquares += vector[i] * vector[i];
  }

  return Math.sqrt(sumSquares);
};

// Return a normalized unit-length vector.
export const normalizeVector = (vector: number[] = []) => {
  const magnitude = vectorMagnitude(vector);

  if (magnitude === 0) {
    const error = new Error('Cannot normalize a zero vector') as Error & {
      code?: string;
    };
    error.code = 'ZERO_VECTOR';
    throw error;
  }

  return vector.map((value) => value / magnitude);
};

// Calculate cosine similarity between two vectors.
export const cosineSimilarity = (a: number[] = [], b: number[] = []) => {
  const magnitudeA = vectorMagnitude(a);
  const magnitudeB = vectorMagnitude(b);

  if (magnitudeA === 0 || magnitudeB === 0) {
    const error = new Error(
      'Cannot compute cosine similarity with a zero vector',
    ) as Error & {
      code?: string;
    };
    error.code = 'ZERO_VECTOR';
    throw error;
  }

  return dotProduct(a, b) / (magnitudeA * magnitudeB);
};

export default {
  cosineSimilarity,
  dotProduct,
  normalizeVector,
  vectorMagnitude,
};