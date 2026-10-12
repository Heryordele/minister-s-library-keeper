import { supabase } from "@/integrations/supabase/client";

export type InstitutionRequestStatus = "pending" | "approved" | "rejected";

/**
 * Institution admin accounts need owner approval, so choosing "Institution"
 * files a request instead of assigning the role. Filing twice is a no-op.
 */
export async function requestInstitutionAccess(userId: string) {
  const { error } = await supabase.from("institution_requests").insert({ user_id: userId });
  // 23505 = unique violation: the user already has a request on file.
  if (error && error.code !== "23505") throw error;
}

export async function fetchInstitutionRequestStatus(
  userId: string,
): Promise<InstitutionRequestStatus | null> {
  const { data } = await supabase
    .from("institution_requests")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.status as InstitutionRequestStatus | undefined) ?? null;
}
