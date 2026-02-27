import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: Request) {
  const auth = await getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT DISTINCT t.tag_name
       FROM tags t
       JOIN reflections r ON r.id = t.reflection_id
       WHERE r.user_id = $1
       ORDER BY t.tag_name`,
      [auth.userId]
    );

    return NextResponse.json({ tags: result.rows.map((r) => r.tag_name) });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
