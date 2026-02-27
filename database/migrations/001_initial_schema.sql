CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_session TIMESTAMPTZ
);

-- Reflections table
CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    summary_text TEXT,
    themes JSONB DEFAULT '[]'::jsonb,
    mood VARCHAR(100),
    actions TEXT,
    mirror_reflection TEXT,
    session_length_seconds INTEGER,
    transcript JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reflection_id UUID NOT NULL REFERENCES reflections(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL
);

-- Indexes
CREATE INDEX idx_reflections_user_id ON reflections(user_id);
CREATE INDEX idx_reflections_date ON reflections(date);
CREATE INDEX idx_tags_reflection_id ON tags(reflection_id);
CREATE INDEX idx_tags_tag_name ON tags(tag_name);
CREATE INDEX idx_users_email ON users(email);
