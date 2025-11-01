"use client";

import {
  AlertTriangle,
  BarChart3,
  FileText,
  Lightbulb,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";

import { LoadingInsights } from "@/components/custom/loading-insights";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MarketInsights {
  keyInsights?: string[];
  opportunities?: string[];
  threats?: string[];
  recommendations?: string[];
  structuredData?: any;
}

export default function MarketAnalystPage() {
  const [documentContent, setDocumentContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<MarketInsights | null>(null);
  const [inputMode, setInputMode] = useState<"text" | "file">("text");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!documentContent.trim() && !selectedFile) {
      alert("Please enter text or upload a file");
      return;
    }

    setLoading(true);
    setInsights(null);

    try {
      const formData = new FormData();

      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("text", documentContent);
      }

      const response = await fetch("/api/market-analyst/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      const data = await response.json();
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
      });
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocumentContent("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-8 max-w-6xl">
        <div className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Market Analyst
          </h1>
          <p className="text-lg text-gray-600">Enter your market research text and get instant AI-powered insights</p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="size-6 text-blue-600" />
            <h2 className="text-2xl font-semibold">Enter Market Research</h2>
          </div>

          {/* Toggle between text and file */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={inputMode === "text" ? "default" : "outline"}
              onClick={() => {
                setInputMode("text");
                setSelectedFile(null);
              }}
              size="sm"
            >
              <FileText className="size-4 mr-2" />
              Paste Text
            </Button>
            <Button
              variant={inputMode === "file" ? "default" : "outline"}
              onClick={() => {
                setInputMode("file");
                setDocumentContent("");
              }}
              size="sm"
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
              className="mb-4 min-h-[300px] text-base"
            />
          ) : (
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
              >
                {selectedFile ? (
                  <div className="text-center">
                    <FileText className="size-12 mx-auto mb-3 text-blue-600" />
                    <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                    <p className="text-xs text-blue-600 mt-2">Click to change file</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="size-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF or TXT files</p>
                  </div>
                )}
              </label>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={loading || (!documentContent && !selectedFile)}
            className="w-full"
            size="lg"
          >
            {loading ? "Analyzing..." : "Get Market Insights"}
          </Button>
        </div>

        {/* Loading State */}
        {loading && <LoadingInsights />}

        {/* Market Insights Section */}
        {insights && !loading && (
          <div className="space-y-6">
            {/* Structured Data */}
            {insights.structuredData && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="size-6 text-purple-600" />
                  <h2 className="text-2xl font-semibold">Company Overview</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.structuredData.companyName && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Company Name</p>
                      <p className="font-semibold">{insights.structuredData.companyName}</p>
                    </div>
                  )}
                  {insights.structuredData.industry && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Industry</p>
                      <p className="font-semibold">{insights.structuredData.industry}</p>
                    </div>
                  )}
                  {insights.structuredData.marketSize && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Market Size</p>
                      <p className="font-semibold">{insights.structuredData.marketSize}</p>
                    </div>
                  )}
                  {insights.structuredData.competitors && insights.structuredData.competitors.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Key Competitors</p>
                      <p className="font-semibold">{insights.structuredData.competitors.join(", ")}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key Insights */}
            {insights.keyInsights && insights.keyInsights.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="size-6 text-blue-600" />
                  <h2 className="text-2xl font-semibold">Key Insights</h2>
                </div>
                <ul className="space-y-3">
                  {insights.keyInsights.map((insight, idx) => (
                    <li key={idx} className="flex gap-3 p-4 bg-blue-50 rounded-lg">
                      <span className="text-blue-600 font-bold">•</span>
                      <span className="text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Opportunities */}
            {insights.opportunities && insights.opportunities.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Lightbulb className="size-6 text-green-600" />
                  <h2 className="text-2xl font-semibold">Market Opportunities</h2>
                </div>
                <ul className="space-y-3">
                  {insights.opportunities.map((opportunity, idx) => (
                    <li key={idx} className="flex gap-3 p-4 bg-green-50 rounded-lg">
                      <span className="text-green-600 font-bold">✓</span>
                      <span className="text-gray-700">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Threats */}
            {insights.threats && insights.threats.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle className="size-6 text-red-600" />
                  <h2 className="text-2xl font-semibold">Potential Threats</h2>
                </div>
                <ul className="space-y-3">
                  {insights.threats.map((threat, idx) => (
                    <li key={idx} className="flex gap-3 p-4 bg-red-50 rounded-lg">
                      <span className="text-red-600 font-bold">⚠</span>
                      <span className="text-gray-700">{threat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="size-6 text-purple-600" />
                  <h2 className="text-2xl font-semibold">Strategic Recommendations</h2>
                </div>
                <ul className="space-y-3">
                  {insights.recommendations.map((recommendation, idx) => (
                    <li key={idx} className="flex gap-3 p-4 bg-purple-50 rounded-lg">
                      <span className="text-purple-600 font-bold">→</span>
                      <span className="text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
