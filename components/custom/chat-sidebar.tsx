"use client";

import { MessageSquare, Send, X } from "lucide-react";
import { useState } from "react";

import { ExampleQuestions } from "@/components/custom/example-questions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  chatMessages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatSidebar({
  isOpen,
  onClose,
  documentName,
  chatMessages,
  onSendMessage,
  isLoading,
}: ChatSidebarProps) {
  const [chatInput, setChatInput] = useState("");

  const handleSend = async () => {
    if (!chatInput.trim() || isLoading) return;
    
    const message = chatInput;
    setChatInput("");
    await onSendMessage(message);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 size-full lg:w-[500px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-3 text-white">
            <MessageSquare className="size-6" />
            <div>
              <h2 className="text-lg font-semibold">AI Chat Assistant</h2>
              <p className="text-xs opacity-90">Ask questions about your document</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Document Info */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex items-start gap-2">
            <div className="shrink-0 mt-0.5">
              <div className="size-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-1">Connected to document:</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{documentName}</p>
              <p className="text-xs text-gray-500 mt-1">
                💡 Ask questions about the content, competitors, market insights, or strategies
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="py-6">
              <p className="text-center text-gray-500 mb-4 text-sm">
                Start a conversation! Ask about market trends, competitors, strategies, or any insights from your document.
              </p>
              <ExampleQuestions
                onQuestionClick={(question) => {
                  setChatInput(question);
                }}
              />
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-100 ml-8 border-l-4 border-blue-500"
                    : "bg-gray-100 mr-8 border-l-4 border-purple-500"
                }`}
              >
                <p className="font-semibold text-xs mb-2 flex items-center gap-2">
                  {msg.role === "user" ? (
                    <>
                      <span className="bg-blue-500 text-white rounded-full size-5 flex items-center justify-center text-xs">
                        U
                      </span>
                      You
                    </>
                  ) : (
                    <>
                      <span className="bg-purple-500 text-white rounded-full size-5 flex items-center justify-center text-xs">
                        AI
                      </span>
                      AI Analyst
                    </>
                  )}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <details className="mt-2 text-xs text-gray-600 bg-white p-2 rounded">
                    <summary className="cursor-pointer font-medium">📚 View sources ({msg.sources.length})</summary>
                    <ul className="mt-2 space-y-1 pl-4">
                      {msg.sources.map((source, i) => (
                        <li key={i} className="text-gray-600">• {source}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="p-3 bg-gray-100 rounded-lg mr-8 border-l-4 border-purple-500 animate-pulse">
              <p className="text-gray-500 flex items-center gap-2 text-sm">
                <span className="bg-purple-500 text-white rounded-full size-5 flex items-center justify-center text-xs">
                  AI
                </span>
                AI is analyzing your question...
              </p>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask anything about your company, market position, competitors, growth strategies, or specific insights from the document..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
              className="min-h-[80px] resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !chatInput.trim()}
              size="lg"
              className="px-4"
            >
              <Send className="size-5" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Tip: Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}
