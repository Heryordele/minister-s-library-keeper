import { Award } from "lucide-react";

import { MILESTONES, milestoneLabel } from "@/lib/reading";
import { cn } from "@/lib/utils";

export function StreakBadges({
  longestStreak,
  className,
}: {
  longestStreak: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {MILESTONES.map((days) => {
        const earned = longestStreak >= days;
        return (
          <div
            key={days}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
              earned
                ? "border-accent bg-accent/10 text-foreground"
                : "border-dashed border-border text-muted-foreground",
            )}
            title={
              earned
                ? `Earned: ${days}-day streak`
                : `Reach a ${days}-day streak to earn this`
            }
          >
            <Award
              className={cn("h-4 w-4", earned ? "text-accent" : "opacity-50")}
            />
            <div className="leading-tight">
              <div className="font-medium">{milestoneLabel(days)}</div>
              <div className="text-xs text-muted-foreground">{days} days</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
