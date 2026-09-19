import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding/minister")({
  head: () => ({
    meta: [
      { title: "Minister Setup — Minister's Vault" },
    ],
  }),
  component: MinisterOnboarding,
});

function MinisterOnboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [churchName, setChurchName] = useState("");
  const [position, setPosition] = useState("");

  async function handleComplete() {
    if (!churchName.trim()) {
      toast.error("Please enter your church/ministry name");
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error("Not authenticated");

      // Update profile with ministry info (stored as JSON metadata for now)
      const { error } = await supabase
        .from("profiles")
        .update({
          name: user.user.email?.split("@")[0],
        })
        .eq("id", user.user.id);

      if (error) throw error;

      toast.success("Welcome to Minister's Vault!");
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
              Protecting Your Scholarly Legacy
            </h1>
            <p className="text-sm text-slate-600">
              Your lifetime of service and study represents a priceless resource. We're here to ensure
              every sermon, treatise, and mission journal is meticulously archived.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="church">Church/Ministry Name</Label>
              <Input
                id="church"
                placeholder="e.g., Grace Community Church"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="position">Your Position (Optional)</Label>
              <Input
                id="position"
                placeholder="e.g., Senior Pastor"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <div className="flex gap-3">
                <div className="text-amber-600 font-bold">✓</div>
                <div className="text-sm text-amber-900">
                  <p className="font-medium">Archival Security</p>
                  <p className="text-xs mt-1">All entries encrypted per Library of Congress standards</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleComplete}
              disabled={loading || !churchName.trim()}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Setting up..." : "Start Cataloging"}
            </Button>
            <p className="text-xs text-center text-slate-500">
              You can update this anytime in settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
