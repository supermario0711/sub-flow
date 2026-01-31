import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client using the secret API key (sb_secret_).
 * Use for server-only operations that need elevated access,
 * such as Storage uploads.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
