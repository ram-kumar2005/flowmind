import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { addItem, chunkText } from '@/lib/storage';
import { generateSummary, generateTags } from '@/lib/groq';
import { KnowledgeItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('YouTube Capture: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { url, title: userTitle, previewOnly, content: providedContent } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let content = providedContent;
    if (!content) {
      try {
        console.log(`YouTube Capture: Fetching transcript for ${url} (User: ${userEmail})`);
        const transcripts = await YoutubeTranscript.fetchTranscript(url);
        content = transcripts.map(t => t.text).join(' ');
      } catch (transcriptError) {
        console.error(`YouTube Capture: Error fetching transcript for ${url}:`, transcriptError);
        return NextResponse.json({ 
          error: 'Failed to fetch transcript. The video might not have captions or is restricted.',
          details: transcriptError instanceof Error ? transcriptError.message : String(transcriptError)
        }, { status: 400 });
      }
    }

    if (previewOnly) {
      return NextResponse.json({ content });
    }

    if (!content) {
      return NextResponse.json({ error: 'No content found to save.' }, { status: 400 });
    }

    console.log(`YouTube Capture: Generating summary and tags for ${url}`);
    const [summary, tags] = await Promise.all([
      generateSummary(content),
      generateTags(content)
    ]);

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

    console.log(`YouTube Capture: Saving item to brain for ${userEmail}`);
    addItem(newItem, userEmail);

    return NextResponse.json(newItem);
  } catch (error: any) {
    console.error('YouTube Capture: Fatal error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error?.message || 'Unknown error' 
    }, { status: 500 });
  }
}
