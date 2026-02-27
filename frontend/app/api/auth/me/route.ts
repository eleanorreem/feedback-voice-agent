import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  const auth = await getAuthFromRequest(req);

  if (!auth) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: { id: auth.userId, email: auth.email } });
}
