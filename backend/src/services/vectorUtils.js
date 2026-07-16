/**
 * Vector math utilities for content-based recommendations
 * Implements TF-IDF and cosine similarity
 */

/**
 * Build a vocabulary from a collection of documents (tag/skill arrays)
 * @param {string[][]} documents - Array of token arrays
 * @returns {string[]} Sorted unique vocabulary
 */
const buildVocabulary = (documents) => {
  const vocab = new Set();
  documents.forEach((doc) => doc.forEach((token) => vocab.add(token.toLowerCase())));
  return Array.from(vocab).sort();
};

/**
 * Compute term frequency for a document
 * @param {string[]} tokens - Document tokens
 * @param {string[]} vocabulary - Global vocabulary
 * @returns {number[]} TF vector
 */
const termFrequency = (tokens, vocabulary) => {
  const normalized = tokens.map((t) => t.toLowerCase());
  const tf = new Array(vocabulary.length).fill(0);

  vocabulary.forEach((term, i) => {
    const count = normalized.filter((t) => t === term).length;
    tf[i] = tokens.length > 0 ? count / tokens.length : 0;
  });

  return tf;
};

/**
 * Compute inverse document frequency
 * @param {string[][]} documents - All documents
 * @param {string[]} vocabulary - Global vocabulary
 * @returns {number[]} IDF vector
 */
const inverseDocumentFrequency = (documents, vocabulary) => {
  const N = documents.length;
  const idf = new Array(vocabulary.length).fill(0);

  vocabulary.forEach((term, i) => {
    const docsContaining = documents.filter((doc) =>
      doc.some((t) => t.toLowerCase() === term)
    ).length;
    idf[i] = docsContaining > 0 ? Math.log(N / docsContaining) + 1 : 0;
  });

  return idf;
};

/**
 * Compute TF-IDF vector for a document
 * @param {string[]} tokens - Document tokens
 * @param {string[]} vocabulary - Global vocabulary
 * @param {number[]} idfVector - Pre-computed IDF values
 * @returns {number[]} TF-IDF vector
 */
const tfidf = (tokens, vocabulary, idfVector) => {
  const tf = termFrequency(tokens, vocabulary);
  return tf.map((val, i) => val * idfVector[i]);
};

/**
 * Compute cosine similarity between two vectors
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} Similarity score between 0 and 1
 */
const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Compute Pearson correlation between two vectors (for collaborative filtering)
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} Correlation between -1 and 1
 */
const pearsonCorrelation = (vecA, vecB) => {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  const n = vecA.length;
  const meanA = vecA.reduce((s, v) => s + v, 0) / n;
  const meanB = vecB.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let denomA = 0;
  let denomB = 0;

  for (let i = 0; i < n; i++) {
    const diffA = vecA[i] - meanA;
    const diffB = vecB[i] - meanB;
    numerator += diffA * diffB;
    denomA += diffA * diffA;
    denomB += diffB * diffB;
  }

  const denominator = Math.sqrt(denomA) * Math.sqrt(denomB);
  if (denominator === 0) return 0;

  return numerator / denominator;
};

module.exports = {
  buildVocabulary,
  termFrequency,
  inverseDocumentFrequency,
  tfidf,
  cosineSimilarity,
  pearsonCorrelation,
};
