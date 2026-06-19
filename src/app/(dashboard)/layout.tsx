import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/sign-in");
  }

  // Fetch the user's profile and check onboarding status
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, onboarding_completed")
    .eq("id", data.user.id)
    .single();

  if (profile && !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const userForShell = {
    email: data.user.email,
    full_name: profile?.full_name ?? undefined,
    avatar_url: profile?.avatar_url ?? undefined,
  };

  return <DashboardShell user={userForShell}>{children}</DashboardShell>;
}