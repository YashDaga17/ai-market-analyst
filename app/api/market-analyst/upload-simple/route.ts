import { NextRequest, NextResponse } from "next/server";

import { storeDocumentChunksSimple } from "@/lib/document-processor-simple";

export const dynamic = 'force-dynamic';

/**
 * Simplified upload route WITHOUT embeddings
 * Use this to test if the issue is with embeddings or Firestore
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[SIMPLE UPLOAD] API called');
    const body = await request.json();
    const { documentName, content, metadata } = body;

    console.log('[SIMPLE UPLOAD] Request:', {
      documentName,
      contentLength: content?.length,
      metadata
    });

    if (!documentName || !content) {
      return NextResponse.json(
        { error: "documentName and content are required" },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is empty" },
        { status: 400 }
      );
    }

    console.log(`[SIMPLE UPLOAD] Processing: ${documentName} (${content.length} chars)`);

    const result = await storeDocumentChunksSimple(documentName, content, metadata);

    console.log(`[SIMPLE UPLOAD] Success: ${result.length} chunks stored`);

    return NextResponse.json({
      success: true,
      message: `Document processed into ${result.length} chunks (simple mode - no embeddings)`,
      chunks: result.length,
      mode: 'simple'
    });
  } catch (error: any) {
    console.error("[SIMPLE UPLOAD] Error:", error);
    console.error("[SIMPLE UPLOAD] Stack:", error.stack);
    return NextResponse.json({ 
      error: error.message || 'Upload failed',
      details: error.toString(),
      mode: 'simple'
    }, { status: 500 });
  }
}
