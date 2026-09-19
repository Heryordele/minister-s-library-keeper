import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Target, Flame, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function StudentDashboard() {
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["student-stats"],
    queryFn: async () => {
      if (!user?.id) return { books: 0, goals: 0, streak: 0 };

      const [booksResult, goalsResult, streakResult] = await Promise.all([
        supabase.from("books").select("id").eq("owner_id", user.id),
        supabase.from("reading_goals").select("id").eq("user_id", user.id),
        supabase.from("reading_streaks").select("current_streak_days").eq("user_id", user.id).single(),
      ]);

      return {
        books: booksResult.data?.length || 0,
        goals: goalsResult.data?.length || 0,
        streak: streakResult.data?.current_streak_days || 0,
      };
    },
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Reading Goals Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Goals</p>
              <p className="text-3xl font-serif font-bold text-slate-900">
                {statsLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats?.goals || 0}
              </p>
            </div>
            <Target className="h-8 w-8 text-blue-600" />
          </div>
          <Link to="/goals">
            <Button variant="outline" size="sm" className="w-full">
              Manage Goals
            </Button>
          </Link>
        </div>

        {/* Reading Streak Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600">Current Streak</p>
              <p className="text-3xl font-serif font-bold text-slate-900">
                {statsLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats?.streak || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">days</p>
            </div>
            <Flame className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        {/* Library Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600">My Books</p>
              <p className="text-3xl font-serif font-bold text-slate-900">
                {statsLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats?.books || 0}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-amber-600" />
          </div>
          <Link to="/books">
            <Button variant="outline" size="sm" className="w-full">
              View Library
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Add Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h3 className="font-serif font-semibold text-slate-900">Add to Your Library</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Link to="/books/scan">
            <Button variant="secondary" className="w-full justify-start">
              📱 Scan ISBN
            </Button>
          </Link>
          <Link to="/books/new">
            <Button variant="secondary" className="w-full justify-start">
              ➕ Add Manually
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-medium">Pro Tip:</span> Log your reading progress daily to build your streak and
          stay accountable to your academic goals.
        </p>
      </div>
    </div>
  );
}
