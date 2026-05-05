"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  RiLockLine,
  RiKeyLine,
  RiMessage2Line,
  RiShieldCheckLine,
  RiSearchLine,
  RiAlertLine,
  RiLoader4Line,
  RiLogoutBoxLine,
} from "react-icons/ri";
import { useAuthContext, useCryptoContext } from "@/app/providers";
import { useAuth } from "@/hooks/useAuth";
import { useKeys } from "@/hooks/useKeys";
import { getConversations } from "@/lib/api/conversations";
import { searchUsers } from "@/lib/api/users";
import { ChatWindow } from "@/components/ChatWindow";
import type { ConversationSummary, UserPublicInfo } from "@/lib/types/api";

export default function ChatPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthContext();
  const { privateKey, myPublicKey } = useCryptoContext();
  const { logout } = useAuth();
  const { unlockFromProfile } = useKeys();

  // ── Redirect if not authenticated ──────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) router.replace("/login");
  }, [accessToken, router]);

  // ── Unlock screen state ────────────────────────────────────────────────────
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  async function handleUnlock(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setUnlockError(null);
    setIsUnlocking(true);
    try {
      await unlockFromProfile(unlockPassword, user);
    } catch {
      setUnlockError(
        "The password you entered is incorrect. Please check it and try again."
      );
    } finally {
      setIsUnlocking(false);
    }
  }

  // ── Conversations ─────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");

  useEffect(() => {
    if (!accessToken) return;
    getConversations(accessToken)
      .then(setConversations)
      .catch(() => {});
  }, [accessToken]);

  function selectConversation(userId: string, displayName: string) {
    setSelectedId(userId);
    setSelectedName(displayName);
    setSearchResults([]);
    setSearchQuery("");
  }

  // ── User search ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserPublicInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchUsers(searchQuery.trim(), accessToken);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError("No users found matching that name.");
      }
    } catch {
      setSearchError("The search could not be completed. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!accessToken || !user) return null;

  // Show password unlock screen if the private key is not yet loaded
  if (!privateKey || !myPublicKey) {
    return (
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg">
              <RiLockLine className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Welcome back, {user.display_name}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Enter your password to decrypt your messages
            </p>
          </div>

          <form
            onSubmit={handleUnlock}
            className="overflow-hidden rounded-2xl bg-white p-6 shadow-xl ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700"
          >
            {unlockError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <RiAlertLine className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{unlockError}</span>
              </div>
            )}

            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Password
            </label>
            <input
              type="password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              placeholder="Your account password"
              autoComplete="current-password"
              autoFocus
              required
              className="mb-4 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
            <button
              type="submit"
              disabled={isUnlocking}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {isUnlocking && <RiLoader4Line className="h-4 w-4 animate-spin" />}
              {isUnlocking ? "Unlocking..." : "Unlock"}
            </button>
          </form>

          <button
            onClick={handleLogout}
            className="mt-4 block w-full text-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            Sign in with a different account
          </button>
        </div>
      </div>
    );
  }

  // ── Main chat layout ────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-72 flex-col border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <RiLockLine className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              WhisperBox
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
          >
            <RiLogoutBoxLine className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>

        {/* User search */}
        <form
          onSubmit={handleSearch}
          className="border-b border-zinc-100 p-3 dark:border-zinc-700"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchError(null);
              }}
              placeholder="Search for a user..."
              className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs outline-none focus:border-emerald-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {isSearching ? (
                <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RiSearchLine className="h-3.5 w-3.5" />
              )}
              Find
            </button>
          </div>
          {searchError && (
            <p className="mt-1.5 text-xs text-zinc-400">{searchError}</p>
          )}
        </form>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="border-b border-zinc-100 dark:border-zinc-700">
            <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Search results
            </p>
            {searchResults.map((u) => (
              <button
                key={u.id}
                onClick={() => selectConversation(u.id, u.display_name)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                <Avatar name={u.display_name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {u.display_name}
                  </p>
                  <p className="truncate text-xs text-zinc-400">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-zinc-400">
              You have no conversations yet. Search for a user above to start chatting.
            </p>
          ) : (
            <>
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Conversations
              </p>
              {conversations.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => selectConversation(conv.user_id, conv.display_name)}
                  className={[
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition",
                    selectedId === conv.user_id
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-700",
                  ].join(" ")}
                >
                  <Avatar name={conv.display_name} active={selectedId === conv.user_id} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {conv.display_name}
                    </p>
                    <p className="truncate text-xs text-zinc-400">@{conv.username}</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Signed-in user footer */}
        <div className="flex items-center gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <Avatar name={user.display_name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {user.display_name}
            </p>
            <p className="truncate text-[10px] text-zinc-400">@{user.username}</p>
          </div>
          <RiKeyLine
            className="h-3.5 w-3.5 text-emerald-500"
            title="Encryption keys are loaded"
          />
        </div>
      </aside>

      {/* Main area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {selectedId ? (
          <ChatWindow
            partnerId={selectedId}
            partnerName={selectedName}
            myUserId={user.id}
            myPublicKey={myPublicKey}
            privateKey={privateKey}
            accessToken={accessToken}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <RiMessage2Line className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
            <h2 className="mt-4 text-lg font-semibold text-zinc-700 dark:text-zinc-300">
              Select a conversation
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Or search for a user to start a new chat
            </p>
            <p className="mt-5 flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <RiShieldCheckLine className="h-3.5 w-3.5" />
              All messages are end-to-end encrypted
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, active }: { name: string; active?: boolean }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={[
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
        active ? "bg-emerald-600" : "bg-zinc-400 dark:bg-zinc-600",
      ].join(" ")}
    >
      {initials || "?"}
    </div>
  );
}
