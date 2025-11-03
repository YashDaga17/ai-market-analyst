import { NextRequest, NextResponse } from "next/server";

import { extractAndStorePdfData } from "@/lib/genkit-flows";

export async function POST(request: NextRequest) {
  try {
    console.log('Genkit Upload API called');
    const body = await request.json();
    const { documentName, content } = body;

    console.log('Request body:', {
      documentName,
      contentLength: content?.length,
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

    console.log(`Processing document with Genkit: ${documentName} (${content.length} characters)`);

    // Use Genkit to extract and store data
    const result = await extractAndStorePdfData(content, documentName);

    console.log(`Upload successful: Document ID ${result.firestoreDocId}`);

    return NextResponse.json({
      success: true,
      message: 'Document processed and stored successfully',
      firestoreDocId: result.firestoreDocId,
      summary: result.extractedSummary,
      extractedData: result.extractedData,
    });
  } catch (error: any) {
    console.error("Genkit upload error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ 
      error: error.message || 'Upload failed',
      details: error.toString()
    }, { status: 500 });
  }
}
