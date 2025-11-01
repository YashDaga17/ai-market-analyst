import { GoogleGenerativeAI } from "@google/generative-ai";

import { searchDocuments } from "./document-processor";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export interface MarketAnalystResponse {
  answer: string;
  sources: string[];
  confidence: number;
}

export interface MarketResearchFindings {
  keyInsights: string[];
  opportunities: string[];
  threats: string[];
  recommendations: string[];
}

export interface StructuredData {
  companyName: string;
  industry: string;
  marketSize?: string;
  competitors?: string[];
  keyMetrics?: Record<string, any>;
  [key: string]: any;
}

// Task 1: General Q&A with RAG
export async function askQuestion(
  question: string,
  documentName?: string
): Promise<MarketAnalystResponse> {
  // Retrieve relevant context using vector search
  const relevantChunks = await searchDocuments(question, 5, documentName);

  if (relevantChunks.length === 0) {
    return {
      answer: "I don't have enough information to answer this question based on the provided documents.",
      sources: [],
      confidence: 0,
    };
  }

  // Build context from relevant chunks
  const context = relevantChunks.map((chunk, i) => `[${i + 1}] ${chunk.content}`).join("\n\n");

  // Generate answer using Gemini
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const prompt = `You are an AI Market Analyst. Answer the following question based on the provided context from market research documents.

Context:
${context}

Question: ${question}

Provide a clear, concise answer based on the context. If the context doesn't contain enough information, say so. Cite which context sections you used (e.g., [1], [2]).`;

  const result = await model.generateContent(prompt);
  const answer = result.response.text();

  // Calculate average confidence from similarity scores
  const avgConfidence =
    relevantChunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / relevantChunks.length;

  return {
    answer,
    sources: relevantChunks.map((chunk) => chunk.content.substring(0, 100) + "..."),
    confidence: avgConfidence,
  };
}

// Task 2: Market Research Findings
export async function generateMarketResearchFindings(
  documentName: string
): Promise<MarketResearchFindings> {
  // Get a broad sample of the document
  const relevantChunks = await searchDocuments(
    "market research findings opportunities threats analysis",
    10,
    documentName
  );

  const context = relevantChunks.map((chunk) => chunk.content).join("\n\n");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const prompt = `You are an AI Market Analyst. Analyze the following market research document and provide structured findings.

Document Content:
${context}

Provide a comprehensive analysis in the following format:

KEY INSIGHTS:
- List 3-5 key insights from the research

OPPORTUNITIES:
- List 3-5 market opportunities identified

THREATS:
- List 3-5 potential threats or challenges

RECOMMENDATIONS:
- List 3-5 strategic recommendations

Format your response as a JSON object with keys: keyInsights, opportunities, threats, recommendations (each as an array of strings).`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  // Fallback parsing if JSON not found
  return {
    keyInsights: ["Unable to parse findings"],
    opportunities: [],
    threats: [],
    recommendations: [],
  };
}

// Task 3: Structured Data Extraction
export async function extractStructuredData(documentName: string): Promise<StructuredData> {
  // Get document content
  const relevantChunks = await searchDocuments(
    "company information metrics data statistics",
    10,
    documentName
  );

  const context = relevantChunks.map((chunk) => chunk.content).join("\n\n");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const prompt = `You are an AI Market Analyst. Extract structured data from the following market research document.

Document Content:
${context}

Extract and return a JSON object with the following information:
- companyName: string
- industry: string
- marketSize: string (if available)
- competitors: array of competitor names
- keyMetrics: object with any numerical metrics found (revenue, growth rate, market share, etc.)
- foundedYear: number (if available)
- headquarters: string (if available)
- employeeCount: number (if available)

Only include fields where you find clear information. Return valid JSON.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return {
    companyName: "Unknown",
    industry: "Unknown",
  };
}
