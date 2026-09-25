"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  userId?: string;
}

// Gợi ý câu hỏi nhanh để user biết chatbot có thể trả lời gì
const QUICK_QUESTIONS = [
  "Tôi có bao nhiêu lượt dùng mỗi ngày?",
  "Làm thế nào để phân tích video TikTok?",
  "Gói Pro có gì khác gói Free?",
  "Lượt dùng có tự hồi phục không?",
];

export default function ChatBot({ userId }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      content: "Xin chào! Tôi là **ViralBot** 👋\n\nTôi có thể giúp bạn tìm hiểu cách dùng ViralScript AI, giải đáp thắc mắc về tính năng hoặc hướng dẫn quy trình phân tích video. Hỏi tôi bất cứ điều gì nhé!",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuickQ, setShowQuickQ] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input khi mở chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const sendMessage = async (text?: string) => {
    const msgText = (text || inputText).trim();
    if (!msgText || loading) return;

    setInputText("");
    setShowQuickQ(false);

    const userMsg: ChatMessage = {
      role: "user",
      content: msgText,
      timestamp: new Date(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Chuẩn bị lịch sử hội thoại (bỏ qua tin nhắn đầu tiên của bot là lời chào)
      const history = newMessages.slice(1, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiFetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgText,
          user_id: userId || null,
          conversation_history: history,
        }),
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        role: "model",
        content: data?.reply?.trim() || "Xin lỗi, tôi không nhận được câu trả lời. Vui lòng thử lại!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);

    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Kết nối bị gián đoạn. Vui lòng thử lại hoặc liên hệ hỗ trợ qua Zalo 0834.490.939.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Render markdown đơn giản: **bold**, \n → <br>
  const renderContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <>
      {/* Nút mở chat nổi ở góc phải */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "bg-slate-800 border border-slate-700 rotate-0"
            : "bg-gradient-to-tr from-fuchsia-600 to-indigo-600 hover:scale-110 shadow-fuchsia-600/40"
        }`}
        title="Chat hỗ trợ"
      >
        {isOpen ? (
          <ChevronDown className="w-6 h-6 text-slate-300" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {/* Chấm xanh online */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
        )}
      </button>

      {/* Cửa sổ chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300 max-h-[70vh]">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-fuchsia-900/60 to-indigo-900/60 border-b border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-100">ViralBot</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Đang hoạt động
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Danh sách tin nhắn */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "model" && (
                  <div className="w-6 h-6 rounded-full bg-fuchsia-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-fuchsia-600 text-white rounded-tr-sm"
                      : "bg-slate-800 text-slate-200 rounded-tl-sm"
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                />
                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-fuchsia-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-slate-800 px-3 py-2 rounded-2xl rounded-tl-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Câu hỏi gợi ý nhanh */}
          {showQuickQ && (
            <div className="px-3 py-2 border-t border-slate-800/50 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="px-2 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-fuchsia-300 rounded-lg border border-slate-700 transition whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input gõ tin nhắn */}
          <div className="px-3 py-3 border-t border-slate-800 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Gõ câu hỏi của bạn..."
              maxLength={500}
              disabled={loading}
              className="flex-1 bg-slate-800 border border-slate-700 focus:border-fuchsia-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !inputText.trim()}
              className="w-8 h-8 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 flex items-center justify-center transition shrink-0"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 text-white" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
