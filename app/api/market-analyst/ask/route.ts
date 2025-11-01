import { NextRequest, NextResponse } from "next/server";

import { askQuestion } from "@/lib/market-analyst-agent";

export async function POST(request: NextRequest) {
  try {
    const { question, documentName } = await request.json();

    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const result = await askQuestion(question, documentName);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Ask error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
