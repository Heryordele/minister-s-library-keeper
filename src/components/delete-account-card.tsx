import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account-deletion.functions";

export function DeleteAccountCard() {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const deleteAccount = useServerFn(deleteMyAccount);

  async function removeAccount() {
    setBusy(true);
    try {
      await deleteAccount({ data: { confirm: "DELETE" } });
      await supabase.auth.signOut();
      window.location.assign("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete your account.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-destructive/40 bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold">Delete account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This permanently removes your account, books, reading history and lending records. It cannot
        be undone. Institution accounts must first download their data or clear their returned and
        lost lending records.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder='Type "DELETE" to confirm'
          className="sm:w-64"
          aria-label="Type DELETE to confirm"
        />
        <Button variant="destructive" disabled={typed !== "DELETE" || busy} onClick={removeAccount}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete my account
        </Button>
      </div>
    </div>
  );
}
