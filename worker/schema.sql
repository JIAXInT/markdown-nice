DROP TABLE IF EXISTS files;
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'file' or 'folder'
  content TEXT,
  created_at INTEGER,
  updated_at INTEGER
);
