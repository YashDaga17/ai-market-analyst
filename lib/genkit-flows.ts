import { generate } from '@genkit-ai/ai';
import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import { adminDb } from './firebase-admin-init';

// Configure Genkit with Google AI
configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

// Define the schema for extracted data
const ExtractedDataSchema = z.object({
  summary: z.string().describe('A concise summary of key market insights (max 200 words)'),
  products: z.array(z.string()).describe('List of mentioned product names'),
  figures: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).describe('Key figures and numbers from the document'),
  keyInsights: z.array(z.string()).describe('Main insights from the market report'),
  marketTrends: z.array(z.string()).describe('Identified market trends'),
});

export type ExtractedData = z.infer<typeof ExtractedDataSchema>;

/**
 * Extract and store PDF data using Genkit and Firebase
 */
export async function extractAndStorePdfData(
  pdfText: string,
  documentName: string
): Promise<{ firestoreDocId: string; extractedSummary: string; extractedData: ExtractedData }> {
  try {
    // Step 1: Use Genkit with Gemini to extract structured data from PDF
    const prompt = `Analyze the following market report document and extract key information.
    
Document Text:
${pdfText}

Extract:
1. A concise summary (max 200 words) of key market insights
2. All mentioned product names
3. Key figures/numbers with their labels
4. Main insights from the report
5. Identified market trends

Format your response as a JSON object.`;

    const llmResponse = await generate({
      model: 'googleai/gemini-1.5-flash',
      prompt,
      output: {
        schema: ExtractedDataSchema,
      },
    });

    const extractedData = llmResponse.output() as ExtractedData;

    if (!extractedData) {
      throw new Error('Failed to extract data from PDF.');
    }

    // Step 2: Store in Firestore
    const docRef = await adminDb.collection('marketReports').add({
      documentName,
      originalPdfText: pdfText,
      summary: extractedData.summary,
      products: extractedData.products || [],
      figures: extractedData.figures || [],
      keyInsights: extractedData.keyInsights || [],
      marketTrends: extractedData.marketTrends || [],
      extractedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    console.log(`Document stored in Firestore with ID: ${docRef.id}`);

    return {
      firestoreDocId: docRef.id,
      extractedSummary: extractedData.summary,
      extractedData,
    };
  } catch (error) {
    console.error('Error in extractAndStorePdfData:', error);
    throw error;
  }
}

/**
 * Retrieve stored market reports from Firestore
 */
export async function getMarketReports(limit: number = 10) {
  const snapshot = await adminDb
    .collection('marketReports')
    .orderBy('extractedAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get a specific market report by ID
 */
export async function getMarketReportById(docId: string) {
  const doc = await adminDb.collection('marketReports').doc(docId).get();
  
  if (!doc.exists) {
    throw new Error('Document not found');
  }

  return {
    id: doc.id,
    ...doc.data(),
  };
}
