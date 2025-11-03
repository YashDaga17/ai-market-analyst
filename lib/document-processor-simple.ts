/**
 * Simplified document processor WITHOUT embeddings
 * Use this for testing to isolate the "Invalid array length" issue
 */

import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

// Chunk text into smaller pieces
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    
    // If we've reached the end, break out
    if (end === text.length) {
      break;
    }
    
    // Move forward, ensuring we don't go backwards
    start = Math.max(start + 1, end - overlap);
  }

  return chunks;
}

// Store document chunks WITHOUT embeddings (for testing)
export async function storeDocumentChunksSimple(
  documentName: string,
  text: string,
  metadata?: Record<string, any>
) {
  console.log(`[SIMPLE] Starting to process document: ${documentName}`);
  console.log(`[SIMPLE] Text length: ${text.length} characters`);
  
  const chunks = chunkText(text);
  console.log(`[SIMPLE] Created ${chunks.length} chunks`);
  
  const storedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    try {
      const chunk = chunks[i];
      console.log(`[SIMPLE] Storing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
      
      // Store in Firestore WITHOUT embedding
      const docRef = await addDoc(collection(db, "market_docs_simple"), {
        documentName,
        content: chunk,
        chunkIndex: i,
        totalChunks: chunks.length,
        metadata: metadata || {},
        createdAt: new Date(),
      });

      console.log(`[SIMPLE] Stored chunk ${i + 1} with ID: ${docRef.id}`);
      storedChunks.push({ id: docRef.id, chunk, chunkIndex: i });
    } catch (error: any) {
      console.error(`[SIMPLE] Error storing chunk ${i}:`, error);
      throw new Error(`Failed to store chunk ${i}: ${error.message}`);
    }
  }

  console.log(`[SIMPLE] Successfully stored ${storedChunks.length} chunks`);
  return storedChunks;
}

// Simple keyword search (no embeddings)
export async function searchDocumentsSimple(
  queryText: string,
  topK: number = 5,
  documentName?: string
): Promise<Array<{ content: string; metadata: any }>> {
  console.log(`[SIMPLE] Searching for: "${queryText}"`);
  
  let q = query(collection(db, "market_docs_simple"));
  if (documentName) {
    q = query(collection(db, "market_docs_simple"), where("documentName", "==", documentName));
  }

  const querySnapshot = await getDocs(q);
  const results: Array<{ content: string; score: number; metadata: any }> = [];

  // Simple keyword matching
  const keywords = queryText.toLowerCase().split(/\s+/);

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const content = data.content.toLowerCase();
    
    // Count keyword matches
    let score = 0;
    keywords.forEach(keyword => {
      const matches = (content.match(new RegExp(keyword, 'g')) || []).length;
      score += matches;
    });

    if (score > 0) {
      results.push({
        content: data.content,
        score,
        metadata: data.metadata || {},
      });
    }
  });

  // Sort by score and return top K
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ content, metadata }) => ({ content, metadata }));
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
}

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

export async function getChatHistory(
  documentName: string
): Promise<ChatMessage[]> {
  try {
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
  } catch (error: any) {
    // If there's an index error or collection doesn't exist, return empty array
    console.warn('[getChatHistory] Error:', error.message);
    return [];
  }
}
