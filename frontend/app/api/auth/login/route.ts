import { NextResponse } from 'next/server';
import { createSessionToken, setAuthCookie, verifyPassword } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const result = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = result.rows[0];
    const valid = await verifyPassword(password, user.password_hash);

    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await createSessionToken(user.id, user.email);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email },
    });
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
