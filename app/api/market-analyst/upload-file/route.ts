import { NextRequest, NextResponse } from "next/server";

import { storeDocumentChunksSimple } from "@/lib/document-processor-simple";
import { extractTextFromPDF } from "@/lib/google-document-ai";

// Force Node.js runtime for PDF processing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const text = formData.get("text") as string | null;
    const documentName = formData.get("documentName") as string;

    if ((!file && !text) || !documentName) {
      return NextResponse.json(
        { error: "Either file or text, and documentName are required" },
        { status: 400 }
      );
    }

    let content: string;
    let metadata: any = {
      uploadedAt: new Date().toISOString(),
    };

    if (file) {
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Extract text based on file type
      if (file.type === "application/pdf") {
        content = await extractTextFromPDF(buffer);
      } else if (file.type === "text/plain") {
        content = buffer.toString("utf-8");
      } else {
        return NextResponse.json(
          { error: "Unsupported file type. Please upload PDF or TXT files." },
          { status: 400 }
        );
      }

      metadata = {
        ...metadata,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      };
    } else {
      content = text!;
      metadata = {
        ...metadata,
        source: "text_input",
      };
    }

    // Store document chunks (simple mode - no embeddings)
    const result = await storeDocumentChunksSimple(documentName, content, metadata);

    return NextResponse.json({
      success: true,
      message: `Document processed into ${result.length} chunks`,
      chunks: result.length,
      documentName,
    });
  } catch (error: any) {
    console.error("Upload file error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
