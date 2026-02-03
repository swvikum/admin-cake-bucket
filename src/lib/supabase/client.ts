import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase browser client.
 * Note: createBrowserClient already implements singleton pattern internally,
 * so each call returns the same instance for the same URL/key combination.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
