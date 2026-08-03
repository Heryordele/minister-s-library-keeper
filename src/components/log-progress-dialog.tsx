import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  logProgress,
  readingProgressKey,
  readingStreakKey,
  type BookReadingStats,
} from "@/lib/reading";

export function LogProgressDialog({
  bookId,
  bookTitle,
  stats,
}: {
  bookId: string;
  bookTitle: string;
  stats: BookReadingStats;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("");
  const [totalPages, setTotalPages] = useState(
    stats.totalPages ? String(stats.totalPages) : "",
  );
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [lessons, setLessons] = useState("");

  const save = useMutation({
    mutationFn: () =>
      logProgress({
        book_id: bookId,
        current_page: Number(currentPage),
        total_pages: totalPages ? Number(totalPages) : null,
        start_page: stats.currentPage || null,
        reading_time_minutes: minutes ? Number(minutes) : null,
        notes: notes.trim() || null,
        key_lessons: lessons.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: readingProgressKey });
      qc.invalidateQueries({ queryKey: readingStreakKey });
      toast.success("Progress logged. Keep the rhythm going.");
      setOpen(false);
      setCurrentPage("");
      setMinutes("");
      setNotes("");
      setLessons("");
    },
    onError: (e) =>
      toast.error(
        e instanceof Error ? e.message : "Could not log your progress.",
      ),
  });

  const invalid = !Number(currentPage) || Number(currentPage) < 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <BookOpenCheck className="mr-2 h-4 w-4" /> Log progress
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log progress</DialogTitle>
          <DialogDescription>
            Where did you reach in “{bookTitle}” today?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="current-page">Current page</Label>
              <Input
                id="current-page"
                type="number"
                min={1}
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
                placeholder={stats.currentPage ? String(stats.currentPage) : "1"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total-pages">Total pages</Label>
              <Input
                id="total-pages"
                type="number"
                min={1}
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="minutes">Reading time (minutes)</Label>
            <Input
              id="minutes"
              type="number"
              min={1}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lessons">Key lessons</Label>
            <Textarea
              id="lessons"
              rows={3}
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => save.mutate()}
            disabled={invalid || save.isPending}
          >
            Save progress
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
