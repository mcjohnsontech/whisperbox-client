"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RiLockLine, RiAlertLine, RiLoader4Line, RiShieldCheckLine } from "react-icons/ri";
import { useAuth } from "@/hooks/useAuth";
import { useKeys } from "@/hooks/useKeys";

type Tab = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isLoading, error } = useAuth();
  const { generateAndWrap, unlockFromProfile, activateKeys } = useKeys();

  const [tab, setTab] = useState<Tab>("login");

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regUsername, setRegUsername] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const [localError, setLocalError] = useState<string | null>(null);
  const [isKeyGen, setIsKeyGen] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    try {
      const response = await login(loginUsername.trim(), loginPassword);
      await unlockFromProfile(loginPassword, response.user);
      router.replace("/chat");
    } catch {
      // error is set by useAuth
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (regPassword !== regConfirm) {
      setLocalError("The passwords you entered do not match. Please re-enter them.");
      return;
    }
    if (regPassword.length < 8) {
      setLocalError("Your password must be at least 8 characters long.");
      return;
    }

    setIsKeyGen(true);
    let keyData;
    try {
      keyData = await generateAndWrap(regPassword);
    } catch {
      setLocalError("We could not generate your encryption keys. Please try again.");
      setIsKeyGen(false);
      return;
    }
    setIsKeyGen(false);

    try {
      const response = await register({
        username: regUsername.trim(),
        display_name: regDisplayName.trim(),
        password: regPassword,
        public_key: keyData.publicKeyBase64,
        wrapped_private_key: keyData.wrappedKeyBase64,
        pbkdf2_salt: keyData.saltBase64,
      });

      activateKeys(
        keyData.keyPair.privateKey,
        keyData.keyPair.publicKey,
        response.user.id,
        keyData.wrappedKey,
        keyData.salt
      );

      router.replace("/chat");
    } catch {
      // error is set by useAuth
    }
  }

  const displayError = localError ?? error;
  const busy = isLoading || isKeyGen;

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg">
            <RiLockLine className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            WhisperBox
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            End-to-end encrypted messaging
          </p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
          {/* Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-700">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setLocalError(null); }}
                className={[
                  "flex-1 py-3 text-sm font-medium transition-colors",
                  tab === t
                    ? "border-b-2 border-emerald-600 text-emerald-600"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
                ].join(" ")}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Error banner */}
            {displayError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <RiAlertLine className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{displayError}</span>
              </div>
            )}

            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Field
                  label="Username"
                  type="text"
                  value={loginUsername}
                  onChange={setLoginUsername}
                  placeholder="your_username"
                  autoComplete="username"
                  required
                />
                <Field
                  label="Password"
                  type="password"
                  value={loginPassword}
                  onChange={setLoginPassword}
                  placeholder="Your password"
                  autoComplete="current-password"
                  required
                />
                <SubmitButton disabled={busy} loading={busy}>
                  Sign In
                </SubmitButton>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                {isKeyGen && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <RiLoader4Line className="h-4 w-4 animate-spin shrink-0" />
                    <span>Generating your encryption keys — this may take a few seconds</span>
                  </div>
                )}
                <Field
                  label="Username"
                  type="text"
                  value={regUsername}
                  onChange={setRegUsername}
                  placeholder="choose_a_username"
                  autoComplete="username"
                  required
                />
                <Field
                  label="Display Name"
                  type="text"
                  value={regDisplayName}
                  onChange={setRegDisplayName}
                  placeholder="Your Name"
                  autoComplete="name"
                  required
                />
                <Field
                  label="Password"
                  type="password"
                  value={regPassword}
                  onChange={setRegPassword}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                />
                <Field
                  label="Confirm Password"
                  type="password"
                  value={regConfirm}
                  onChange={setRegConfirm}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                />
                <SubmitButton disabled={busy} loading={busy}>
                  {isKeyGen ? "Generating keys..." : "Create Account"}
                </SubmitButton>
              </form>
            )}
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600">
          <RiShieldCheckLine className="h-3.5 w-3.5" />
          Your private key never leaves your device
        </p>
      </div>
    </div>
  );
}

// ─── Reusable form primitives ─────────────────────────────────────────────────

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  label: string;
  type: "text" | "password";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
      />
    </div>
  );
}

function SubmitButton({
  disabled,
  loading,
  children,
}: {
  disabled: boolean;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading && <RiLoader4Line className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
