import { GoogleGenerativeAI } from "@google/generative-ai";
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";

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
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text is empty or invalid');
    }

    // Limit text length for embedding (Gemini has limits)
    const maxLength = 2048;
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;
    
    console.log(`Generating embedding for text of length: ${truncatedText.length}`);
    
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
    }
    
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(truncatedText);
    
    if (!result.embedding || !result.embedding.values) {
      console.error('Invalid embedding result:', result);
      throw new Error('No embedding returned from API');
    }
    
    const embeddingValues = result.embedding.values;
    console.log(`Embedding generated successfully: ${embeddingValues.length} dimensions`);
    
    // Validate the embedding array
    if (!Array.isArray(embeddingValues)) {
      throw new Error('Embedding values is not an array');
    }
    
    if (embeddingValues.length === 0) {
      throw new Error('Embedding array is empty');
    }
    
    // Check for invalid values
    const hasInvalidValues = embeddingValues.some(val => 
      typeof val !== 'number' || isNaN(val) || !isFinite(val)
    );
    
    if (hasInvalidValues) {
      throw new Error('Embedding contains invalid numeric values');
    }
    
    return embeddingValues;
  } catch (error: any) {
    console.error('Embedding generation error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

// Store document chunks with embeddings in Firestore
export async function storeDocumentChunks(
  documentName: string,
  text: string,
  metadata?: Record<string, any>
) {
  console.log(`Starting to process document: ${documentName}`);
  console.log(`Text length: ${text.length} characters`);
  
  const chunks = chunkText(text);
  console.log(`Created ${chunks.length} chunks`);
  
  const storedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    try {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
      
      // Generate embedding
      const embedding = await generateEmbedding(chunk);
      console.log(`Generated embedding with ${embedding.length} dimensions`);
      
      // Validate embedding array
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error(`Invalid embedding generated for chunk ${i}`);
      }

      // Validate embedding values are numbers
      const validEmbedding = embedding.every(val => typeof val === 'number' && !isNaN(val));
      if (!validEmbedding) {
        throw new Error(`Embedding contains invalid values for chunk ${i}`);
      }

      // Convert to plain array to avoid Firestore issues
      const embeddingArray = Array.from(embedding);
      
      // Store in Firestore with proper array handling
      const docRef = await addDoc(collection(db, "market_docs"), {
        documentName,
        content: chunk,
        chunkIndex: i,
        totalChunks: chunks.length,
        embedding: embeddingArray,
        metadata: metadata || {},
        createdAt: new Date(),
      });

      console.log(`Stored chunk ${i + 1} with ID: ${docRef.id}`);
      storedChunks.push({ id: docRef.id, chunk, chunkIndex: i });
    } catch (error: any) {
      console.error(`Error processing chunk ${i}:`, error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw new Error(`Failed to process chunk ${i}: ${error.message}`);
    }
  }

  console.log(`Successfully stored ${storedChunks.length} chunks`);
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

// Chat message types
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
}

// Store chat message in Firestore
export async function storeChatMessage(
  documentName: string,
  message: ChatMessage
): Promise<string> {
  const docRef = await addDoc(collection(db, "chat_messages"), {
    documentName,
    role: message.role,
    content: message.content,
    sources: message.sources || [],
    timestamp: Timestamp.fromDate(message.timestamp),
    createdAt: new Date(),
  });

  return docRef.id;
}

// Retrieve chat history for a document
export async function getChatHistory(
  documentName: string
): Promise<ChatMessage[]> {
  const q = query(
    collection(db, "chat_messages"),
    where("documentName", "==", documentName),
    orderBy("timestamp", "asc")
  );

  const querySnapshot = await getDocs(q);
  const messages: ChatMessage[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    messages.push({
      role: data.role,
      content: data.content,
      sources: data.sources || [],
      timestamp: data.timestamp.toDate(),
    });
  });

  return messages;
}
