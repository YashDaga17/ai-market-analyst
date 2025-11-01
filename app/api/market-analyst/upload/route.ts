import { NextRequest, NextResponse } from "next/server";

import { storeDocumentChunks } from "@/lib/document-processor";

export async function POST(request: NextRequest) {
  try {
    const { documentName, content, metadata } = await request.json();

    if (!documentName || !content) {
      return NextResponse.json(
        { error: "documentName and content are required" },
        { status: 400 }
      );
    }

    const result = await storeDocumentChunks(documentName, content, metadata);

    return NextResponse.json({
      success: true,
      message: `Document processed into ${result.length} chunks`,
      chunks: result.length,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
