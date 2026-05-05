"use client";

import { RiAlertLine } from "react-icons/ri";
import type { DecryptedMessage } from "@/lib/types/message";

interface MessageBubbleProps {
  message: DecryptedMessage;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { text, created_at, isMine, failed } = message;

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
      <div
        className={[
          "max-w-[72%] rounded-2xl px-4 py-2 text-sm shadow-sm",
          isMine
            ? "rounded-br-sm bg-emerald-600 text-white"
            : "rounded-bl-sm bg-white text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100",
          failed ? "opacity-60 italic" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <p className="break-words leading-relaxed">{text}</p>
        <p
          className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${
            isMine ? "text-emerald-200" : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          {failed && <RiAlertLine className="h-3 w-3" />}
          {formatTime(created_at)}
          {failed && <span>Could not decrypt</span>}
        </p>
      </div>
    </div>
  );
}
