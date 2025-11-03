import { NextRequest, NextResponse } from "next/server";
import { getMarketReports, getMarketReportById } from "@/lib/genkit-flows";

// GET all reports or a specific report by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (docId) {
      // Get specific report
      const report = await getMarketReportById(docId);
      return NextResponse.json({ success: true, report });
    } else {
      // Get all reports
      const reports = await getMarketReports(limit);
      return NextResponse.json({ success: true, reports, count: reports.length });
    }
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch reports',
      details: error.toString()
    }, { status: 500 });
  }
}
