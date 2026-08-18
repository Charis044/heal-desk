"use client";

import { getChat, sendChatMessage, summarizeChat } from "@/lib/api";
import { buildLocalSummary } from "@/lib/localSummary";
import type { ChatMessage, ChatSummaryResponse } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

interface ChatWindowProps {
  chatId?: string;
  onFinish: (payload: {
    summary: ChatSummaryResponse;
    messages: ChatMessage[];
  }) => Promise<void> | void;
}

const HINT =
  "可以说一篇记录、某一天、某几天、某段时间，或一个具体问题。想问得越具体，我越能一起看清楚。";
const STORAGE_KEY = "ping-i-cabin-chat-messages";

function loadSavedMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 小熊咨询：不预读笔记。空输入时浅灰提示范围；用户开口后提示消失。
 * 聊完压缩成一篇，完整对话留在小熊里。
 */
export default function ChatWindow({ chatId, onFinish }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ready, setReady] = useState(!chatId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) {
      setMessages(loadSavedMessages());
      setReady(true);
      return;
    }
    let alive = true;
    getChat(chatId)
      .then((c) => {
        if (alive) setMessages(c.messages);
      })
      .catch(() => {
        if (alive) setMessages([]);
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [chatId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (chatId) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [chatId, messages]);

  const hasUserMsg = messages.some((m) => m.role === "user");
  const showHint = ready && !hasUserMsg;

  const send = async () => {
    const text = input.trim();
    if (!text || sending || summarizing) return;
    setInput("");
    setError(false);
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setSending(true);
    try {
      const r = await sendChatMessage({ messages: next });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: r.reply },
      ]);
    } catch {
      setError(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "……好像断了一下。你再说一次范围或问题，我还在。",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const finish = async () => {
    if (summarizing) return;
    setSummarizing(true);
    setError(false);
    let summary: ChatSummaryResponse;
    try {
      summary = await summarizeChat({ messages });
    } catch {
      summary = buildLocalSummary(undefined, messages);
    }
    try {
      await onFinish({ summary, messages });
      if (!chatId) {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="chat">
      <div className="chat-scroll" ref={scrollRef}>
        {showHint && (
          <p className="chat-watermark" aria-hidden>
            {HINT}
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat-row ${m.role === "user" ? "user" : "ai"}`}
          >
            {m.role === "assistant" && (
              <span className="chat-avatar" aria-hidden>
                🌱
              </span>
            )}
            <div className="chat-bubble">{m.content}</div>
          </div>
        ))}
        {sending && (
          <div className="chat-row ai">
            <span className="chat-avatar" aria-hidden>
              🌱
            </span>
            <div className="chat-bubble chat-typing">正在听……</div>
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={showHint ? "" : "继续说……"}
          disabled={sending || summarizing || !ready}
        />
        <button
          type="button"
          className="chat-send"
          onClick={send}
          disabled={sending || summarizing || !input.trim()}
        >
          发送
        </button>
      </div>

      {hasUserMsg && (
        <button
          type="button"
          className="chat-finish"
          onClick={finish}
          disabled={summarizing}
        >
          {summarizing ? "正在记下……" : "聊完了，帮我记下"}
        </button>
      )}

      {error && (
        <p className="chat-error">
          AI 暂时连不上。你可以稍后重试，或直接点「聊完了，帮我记下」。
        </p>
      )}
    </div>
  );
}
