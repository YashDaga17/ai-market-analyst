import { GoogleGenerativeAI } from "@google/generative-ai";

import { searchDocumentsSimple } from "./document-processor-simple";

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
  console.log(`[ASK] Question: "${question}" for document: ${documentName || 'all'}`);
  
  // Retrieve relevant context using keyword search from uploaded PDF chunks
  const relevantChunks = await searchDocumentsSimple(question, 5, documentName);

  console.log(`[ASK] Found ${relevantChunks.length} relevant chunks`);

  if (relevantChunks.length === 0) {
    return {
      answer: "I don't have enough information to answer this question based on the uploaded document. Please make sure you've uploaded a document first, or try rephrasing your question.",
      sources: [],
      confidence: 0,
    };
  }

  // Build context from relevant chunks (these are from your uploaded PDF)
  const context = relevantChunks.map((chunk, i) => `[Source ${i + 1}]\n${chunk.content}`).join("\n\n---\n\n");

  console.log(`[ASK] Context length: ${context.length} characters`);

  // Generate answer using Gemini with the PDF context
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `You are an AI Market Analyst with access to the user's uploaded market research document. Answer the following question using ONLY the information from the provided document context.

DOCUMENT CONTEXT (from uploaded PDF):
${context}

USER QUESTION: ${question}

INSTRUCTIONS:
- Answer based ONLY on the information in the document context above
- Be specific and cite relevant details from the document
- If the document doesn't contain information to answer the question, clearly state that
- Reference specific sections like [Source 1], [Source 2] when applicable
- Provide actionable insights when possible

Your answer:`;

  const result = await model.generateContent(prompt);
  const answer = result.response.text();

  console.log(`[ASK] Generated answer length: ${answer.length} characters`);

  return {
    answer,
    sources: relevantChunks.map((chunk) => chunk.content.substring(0, 150) + "..."),
    confidence: 0.8, // Default confidence for keyword search
  };
}

// Task 2: Market Research Findings
export async function generateMarketResearchFindings(
  documentName: string
): Promise<MarketResearchFindings> {
  // Get a broad sample of the document
  const relevantChunks = await searchDocumentsSimple(
    "market research findings opportunities threats analysis",
    10,
    documentName
  );

  const context = relevantChunks.map((chunk) => chunk.content).join("\n\n");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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
  const relevantChunks = await searchDocumentsSimple(
    "company information metrics data statistics",
    10,
    documentName
  );

  const context = relevantChunks.map((chunk) => chunk.content).join("\n\n");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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
