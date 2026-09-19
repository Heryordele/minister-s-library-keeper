import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding/student")({
  head: () => ({
    meta: [
      { title: "Student Setup — Minister's Vault" },
    ],
  }),
  component: StudentOnboarding,
});

function StudentOnboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState("");
  const [program, setProgram] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState("3");

  async function handleComplete() {
    if (!school.trim()) {
      toast.error("Please enter your institution");
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error("Not authenticated");

      // Create initial reading goal
      const { error: goalError } = await supabase.from("reading_goals").insert({
        user_id: user.user.id,
        period: "weekly",
        target_value: parseInt(weeklyGoal),
        target_unit: "books",
        start_date: new Date().toISOString().split("T")[0],
      });

      if (goalError) throw goalError;

      // Initialize reading streak
      const { error: streakError } = await supabase.from("reading_streaks").insert({
        user_id: user.user.id,
      });

      if (streakError && streakError.code !== "23505") throw streakError; // Ignore duplicate key

      toast.success("Welcome! Your reading journey begins now.");
      navigate({ to: "/reading", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Setup failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">
              Foundation and Discipline
            </h1>
            <p className="text-sm text-slate-600">
              Set your academic reading goals and track your progress toward becoming a disciplined, informed scholar.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="school">Seminary/Institution</Label>
              <Input
                id="school"
                placeholder="e.g., Westminster Theological Seminary"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="program">Program (Optional)</Label>
              <Input
                id="program"
                placeholder="e.g., M.Div. in Systematic Theology"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal">Weekly Reading Goal</Label>
              <div className="flex gap-2">
                <Input
                  id="goal"
                  type="number"
                  min="1"
                  max="20"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(e.target.value)}
                  className="flex-1"
                />
                <span className="flex items-center text-sm text-slate-600 px-2">books/week</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex gap-3">
                <div className="text-blue-600 font-bold">✓</div>
                <div className="text-sm text-blue-900">
                  <p className="font-medium">Reading Discipline</p>
                  <p className="text-xs mt-1">Track progress, maintain streaks, and reach your goals</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleComplete}
              disabled={loading || !school.trim()}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Setting up..." : "Start Reading"}
            </Button>
            <p className="text-xs text-center text-slate-500">
              Adjust your goal anytime in settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
