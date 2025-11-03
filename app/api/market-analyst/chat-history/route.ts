import { NextRequest, NextResponse } from "next/server";

import { getChatHistory } from "@/lib/document-processor-simple";

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentName = searchParams.get("documentName");

    if (!documentName) {
      return NextResponse.json({ error: "documentName is required" }, { status: 400 });
    }

    console.log('[CHAT HISTORY] Fetching for:', documentName);
    
    try {
      const messages = await getChatHistory(documentName);
      console.log('[CHAT HISTORY] Found messages:', messages.length);
      return NextResponse.json({ messages });
    } catch (historyError: any) {
      // If there's an error (like missing index), return empty array
      console.warn('[CHAT HISTORY] Error fetching history:', historyError.message);
      console.log('[CHAT HISTORY] Returning empty history');
      return NextResponse.json({ messages: [] });
    }
  } catch (error: any) {
    console.error("[CHAT HISTORY] Fatal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
