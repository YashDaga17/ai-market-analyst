import { DocumentProcessorServiceClient } from "@google-cloud/documentai";

// Initialize Document AI client (requires service account credentials in production)
// For development, you can use API key authentication
export async function processDocumentWithAI(
  fileBuffer: Buffer,
  mimeType: string = "application/pdf"
): Promise<string> {
  try {
    // For now, we'll use a simple text extraction
    // In production, you would set up Document AI with proper credentials

    // If it's a PDF, we can use pdf-parse
    if (mimeType === "application/pdf") {
      return await extractTextFromPDF(fileBuffer);
    }

    // For text files
    return fileBuffer.toString("utf-8");
  } catch (error) {
    console.error("Document processing error:", error);
    throw new Error("Failed to process document");
  }
}

// Advanced Document AI processing (requires service account setup)
export async function processWithDocumentAI(
  fileBuffer: Buffer,
  processorId?: string
): Promise<{
  text: string;
  entities: Array<{ type: string; mentionText: string; confidence: number }>;
  tables: any[];
}> {
  // This requires Google Cloud service account credentials
  // For production use, set up Document AI processor in Google Cloud Console

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "us";
  const processor = processorId || process.env.GOOGLE_CLOUD_PROCESSOR_ID;

  if (!projectId || !processor) {
    throw new Error(
      "Document AI not configured. Set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_CLOUD_PROCESSOR_ID"
    );
  }

  // Initialize client with credentials
  const client = new DocumentProcessorServiceClient();

  const name = `projects/${projectId}/locations/${location}/processors/${processor}`;

  const request = {
    name,
    rawDocument: {
      content: fileBuffer.toString("base64"),
      mimeType: "application/pdf",
    },
  };

  const [result] = await client.processDocument(request);
  const { document } = result;

  if (!document) {
    throw new Error("No document returned from Document AI");
  }

  // Extract text
  const text = document.text || "";

  // Extract entities
  const entities =
    document.entities?.map((entity) => ({
      type: entity.type || "unknown",
      mentionText: entity.mentionText || "",
      confidence: entity.confidence || 0,
    })) || [];

  // Extract tables
  const tables = document.pages?.flatMap((page) => page.tables || []) || [];

  return { text, entities, tables };
}

// Simple PDF text extraction using pdf-parse
export async function extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
  try {
    // Use require for pdf-parse in Node.js runtime
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require("pdf-parse");

    // Parse the PDF buffer
    const data = await pdfParse(fileBuffer);

    if (!data || !data.text) {
      throw new Error("No text extracted from PDF");
    }

    return data.text;
  } catch (error: any) {
    console.error("PDF extraction error:", error);

    // Provide more helpful error messages
    if (error.message.includes("pdf-parse")) {
      throw new Error("PDF parsing library not available. Please ensure pdf-parse is installed.");
    }

    if (error.message.includes("Invalid PDF")) {
      throw new Error("Invalid PDF file. Please ensure the file is a valid PDF document.");
    }

    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}
