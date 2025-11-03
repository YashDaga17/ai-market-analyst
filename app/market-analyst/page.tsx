"use client";

import {
  AlertTriangle,
  BarChart3,
  FileText,
  Lightbulb,
  MessageSquare,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { ChatSidebar } from "@/components/custom/chat-sidebar";
import { LoadingInsights } from "@/components/custom/loading-insights";
import { PDFUpload } from "@/components/custom/pdf-upload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Force dynamic rendering to avoid prerendering issues with PDF library
export const dynamic = 'force-dynamic';

interface MarketInsights {
  keyInsights?: string[];
  opportunities?: string[];
  threats?: string[];
  recommendations?: string[];
  structuredData?: any;
  swotAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export default function MarketAnalystPage() {
  const [documentContent, setDocumentContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<MarketInsights | null>(null);
  const [inputMode, setInputMode] = useState<"text" | "file">("text");
  const [documentName, setDocumentName] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleAnalyze = async () => {
    if (!documentContent.trim()) {
      alert("Please enter text or upload a file");
      return;
    }

    console.log('Starting analysis...');
    console.log('Document content length:', documentContent.length);
    console.log('First 200 chars:', documentContent.substring(0, 200));

    setLoading(true);
    setInsights(null);
    setChatMessages([]);

    try {
      const docName = documentName || `document_${Date.now()}`;
      console.log('Document name:', docName);

      // First, upload and store the document with extracted text
      console.log('Uploading document to Firestore...');
      // Use simple upload (no embeddings) for testing
      const uploadResponse = await fetch("/api/market-analyst/upload-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentName: docName,
          content: documentContent,
          metadata: {
            uploadedAt: new Date().toISOString(),
            source: inputMode === "file" ? "pdf_upload" : "text_input",
          },
        }),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        console.error('Upload failed:', error);
        throw new Error(error.error || "Upload failed");
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload successful:', uploadData);
      setDocumentName(docName);

      // Load chat history for this document
      console.log('Loading chat history...');
      const historyResponse = await fetch(
        `/api/market-analyst/chat-history?documentName=${encodeURIComponent(docName)}`
      );
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log('Chat history loaded:', historyData.messages?.length || 0, 'messages');
        setChatMessages(historyData.messages || []);
      }

      // Then analyze it
      console.log('Starting AI analysis...');
      const response = await fetch("/api/market-analyst/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: documentContent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Analysis failed:', error);
        throw new Error(error.error || "Analysis failed");
      }

      const data = await response.json();
      console.log('Analysis complete:', data);
      const analysis = data.analysis;

      setInsights({
        keyInsights: analysis.keyInsights || [],
        opportunities: analysis.opportunities || [],
        threats: analysis.threats || [],
        recommendations: analysis.recommendations || [],
        structuredData: {
          companyName: analysis.companyName,
          industry: analysis.industry,
          marketSize: analysis.marketSize,
          competitors: analysis.competitors,
        },
        swotAnalysis: analysis.swotAnalysis,
      });
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (question: string) => {
    if (!question.trim() || !documentName) {
      return;
    }

    const userMessage: ChatMessage = { role: "user", content: question };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatLoading(true);

    try {
      const response = await fetch("/api/market-analyst/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          documentName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Floating Chat Button - Only shows when document is uploaded */}
      {documentName && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-30 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center gap-2 group"
          aria-label="Open chat"
        >
          <MessageSquare className="size-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
            Chat with AI
          </span>
          {chatMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-6 flex items-center justify-center font-bold">
              {chatMessages.length}
            </span>
          )}
        </button>
      )}

      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        documentName={documentName}
        chatMessages={chatMessages}
        onSendMessage={handleAskQuestion}
        isLoading={chatLoading}
      />

      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12 pt-4 md:pt-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <BarChart3 className="size-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Market Analyst
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your market research document and get instant AI-powered insights, competitive analysis, and strategic recommendations
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="size-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Upload Document</h2>
              <p className="text-sm text-gray-500">Choose how to provide your market research data</p>
            </div>
          </div>

          {/* Toggle between text and file */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
            <Button
              variant="ghost"
              onClick={() => {
                setInputMode("text");
              }}
              size="sm"
              className={`transition-all ${inputMode === "text"
                  ? "bg-black text-white hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-200"
                }`}
            >
              <FileText className="size-4 mr-2" />
              Paste Text
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setInputMode("file");
              }}
              size="sm"
              className={`transition-all ${inputMode === "file"
                  ? "bg-black text-white hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-200"
                }`}
            >
              <Upload className="size-4 mr-2" />
              Upload PDF
            </Button>
          </div>

          {inputMode === "text" ? (
            <Textarea
              placeholder="Paste your market research document content here..."
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              className="mb-6 min-h-[300px] text-base border-2 focus:border-blue-500 rounded-xl"
            />
          ) : (
            <div className="mb-6">
              <PDFUpload
                onTextExtracted={(text, metadata) => {
                  setDocumentContent(text);
                  if (metadata?.fileName) {
                    setDocumentName(metadata.fileName);
                  }
                }}
                onError={(error) => {
                  alert("PDF Error: " + error);
                }}
              />
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={loading || !documentContent}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full size-5 border-b-2 border-white mr-2" />
                Analyzing Document...
              </>
            ) : (
              <>
                <BarChart3 className="size-5 mr-2" />
                Analyze & Get Insights
              </>
            )}
          </Button>
        </div>

        {/* Loading State */}
        {loading && <LoadingInsights />}

        {/* Market Insights Section */}
        {insights && !loading && (
          <div className="space-y-6">
            {/* Structured Data */}
            {insights.structuredData && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-xl border border-purple-100 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <BarChart3 className="size-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Company Overview</h2>
                    <p className="text-sm text-gray-600">Key information extracted from your document</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.structuredData.companyName && (
                    <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Company Name</p>
                      <p className="font-semibold text-gray-800 text-lg">{insights.structuredData.companyName}</p>
                    </div>
                  )}
                  {insights.structuredData.industry && (
                    <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Industry</p>
                      <p className="font-semibold text-gray-800 text-lg">{insights.structuredData.industry}</p>
                    </div>
                  )}
                  {insights.structuredData.marketSize && (
                    <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Market Size</p>
                      <p className="font-semibold text-gray-800 text-lg">{insights.structuredData.marketSize}</p>
                    </div>
                  )}
                  {insights.structuredData.competitors && insights.structuredData.competitors.length > 0 && (
                    <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Key Competitors</p>
                      <p className="font-semibold text-gray-800 text-lg">{insights.structuredData.competitors.join(", ")}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key Insights */}
            {insights.keyInsights && insights.keyInsights.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <TrendingUp className="size-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Key Insights</h2>
                    <p className="text-sm text-gray-600">Critical findings from your market analysis</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {insights.keyInsights.map((insight, idx) => (
                    <li key={idx} className="flex gap-4 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                      <span className="shrink-0 flex items-center justify-center size-6 bg-blue-600 text-white rounded-full text-sm font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700 leading-relaxed">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Opportunities */}
            {insights.opportunities && insights.opportunities.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-green-100 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Lightbulb className="size-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Market Opportunities</h2>
                    <p className="text-sm text-gray-600">Growth potential and strategic advantages</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {insights.opportunities.map((opportunity, idx) => (
                    <li key={idx} className="flex gap-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-shadow">
                      <span className="shrink-0 flex items-center justify-center size-6 bg-green-600 text-white rounded-full text-sm">
                        ✓
                      </span>
                      <span className="text-gray-700 leading-relaxed">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Threats */}
            {insights.threats && insights.threats.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-600 rounded-lg">
                    <AlertTriangle className="size-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Potential Threats</h2>
                    <p className="text-sm text-gray-600">Risks and challenges to monitor</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {insights.threats.map((threat, idx) => (
                    <li key={idx} className="flex gap-4 p-5 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 hover:shadow-md transition-shadow">
                      <span className="shrink-0 flex items-center justify-center size-6 bg-red-600 text-white rounded-full text-sm">
                        ⚠
                      </span>
                      <span className="text-gray-700 leading-relaxed">{threat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-purple-100 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <Target className="size-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Strategic Recommendations</h2>
                    <p className="text-sm text-gray-600">Actionable steps for success</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {insights.recommendations.map((recommendation, idx) => (
                    <li key={idx} className="flex gap-4 p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
                      <span className="shrink-0 flex items-center justify-center size-6 bg-purple-600 text-white rounded-full text-sm font-bold">
                        →
                      </span>
                      <span className="text-gray-700 leading-relaxed">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* SWOT Analysis */}
            {insights.swotAnalysis && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-xl border border-indigo-100 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <BarChart3 className="size-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800">SWOT Analysis</h2>
                    <p className="text-sm text-gray-600">Comprehensive strategic assessment</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Strengths */}
                  <div className="p-6 bg-white rounded-xl shadow-sm border-l-4 border-green-500">
                    <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                      <span className="size-8 bg-green-100 rounded-lg flex items-center justify-center">💪</span>
                      Strengths
                    </h3>
                    <ul className="space-y-3">
                      {insights.swotAnalysis.strengths?.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-gray-700">
                          <span className="text-green-600 font-bold">✓</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="p-6 bg-white rounded-xl shadow-sm border-l-4 border-red-500">
                    <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
                      <span className="size-8 bg-red-100 rounded-lg flex items-center justify-center">⚡</span>
                      Weaknesses
                    </h3>
                    <ul className="space-y-3">
                      {insights.swotAnalysis.weaknesses?.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-gray-700">
                          <span className="text-red-600 font-bold">✗</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div className="p-6 bg-white rounded-xl shadow-sm border-l-4 border-blue-500">
                    <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                      <span className="size-8 bg-blue-100 rounded-lg flex items-center justify-center">🎯</span>
                      Opportunities
                    </h3>
                    <ul className="space-y-3">
                      {insights.swotAnalysis.opportunities?.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-gray-700">
                          <span className="text-blue-600 font-bold">→</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Threats */}
                  <div className="p-6 bg-white rounded-xl shadow-sm border-l-4 border-orange-500">
                    <h3 className="text-lg font-semibold text-orange-700 mb-4 flex items-center gap-2">
                      <span className="size-8 bg-orange-100 rounded-lg flex items-center justify-center">⚠️</span>
                      Threats
                    </h3>
                    <ul className="space-y-3">
                      {insights.swotAnalysis.threats?.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-gray-700">
                          <span className="text-orange-600 font-bold">!</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}


          </div>
        )}
      </div>
    </div>
  );
}
