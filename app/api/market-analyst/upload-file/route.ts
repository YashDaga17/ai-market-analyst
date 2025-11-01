import { NextRequest, NextResponse } from "next/server";

import { storeDocumentChunks } from "@/lib/document-processor";
import { extractTextFromPDF } from "@/lib/google-document-ai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentName = formData.get("documentName") as string;

    if (!file || !documentName) {
      return NextResponse.json(
        { error: "file and documentName are required" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let content: string;

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

    // Store document chunks with embeddings
    const result = await storeDocumentChunks(documentName, content, {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    });

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
