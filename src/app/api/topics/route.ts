import { NextResponse } from 'next/server';
import { readKnowledge } from '@/lib/storage';

export async function GET() {
  try {
    const items = readKnowledge();
    const topics: { [key: string]: string[] } = {};

    items.forEach(item => {
      item.tags.forEach(tag => {
        const normalizedTag = tag.toLowerCase().trim();
        if (!topics[normalizedTag]) {
          topics[normalizedTag] = [];
        }
        if (!topics[normalizedTag].includes(item.id)) {
          topics[normalizedTag].push(item.id);
        }
      });
    });

    const topicList = Object.keys(topics).map(name => ({
      name,
      count: topics[name].length,
      itemIds: topics[name]
    })).sort((a, b) => b.count - a.count);

    return NextResponse.json(topicList);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
