"use client";

import React, { useState, useEffect, Suspense } from "react";
import { 
  Search, 
  Filter, 
  Trash2, 
  ExternalLink, 
  ChevronDown, 
  FileText, 
  Video, 
  File, 
  Globe, 
  FileCode,
  X,
  Sparkles,
  Download
} from "lucide-react";
import { KnowledgeItem } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export default function KnowledgePage() {
  return (
    <Suspense fallback={
      <div className="p-10 max-w-7xl mx-auto space-y-10">
        <div className="h-64 animate-pulse bg-[#EDE8E0]/30 border-[#E8E2D9] rounded-2xl" />
      </div>
    }>
      <KnowledgeContent />
    </Suspense>
  );
}

function KnowledgeContent() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type");
  const selectedId = searchParams.get("id");

  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedItem, setExpandedItem] = useState<KnowledgeItem | null>(null);

  useEffect(() => {
    fetchKnowledge();
  }, []);

  useEffect(() => {
    if (typeFilter) {
      setFilter(typeFilter);
    }
  }, [typeFilter]);

  useEffect(() => {
    if (items.length > 0 && selectedId) {
      const item = items.find(i => i.id === selectedId);
      if (item) setExpandedItem(item);
    }
  }, [items, selectedId]);

  const fetchKnowledge = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/knowledge");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch knowledge:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportAsMarkdown = () => {
    let md = "# FlowMind Knowledge Base Export\n\n";
    items.forEach(item => {
      md += `## ${item.title}\n`;
      md += `**Type:** ${item.type} | **Date:** ${formatDate(item.date_saved)}\n`;
      md += `**Tags:** ${item.tags.join(", ")}\n\n`;
      md += `### Summary\n${item.summary}\n\n`;
      md += `### Content\n${item.content}\n\n`;
      md += "---\n\n";
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowmind-export-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this treasure?")) return;

    try {
      const res = await fetch("/api/knowledge", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setItems(items.filter(i => i.id !== id));
        if (expandedItem?.id === id) setExpandedItem(null);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const filteredItems = items.filter(item => {
    const searchLower = search.toLowerCase();
    const matchesSearch = item.title.toLowerCase().includes(searchLower) || 
                         item.content.toLowerCase().includes(searchLower) ||
                         item.tags.some(t => t.toLowerCase().includes(searchLower));
    const matchesFilter = filter === "all" || item.type === filter;
    return matchesSearch && matchesFilter;
  });

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
    <div className="p-10 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#E8E2D9] pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-bold text-[#2C2420]">Knowledge Base</h1>
          <div className="flex items-center gap-4">
            <p className="text-[#A69E94] text-sm font-medium">{items.length} items preserved</p>
            <button 
              onClick={exportAsMarkdown}
              className="text-[10px] flex items-center gap-2 text-[#C4714F] hover:text-[#A65A3D] font-bold uppercase tracking-[0.2em] transition-colors"
            >
              <Download size={14} />
              Export MD
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 flex-1 max-w-3xl">
          {/* Quick Filter Pills */}
          <div className="flex flex-wrap gap-2 items-center mr-4">
            {["all", "note", "youtube", "pdf", "article", "code"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                  filter === type 
                    ? "bg-[#C4714F] text-white shadow-md shadow-orange-900/10" 
                    : "bg-[#F5F0EA] text-[#8C847E] border border-[#E8E2D9] hover:border-[#C4714F]/30"
                )}
              >
                {type === "all" ? "All" : type === "youtube" ? "Video" : type === "pdf" ? "PDF" : type + "s"}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D6CEC3]" size={18} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your library..." 
              className="w-full bg-[#FDFAF7] border border-[#E8E2D9] rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-[#C4714F] transition-all text-[#2C2420] placeholder:text-[#A69E94]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card h-64 animate-pulse bg-[#EDE8E0]/30 border-[#E8E2D9]" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setExpandedItem(item)}
              className="break-inside-avoid card space-y-5 cursor-pointer group hover:scale-[1.02] transition-all duration-300 bg-[#FDFAF7] border-[#E8E2D9]"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#F5F0EA] text-[#8C847E] group-hover:text-[#C4714F] transition-colors">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="text-[10px] text-[#A69E94] font-bold uppercase tracking-widest">{formatDate(item.date_saved)}</div>
                </div>
                <button 
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-2 rounded-xl text-[#D6CEC3] hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div>
                <h3 className="font-serif font-bold text-xl leading-snug text-[#2C2420] group-hover:text-[#C4714F] transition-colors">{item.title}</h3>
                <p className="text-sm text-[#5C544E] line-clamp-4 mt-3 leading-relaxed">{item.summary || item.content}</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {item.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-[#F5F0EA] px-2.5 py-1 rounded-full text-[#8C847E] font-medium border border-[#E8E2D9] group-hover:border-[#C4714F]/30 transition-colors">#{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card py-24 text-center space-y-8 border-dashed bg-transparent">
          <div className="w-24 h-24 bg-[#FDFAF7] rounded-full flex items-center justify-center mx-auto text-[#D6CEC3] border border-[#E8E2D9]">
            <Search size={44} />
          </div>
          <div className="space-y-3 max-w-sm mx-auto">
            <h3 className="text-2xl font-serif font-bold text-[#2C2420]">Nothing found</h3>
            <p className="text-[#5C544E] text-sm">We couldn't find any matches for your search. Perhaps try a different keyword?</p>
          </div>
          <button 
            onClick={() => { setSearch(""); setFilter("all"); }}
            className="btn-secondary font-bold"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Expanded Item Modal */}
      {expandedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#2C2420]/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#FDFAF7] w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] border border-[#E8E2D9] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-[#E8E2D9] flex justify-between items-center bg-white/50">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-[#F5F0EA] text-[#C4714F] shadow-sm">
                  {getTypeIcon(expandedItem.type)}
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#2C2420] line-clamp-1">{expandedItem.title}</h2>
                  <p className="text-[10px] text-[#A69E94] uppercase tracking-[0.2em] font-bold mt-1">{formatDate(expandedItem.date_saved)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {expandedItem.source_url && (
                  <a 
                    href={expandedItem.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 rounded-2xl text-[#8C847E] hover:text-[#C4714F] hover:bg-[#F5F0EA] transition-all"
                  >
                    <ExternalLink size={22} />
                  </a>
                )}
                <button 
                  onClick={() => setExpandedItem(null)}
                  className="p-3 rounded-2xl text-[#8C847E] hover:text-[#C4714F] hover:bg-[#F5F0EA] transition-all"
                >
                  <X size={22} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
              {/* Summary Section */}
              <div className="bg-[#C4714F]/5 border border-[#C4714F]/10 rounded-[2rem] p-8 space-y-4">
                <div className="flex items-center gap-2.5 text-[#C4714F] text-[10px] font-bold uppercase tracking-[0.2em]">
                  <Sparkles size={14} />
                  Artificial Insight
                </div>
                <p className="text-[#2C2420] text-lg leading-relaxed font-serif italic">
                  "{expandedItem.summary || "This item is still awaiting its AI-generated reflection."}"
                </p>
              </div>

              {/* Content Section */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A69E94]">Full Gathering</h3>
                {expandedItem.type === "code" ? (
                  <div className="relative group">
                    <pre className="bg-[#2C2420] p-8 rounded-[1.5rem] border border-[#E8E2D9] overflow-x-auto text-sm font-mono text-[#F5F0EA] leading-relaxed">
                      <code>{expandedItem.content}</code>
                    </pre>
                    <div className="absolute top-5 right-5 text-[10px] bg-[#C4714F] px-3 py-1 rounded-full text-white font-bold uppercase tracking-wider">
                      {expandedItem.language || 'plaintext'}
                    </div>
                  </div>
                ) : (
                  <div className="text-[#5C544E] leading-[1.8] whitespace-pre-wrap text-base">
                    {expandedItem.content}
                  </div>
                )}
              </div>

              {/* Tags Section */}
              <div className="flex flex-wrap gap-2.5 pt-8 border-t border-[#E8E2D9]">
                {expandedItem.tags.map(tag => (
                  <span key={tag} className="px-4 py-2 bg-[#F5F0EA] rounded-full text-xs font-bold text-[#8C847E] border border-[#E8E2D9] transition-colors hover:border-[#C4714F]/30">#{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
