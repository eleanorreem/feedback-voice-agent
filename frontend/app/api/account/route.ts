import { NextResponse } from 'next/server';
import { clearAuthCookie, getAuthFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

export async function DELETE(req: Request) {
  const auth = await getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // CASCADE delete removes all reflections and tags
    await pool.query('DELETE FROM users WHERE id = $1', [auth.userId]);

    const response = NextResponse.json({ success: true });
    clearAuthCookie(response);
    return response;
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
