import { NextRequest, NextResponse } from "next/server";

import { extractStructuredData } from "@/lib/market-analyst-agent";

export async function POST(request: NextRequest) {
  try {
    const { documentName } = await request.json();

    if (!documentName) {
      return NextResponse.json({ error: "documentName is required" }, { status: 400 });
    }

    const result = await extractStructuredData(documentName);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Extract error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
