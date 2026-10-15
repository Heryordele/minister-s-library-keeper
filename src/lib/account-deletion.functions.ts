import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { deletionBlockReason } from "@/lib/account-deletion-rules";

/**
 * Permanently deletes the signed-in user's account. The database removes the
 * user's books, lending records, reading data and profile with it. Institution
 * accounts are refused until they have exported their data or cleared their
 * records.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ confirm: z.literal("DELETE") }).parse(data))
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (rolesError) throw new Error("Could not check your account. Please try again.");
    const isInstitution = (roles ?? []).some((r) => r.role === "institution_admin");

    let openRecords = 0;
    let lastExportedAt: string | null = null;
    if (isInstitution) {
      const { count, error } = await supabase
        .from("borrow_records")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId)
        .is("cleared_at", null);
      if (error) throw new Error("Could not check your lending records. Please try again.");
      openRecords = count ?? 0;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("last_exported_at")
        .eq("id", userId)
        .maybeSingle();
      if (profileError) throw new Error("Could not check your export history. Please try again.");
      lastExportedAt = profile?.last_exported_at ?? null;
    }

    const reason = deletionBlockReason({ isInstitution, openRecords, lastExportedAt });
    if (reason) throw new Error(reason);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error("Could not delete your account. Please try again.");

    return { deleted: true };
  });
