import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";
import { booksKey, categoriesKey, fetchCategories } from "@/lib/books";
import {
  IMPORT_COLUMNS,
  parseImportFile,
  templateCsv,
  type ParsedRow,
} from "@/lib/bulk-import";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/books/import")({
  head: () => ({
    meta: [
      { title: "Bulk import — Minister's Vault" },
      {
        name: "description",
        content:
          "Import many books at once from a CSV or Excel file matching the Minister's Vault template.",
      },
    ],
  }),
  component: ImportPage,
});

function ImportPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: categoriesKey,
    queryFn: fetchCategories,
  });

  const valid = (rows ?? []).filter((r) => r.ok) as Extract<
    ParsedRow,
    { ok: true }
  >[];
  const invalid = (rows ?? []).filter((r) => !r.ok) as Extract<
    ParsedRow,
    { ok: false }
  >[];

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setParsing(true);
    setFileName(file.name);
    try {
      const parsed = await parseImportFile(file, categories);
      if (parsed.length === 0) {
        setError("That file has no data rows. Check it matches the template.");
        setRows(null);
      } else {
        setRows(parsed);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not read that file.",
      );
      setRows(null);
    } finally {
      setParsing(false);
    }
  }

  const commit = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You must be signed in.");
      const payload = valid.map((r) => ({
        ...r.row,
        owner_id: userId,
        reading_status: "unread" as const,
        lending_status: "available" as const,
      }));
      const { error: err } = await supabase.from("books").insert(payload);
      if (err) throw err;
      return payload.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: booksKey });
      toast.success(`${count} book${count === 1 ? "" : "s"} imported.`);
      navigate({ to: "/library" });
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : "Import failed."),
  });

  function downloadTemplate() {
    const blob = new Blob([templateCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ministers-vault-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Bulk import"
        subtitle="Upload a CSV or Excel file to catalogue many books at once."
      />

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-8">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-serif text-lg font-semibold">Template columns</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your first row must be a header row using these column names.
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {IMPORT_COLUMNS.map((c) => (
              <li
                key={c}
                className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs"
              >
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Only <span className="font-medium">title</span> is required. Category
            must match one of the built-in category names.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={downloadTemplate}
          >
            <Download className="mr-2 h-4 w-4" /> Download CSV template
          </Button>
        </section>

        <section className="space-y-3">
          <input
            id="import-file"
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              disabled={parsing}
              onClick={() => document.getElementById("import-file")?.click()}
            >
              {parsing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Choose file
            </Button>
            {fileName && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" /> {fileName}
              </span>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </section>

        {rows && (
          <section className="space-y-5 border-t border-border pt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryCard
                tone="ok"
                icon={<CheckCircle2 className="h-5 w-5" />}
                count={valid.length}
                label="rows ready to import"
              />
              <SummaryCard
                tone="warn"
                icon={<AlertTriangle className="h-5 w-5" />}
                count={invalid.length}
                label="rows with errors (skipped)"
              />
            </div>

            {invalid.length > 0 && (
              <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-4 py-3 text-sm font-semibold">
                  Rows that will be skipped
                </div>
                <ul className="divide-y divide-border">
                  {invalid.map((r) => (
                    <li key={r.line} className="px-4 py-3 text-sm">
                      <div className="font-medium">
                        Row {r.line} — {r.title}
                      </div>
                      <ul className="mt-1 list-disc pl-5 text-xs text-destructive">
                        {r.errors.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {valid.length > 0 && (
              <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-4 py-3 text-sm font-semibold">
                  Rows that will import
                </div>
                <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                  {valid.map((r) => (
                    <li
                      key={r.line}
                      className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5 text-sm"
                    >
                      <span className="font-medium">{r.row.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.row.author ?? "Unknown author"}
                        {r.categoryName ? ` · ${r.categoryName}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={valid.length === 0 || commit.isPending}
                onClick={() => {
                  setError(null);
                  commit.mutate();
                }}
              >
                {commit.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Import {valid.length} book{valid.length === 1 ? "" : "s"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setRows(null);
                  setFileName(null);
                }}
              >
                Choose a different file
              </Button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function SummaryCard({
  tone,
  icon,
  count,
  label,
}: {
  tone: "ok" | "warn";
  icon: React.ReactNode;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div
        className={
          tone === "ok"
            ? "text-accent-foreground/80"
            : "text-destructive"
        }
      >
        {icon}
      </div>
      <div>
        <div className="text-xl font-semibold">{count}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
