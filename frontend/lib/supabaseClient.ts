// frontend/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// ✅ Read from your .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Check .env.local.");
}

// ✅ Export a single client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
