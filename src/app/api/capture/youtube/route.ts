import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { addItem, chunkText } from '@/lib/storage';
import { generateSummary, generateTags } from '@/lib/groq';
import { KnowledgeItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { url, title: userTitle, previewOnly, content: providedContent } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let content = providedContent;
    if (!content) {
      const transcripts = await YoutubeTranscript.fetchTranscript(url);
      content = transcripts.map(t => t.text).join(' ');
    }

    if (previewOnly) {
      return NextResponse.json({ content });
    }

    const summary = await generateSummary(content);
    const tags = await generateTags(content);

    const newItem: KnowledgeItem = {
      id: uuidv4(),
      type: 'youtube',
      title: userTitle || 'YouTube Video Transcript',
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
    console.error('Error in youtube capture:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
