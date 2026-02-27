import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: Request) {
  const auth = await getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tag = searchParams.get('tag');

  try {
    let query: string;
    const params: (string | null)[] = [auth.userId];

    if (tag) {
      query = `
        SELECT r.id, r.date, r.timestamp, r.summary_text, r.themes, r.mood,
               r.actions, r.mirror_reflection, r.session_length_seconds, r.created_at,
               COALESCE(array_agg(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), '{}') as tags
        FROM reflections r
        LEFT JOIN tags t ON t.reflection_id = r.id
        WHERE r.user_id = $1
          AND r.id IN (SELECT reflection_id FROM tags WHERE tag_name = $2)
        GROUP BY r.id
        ORDER BY r.timestamp DESC
      `;
      params.push(tag);
    } else {
      query = `
        SELECT r.id, r.date, r.timestamp, r.summary_text, r.themes, r.mood,
               r.actions, r.mirror_reflection, r.session_length_seconds, r.created_at,
               COALESCE(array_agg(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), '{}') as tags
        FROM reflections r
        LEFT JOIN tags t ON t.reflection_id = r.id
        WHERE r.user_id = $1
        GROUP BY r.id
        ORDER BY r.timestamp DESC
      `;
    }

    const result = await pool.query(query, params);
    return NextResponse.json({ reflections: result.rows });
  } catch (error) {
    console.error('Error fetching reflections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { summary_text, themes, mood, actions, mirror_reflection, tags } = body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO reflections (user_id, summary_text, themes, mood, actions, mirror_reflection)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [auth.userId, summary_text, JSON.stringify(themes ?? []), mood, actions, mirror_reflection]
      );

      const reflectionId = result.rows[0].id;

      if (tags && tags.length > 0) {
        for (const tag of tags) {
          await client.query('INSERT INTO tags (reflection_id, tag_name) VALUES ($1, $2)', [
            reflectionId,
            tag.toLowerCase().trim(),
          ]);
        }
      }

      await client.query('COMMIT');

      return NextResponse.json({ id: reflectionId }, { status: 201 });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating reflection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
