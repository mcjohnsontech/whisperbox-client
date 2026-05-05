"use client";

import { useRef, useEffect, useState, type KeyboardEvent } from "react";
import { RiShieldCheckLine, RiSendPlaneFill, RiAlertLine } from "react-icons/ri";
import { MessageBubble } from "./MessageBubble";
import { useChat } from "@/hooks/useChat";

interface ChatWindowProps {
  partnerId: string;
  partnerName: string;
  myUserId: string;
  myPublicKey: CryptoKey;
  privateKey: CryptoKey;
  accessToken: string;
}

export function ChatWindow({
  partnerId,
  partnerName,
  myUserId,
  myPublicKey,
  privateKey,
  accessToken,
}: ChatWindowProps) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, error, isSending, sendError, send } = useChat({
    partnerId,
    myUserId,
    myPublicKey,
    privateKey,
    accessToken,
  });

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || isSending) return;
    setDraft("");
    try {
      await send(text);
    } catch {
      // sendError is exposed by the hook
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full flex-col bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {partnerName}
          </h2>
          <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <RiShieldCheckLine className="h-3.5 w-3.5" />
            <span>End-to-End Encrypted</span>
          </p>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <span className="text-sm text-zinc-400">Loading messages...</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <RiAlertLine className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <RiShieldCheckLine className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              No messages yet
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
              All messages are end-to-end encrypted
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Send error */}
      {sendError && (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
          <RiAlertLine className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{sendError}</span>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            style={{ maxHeight: "8rem", overflowY: "auto" }}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || isSending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            {isSending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <RiSendPlaneFill className="h-5 w-5 translate-x-px" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
