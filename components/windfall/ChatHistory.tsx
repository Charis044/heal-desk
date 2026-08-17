"use client";

import ConfirmDialog from "@/components/windfall/ConfirmDialog";
import { deleteChat, getChat, listChats } from "@/lib/api";
import { getEmotion } from "@/lib/emotions";
import type { ChatListItem, ChatRecord } from "@/lib/types";
import { useEffect, useState } from "react";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}.${m}.${day}`;
}

/**
 * 「聊天内容回溯」：翻看过去和韧芽聊过的天。
 * 列表只展示预览；点开可读完整对话，可删除。
 */
export default function ChatHistory() {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ChatRecord | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    listChats()
      .then(setChats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetail(null);
    try {
      const c = await getChat(id);
      setDetail(c);
    } catch {
      setDetail(null);
    }
  };

  const remove = (id: string) => {
    setConfirmId(id);
  };

  const confirmRemove = async () => {
    const id = confirmId;
    setConfirmId(null);
    if (!id) return;
    try {
      await deleteChat(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (expandedId === id) {
        setExpandedId(null);
        setDetail(null);
      }
    } catch {
      /* 静默 */
    }
  };

  return (
    <div className="chatlog">
      {loading && <p className="chatlog-empty">正在翻找聊天记录……</p>}
      {!loading && chats.length === 0 && (
        <p className="chatlog-empty">还没有聊过天，去「聊一聊」说说吧。</p>
      )}

      <ul className="chatlog-list">
        {chats.map((c) => {
          const open = expandedId === c.id;
          return (
            <li key={c.id} className="chatlog-item">
              <button
                type="button"
                className="chatlog-head"
                onClick={() => toggle(c.id)}
              >
                <span
                  className="chatlog-dot"
                  style={{
                    background: c.emotion ? getEmotion(c.emotion).color : "#c9bfae",
                  }}
                />
                <span className="chatlog-date">{formatDate(c.created_at)}</span>
                <span className="chatlog-count">{c.message_count} 句</span>
                <span className="chatlog-toggle">{open ? "收起" : "展开"}</span>
              </button>

              <p className="chatlog-preview">
                {c.preview || "（这段没有文字）"}
              </p>

              {open && detail && (
                <div className="chatlog-detail">
                  {detail.messages.map((m, i) => (
                    <div key={i} className={`chatlog-msg ${m.role}`}>
                      {m.role === "assistant" && (
                        <span className="chatlog-avatar" aria-hidden>
                          🌱
                        </span>
                      )}
                      <span className="chatlog-bubble">{m.content}</span>
                    </div>
                  ))}
                  <div className="chatlog-actions">
                    <button
                      type="button"
                      className="chatlog-delete"
                      onClick={() => remove(c.id)}
                    >
                      删除这段
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除这段聊天记录？"
        message="删除后无法恢复，确定要删除吗？"
        confirmText="删除"
        danger
        onConfirm={confirmRemove}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
