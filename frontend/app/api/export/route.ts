import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: Request) {
  const auth = await getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'json';

  try {
    const reflections = await pool.query(
      `SELECT r.*, COALESCE(array_agg(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), '{}') as tags
       FROM reflections r
       LEFT JOIN tags t ON t.reflection_id = r.id
       WHERE r.user_id = $1
       GROUP BY r.id
       ORDER BY r.timestamp DESC`,
      [auth.userId]
    );

    const user = await pool.query('SELECT email, created_at FROM users WHERE id = $1', [
      auth.userId,
    ]);

    if (format === 'markdown') {
      let markdown = `# Reflective Journal Export\n\n`;
      markdown += `Exported: ${new Date().toISOString()}\n`;
      markdown += `Account: ${user.rows[0]?.email}\n\n---\n\n`;

      for (const r of reflections.rows) {
        const date = new Date(r.date).toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        markdown += `## Reflection - ${date}\n\n`;

        if (r.summary_text) {
          markdown += `### What You Shared\n${r.summary_text}\n\n`;
        }

        if (r.themes && r.themes.length > 0) {
          const themes = typeof r.themes === 'string' ? JSON.parse(r.themes) : r.themes;
          markdown += `### Themes\n${themes.map((t: string) => `- ${t}`).join('\n')}\n\n`;
        }

        if (r.mood) {
          markdown += `### Mood\n${r.mood}\n\n`;
        }

        if (r.actions) {
          markdown += `### Actions\n${r.actions}\n\n`;
        }

        if (r.mirror_reflection) {
          markdown += `### Mirror Reflection\n${r.mirror_reflection}\n\n`;
        }

        if (r.tags && r.tags.length > 0) {
          markdown += `Tags: ${r.tags.map((t: string) => `#${t}`).join(' ')}\n\n`;
        }

        markdown += `---\n\n`;
      }

      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="reflective-journal-export.md"',
        },
      });
    }

    // JSON format
    const data = {
      exported_at: new Date().toISOString(),
      user: {
        email: user.rows[0]?.email,
        created_at: user.rows[0]?.created_at,
      },
      reflections: reflections.rows.map((r) => ({
        date: r.date,
        summary_text: r.summary_text,
        themes: typeof r.themes === 'string' ? JSON.parse(r.themes) : r.themes,
        mood: r.mood,
        actions: r.actions,
        mirror_reflection: r.mirror_reflection,
        tags: r.tags,
        session_length_seconds: r.session_length_seconds,
        created_at: r.created_at,
      })),
    };

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="reflective-journal-export.json"',
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
