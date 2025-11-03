import { NextRequest, NextResponse } from "next/server";

import { askQuestion } from "@/lib/market-analyst-agent";
import { storeChatMessage } from "@/lib/document-processor-simple";

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { question, documentName } = await request.json();

    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    // Store user message
    if (documentName) {
      await storeChatMessage(documentName, {
        role: "user",
        content: question,
        timestamp: new Date(),
      });
    }

    // Get AI response
    const result = await askQuestion(question, documentName);

    // Store assistant message
    if (documentName) {
      await storeChatMessage(documentName, {
        role: "assistant",
        content: result.answer,
        sources: result.sources,
        timestamp: new Date(),
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Ask error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
