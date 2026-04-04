import { NextResponse } from 'next/server';
import groq, { findRelevantChunks } from '@/lib/groq';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    const relevantChunks = findRelevantChunks(lastMessage);
    const context = relevantChunks.map(c => `Source: ${c.title}\nContent: ${c.chunk}`).join('\n\n');

    const systemPrompt = `You are FlowMind, the user's personal AI second brain. You have access to everything the user has saved. Answer questions ONLY from their saved knowledge. Always cite your source. If information isn't in their knowledge base, say 'I don't have that in your knowledge base yet — try saving some content about it first.' Be like a brilliant friend who has read everything they saved.

Relevant Knowledge:
${context || 'No relevant knowledge found.'}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      model: "llama-3.3-70b-versatile",
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        // Send metadata first
        const metadata = JSON.stringify({
          citations: relevantChunks.map(c => c.title),
          confidence: relevantChunks.length > 0 ? 0.95 : 0.0,
        }) + "\n---\n";
        controller.enqueue(new TextEncoder().encode(metadata));

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
