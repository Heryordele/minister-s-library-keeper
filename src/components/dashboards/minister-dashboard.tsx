import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function MinisterDashboard() {
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ["books-count"],
    queryFn: async () => {
      if (!user?.id) return { total: 0, borrowed: 0 };
      const { data } = await supabase
        .from("books")
        .select("id, lending_status")
        .eq("owner_id", user.id);
      return {
        total: data?.length || 0,
        borrowed: data?.filter((b) => b.lending_status === "borrowed").length || 0,
      };
    },
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Your Library Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600">Your Library</p>
              <p className="text-3xl font-serif font-bold text-slate-900">
                {booksLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : books?.total || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">{books?.borrowed || 0} currently borrowed</p>
            </div>
            <BookOpen className="h-8 w-8 text-amber-600" />
          </div>
          <Link to="/books">
            <Button variant="outline" size="sm" className="w-full">
              View Library
            </Button>
          </Link>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-900 mb-3">Quick Actions</p>
            <div className="space-y-2">
              <Link to="/books/scan">
                <Button variant="secondary" size="sm" className="w-full justify-start">
                  📱 Scan Barcode
                </Button>
              </Link>
              <Link to="/books/new">
                <Button variant="secondary" size="sm" className="w-full justify-start">
                  ➕ Add Book
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Lending Activity */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-serif font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" /> Lending Status
        </h3>
        <p className="text-sm text-slate-600 text-center py-8">
          No active lending records. Books you lend will appear here.
        </p>
      </div>

      {/* Tip Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-900">
          <span className="font-medium">Tip:</span> Use the barcode scanner for fast cataloging. Minister's Vault
          will look up ISBN details automatically.
        </p>
      </div>
    </div>
  );
}
