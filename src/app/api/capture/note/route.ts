import { NextResponse } from 'next/server';
import { addItem, chunkText } from '@/lib/storage';
import { generateSummary, generateTags } from '@/lib/groq';
import { KnowledgeItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { title, content, tags } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const summary = await generateSummary(content);
    const autoTags = await generateTags(content);
    const combinedTags = Array.from(new Set([...(tags || []), ...autoTags]));

    const newItem: KnowledgeItem = {
      id: uuidv4(),
      type: 'note',
      title: title || 'Untitled Note',
      content,
      summary,
      tags: combinedTags,
      date_saved: new Date().toISOString(),
      chunks: chunkText(content),
    };

    addItem(newItem);

    return NextResponse.json(newItem);
  } catch (error) {
    console.error('Error in note capture:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
