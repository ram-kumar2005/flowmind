"use client";

import { useState } from "react";
import { FileText, Video, File, Globe, FileCode, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

type CaptureType = "note" | "youtube" | "pdf" | "article" | "code";

export default function CapturePage() {
  const [activeTab, setActiveTab] = useState<CaptureType>("note");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [file, setFile] = useState<File | null>(null);
  const [transcriptPreview, setTranscriptPreview] = useState<string>("");
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);

  const fetchTranscript = async () => {
    if (!url || !url.includes("youtube.com") && !url.includes("youtu.be")) return;
    setIsFetchingTranscript(true);
    try {
      const res = await fetch("/api/capture/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, previewOnly: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranscriptPreview(data.content);
      }
    } catch (error) {
      console.error("Failed to fetch transcript:", error);
    } finally {
      setIsFetchingTranscript(false);
    }
  };

  const tabs = [
    { id: "note", label: "Note", icon: FileText },
    { id: "youtube", label: "YouTube", icon: Video },
    { id: "pdf", label: "PDF", icon: File },
    { id: "article", label: "Article", icon: Globe },
    { id: "code", label: "Code", icon: FileCode },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      let endpoint = `/api/capture/${activeTab}`;
      let body: any;
      let isFormData = false;

      if (activeTab === "note") {
        body = JSON.stringify({ title, content, tags: tags.split(",").map(t => t.trim()) });
      } else if (activeTab === "youtube") {
        body = JSON.stringify({ url, title, content: transcriptPreview });
      } else if (activeTab === "article") {
        body = JSON.stringify({ url, title });
      } else if (activeTab === "code") {
        body = JSON.stringify({ title, content, language, description: tags });
      } else if (activeTab === "pdf") {
        const formData = new FormData();
        if (file) formData.append("file", file);
        formData.append("title", title);
        body = formData;
        isFormData = true;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: isFormData ? {} : { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        setSuccess(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#C4714F", "#7A9E7E", "#EDE8E0"]
        });
        // Reset form
        setTitle("");
        setContent("");
        setUrl("");
        setTags("");
        setFile(null);
        setTranscriptPreview("");
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-10">
      <div className="space-y-3">
        <h1 className="text-4xl font-serif font-bold text-[#2C2420]">Capture Knowledge</h1>
        <p className="text-[#5C544E]">Preserve a new spark of wisdom for your second brain.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#EDE8E0] p-1.5 rounded-2xl border border-[#E8E2D9] shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as CaptureType);
              setSuccess(false);
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold transition-all duration-300",
              activeTab === tab.id 
                ? "bg-[#C4714F] text-white shadow-lg shadow-orange-900/10" 
                : "text-[#8C847E] hover:text-[#2C2420] hover:bg-[#E2DCD3]"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="card p-10 bg-[#FDFAF7]">
        <form onSubmit={handleSave} className="space-y-8">
          {activeTab === "note" && (
            <>
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#A69E94] uppercase tracking-widest">Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The essence of this note..." 
                  className="w-full input-field"
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#A69E94] uppercase tracking-widest">Content</label>
                <textarea 
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Flow your thoughts here..." 
                  className="w-full input-field resize-none leading-relaxed"
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#A69E94] uppercase tracking-widest">Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="philosophy, biology, project-alpha..." 
                  className="w-full input-field"
                />
              </div>
            </>
          )}

          {(activeTab === "youtube" || activeTab === "article") && (
            <>
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#A69E94] uppercase tracking-widest">{activeTab === "youtube" ? "YouTube URL" : "Article URL"}</label>
                <div className="flex gap-3">
                  <input 
                    type="url" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..." 
                    className="flex-1 input-field"
                    required
                  />
                  {activeTab === "youtube" && (
                    <button 
                      type="button" 
                      onClick={fetchTranscript}
                      disabled={isFetchingTranscript || !url}
                      className="btn-secondary px-8 font-bold"
                    >
                      {isFetchingTranscript ? "..." : "Fetch"}
                    </button>
                  )}
                </div>
              </div>

              {activeTab === "youtube" && transcriptPreview && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-3 duration-300">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[#A69E94] uppercase tracking-widest">Transcript Preview</label>
                    <span className="text-[10px] text-[#7A9E7E] font-bold uppercase tracking-widest border border-[#7A9E7E]/30 px-2 py-0.5 rounded">Refinable</span>
                  </div>
                  <textarea 
                    rows={8}
                    value={transcriptPreview}
                    onChange={(e) => setTranscriptPreview(e.target.value)}
                    className="w-full input-field text-sm leading-relaxed"
                  />
                </div>
              )}

              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#A69E94] uppercase tracking-widest">Custom Title (Optional)</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="A personal name for this item..." 
                  className="w-full input-field"
                />
              </div>
            </>
          )}

          {activeTab === "pdf" && (
            <>
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#A69E94] uppercase tracking-widest">PDF Document</label>
                <div className="border-2 border-dashed border-[#E8E2D9] rounded-3xl p-16 text-center space-y-5 hover:border-[#C4714F]/50 transition-all cursor-pointer relative bg-[#F5F0EA]/50 group">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto text-[#D6CEC3] border border-[#E8E2D9] group-hover:scale-110 transition-transform shadow-sm">
                    <File size={36} className="text-[#C4714F]" />
                  </div>
                  <div>
                    <p className="font-serif font-bold text-[#2C2420] text-lg">{file ? file.name : "Select your PDF file"}</p>
                    <p className="text-sm text-[#A69E94]">Drop your document here or click to browse</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#A69E94] uppercase tracking-widest">Title (Optional)</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document name..." 
                  className="w-full input-field"
                />
              </div>
            </>
          )}

          {activeTab === "code" && (
            <>
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#A69E94] uppercase tracking-widest">Snippet Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Elegant Rust error handling" 
                  className="w-full input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-[#A69E94] uppercase tracking-widest">Language</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full input-field cursor-pointer appearance-none"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="rust">Rust</option>
                    <option value="go">Go</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                  </select>
                </div>
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-[#A69E94] uppercase tracking-widest">Description</label>
                  <input 
                    type="text" 
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="What does this solve?" 
                    className="w-full input-field"
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#A69E94] uppercase tracking-widest">The Code</label>
                <textarea 
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your logic here..." 
                  className="w-full input-field font-mono resize-none leading-relaxed"
                  required
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={cn(
              "w-full btn-primary py-5 flex items-center justify-center gap-3 text-lg shadow-xl shadow-orange-900/10",
              success && "bg-[#7A9E7E] hover:bg-[#688A6B] shadow-green-900/10"
            )}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Gathering knowledge...
              </>
            ) : success ? (
              <>
                <Check size={22} />
                Saved to Memory
              </>
            ) : (
              "Save to FlowMind"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
