export type KnowledgeItemType = "note" | "youtube" | "pdf" | "article" | "code";

export interface KnowledgeItem {
  id: string;
  type: KnowledgeItemType;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  source_url?: string;
  language?: string;
  date_saved: string;
  chunks: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citation?: string;
}
