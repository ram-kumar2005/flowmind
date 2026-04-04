import { NextResponse } from 'next/server';
// @ts-ignore
import pdf from 'pdf-parse/dist/pdf-parse/esm/index';
import { addItem, chunkText } from '@/lib/storage';
import { generateSummary, generateTags } from '@/lib/groq';
import { KnowledgeItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userTitle = formData.get('title') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    const content = data.text;

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

    addItem(newItem);

    return NextResponse.json(newItem);
  } catch (error) {
    console.error('Error in pdf capture:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
