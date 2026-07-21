-- Adds a comments table for per-article, nickname-style comments.
-- Additive only: does not modify or drop the existing page_views table.

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  article_path TEXT NOT NULL,
  nickname TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden')),
  submitter_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_public_feed
  ON comments (article_path, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_rate_limit
  ON comments (submitter_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_admin_feed
  ON comments (status, created_at DESC);
