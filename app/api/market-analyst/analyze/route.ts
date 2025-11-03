import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const content = text.trim();

    if (content.length === 0) {
      return NextResponse.json(
        { error: "No content found in the document" },
        { status: 400 }
      );
    }

    console.log(`Analyzing document with ${content.length} characters`);

    // Gemini has a context limit - truncate if needed (roughly 30k tokens = ~120k chars)
    const maxLength = 100000;
    const truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength) + '\n\n[Document truncated for analysis]'
      : content;

    if (content.length > maxLength) {
      console.log(`Document truncated from ${content.length} to ${maxLength} characters`);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `You are an AI Market Analyst. Analyze the following market research document and provide comprehensive insights.

Document Content:
${truncatedContent}

Provide your analysis in the following JSON format:
{
  "companyName": "string",
  "industry": "string",
  "marketSize": "string (if available)",
  "competitors": ["array of competitor names"],
  "keyInsights": ["3-5 key insights from the research"],
  "opportunities": ["3-5 market opportunities identified"],
  "threats": ["3-5 potential threats or challenges"],
  "recommendations": ["3-5 strategic recommendations"],
  "swotAnalysis": {
    "strengths": ["3-5 company strengths"],
    "weaknesses": ["3-5 company weaknesses"],
    "opportunities": ["3-5 market opportunities"],
    "threats": ["3-5 external threats"]
  }
}

Return ONLY valid JSON, no additional text.`;

    const result = await model.generateContent(prompt);

    const responseText = result.response.text();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze document" },
      { status: 500 }
    );
  }
}
