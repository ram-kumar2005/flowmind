"use client";

import { useState, useEffect } from "react";
import { Tag, FileText, ChevronRight, Hash, ArrowRight } from "lucide-react";
import { KnowledgeItem } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";

interface Topic {
  name: string;
  count: number;
  itemIds: string[];
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/topics").then(res => res.json()),
      fetch("/api/knowledge").then(res => res.json())
    ]).then(([topicsData, itemsData]) => {
      setTopics(topicsData);
      setItems(itemsData);
      setLoading(false);
    });
  }, []);

  const getTopicItems = (topic: Topic) => {
    return items.filter(i => topic.itemIds.includes(i.id));
  };

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-12">
      <div className="space-y-3">
        <h1 className="text-4xl font-serif font-bold text-[#2C2420]">Brain Topics</h1>
        <p className="text-[#5C544E]">Discover the constellations of thought in your knowledge base.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card h-32 animate-pulse bg-[#EDE8E0]/30 border-[#E8E2D9]" />
          ))}
        </div>
      ) : topics.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Topics List */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A69E94] mb-4">All Themes</h2>
            <div className="space-y-3">
              {topics.map((topic) => (
                <button
                  key={topic.name}
                  onClick={() => setSelectedTopic(topic)}
                  className={cn(
                    "w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 group text-left",
                    selectedTopic?.name === topic.name
                      ? "bg-[#C4714F] border-[#C4714F] text-white shadow-lg shadow-orange-900/10"
                      : "bg-[#FDFAF7] border-[#E8E2D9] text-[#5C544E] hover:border-[#C4714F]/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Hash size={18} className={selectedTopic?.name === topic.name ? "text-white/70" : "text-[#D6CEC3] group-hover:text-[#C4714F] transition-colors"} />
                    <span className="font-bold text-lg capitalize">{topic.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] px-2.5 py-1 rounded-full font-bold border transition-colors",
                      selectedTopic?.name === topic.name 
                        ? "bg-white/20 border-white/30 text-white" 
                        : "bg-[#F5F0EA] border-[#E8E2D9] text-[#8C847E]"
                    )}>{topic.count}</span>
                    <ChevronRight size={16} className={selectedTopic?.name === topic.name ? "text-white/50" : "text-[#D6CEC3]"} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Topic Detail */}
          <div className="lg:col-span-8 space-y-10">
            {selectedTopic ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-5 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E8E2D9] pb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-[#C4714F] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-900/10">
                      <Hash size={28} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-serif font-bold text-[#2C2420] capitalize">{selectedTopic.name}</h2>
                      <p className="text-[#A69E94] text-sm font-medium">{selectedTopic.count} related memories</p>
                    </div>
                  </div>
                  <Link 
                    href={`/chat?q=Tell me everything I know about ${selectedTopic.name}`}
                    className="btn-primary flex items-center gap-2.5 shadow-xl shadow-orange-900/10"
                  >
                    Discuss this Theme
                    <ArrowRight size={18} />
                  </Link>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A69E94]">Associated Gatherings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {getTopicItems(selectedTopic).map(item => (
                      <Link 
                        href={`/knowledge?id=${item.id}`} 
                        key={item.id} 
                        className="card group hover:border-[#C4714F] transition-all bg-[#FDFAF7]"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-[#F5F0EA] text-[#8C847E] group-hover:text-[#C4714F] transition-colors">
                            <FileText size={16} />
                          </div>
                          <span className="text-[10px] text-[#A69E94] font-bold uppercase tracking-widest">{formatDate(item.date_saved)}</span>
                        </div>
                        <h4 className="font-serif font-bold text-[#2C2420] mb-2.5 group-hover:text-[#C4714F] transition-colors">{item.title}</h4>
                        <p className="text-xs text-[#5C544E] line-clamp-2 leading-relaxed">{item.summary}</p>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="bg-[#FDFAF7] border border-[#E8E2D9] rounded-[2.5rem] p-10 shadow-sm space-y-8">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A69E94]">Neural Connections</h3>
                  <div className="relative h-60 bg-[#F5F0EA]/50 rounded-[1.5rem] border border-[#E8E2D9] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                      <svg className="w-full h-full">
                        <line x1="15%" y1="25%" x2="45%" y2="55%" stroke="#C4714F" strokeWidth="1.5" />
                        <line x1="45%" y1="55%" x2="85%" y2="35%" stroke="#C4714F" strokeWidth="1.5" />
                        <line x1="45%" y1="55%" x2="65%" y2="85%" stroke="#C4714F" strokeWidth="1.5" />
                        <circle cx="15%" cy="25%" r="5" fill="#C4714F" />
                        <circle cx="45%" cy="55%" r="7" fill="#C4714F" />
                        <circle cx="85%" cy="35%" r="5" fill="#C4714F" />
                        <circle cx="65%" cy="85%" r="5" fill="#C4714F" />
                      </svg>
                    </div>
                    <div className="text-center space-y-3 relative z-10 px-10">
                      <p className="text-sm font-serif italic text-[#5C544E]">Mapping the intersections of your unique wisdom...</p>
                      <p className="text-[10px] text-[#A69E94] uppercase tracking-[0.3em] font-bold">Intuitive Graph Coming Soon</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-32 border-2 border-dashed border-[#E8E2D9] rounded-[3rem] bg-white/30">
                <div className="w-28 h-28 bg-[#FDFAF7] rounded-full flex items-center justify-center text-[#D6CEC3] border border-[#E8E2D9] shadow-sm">
                  <Tag size={52} className="text-[#EDE8E0]" />
                </div>
                <div className="space-y-3 max-w-sm">
                  <h3 className="text-2xl font-serif font-bold text-[#2C2420]">Choose a Theme</h3>
                  <p className="text-[#5C544E]">Select a topic from the garden on the left to explore its associated memories and connections.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card py-24 text-center space-y-8 border-dashed bg-transparent">
          <div className="w-24 h-24 bg-[#FDFAF7] rounded-full flex items-center justify-center mx-auto text-[#D6CEC3] border border-[#E8E2D9]">
            <Hash size={44} />
          </div>
          <div className="space-y-3 max-w-sm mx-auto">
            <h3 className="text-2xl font-serif font-bold text-[#2C2420]">A blank canvas</h3>
            <p className="text-[#5C544E]">Themes will bloom automatically as you gather more knowledge in your second brain.</p>
          </div>
          <Link href="/capture" className="btn-primary inline-block font-bold">Gather Knowledge</Link>
        </div>
      )}
    </div>
  );
}
