import json
import os
import asyncpg

_pool = None


async def get_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=os.environ.get("DATABASE_URL"),
            min_size=2,
            max_size=10,
        )
    return _pool


async def get_user_session_count(user_id: str) -> int:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT COUNT(*) as count FROM reflections WHERE user_id = $1",
            user_id,
        )
        return row["count"] if row else 0


async def get_user_reflections(user_id: str, limit: int = 5) -> list[dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT r.id, r.date, r.summary_text, r.themes, r.mood,
                   r.actions, r.mirror_reflection
            FROM reflections r
            WHERE r.user_id = $1
            ORDER BY r.timestamp DESC
            LIMIT $2
            """,
            user_id,
            limit,
        )
        result = []
        for row in rows:
            reflection = dict(row)
            # Get tags for this reflection
            tag_rows = await conn.fetch(
                "SELECT tag_name FROM tags WHERE reflection_id = $1",
                row["id"],
            )
            reflection["tags"] = [t["tag_name"] for t in tag_rows]
            # Parse themes from JSONB
            if isinstance(reflection["themes"], str):
                reflection["themes"] = json.loads(reflection["themes"])
            result.append(reflection)
        return result


async def save_reflection(
    user_id: str,
    summary_text: str,
    themes: list[str],
    mood: str | None,
    actions: str | None,
    mirror_reflection: str,
    session_length_seconds: int,
    transcript: list[dict],
    tags: list[str],
) -> str:
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(
                """
                INSERT INTO reflections
                    (user_id, summary_text, themes, mood, actions,
                     mirror_reflection, session_length_seconds, transcript)
                VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8::jsonb)
                RETURNING id
                """,
                user_id,
                summary_text,
                json.dumps(themes),
                mood,
                actions,
                mirror_reflection,
                session_length_seconds,
                json.dumps(transcript),
            )
            reflection_id = row["id"]

            for tag in tags:
                await conn.execute(
                    "INSERT INTO tags (reflection_id, tag_name) VALUES ($1, $2)",
                    reflection_id,
                    tag.lower().strip(),
                )

            await conn.execute(
                "UPDATE users SET last_session = NOW() WHERE id = $1",
                user_id,
            )

            return str(reflection_id)
