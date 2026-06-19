import { createBrowserClient } from "@supabase/ssr";

// Singleton cache – ensures the same client instance is returned on every call.
// This prevents infinite re-render loops when the reference is used in React
// useEffect dependency arrays (new reference each render → effect re-fires → setState → re-render → loop).
let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase URL or Anon Key. Ensure they are configured in environment variables.");
  }

  cachedClient = createBrowserClient(url, anonKey);
  return cachedClient;
}