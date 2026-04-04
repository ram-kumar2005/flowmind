import Groq from 'groq-sdk';
import { readKnowledge } from './storage';
import { KnowledgeItem } from './types';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateSummary(content: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    return "Summary unavailable (API key not set)";
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a concise summarizer. Summarize the following content in 2-3 sentences.",
        },
        {
          role: "user",
          content: content.slice(0, 5000), // Limit input size
        },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content || "No summary generated.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Error generating summary.";
  }
}

export async function generateTags(content: string): Promise<string[]> {
  if (!process.env.GROQ_API_KEY) {
    return ["general"];
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Extract 3-5 relevant keywords/tags from the following content. Return ONLY a comma-separated list.",
        },
        {
          role: "user",
          content: content.slice(0, 3000),
        },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 50,
    });

    const tags = completion.choices[0]?.message?.content?.split(',').map(t => t.trim()) || [];
    return tags.length > 0 ? tags : ["general"];
  } catch (error) {
    console.error("Error generating tags:", error);
    return ["general"];
  }
}

export function findRelevantChunks(query: string, limit: number = 5): { chunk: string, sourceId: string, title: string }[] {
  const items = readKnowledge();
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const results: { chunk: string, sourceId: string, title: string, score: number }[] = [];

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

export default groq;
