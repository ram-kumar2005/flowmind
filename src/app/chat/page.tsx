"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Sparkles, BookOpen, Search } from "lucide-react";
import { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Summarize everything I know about AI",
    "What are the key points from my latest notes?",
    "Find connections between my code and articles",
    "Explain the concept of 'Second Brain'",
  ];

  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const assistantMessage: ChatMessage = { role: "assistant", content: "" };
      setMessages(prev => [...prev, assistantMessage]);

      let fullContent = "";
      let metadataSent = false;
      if (reader) {
        const textDecoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = textDecoder.decode(value);
          
          if (!metadataSent && chunk.includes("\n---\n")) {
            const parts = chunk.split("\n---\n");
            const metadataStr = parts[0];
            try {
              const metadata = JSON.parse(metadataStr);
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].citation = metadata.citations.join(", ");
                return newMessages;
              });
            } catch (e) { console.error("Metadata parse error", e); }
            metadataSent = true;
            fullContent += parts[1];
          } else {
            fullContent += chunk;
          }

          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = fullContent;
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "I'm so sorry, I encountered a bit of trouble retrieving that. Could you try again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F5F0EA]">
      {/* Header */}
      <header className="p-5 border-b border-[#E8E2D9] bg-[#FDFAF7]/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-[#C4714F] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-900/10">
              <Sparkles size={22} />
            </div>
            <div>
              <h1 className="font-serif font-bold text-[#2C2420]">FlowMind AI</h1>
              <p className="text-[10px] text-[#A69E94] font-bold uppercase tracking-widest">Personal Scholar</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2 bg-[#F5F0EA] border border-[#E8E2D9] rounded-full text-[10px] font-bold text-[#7A9E7E] uppercase tracking-wider">
            <div className="w-2 h-2 rounded-full bg-[#7A9E7E] animate-pulse shadow-[0_0_8px_rgba(122,158,126,0.5)]" />
            Connected to Knowledge
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-24 space-y-16">
            <div className="text-center space-y-6">
              <h2 className="text-5xl font-serif font-bold text-[#2C2420] leading-tight">
                How shall we <br/> <span className="text-[#C4714F]">learn</span> today?
              </h2>
              <p className="text-[#5C544E] max-w-md mx-auto">Ask me anything about your saved treasures—notes, videos, or articles.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="card text-left p-7 border-[#E8E2D9] hover:border-[#C4714F] group transition-all bg-[#FDFAF7]"
                >
                  <Search className="text-[#D6CEC3] group-hover:text-[#C4714F] mb-5 transition-colors" size={20} />
                  <p className="text-sm font-bold text-[#5C544E] group-hover:text-[#2C2420] transition-colors">{q}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-10 py-10">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-5", m.role === "user" ? "justify-end" : "justify-start animate-in fade-in slide-in-from-bottom-2 duration-300")}>
                {m.role === "assistant" && (
                  <div className="w-9 h-9 bg-[#EDE8E0] border border-[#E8E2D9] rounded-xl flex items-center justify-center flex-shrink-0 mt-1 text-[#C4714F] shadow-sm">
                    <Sparkles size={18} />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-3xl p-6 text-sm leading-relaxed shadow-sm",
                  m.role === "user" 
                    ? "bg-[#C4714F] text-[#F5F0EA] rounded-tr-none shadow-orange-900/10" 
                    : "bg-[#FDFAF7] border border-[#E8E2D9] rounded-tl-none text-[#2C2420]"
                )}>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  
                  {m.role === "assistant" && !isLoading && i === messages.length - 1 && (
                    <div className="mt-6 pt-5 border-t border-[#E8E2D9] space-y-3">
                      <div className="flex items-center gap-2 text-[10px] text-[#A69E94] font-bold uppercase tracking-widest">
                        <BookOpen size={12} />
                        Source: {m.citation || "Personal Knowledge Base"}
                      </div>
                      {m.citation && (
                        <div className="flex items-center gap-2 text-[10px] text-[#7A9E7E] font-bold uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#7A9E7E]" />
                          Confident Insight
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="w-9 h-9 bg-[#C4714F] rounded-xl flex items-center justify-center flex-shrink-0 mt-1 text-white shadow-md">
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-[#E8E2D9] bg-[#FDFAF7]/80 backdrop-blur-md shadow-2xl">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="max-w-4xl mx-auto relative group"
        >
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search your soul... or just your notes." 
            className="w-full bg-[#F5F0EA] border border-[#E8E2D9] rounded-2xl py-5 pl-7 pr-16 focus:outline-none focus:border-[#C4714F] focus:ring-4 focus:ring-[#C4714F]/5 transition-all text-[#2C2420] placeholder:text-[#A69E94]"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#C4714F] rounded-xl flex items-center justify-center text-white hover:bg-[#A65A3D] disabled:opacity-30 transition-all shadow-md shadow-orange-900/10"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="text-center text-[10px] text-[#A69E94] mt-5 uppercase tracking-[0.2em] font-bold">
          Reflecting your unique wisdom • FlowMind AI
        </p>
      </div>
    </div>
  );
}
