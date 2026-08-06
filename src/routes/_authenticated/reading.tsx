import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Flame, Loader2, Pencil, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, EmptyState } from "@/components/page-header";
import { ReadingGoalDialog } from "@/components/reading-goal-dialog";
import { StatCard } from "@/components/stat-card";
import { StreakBadges } from "@/components/streak-badges";
import { Button } from "@/components/ui/button";
import { booksKey, categoriesKey, fetchBooks, fetchCategories } from "@/lib/books";
import {
  allProgressKey,
  computeReadingDashboard,
  fetchAllProgress,
} from "@/lib/dashboard";
import {
  deleteGoal,
  describeGoal,
  fetchGoals,
  fetchStreak,
  liveStreakDays,
  readingGoalsKey,
  readingStreakKey,
} from "@/lib/reading";


export const Route = createFileRoute("/_authenticated/reading")({
  head: () => ({
    meta: [
      { title: "Reading — Minister's Vault" },
      {
        name: "description",
        content:
          "Set reading goals, log your progress, and build a steady reading streak.",
      },
      { property: "og:title", content: "Reading — Minister's Vault" },
      {
        property: "og:description",
        content:
          "Set reading goals, log your progress, and build a steady reading streak.",
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
  const { data: books } = useQuery({ queryKey: booksKey, queryFn: fetchBooks });
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
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not remove the goal."),
  });

  const current = liveStreakDays(streak ?? null);
  const longest = streak?.longest_streak_days ?? 0;
  const dash = computeReadingDashboard(
    books ?? [],
    progress ?? [],
    categories ?? [],
  );

  return (
    <>
      <PageHeader
        title="Reading dashboard"
        subtitle="Your goals, streaks, and daily discipline."
        actions={<ReadingGoalDialog />}
      />

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-8">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label="Currently reading" value={dash.currentlyReading} />
          <StatCard label="Books completed" value={dash.completed} />
          <StatCard
            label="Pages this month"
            value={dash.pagesThisMonth}
          />
          <StatCard label="Hours this month" value={dash.hoursThisMonth} />
          <StatCard
            label="Current streak"
            value={`${current} ${current === 1 ? "day" : "days"}`}
          />
          <StatCard
            label="Most-read category"
            value={
              <span className="text-base">
                {dash.mostReadCategory ?? "—"}
              </span>
            }
            hint={dash.mostReadCategory ? undefined : "Log progress to see this"}
          />
        </section>


        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-accent/15 text-accent">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{current} days</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Current streak
                </div>
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold">{longest} days</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Longest streak
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Log progress from any book marked “reading” to keep your streak
            alive.
          </p>
          <StreakBadges longestStreak={longest} className="mt-5" />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Reading goals</h2>
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
            <ul className="space-y-3">
              {goals.map((goal) => (
                <li
                  key={goal.id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-serif text-base font-semibold capitalize">
                      {goal.period} goal
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {describeGoal(goal)} · since{" "}
                      {new Date(`${goal.start_date}T00:00:00`).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "short", day: "numeric" },
                      )}
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
                  <GoalProgressBar
                    goal={goal}
                    progress={progress ?? []}
                    books={books ?? []}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
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
