import { GoogleGenerativeAI } from "@google/generative-ai";
import { readKnowledge } from "./storage";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateSummary(content: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return "Summary unavailable (API key not set)";
  }

  try {
    const result = await model.generateContent([
      "You are a concise summarizer. Summarize the following content in 2-3 sentences.",
      content.slice(0, 10000), // Gemini has a larger window than Llama 70b usually
    ]);
    const response = await result.response;
    return response.text() || "No summary generated.";
  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    return "Error generating summary.";
  }
}

export async function generateTags(content: string): Promise<string[]> {
  if (!process.env.GEMINI_API_KEY) {
    return ["general"];
  }

  try {
    const result = await model.generateContent([
      "Extract 3-5 relevant keywords/tags from the following content. Return ONLY a comma-separated list.",
      content.slice(0, 5000),
    ]);
    const response = await result.response;
    const text = response.text();
    const tags = text.split(",").map((t) => t.trim()) || [];
    return tags.length > 0 ? tags : ["general"];
  } catch (error) {
    console.error("Error generating tags with Gemini:", error);
    return ["general"];
  }
}

export function findRelevantChunks(
  query: string,
  email?: string,
  limit: number = 5
): { chunk: string; sourceId: string; title: string }[] {
  const items = readKnowledge(email);
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const results: {
    chunk: string;
    sourceId: string;
    title: string;
    score: number;
  }[] = [];

  for (const item of items) {
    for (const chunk of item.chunks) {
      let score = 0;
      const chunkLower = chunk.toLowerCase();
      for (const word of queryWords) {
        if (chunkLower.includes(word)) {
          score += 1;
        }
      }
      if (score > 0) {
        results.push({ chunk, sourceId: item.id, title: item.title, score });
      }
    }
  }

  // Sort by score descending and take limit
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ chunk, sourceId, title }) => ({ chunk, sourceId, title }));
}

export default model;
