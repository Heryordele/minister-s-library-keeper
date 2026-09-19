import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding/institution")({
  head: () => ({
    meta: [
      { title: "Institution Setup — Minister's Vault" },
    ],
  }),
  component: InstitutionOnboarding,
});

function InstitutionOnboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [institutionName, setInstitutionName] = useState("");
  const [libraryName, setLibraryName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  async function handleComplete() {
    if (!institutionName.trim() || !libraryName.trim()) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error("Not authenticated");

      // Update profile with institution info
      const { error } = await supabase
        .from("profiles")
        .update({
          name: institutionName,
        })
        .eq("id", user.user.id);

      if (error) throw error;

      toast.success("Institution setup complete! Invite your team to get started.");
      navigate({ to: "/reading", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Setup failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
              Centralize Your Institutional Archive
            </h1>
            <p className="text-sm text-slate-600 italic">
              Configuring accountability frameworks for {institutionName || "your institution"}. Define your
              parameters to ensure scholarly rigor and archival integrity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="font-serif font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-amber-600">⚙</span> Identity & Scale
              </h2>

              <div className="space-y-1.5">
                <Label htmlFor="institution">Institution Name *</Label>
                <Input
                  id="institution"
                  placeholder="e.g., Grace Bible College"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="library">Library Name *</Label>
                <Input
                  id="library"
                  placeholder="e.g., Grace Bible College Archival Library"
                  value={libraryName}
                  onChange={(e) => setLibraryName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin">Primary Administrator Email</Label>
                <Input
                  id="admin"
                  type="email"
                  placeholder="admin@gracebible.edu"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-blue-600">👥</span> Access Roles
              </h2>

              <div className="space-y-3">
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <p className="font-medium text-sm text-slate-900">Senior Archivist</p>
                  <p className="text-xs text-slate-600 mt-1">Administrator Access</p>
                  <div className="flex gap-1 mt-2">
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">WRITE ACCESS</span>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">USER MGMT</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <p className="font-medium text-sm text-slate-900">Faculty Researcher</p>
                  <p className="text-xs text-slate-600 mt-1">Standard Circulation</p>
                  <div className="flex gap-1 mt-2">
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">READ ONLY</span>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">90-DAY BORROW</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <p className="font-medium text-sm text-slate-900">Graduate Student</p>
                  <p className="text-xs text-slate-600 mt-1">Limited Access</p>
                  <div className="flex gap-1 mt-2">
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">IN-LIBRARY ONLY</span>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">5 ITEM LIMIT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <span className="font-medium">Strict Archival Mode:</span> High-value volumes (pre-1900) will bypass
              lending rules and remain non-circulating by default.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleComplete}
              disabled={loading || !institutionName.trim() || !libraryName.trim()}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Setting up..." : "Confirm & Next: Asset Ingestion"}
            </Button>
            <p className="text-xs text-center text-slate-500">
              Institutional parameters saved to local staging
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
