import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Users, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding/role-select")({
  head: () => ({
    meta: [
      { title: "Choose Your Role — Minister's Vault" },
      { name: "description", content: "Select how you'll use Minister's Vault" },
    ],
  }),
  component: RoleSelectPage,
});

function RoleSelectPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"minister" | "student" | "institution_admin" | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRoleSelect() {
    if (!selectedRole) {
      toast.error("Please select a role to continue");
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error("Not authenticated");

      // Insert role into user_roles table
      const { error } = await supabase.from("user_roles").insert({
        user_id: user.user.id,
        role: selectedRole,
      });

      if (error) throw error;

      // Redirect to role-specific onboarding
      const onboardingRoutes = {
        minister: "/onboarding/minister",
        student: "/onboarding/student",
        institution_admin: "/onboarding/institution",
      };

      navigate({ to: onboardingRoutes[selectedRole] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to select role");
      setLoading(false);
    }
  }

  const roles = [
    {
      id: "minister" as const,
      title: "Pastor/Minister",
      description: "Manage your personal theological library and lending",
      icon: BookOpen,
      highlight: "Mobile-first cataloging and lending reminders",
    },
    {
      id: "student" as const,
      title: "Theological Student",
      description: "Track reading goals and academic library",
      icon: Users,
      highlight: "Reading progress, goals, and discipline tracking",
    },
    {
      id: "institution_admin" as const,
      title: "Institution/Seminary",
      description: "Manage institutional library and multi-user access",
      icon: Building2,
      highlight: "Shared library, reporting, and user management",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold mb-3 text-slate-900">
            Tell us about your ministry
          </h1>
          <p className="text-lg text-slate-600">
            Choose the role that best describes how you'll use Minister's Vault
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`text-left p-6 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-amber-500 bg-amber-50 shadow-lg"
                    : "border-slate-200 bg-white hover:border-amber-300"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className={`h-8 w-8 ${isSelected ? "text-amber-600" : "text-slate-400"}`} />
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
                <h3 className="font-serif text-lg font-semibold text-slate-900 mb-2">{role.title}</h3>
                <p className="text-sm text-slate-600 mb-3">{role.description}</p>
                <p className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded w-fit">
                  {role.highlight}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleRoleSelect}
            disabled={!selectedRole || loading}
            size="lg"
            className="px-8"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Setting up..." : "Continue to Setup"}
          </Button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">
          You can change this later in your account settings
        </p>
      </div>
    </div>
  );
}
