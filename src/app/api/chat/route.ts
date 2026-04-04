import { NextResponse } from 'next/server';
import groq, { findRelevantChunks } from '@/lib/groq';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  // Wrap EVERYTHING in a top-level try/catch
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

    // Find relevant chunks with fallback
    let relevantChunks = [];
    try {
      relevantChunks = findRelevantChunks(lastMessage, userEmail);
    } catch (err) {
      console.error(`Chat API: Search error for ${userEmail}:`, err);
      relevantChunks = [];
    }

    const context = relevantChunks.length > 0 
      ? relevantChunks.map(c => `Source: ${c.title}\nContent: ${c.chunk}`).join('\n\n')
      : 'NO_SAVED_KNOWLEDGE';

    const systemPrompt = `You are FlowMind, the user's personal AI second brain. You have access to everything the user has saved. 

CRITICAL RULES:
1. Answer questions ONLY from their saved knowledge provided below.
2. If the context is 'NO_SAVED_KNOWLEDGE' or if the answer isn't in the provided context, you MUST say exactly: "I don't have that in your knowledge base yet. Try saving some content about it first!"
3. Always cite your source title if you found an answer.
4. Be like a brilliant friend who has read everything they saved.

Relevant Knowledge Context:
${context}`;

    // Initialize Groq stream
    let completion;
    try {
      completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        model: "llama-3.3-70b-versatile",
        stream: true,
      });
    } catch (groqErr: any) {
      console.error('Chat API: Groq connection error:', groqErr);
      return NextResponse.json({ error: 'AI service is currently unavailable', details: groqErr?.message }, { status: 503 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          // Send metadata first
          const metadata = JSON.stringify({
            citations: relevantChunks.map(c => c.title),
            confidence: relevantChunks.length > 0 ? 0.95 : 0.0,
          }) + "\n---\n";
          controller.enqueue(encoder.encode(metadata));

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (err) {
          console.error('Chat API: Streaming error:', err);
          // Don't kill the whole stream if possible, but notify controller
          const errorMessage = "\n\n[System: The stream was interrupted. Please try again.]";
          controller.enqueue(encoder.encode(errorMessage));
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
