import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DuplicateMatch } from "@/lib/duplicates";

/**
 * Shown before saving a book that looks like one already in the library.
 * Nothing is blocked: the owner can still add it, for example for a second copy.
 */
export function DuplicateWarning({
  matches,
  busy,
  onAddAnyway,
  onCancel,
}: {
  matches: DuplicateMatch[];
  busy: boolean;
  onAddAnyway: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="alert"
      className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {matches.length === 1
              ? "This book looks like one you already own."
              : "These books look like ones you already own."}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {matches.map(({ book, reason }) => (
              <li key={book.id}>
                <Link
                  to="/books/$bookId"
                  params={{ bookId: book.id }}
                  className="font-medium underline underline-offset-2"
                >
                  {book.title}
                </Link>
                {book.author && <span> by {book.author}</span>}
                <span className="block text-xs text-amber-800">
                  {reason === "isbn" ? "Same ISBN" : "Same title and author"}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={onCancel}>
              Don&apos;t add it
            </Button>
            <Button size="sm" disabled={busy} onClick={onAddAnyway}>
              Add anyway (second copy)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
