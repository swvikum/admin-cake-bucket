"use client";

import { useMemo, useCallback } from "react";
import { createClient } from "./client";

/**
 * Hook that provides a Supabase client with session refresh capability.
 * Call refreshSession() before important operations to ensure valid auth.
 */
export function useSupabase() {
  const supabase = useMemo(() => createClient(), []);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Session refresh error:", error.message);
        // If session is invalid, redirect to login
        if (error.message.includes("session") || error.message.includes("token")) {
          window.location.href = "/login";
          return false;
        }
      }
      if (!data.session) {
        console.warn("No active session, redirecting to login");
        window.location.href = "/login";
        return false;
      }
      return true;
    } catch (err) {
      console.error("Failed to refresh session:", err);
      return false;
    }
  }, [supabase]);

  return { supabase, refreshSession };
}
