import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await pool.query(
      `SELECT r.*, COALESCE(array_agg(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), '{}') as tags
       FROM reflections r
       LEFT JOIN tags t ON t.reflection_id = r.id
       WHERE r.id = $1 AND r.user_id = $2
       GROUP BY r.id`,
      [id, auth.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ reflection: result.rows[0] });
  } catch (error) {
    console.error('Error fetching reflection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { summary_text, mood, actions, tags } = body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify ownership
      const check = await client.query(
        'SELECT id FROM reflections WHERE id = $1 AND user_id = $2',
        [id, auth.userId]
      );
      if (check.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      await client.query(
        `UPDATE reflections SET summary_text = $1, mood = $2, actions = $3, updated_at = NOW()
         WHERE id = $4`,
        [summary_text, mood, actions, id]
      );

      // Update tags if provided
      if (tags !== undefined) {
        await client.query('DELETE FROM tags WHERE reflection_id = $1', [id]);
        for (const tag of tags) {
          await client.query('INSERT INTO tags (reflection_id, tag_name) VALUES ($1, $2)', [
            id,
            tag.toLowerCase().trim(),
          ]);
        }
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating reflection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await pool.query(
      'DELETE FROM reflections WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, auth.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reflection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
