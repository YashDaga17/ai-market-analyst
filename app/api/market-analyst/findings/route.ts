import { NextRequest, NextResponse } from "next/server";

import { generateMarketResearchFindings } from "@/lib/market-analyst-agent";

export async function POST(request: NextRequest) {
  try {
    const { documentName } = await request.json();

    if (!documentName) {
      return NextResponse.json({ error: "documentName is required" }, { status: 400 });
    }

    const result = await generateMarketResearchFindings(documentName);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Findings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
