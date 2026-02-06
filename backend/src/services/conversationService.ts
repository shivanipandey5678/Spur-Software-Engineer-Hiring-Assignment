import db from "../db";
import { v4 as uuid } from "uuid";
import type { Message, Conversation } from "../types";

export function createConversation(): string {
  const id = uuid();
  db.prepare("INSERT INTO conversations (id, createdAt, summary) VALUES (?, ?, NULL)").run(id, Date.now());
  return id;
}

export function getConversation(id: string): Conversation | undefined {
  return db.prepare("SELECT * FROM conversations WHERE id = ?").get(id) as Conversation | undefined;
}

export function saveMessage(conversationId: string, sender: "user" | "ai", text: string): void {
  db.prepare(
    "INSERT INTO messages (id, conversationId, sender, text, timestamp) VALUES (?, ?, ?, ?, ?)"
  ).run(uuid(), conversationId, sender, text, Date.now());
}

export function getMessages(conversationId: string): Message[] {
  return db.prepare(
    "SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC"
  ).all(conversationId) as Message[];
}

export function updateSummary(conversationId: string, summary: string): void {
  db.prepare("UPDATE conversations SET summary = ? WHERE id = ?").run(summary, conversationId);
}
