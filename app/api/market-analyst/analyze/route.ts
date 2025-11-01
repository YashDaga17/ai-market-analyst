import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

import { extractTextFromPDF } from "@/lib/google-document-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const text = formData.get("text") as string | null;

    if (!file && !text) {
      return NextResponse.json(
        { error: "Either file or text is required" },
        { status: 400 }
      );
    }

    let content: string = "";

    // Handle file upload
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.type === "application/pdf") {
        // Extract text from PDF
        content = await extractTextFromPDF(buffer);
      } else if (file.type === "text/plain") {
        content = buffer.toString("utf-8");
      } else {
        return NextResponse.json(
          { error: "Unsupported file type. Please upload PDF or TXT files." },
          { status: 400 }
        );
      }
    } else {
      content = text!;
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "No content found in the document" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `You are an AI Market Analyst. Analyze the following market research document and provide comprehensive insights.

Document Content:
${content}

Provide your analysis in the following JSON format:
{
  "companyName": "string",
  "industry": "string",
  "marketSize": "string (if available)",
  "competitors": ["array of competitor names"],
  "keyInsights": ["3-5 key insights from the research"],
  "opportunities": ["3-5 market opportunities identified"],
  "threats": ["3-5 potential threats or challenges"],
  "recommendations": ["3-5 strategic recommendations"]
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
