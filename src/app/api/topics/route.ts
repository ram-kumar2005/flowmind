import { NextResponse } from 'next/server';
import { readKnowledge } from '@/lib/storage';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = readKnowledge(session.user.email);
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
