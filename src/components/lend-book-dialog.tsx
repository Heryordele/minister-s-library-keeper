import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HandCoins, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { booksKey } from "@/lib/books";
import { borrowRecordsKey, lendBook } from "@/lib/lending";

export function LendBookDialog({
  bookId,
  bookTitle,
}: {
  bookId: string;
  bookTitle: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lend = useMutation({
    mutationFn: (values: {
      borrower_name: string;
      borrower_phone: string | null;
      borrower_email: string | null;
      borrower_organization: string | null;
      expected_return_date: string | null;
    }) => lendBook(bookId, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: booksKey });
      qc.invalidateQueries({ queryKey: borrowRecordsKey });
      toast.success("Book marked as lent out.");
      setOpen(false);
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : "Could not record this loan."),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <HandCoins className="mr-2 h-4 w-4" /> Lend this book
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            const str = (k: string) => {
              const v = String(fd.get(k) ?? "").trim();
              return v.length ? v : null;
            };
            const name = str("borrower_name");
            if (!name) {
              setError("Borrower name is required.");
              return;
            }
            lend.mutate({
              borrower_name: name,
              borrower_phone: str("borrower_phone"),
              borrower_email: str("borrower_email"),
              borrower_organization: str("borrower_organization"),
              expected_return_date: str("expected_return_date"),
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>Lend “{bookTitle}”</DialogTitle>
            <DialogDescription>
              Record who has the book and when you expect it home.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="borrower_name">Borrower name</Label>
              <Input id="borrower_name" name="borrower_name" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="borrower_phone">Phone</Label>
                <Input id="borrower_phone" name="borrower_phone" type="tel" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="borrower_email">Email</Label>
                <Input id="borrower_email" name="borrower_email" type="email" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="borrower_organization">Church / organization</Label>
              <Input id="borrower_organization" name="borrower_organization" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="expected_return_date">Expected return date</Label>
              <Input
                id="expected_return_date"
                name="expected_return_date"
                type="date"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="submit" disabled={lend.isPending}>
              {lend.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Record loan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
