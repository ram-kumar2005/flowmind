import { NextResponse } from 'next/server';
import { addItem, chunkText } from '@/lib/storage';
import { generateSummary, generateTags } from '@/lib/groq';
import { KnowledgeItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { title, content, language, description } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Code content is required' }, { status: 400 });
    }

    const fullContent = `Description: ${description || 'No description'}\n\nCode:\n${content}`;
    const summary = await generateSummary(fullContent);
    const tags = await generateTags(fullContent);

    const newItem: KnowledgeItem = {
      id: uuidv4(),
      type: 'code',
      title: title || 'Untitled Code Snippet',
      content,
      summary,
      tags: [...tags, language || 'plaintext'],
      language: language || 'plaintext',
      date_saved: new Date().toISOString(),
      chunks: chunkText(fullContent),
    };

    addItem(newItem);

    return NextResponse.json(newItem);
  } catch (error) {
    console.error('Error in code capture:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
