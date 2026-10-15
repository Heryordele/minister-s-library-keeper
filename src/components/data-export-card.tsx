import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadDataExport, fetchDataExport, recordExport } from "@/lib/data-export";

export function DataExportCard() {
  const [busy, setBusy] = useState(false);

  async function exportData() {
    setBusy(true);
    try {
      const data = await fetchDataExport();
      downloadDataExport(data);
      await recordExport();
      toast.success("Your data is downloading.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not export your data.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold">Your data</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Download a copy of your books, lending records, reading goals, reading progress, and streak
        as a JSON file. Lending records include the borrower details you entered.
      </p>
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={exportData} disabled={busy}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download my data
        </Button>
      </div>
    </div>
  );
}
