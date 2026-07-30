import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Camera, CameraOff, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { BookForm, type BookFormValues } from "@/components/book-form";
import { supabase } from "@/integrations/supabase/client";
import { booksKey } from "@/lib/books";
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

  const save = useMutation({
    mutationFn: async (values: BookFormValues) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You must be signed in.");
      const { data, error } = await supabase
        .from("books")
        .insert({
          ...values,
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let controls: { stop: () => void } | undefined;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
    ]);
    const reader = new BrowserMultiFormatReader(hints);

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        if (stopped || !result) return;
        const text = normaliseIsbn(result.getText());
        if (!isValidIsbn(text)) return;
        stopped = true;
        controls?.stop();
        setActive(false);
        onDetected(text);
      })
      .then((c) => {
        controls = c;
        if (stopped) c.stop();
      })
      .catch((e: unknown) => {
        setActive(false);
        setError(
          e instanceof Error
            ? `Camera unavailable: ${e.message}`
            : "Camera unavailable on this device.",
        );
      });

    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [active, onDetected]);

  return (
    <section className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        {!active && (
          <div className="absolute inset-0 grid place-items-center bg-muted text-center text-sm text-muted-foreground">
            <div className="space-y-3 px-6">
              <CameraOff className="mx-auto h-7 w-7" />
              <p>Camera is off. Start the scanner when you're ready.</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setActive((a) => !a)} variant={active ? "outline" : "default"}>
          <Camera className="mr-2 h-4 w-4" />
          {active ? "Stop camera" : "Start camera"}
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
