import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Loader2 } from "lucide-react";
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
import { borrowRecordsKey, extendLoan } from "@/lib/lending";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ExtendLoanDialog({
  recordId,
  bookId,
  bookTitle,
  borrowerName,
  currentDueDate,
}: {
  recordId: string;
  bookId: string;
  bookTitle: string;
  borrowerName: string;
  currentDueDate: string | null;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extend = useMutation({
    mutationFn: (newDueDate: string) => extendLoan(recordId, bookId, newDueDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: borrowRecordsKey });
      qc.invalidateQueries({ queryKey: booksKey });
      toast.success("Due date updated.");
      setOpen(false);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not extend this loan."),
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
        <Button variant="outline" size="sm">
          <CalendarClock className="mr-2 h-4 w-4" /> Extend loan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const value = String(new FormData(e.currentTarget).get("due_date") ?? "");
            if (!value) return setError("Choose a new due date.");
            if (value < today()) return setError("The new due date can't be in the past.");
            extend.mutate(value);
          }}
        >
          <DialogHeader>
            <DialogTitle>Extend loan</DialogTitle>
            <DialogDescription>
              Give {borrowerName} more time with “{bookTitle}”. Reminders restart for the new date.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-1.5">
            <Label htmlFor={`due_date_${recordId}`}>New due date</Label>
            <Input
              id={`due_date_${recordId}`}
              name="due_date"
              type="date"
              min={today()}
              defaultValue={currentDueDate && currentDueDate >= today() ? currentDueDate : ""}
              required
            />
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={extend.isPending}>
              {extend.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save new date
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
