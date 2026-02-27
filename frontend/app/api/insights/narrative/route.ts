import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

const NARRATIVE_PROMPT = `You are a compassionate journal companion who has been listening to someone reflect over time.

Based on their journaling sessions, write a warm second-person narrative synthesis (3–5 short paragraphs) that:
- Identifies recurring themes and emotional patterns across sessions
- Notes any evolution, shifts in tone, or signs of growth over time
- Points out language patterns, contradictions, or tendencies worth noticing
- Ends with a brief, grounded observation about their journaling practice itself

Write as if you're a wise friend who has been paying close attention. Use "you" to address them directly.
Be specific and grounded in what they've actually said — no generic platitudes.
Keep it warm but honest. Don't over-celebrate or catastrophise. Avoid bullet points — write flowing paragraphs.`;

export async function POST(req: Request) {
  const auth = await getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT r.date, r.summary_text, r.themes, r.mood,
              COALESCE(array_agg(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), '{}') as tags
       FROM reflections r
       LEFT JOIN tags t ON t.reflection_id = r.id
       WHERE r.user_id = $1
       GROUP BY r.id, r.date, r.summary_text, r.themes, r.mood, r.timestamp
       ORDER BY r.timestamp ASC`,
      [auth.userId]
    );

    const reflections = result.rows;

    if (reflections.length < 2) {
      return NextResponse.json({ error: 'Not enough sessions' }, { status: 400 });
    }

    const context = reflections
      .map((r) => {
        const date = new Date(r.date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const parts: string[] = [`Session on ${date}`];
        if (r.mood) parts.push(`Mood: ${r.mood}`);
        if (Array.isArray(r.themes) && r.themes.length > 0)
          parts.push(`Themes: ${r.themes.join(', ')}`);
        if (Array.isArray(r.tags) && r.tags.length > 0)
          parts.push(`Tags: ${r.tags.join(', ')}`);
        if (r.summary_text) parts.push(`What they shared:\n${r.summary_text}`);
        return parts.join('\n');
      })
      .join('\n\n---\n\n');

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        stream: true,
        system: NARRATIVE_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Here are the journaling sessions:\n\n${context}`,
          },
        ],
      }),
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      console.error('Anthropic error:', body);
      return NextResponse.json({ error: 'Failed to generate narrative' }, { status: 500 });
    }

    // Transform Anthropic SSE → plain text stream
    // Anthropic emits `content_block_delta` events with delta.type = "text_delta"
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                  const text = parsed.delta.text ?? '';
                  if (text) controller.enqueue(encoder.encode(text));
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error generating narrative:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
