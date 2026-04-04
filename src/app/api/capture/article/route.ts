import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { addItem, chunkText } from '@/lib/storage';
import { generateSummary, generateTags } from '@/lib/groq';
import { KnowledgeItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return NextResponse.json({ error: 'Failed to parse article' }, { status: 400 });
    }

    const content = article?.textContent || '';
    const summary = await generateSummary(content);
    const tags = await generateTags(content);

    const newItem: KnowledgeItem = {
      id: uuidv4(),
      type: 'article',
      title: article?.title || 'Untitled Article',
      content,
      summary,
      tags,
      source_url: url,
      date_saved: new Date().toISOString(),
      chunks: chunkText(content),
    };

    addItem(newItem);

    return NextResponse.json(newItem);
  } catch (error) {
    console.error('Error in article capture:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
