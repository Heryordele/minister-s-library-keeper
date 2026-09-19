import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, BookOpen, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function InstitutionDashboard() {
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["institution-stats"],
    queryFn: async () => {
      if (!user?.id) return { books: 0, borrowed: 0, borrowers: 0 };

      const [booksResult, borrowsResult] = await Promise.all([
        supabase.from("books").select("id, lending_status").eq("owner_id", user.id),
        supabase.from("borrow_records").select("borrower_email").eq("owner_id", user.id),
      ]);

      const uniqueBorrowers = new Set(
        borrowsResult.data?.map((b) => b.borrower_email).filter(Boolean)
      ).size;

      return {
        books: booksResult.data?.length || 0,
        borrowed: booksResult.data?.filter((b) => b.lending_status === "borrowed").length || 0,
        borrowers: uniqueBorrowers,
      };
    },
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Books Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Holdings</p>
              <p className="text-2xl font-serif font-bold text-slate-900">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.books || 0}
              </p>
            </div>
            <BookOpen className="h-6 w-6 text-amber-600" />
          </div>
        </div>

        {/* Currently Borrowed */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Currently Borrowed</p>
              <p className="text-2xl font-serif font-bold text-slate-900">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.borrowed || 0}
              </p>
            </div>
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Active Borrowers */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Borrowers</p>
              <p className="text-2xl font-serif font-bold text-slate-900">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.borrowers || 0}
              </p>
            </div>
            <Users className="h-6 w-6 text-green-600" />
          </div>
        </div>

        {/* Admin Panel Access */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Settings</p>
            </div>
            <Settings className="h-6 w-6 text-slate-400" />
          </div>
          <Link to="/admin">
            <Button variant="outline" size="sm" className="w-full text-xs">
              Admin Panel
            </Button>
          </Link>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h3 className="font-serif font-semibold text-slate-900 flex items-center gap-2">
          <Building2 className="h-5 w-5" /> Administrative Actions
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          <Link to="/books/scan">
            <Button variant="secondary" className="w-full justify-start text-sm">
              📱 Add Books
            </Button>
          </Link>
          <Button variant="secondary" className="w-full justify-start text-sm">
            👥 Manage Users
          </Button>
          <Button variant="secondary" className="w-full justify-start text-sm">
            📊 View Reports
          </Button>
        </div>
      </div>

      {/* Lending Activity */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-serif font-semibold text-slate-900 mb-4">Recent Activity</h3>
        <p className="text-sm text-slate-600 text-center py-8">
          Lending activity and borrower updates will appear here.
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-700">
          <span className="font-medium">Institution Setup:</span> Multi-user library management and role-based access
          coming in Phase 2. Contact support to enable these features for your institution.
        </p>
      </div>
    </div>
  );
}
