"use client";

import { useState, useEffect } from "react";
import { Search, Plus, FileText, Video, File, Globe, FileCode, Zap, Clock, Hash, Library } from "lucide-react";
import { KnowledgeItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickCapture, setQuickCapture] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/knowledge")
      .then(res => res.json())
      .then(data => {
        const validatedData = Array.isArray(data) ? data : [];
        setItems(validatedData);
        setLoading(false);
        if (validatedData.length >= 2) generateDailyInsight(validatedData);
      })
      .catch(err => {
        console.error("Error fetching knowledge:", err);
        setItems([]);
        setLoading(false);
      });
  }, []);

  const generateDailyInsight = async (knowledgeItems: KnowledgeItem[]) => {
    if (!Array.isArray(knowledgeItems) || knowledgeItems.length < 2) return;
    const randomItems = [...knowledgeItems].sort(() => 0.5 - Math.random()).slice(0, 2);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [{ 
            role: "user", 
            content: `Find a brief connection or insight between these two items: "${randomItems[0].title}" and "${randomItems[1].title}". Return only a 1-sentence interesting observation.` 
          }] 
        }),
      });
      if (res.ok) {
        const text = await res.text();
        const cleanedText = text.split("---")[1] || text;
        setInsight(cleanedText);
      }
    } catch (e) { console.error("Insight failed", e); }
  };

  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCapture.trim()) return;

    setIsCapturing(true);
    try {
      let type = "note";
      let payload: any = { content: quickCapture };

      if (quickCapture.startsWith("http")) {
        if (quickCapture.includes("youtube.com") || quickCapture.includes("youtu.be")) {
          type = "youtube";
          payload = { url: quickCapture };
        } else {
          type = "article";
          payload = { url: quickCapture };
        }
      }

      const res = await fetch(`/api/capture/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newItem = await res.json();
        setItems([newItem, ...items]);
        setQuickCapture("");
      }
    } catch (error) {
      console.error("Quick capture failed:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const stats = [
    { label: "Items Saved", value: Array.isArray(items) ? items.length : 0, icon: FileText, color: "text-[#C4714F]" },
    { label: "Topics Covered", value: Array.isArray(items) ? Array.from(new Set(items.flatMap(i => i.tags))).length : 0, icon: Hash, color: "text-[#C4714F]" },
    { label: "Last Updated", value: Array.isArray(items) && items.length > 0 ? formatDate(items[0].date_saved) : "Never", icon: Clock, color: "text-[#7A9E7E]" },
    { label: "Today's Insight", value: insight || "AI Connection", icon: Zap, color: "text-[#C4714F]" },
  ];

  const recentItems = Array.isArray(items) ? items.slice(0, 6) : [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "note": return <FileText size={18} />;
      case "youtube": return <Video size={18} />;
      case "pdf": return <File size={18} />;
      case "article": return <Globe size={18} />;
      case "code": return <FileCode size={18} />;
      default: return <FileText size={18} />;
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-12">
      {/* Header & Search */}
      <div className="space-y-8">
        <h1 className="text-4xl font-serif font-bold text-[#2C2420]">Good morning, User</h1>
        <div className="relative group max-w-3xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8C847E] group-focus-within:text-[#C4714F] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Ask your second brain..." 
            className="w-full bg-[#FDFAF7] border border-[#E8E2D9] rounded-2xl py-5 pl-14 pr-6 text-lg focus:outline-none focus:border-[#C4714F] focus:ring-4 focus:ring-[#C4714F]/5 transition-all shadow-sm placeholder:text-[#A69E94]"
            onKeyDown={(e) => e.key === "Enter" && router.push(`/chat?q=${e.currentTarget.value}`)}
          />
        </div>
      </div>

      {/* Quick Capture */}
      <div className="bg-[#FDFAF7] border border-[#E8E2D9] rounded-2xl p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#A69E94] uppercase tracking-widest">
          <Plus size={14} className="text-[#C4714F]" />
          <span>Quick Capture</span>
        </div>
        <form onSubmit={handleQuickCapture} className="flex gap-4">
          <input 
            type="text" 
            value={quickCapture}
            onChange={(e) => setQuickCapture(e.target.value)}
            placeholder="Paste a link or type a note..." 
            className="flex-1 bg-white border border-[#E8E2D9] rounded-xl px-5 py-3.5 focus:outline-none focus:border-[#C4714F] transition-all"
          />
          <button 
            type="submit" 
            disabled={isCapturing || !quickCapture.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
          >
            {isCapturing ? "Saving..." : "Save to Brain"}
          </button>
        </form>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card flex items-center gap-4 bg-[#FDFAF7]">
            <div className="p-3 rounded-xl bg-[#F5F0EA] flex items-center justify-center">
              <stat.icon size={22} className={stat.color} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[#A69E94] uppercase font-bold tracking-widest mb-0.5">{stat.label}</p>
              <p className="text-lg font-bold text-[#2C2420] truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Items */}
      <div className="space-y-8">
        <div className="flex justify-between items-end border-b border-[#E8E2D9] pb-4">
          <h2 className="text-2xl font-serif font-bold text-[#2C2420]">Recent Gatherings</h2>
          <Link href="/knowledge" className="text-sm font-bold text-[#C4714F] hover:underline flex items-center gap-1 group">
            Explore all
            <Plus size={14} className="transition-transform group-hover:rotate-90" />
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-52 animate-pulse bg-[#EDE8E0]/30 border-[#E8E2D9]" />
            ))}
          </div>
        ) : recentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentItems.map((item) => (
              <Link href={`/knowledge?id=${item.id}`} key={item.id} className="card space-y-4 group">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-lg bg-[#F5F0EA] text-[#8C847E] group-hover:text-[#C4714F] transition-colors">
                    {getTypeIcon(item.type)}
                  </div>
                  <span className="text-[10px] text-[#A69E94] font-bold uppercase tracking-[0.1em]">{formatDate(item.date_saved)}</span>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-[#2C2420] line-clamp-1 group-hover:text-[#C4714F] transition-colors">{item.title}</h3>
                  <p className="text-sm text-[#5C544E] line-clamp-2 mt-2 leading-relaxed">{item.summary}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {item.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[10px] bg-[#F5F0EA] px-2.5 py-1 rounded-full text-[#8C847E] font-medium border border-[#E8E2D9]">#{tag}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card py-16 text-center space-y-6 border-dashed bg-transparent">
            <div className="w-20 h-20 bg-[#FDFAF7] rounded-full flex items-center justify-center mx-auto text-[#D6CEC3] border border-[#E8E2D9]">
              <Library size={36} />
            </div>
            <div className="space-y-2 max-w-sm mx-auto">
              <p className="text-xl font-serif font-bold text-[#2C2420]">A quiet space...</p>
              <p className="text-sm text-[#5C544E]">Start adding notes, videos, or articles to cultivate your second brain.</p>
            </div>
            <Link href="/capture" className="inline-block btn-primary">Begin Capturing</Link>
          </div>
        )}
      </div>
    </div>
  );
}
