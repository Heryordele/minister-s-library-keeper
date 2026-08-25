import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BookMarked,
  Camera,
  Flame,
  Loader2,
  PartyPopper,
  Pencil,
  Target,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader, EmptyState } from "@/components/page-header";
import { ReadingGoalDialog } from "@/components/reading-goal-dialog";
import { StatCard } from "@/components/stat-card";
import { StreakBadges } from "@/components/streak-badges";
import { Button } from "@/components/ui/button";
import {
  booksKey,
  categoriesKey,
  fetchBooks,
  fetchCategories,
  type Book as BookRow,
} from "@/lib/books";
import {
  allProgressKey,
  computeGoalProgress,
  computeReadingDashboard,
  fetchAllProgress,
  type GoalPeriodName,
} from "@/lib/dashboard";
import {
  deleteGoal,
  describeGoal,
  fetchGoals,
  fetchStreak,
  liveStreakDays,
  readingGoalsKey,
  readingStreakKey,
  type ReadingGoal,
  type ReadingProgress as ReadingProgressRow,
} from "@/lib/reading";

export const Route = createFileRoute("/_authenticated/reading")({
  head: () => ({
    meta: [
      { title: "Reading — Minister's Vault" },
      {
        name: "description",
        content: "Set reading goals, log your progress, and build a steady reading streak.",
      },
      { property: "og:title", content: "Reading — Minister's Vault" },
      {
        property: "og:description",
        content: "Set reading goals, log your progress, and build a steady reading streak.",
      },
    ],
  }),
  component: ReadingPage,
});

function ReadingPage() {
  const qc = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: readingGoalsKey,
    queryFn: fetchGoals,
  });
  const { data: streak } = useQuery({
    queryKey: readingStreakKey,
    queryFn: fetchStreak,
  });
  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: booksKey,
    queryFn: fetchBooks,
  });
  const { data: categories } = useQuery({
    queryKey: categoriesKey,
    queryFn: fetchCategories,
  });
  const { data: progress } = useQuery({
    queryKey: allProgressKey,
    queryFn: fetchAllProgress,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: readingGoalsKey });
      toast.success("Goal removed.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove the goal."),
  });

  const current = liveStreakDays(streak ?? null);
  const longest = streak?.longest_streak_days ?? 0;
  const dash = computeReadingDashboard(books ?? [], progress ?? [], categories ?? []);
  const hasNoLibrary = !booksLoading && (books?.length ?? 0) === 0;

  return (
    <>
      <PageHeader
        title="Reading dashboard"
        subtitle="Your goals, streaks, and daily discipline."
        actions={hasNoLibrary ? undefined : <ReadingGoalDialog />}
      />

      {hasNoLibrary ? (
        <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
          <section className="scholar-card">
            <div className="grid h-11 w-11 place-items-center bg-accent/15 text-accent">
              <BookMarked className="h-5 w-5" />
            </div>
            <h2 className="headline-lg mt-6">
              Your vault is empty — let's add your first book.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Everything here — reading goals, streaks, lending — starts once your library has at
              least one book in it. Catalog one now, however is fastest for you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="default">
                <Link to="/books/scan">
                  <Camera className="mr-2 h-4 w-4" />
                  Scan a barcode
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/books/new" search={{ isbn: undefined }}>
                  Add manually
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link to="/books/import">
                  <Upload className="mr-2 h-4 w-4" />
                  Import a list
                </Link>
              </Button>
            </div>
          </section>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-8">
          <section className=”grid grid-cols-2 gap-4 md:grid-cols-3”>
            <StatCard label=”Books in library” value={books?.length ?? 0} />
            <StatCard label=”Currently reading” value={dash.currentlyReading} />
            <StatCard label=”Books completed” value={dash.completed} />
            <StatCard label=”Pages this month” value={dash.pagesThisMonth} />
            <StatCard label=”Hours this month” value={dash.hoursThisMonth} />
            <StatCard
              label=”Most-read category”
              value={<span className=”text-base”>{dash.mostReadCategory ?? “—“}</span>}
              hint={dash.mostReadCategory ? undefined : “Log progress to see this”}
            />
          </section>

          <section className=”scholar-card”>
            <div className=”flex flex-wrap items-center gap-8”>
              <div className=”flex items-center gap-4”>
                <div className=”grid h-14 w-14 place-items-center bg-accent/15 text-accent”>
                  <Flame className=”h-7 w-7” />
                </div>
                <div>
                  <div className=”display-md text-accent”>{current}</div>
                  <div className=”label-sm uppercase text-muted-foreground”>
                    Current streak (days)
                  </div>
                </div>
              </div>
              <div>
                <div className=”display-md”>{longest}</div>
                <div className=”label-sm uppercase text-muted-foreground”>
                  Longest streak (days)
                </div>
              </div>
            </div>
            <p className=”mt-6 text-sm text-muted-foreground”>
              Log progress from any book marked “reading” to keep your streak alive.
            </p>
            <StreakBadges longestStreak={longest} className=”mt-6” />
          </section>

          <section>
            <h2 className=”headline-lg mb-6”>Reading goals</h2>
            {isLoading ? (
              <div className="grid place-items-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !goals || goals.length === 0 ? (
              <EmptyState
                icon={<Target className="h-6 w-6" />}
                title="No reading goal yet"
                body="Set a rhythm — a few pages a day, or a book a month — and build from there."
                action={<ReadingGoalDialog />}
              />
            ) : (
              <ul className="space-y-4">
                {goals.map((goal) => (
                  <li key={goal.id} className="scholar-card">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="headline-md capitalize font-display">
                          {goal.period} goal
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {describeGoal(goal)} · since{" "}
                          {new Date(`${goal.start_date}T00:00:00`).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <ReadingGoalDialog
                          goal={goal}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <GoalProgressBar goal={goal} progress={progress ?? []} books={books ?? []} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function GoalProgressBar({
  goal,
  progress,
  books,
}: {
  goal: ReadingGoal;
  progress: ReadingProgressRow[];
  books: BookRow[];
}) {
  const result = computeGoalProgress(
    {
      period: goal.period as GoalPeriodName,
      target_value: goal.target_value,
      target_unit: goal.target_unit as "pages" | "books",
    },
    progress,
    books,
  );

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className={result.met ? "font-medium text-accent" : "text-muted-foreground"}>
          {result.met ? (
            <span className="inline-flex items-center gap-1">
              <PartyPopper className="h-3.5 w-3.5" /> Goal reached {result.periodLabel}!
            </span>
          ) : (
            `${result.achieved} of ${result.target} ${result.unit} ${result.periodLabel}`
          )}
        </span>
        <span className="text-muted-foreground">{result.percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={result.met ? "h-full bg-accent" : "h-full bg-primary"}
          style={{ width: `${result.percent}%` }}
        />
      </div>
    </div>
  );
}
