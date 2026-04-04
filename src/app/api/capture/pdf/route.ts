import { NextResponse } from 'next/server';
import { addItem, chunkText } from '@/lib/storage';
import { generateSummary, generateTags } from '@/lib/groq';
import { KnowledgeItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userTitle = formData.get('title') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Read file as buffer and extract readable strings (simple fallback for Vercel)
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Basic text extraction: Filter out non-printable characters 
    // This is a simple fallback since pdf-parse is incompatible with Vercel serverless
    const rawText = buffer.toString('utf8');
    const content = rawText.replace(/[^\x20-\x7E\n\t\r]/g, ' ').replace(/\s+/g, ' ').trim() || 'Extraction failed: No readable text found.';

    const summary = await generateSummary(content);
    const tags = await generateTags(content);

    const newItem: KnowledgeItem = {
      id: uuidv4(),
      type: 'pdf',
      title: userTitle || file.name,
      content,
      summary,
      tags,
      date_saved: new Date().toISOString(),
      chunks: chunkText(content),
    };

    addItem(newItem, session.user.email);

    return NextResponse.json(newItem);
  } catch (error) {
    console.error('Error in pdf capture:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
