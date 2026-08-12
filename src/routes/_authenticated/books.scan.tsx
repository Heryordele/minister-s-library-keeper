import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Camera, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { BookForm, type BookFormValues } from "@/components/book-form";
import { supabase } from "@/integrations/supabase/client";
import { booksKey } from "@/lib/books";
import { mirrorRemoteCover } from "@/lib/covers.functions";
import {
  isValidIsbn,
  lookupIsbn,
  normaliseIsbn,
  type LookupResult,
} from "@/lib/book-lookup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/books/scan")({
  head: () => ({
    meta: [
      { title: "Scan a barcode — Minister's Vault" },
      {
        name: "description",
        content:
          "Scan a book's ISBN barcode to look up its details before adding it to your library.",
      },
    ],
  }),
  component: ScanPage,
});

type Stage =
  | { kind: "scanning" }
  | { kind: "looking-up"; isbn: string }
  | { kind: "confirm"; result: LookupResult };

function ScanPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [stage, setStage] = useState<Stage>({ kind: "scanning" });
  const [saveError, setSaveError] = useState<string | null>(null);
  const mirrorCover = useServerFn(mirrorRemoteCover);

  const save = useMutation({
    mutationFn: async (values: BookFormValues) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You must be signed in.");

      // Copy externally-hosted cover art into our own storage so it can't vanish.
      let cover = values.cover_image_url;
      if (cover?.startsWith("http")) {
        try {
          const res = await mirrorCover({ data: { url: cover } });
          cover = res.path;
        } catch {
          /* keep the remote URL if mirroring fails */
        }
      }

      const { data, error } = await supabase
        .from("books")
        .insert({
          ...values,
          cover_image_url: cover,
          owner_id: userId,
          reading_status: "unread",
          lending_status: "available",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: booksKey });
      toast.success("Book added to your library.");
      navigate({ to: "/books/$bookId", params: { bookId: data.id } });
    },
    onError: (e) =>
      setSaveError(e instanceof Error ? e.message : "Could not save this book."),
  });

  async function handleIsbn(rawIsbn: string) {
    const isbn = normaliseIsbn(rawIsbn);
    setStage({ kind: "looking-up", isbn });
    const result = await lookupIsbn(isbn);
    if (!result) {
      toast.info("No match found — finish the details manually.");
      navigate({ to: "/books/new", search: { isbn } });
      return;
    }
    setStage({ kind: "confirm", result });
  }

  if (stage.kind === "looking-up") {
    return (
      <>
        <PageHeader title="Scan barcode" subtitle={`Looking up ${stage.isbn}…`} />
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (stage.kind === "confirm") {
    const r = stage.result;
    return (
      <>
        <PageHeader
          title="Confirm book details"
          subtitle={`Found via ${r.source}. Check or edit anything before saving.`}
        />
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
          {r.description && (
            <div className="mb-8 rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description from {r.source}
              </div>
              <p className="mt-2 line-clamp-6 text-sm text-muted-foreground">
                {r.description}
              </p>
            </div>
          )}
          <BookForm
            book={{
              title: r.title,
              author: r.author,
              isbn: r.isbn,
              publisher: r.publisher,
              publication_year: r.publication_year,
              description: r.description,
              cover_image_url: r.cover_image_url,
            }}
            submitLabel="Confirm and add to library"
            submitting={save.isPending}
            error={saveError}
            onSubmit={(v) => {
              setSaveError(null);
              save.mutate(v);
            }}
            onCancel={() => setStage({ kind: "scanning" })}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Scan barcode"
        subtitle="Point your camera at the ISBN barcode on the back cover."
      />
      <div className="mx-auto max-w-xl space-y-8 px-4 py-8 md:px-8">
        <Scanner onDetected={(isbn) => void handleIsbn(isbn)} />
        <ManualIsbn onSubmit={(isbn) => void handleIsbn(isbn)} />
      </div>
    </>
  );
}

function Scanner({ onDetected }: { onDetected: (isbn: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleFile(file: File) {
    setError(null);
    const url = URL.createObjectURL(file);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });
    setReading(true);
    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.ITF,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints);
      const result = await reader.decodeFromImageUrl(url);
      const text = normaliseIsbn(result.getText());
      if (!isValidIsbn(text)) {
        setError("That barcode isn't an ISBN. Try again or type it below.");
        return;
      }
      onDetected(text);
    } catch {
      setError(
        "Couldn't read the barcode. Get closer, keep it flat and well lit, then snap again — or type the ISBN below.",
      );
    } finally {
      setReading(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
        {preview ? (
          <img src={preview} alt="Captured barcode" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-center text-sm text-muted-foreground">
            <div className="space-y-3 px-6">
              <Camera className="mx-auto h-7 w-7" />
              <p>Snap a clear photo of the ISBN barcode on the back cover.</p>
            </div>
          </div>
        )}
        {reading && (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => inputRef.current?.click()} disabled={reading}>
          <Camera className="mr-2 h-4 w-4" />
          {reading ? "Reading barcode…" : preview ? "Capture again" : "Capture barcode"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}

function ManualIsbn({ onSubmit }: { onSubmit: (isbn: string) => void }) {
  const [value, setValue] = useState("");
  const valid = isValidIsbn(value);
  return (
    <form
      className="space-y-2 border-t border-border pt-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(value);
      }}
    >
      <Label htmlFor="isbn-lookup">Or type the ISBN</Label>
      <div className="flex gap-2">
        <Input
          id="isbn-lookup"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="9780830816507"
          inputMode="numeric"
        />
        <Button type="submit" disabled={!valid} variant="secondary">
          <Search className="mr-2 h-4 w-4" /> Look up
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        We check Google Books first, then Open Library.
      </p>
    </form>
  );
}
