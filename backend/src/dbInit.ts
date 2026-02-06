import db from "./db";

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    createdAt INTEGER NOT NULL,
    summary TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    sender TEXT NOT NULL CHECK(sender IN ('user', 'ai')),
    text TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (conversationId) REFERENCES conversations(id)
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages(conversationId, timestamp)
`);

console.log("✅ Database initialized");
