import { Router, Request, Response } from "express";
import {
  createConversation,
  getConversation,
  saveMessage,
  getMessages,
  updateSummary,
} from "../services/conversationService";
import { generateReply, summarizeConversation } from "../services/llmService";
import { rewriteQuery } from "../services/queryRewriter";
import { quickFAQMatch } from "../services/faqService";
import type { ChatMessage } from "../types";

const router = Router();

router.post("/message", async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = req.body as { message: string; sessionId?: string };

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required and must be a string" });
    }
    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    if (trimmed.length > 1000) {
      return res.status(400).json({
        reply: "Your message is too long. Please keep it under 1000 characters.",
        sessionId: sessionId || "",
      });
    }

    let convId = sessionId;
    if (!convId || !getConversation(convId)) convId = createConversation();

    saveMessage(convId, "user", trimmed);

    const faqAnswer = quickFAQMatch(trimmed);
    if (faqAnswer) {
      saveMessage(convId, "ai", faqAnswer);
      return res.json({ reply: faqAnswer, sessionId: convId });
    }

    const cleanedMessage = await rewriteQuery(trimmed);
    const allMessages = getMessages(convId);
    const conversation = getConversation(convId);
    const context: ChatMessage[] = [];

    if (conversation?.summary) {
      context.push({ role: "system", content: `Previous conversation summary: ${conversation.summary}` });
    }

    const SUMMARIZE_THRESHOLD = 10;
    const KEEP_RECENT = 8;

    if (allMessages.length > SUMMARIZE_THRESHOLD && !conversation?.summary) {
      const toSummarize = allMessages.slice(0, allMessages.length - KEEP_RECENT).map(m => `${m.sender}: ${m.text}`);
      const summary = await summarizeConversation(toSummarize);
      updateSummary(convId, summary);
      context.push({ role: "system", content: `Previous conversation summary: ${summary}` });
    }

    const recent = allMessages.slice(-KEEP_RECENT);
    recent.forEach(m => {
      context.push({ role: m.sender === "user" ? "user" : "assistant", content: m.text });
    });

    const reply = await generateReply(context, cleanedMessage);
    saveMessage(convId, "ai", reply);

    return res.json({ reply, sessionId: convId });
  } catch (error: any) {
    console.error("Chat error:", error);
    const messages: Record<string, string> = {
      INVALID_API_KEY: "Configuration error. Please contact support.",
      RATE_LIMIT: "High demand. Please try again in a moment.",
      CONTEXT_TOO_LONG: "Conversation too long. Please start a new chat.",
      LLM_ERROR: "Sorry, I'm having trouble. Please try again.",
    };
    const friendly = messages[error.message] || "Something went wrong. Please try again.";
    return res.status(500).json({ reply: friendly, sessionId: req.body.sessionId || "" });
  }
});

router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

export default router;
