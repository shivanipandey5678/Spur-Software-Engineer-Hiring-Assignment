import { useState, useRef, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
};

const SUGGESTION_PILLS = [
  "Do you ship to USA?",
  "What's your return policy?",
  "Refund process?",
  "Support hours?",
  "Payment options?",
  "Contact support?",
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  content: "Hi there! 👋 Welcome to Spur Support. How can I help you today?",
  isUser: false,
  timestamp: formatTime(new Date()),
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load session and history on mount
  useEffect(() => {
    const stored = localStorage.getItem("spurSessionId");
    if (stored) {
      setSessionId(stored);
      fetch(`${API_URL}/chat/history/${stored}`)
        .then((res) => res.ok ? res.json() : { messages: [] })
        .then((data) => {
          if (data.messages?.length) {
            const msgs: Message[] = data.messages.map((m: { id: string; sender: string; text: string; timestamp: number }) => ({
              id: m.id,
              content: m.text,
              isUser: m.sender === "user",
              timestamp: formatTime(new Date(m.timestamp)),
            }));
            setMessages(msgs);
          }
        })
        .catch(() => {});
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!showScrollBottom) scrollToBottom();
  }, [messages, streamingContent, isTyping, showScrollBottom]);

  const onScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBottom(!nearBottom);
  };

  // Stream reply character-by-character so it doesn't appear suddenly
  const streamResponse = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      setStreamingContent("");
      let i = 0;
      const CHUNK = 2; // characters per tick
      const TICK_MS = 25;
      const step = () => {
        if (i < text.length) {
          i = Math.min(i + CHUNK, text.length);
          setStreamingContent(text.slice(0, i));
          setTimeout(step, TICK_MS);
        } else resolve();
      };
      setTimeout(step, TICK_MS);
    });
  };

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;

    setError(null);
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      content: trimmed,
      isUser: true,
      timestamp: formatTime(new Date()),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, sessionId: sessionId || undefined }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem("spurSessionId", data.sessionId);
      }

      // Keep isTyping true so user sees: first typing dots, then streamed text
      await streamResponse(data.reply || "");

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        content: data.reply || "",
        isUser: false,
        timestamp: formatTime(new Date()),
      };
      setStreamingContent(null);
      setIsTyping(false);
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setStreamingContent(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          content: "Sorry, I couldn't process your message. Please check your connection and try again.",
          isUser: false,
          timestamp: formatTime(new Date()),
        },
      ]);
      setError("Failed to connect. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => sendMessage(input);
  const handlePillClick = (text: string) => sendMessage(text);

  const handleNewChat = () => {
    localStorage.removeItem("spurSessionId");
    setSessionId("");
    setMessages([WELCOME_MESSAGE]);
    setError(null);
  };

  return (
    <div className="chat-card">
      <header className="chat-header">
        <div className="chat-header-icon">💬</div>
        <div className="chat-header-text">
          <h1>Spur Support</h1>
          <p>We usually reply instantly</p>
        </div>
        {sessionId && (
          <button type="button" className="btn-new-chat" onClick={handleNewChat}>
            New Chat
          </button>
        )}
      </header>

      {error && (
        <div className="error-banner">{error}</div>
      )}

      <div className="chat-messages-wrap">
        <div
          ref={messagesContainerRef}
          className="chat-messages"
          onScroll={onScroll}
        >
          {messages.map((m) => (
          <div key={m.id} className={`message-row ${m.isUser ? "user" : "ai"}`}>
            {!m.isUser && <div className="bot-avatar">🤖</div>}
            <div className={`bubble ${m.isUser ? "user" : "ai"}`}>
              <div className="bubble-text">{m.content}</div>
              <div className="bubble-time">{m.timestamp}</div>
            </div>
          </div>
        ))}
        {isTyping && streamingContent !== null && (
          <div className="message-row ai">
            <div className="bot-avatar">🤖</div>
            <div className="bubble ai">
              <div className="bubble-text">{streamingContent}<span className="cursor">|</span></div>
              <div className="bubble-time">{formatTime(new Date())}</div>
            </div>
          </div>
        )}
        {isTyping && streamingContent === null && (
          <div className="message-row ai">
            <div className="bot-avatar">🤖</div>
            <div className="bubble ai typing">
              <span className="typing-label">Agent is typing</span>
              <span className="dots">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>

        {showScrollBottom && (
          <button type="button" className="scroll-to-bottom" onClick={scrollToBottom} aria-label="Scroll to bottom">
            ↓
          </button>
        )}
      </div>

      {/* Suggestion pills above input */}
      <div className="suggestion-pills">
        {SUGGESTION_PILLS.map((text) => (
          <button
            key={text}
            type="button"
            className="pill"
            onClick={() => handlePillClick(text)}
            disabled={isSending}
          >
            {text}
          </button>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          className="chat-input"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          disabled={isSending}
        />
        <button
          type="button"
          className="btn-send"
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          aria-label="Send"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
