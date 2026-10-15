import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Long enough that the sign-in ban lasts until a super admin restores the account. */
const SUSPENDED_FOR = "876000h";

/**
 * Suspends or restores an account. A suspended account cannot sign in. The
 * super admin check runs first, and the change is logged in the activity log.
 */
export const setUserSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ userId: z.string().uuid(), suspended: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId: actorId } = context;

    const { data: isAdmin, error: adminError } = await supabase.rpc("is_super_admin");
    if (adminError) throw new Error("Could not check your access. Please try again.");
    if (isAdmin !== true) throw new Error("Super admin access required");
    if (data.userId === actorId) throw new Error("You cannot suspend your own account.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.suspended ? SUSPENDED_FOR : "none",
    });
    if (banError) throw new Error("Could not change this account's sign-in access.");

    const { error } = await supabase.rpc("admin_set_user_suspended", {
      _user_id: data.userId,
      _suspended: data.suspended,
    });
    if (error) throw new Error(error.message);

    return { suspended: data.suspended };
  });
