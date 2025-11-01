import { GoogleGenerativeAI } from "@google/generative-ai";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

import { db } from "./firebase";

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

// Chunk text into smaller pieces for better embedding
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }

  return chunks;
}

// Generate embeddings using Gemini
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Store document chunks with embeddings in Firestore
export async function storeDocumentChunks(
  documentName: string,
  text: string,
  metadata?: Record<string, any>
) {
  const chunks = chunkText(text);
  const storedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);

    const docRef = await addDoc(collection(db, "market_docs"), {
      documentName,
      content: chunk,
      chunkIndex: i,
      totalChunks: chunks.length,
      embedding,
      metadata: metadata || {},
      createdAt: new Date(),
    });

    storedChunks.push({ id: docRef.id, chunk, chunkIndex: i });
  }

  return storedChunks;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Search for relevant document chunks
export async function searchDocuments(
  queryText: string,
  topK: number = 5,
  documentName?: string
): Promise<Array<{ content: string; similarity: number; metadata: any }>> {
  const queryEmbedding = await generateEmbedding(queryText);

  // Get all documents (or filter by documentName)
  let q = query(collection(db, "market_docs"));
  if (documentName) {
    q = query(collection(db, "market_docs"), where("documentName", "==", documentName));
  }

  const querySnapshot = await getDocs(q);
  const results: Array<{ content: string; similarity: number; metadata: any }> = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const similarity = cosineSimilarity(queryEmbedding, data.embedding);
    results.push({
      content: data.content,
      similarity,
      metadata: data.metadata || {},
    });
  });

  // Sort by similarity and return top K
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}
