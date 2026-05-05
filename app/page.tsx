"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "./providers";

/**
 * Root route: redirect immediately to /chat when a session exists,
 * or to /login when there is no token.
 */
export default function RootPage() {
  const { accessToken } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    router.replace(accessToken ? "/chat" : "/login");
  }, [accessToken, router]);

  return null;
}
