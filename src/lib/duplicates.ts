import { supabase } from "@/integrations/supabase/client";
import {
  findDuplicateMatches,
  type DuplicateCandidate,
  type DuplicateMatch,
} from "@/lib/duplicate-rules";

export type { DuplicateCandidate, DuplicateMatch, ExistingBook } from "@/lib/duplicate-rules";

/** Checks the signed-in user's library. RLS limits the query to their own books. */
export async function findLibraryDuplicates(
  candidate: DuplicateCandidate,
): Promise<DuplicateMatch[]> {
  const { data, error } = await supabase.from("books").select("id, title, author, isbn");
  if (error) throw error;
  return findDuplicateMatches(candidate, data ?? []);
}
