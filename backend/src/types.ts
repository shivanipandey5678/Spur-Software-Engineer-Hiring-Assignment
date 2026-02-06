export type Message = {
  id: string;
  conversationId: string;
  sender: "user" | "ai";
  text: string;
  timestamp: number;
};

export type Conversation = {
  id: string;
  createdAt: number;
  summary?: string | null;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
