import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Target } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GOAL_PERIODS,
  GOAL_UNITS,
  readingGoalsKey,
  saveGoal,
  type GoalPeriod,
  type GoalUnit,
  type ReadingGoal,
} from "@/lib/reading";

export function ReadingGoalDialog({
  goal,
  trigger,
}: {
  goal?: ReadingGoal;
  trigger?: React.ReactNode;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<GoalPeriod>(goal?.period ?? "daily");
  const [unit, setUnit] = useState<GoalUnit>(goal?.target_unit ?? "pages");
  const [value, setValue] = useState(String(goal?.target_value ?? 20));
  const [startDate, setStartDate] = useState(
    goal?.start_date ?? new Date().toISOString().slice(0, 10),
  );

  const save = useMutation({
    mutationFn: () =>
      saveGoal(
        {
          period,
          target_unit: unit,
          target_value: Number(value),
          start_date: startDate,
        },
        goal?.id,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: readingGoalsKey });
      toast.success(goal ? "Goal updated." : "Goal set. One page at a time.");
      setOpen(false);
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not save your goal."),
  });

  const invalid = !Number(value) || Number(value) < 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Target className="mr-2 h-4 w-4" /> Set a reading goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? "Edit goal" : "Set a reading goal"}</DialogTitle>
          <DialogDescription>
            Choose a rhythm you can keep — consistency matters more than volume.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Period</Label>
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as GoalPeriod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_PERIODS.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="goal-target">Target</Label>
              <Input
                id="goal-target"
                type="number"
                min={1}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as GoalUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_UNITS.map((u) => (
                    <SelectItem key={u} value={u} className="capitalize">
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goal-start">Start date</Label>
            <Input
              id="goal-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => save.mutate()}
            disabled={invalid || save.isPending}
          >
            {goal ? "Save goal" : "Set goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
