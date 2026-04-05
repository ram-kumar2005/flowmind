import { NextResponse } from 'next/server';
import groq, { findRelevantChunks } from '@/lib/groq';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { messages } = body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content;
    const userEmail = session.user.email;

    let relevantChunks: string[] = [];
    try {
      relevantChunks = findRelevantChunks(lastMessage, userEmail);
    } catch (err) {
      console.error(`Chat API: Search error for ${userEmail}:`, err);
      relevantChunks = [];
    }

    const context = relevantChunks.length > 0
      ? relevantChunks.map((c: any) => `Source: ${c.title}\nContent: ${c.chunk}`).join('\n\n')
      : 'NO_SAVED_KNOWLEDGE';

    const systemPrompt = `You are FlowMind, the user's personal AI second brain. You have access to everything the user has saved.
CRITICAL RULES:
1. Answer questions ONLY from their saved knowledge provided below.
2. If the context is 'NO_SAVED_KNOWLEDGE' or if the answer isn't in the provided context, you MUST say exactly: "I don't have that in your knowledge base yet. Try saving some content about it first!"
3. Always cite your source title if you found an answer.
4. Be like a brilliant friend who has read everything they saved.

Relevant Knowledge Context:
${context}`;

    const cleanedMessages = messages.map((m: any) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: typeof m.content === 'string' ? m.content : String(m.content)
    }));

    const models = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'llama3-70b-8192'
    ];

    let completion;
    for (const modelName of models) {
      try {
        console.log(`Chat API: Attempting Groq with model: ${modelName}`);
        completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            ...cleanedMessages
          ],
          model: modelName,
          stream: true,
        });
        break;
      } catch (err: any) {
        console.error(`Chat API: Error with model ${modelName}:`, err?.message);
        if (modelName === models[models.length - 1]) {
          return NextResponse.json({ error: 'AI service is currently unavailable' }, { status: 503 });
        }
      }
    }

    if (!completion) {
      return NextResponse.json({ error: 'AI service is currently unavailable' }, { status: 503 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          const metadata = JSON.stringify({
            citations: relevantChunks.map((c: any) => c.title),
            confidence: relevantChunks.length > 0 ? 0.95 : 0.0,
          }) + "\n---\n";
          controller.enqueue(encoder.encode(metadata));

          for await (const chunk of completion!) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (err) {
          console.error('Chat API: Streaming error:', err);
          controller.enqueue(encoder.encode("\n\n[Stream interrupted. Please try again.]"));
        } finally {
          controller.close();
        }
      },
      cancel() {
        console.log('Chat API: Stream cancelled by client');
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (fatalError: any) {
    console.error('Chat API: Fatal Uncaught Error:', fatalError);
    return NextResponse.json({
      error: 'Internal server error',
      details: fatalError?.message || 'Unknown error'
    }, { status: 500 });
  }
}