import { createClient } from "@/lib/supabase/client";

export type SubscriptionPlan = "free" | "pro" | "premium";

export interface PlanLimits {
  subjects: number;
  tasks: number;
  notes: number;
  resumes: number;
  aiQueries: number;
  features: string[];
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    subjects: 3,
    tasks: 15,
    notes: 5,
    resumes: 1,
    aiQueries: 5,
    features: ["Study Planner basics", "Kanban task board", "Simple notes", "1 ATS Resume"]
  },
  pro: {
    subjects: 15,
    tasks: 100,
    notes: 50,
    resumes: 5,
    aiQueries: 100,
    features: ["All Free tier features", "Competitive Programming Tracker", "Kaggle Tracker", "Full Resume Templates", "100 AI Queries / Month", "Habit streaks analytics"]
  },
  premium: {
    subjects: 9999, // unlimited
    tasks: 9999,
    notes: 9999,
    resumes: 9999,
    aiQueries: 9999,
    features: ["Everything in Pro tier", "Unlimited Resume Builders", "Unlimited AI Assistant Queries", "Advanced Analytics Dashboard", "Priority Admin Support", "Early Access to Beta Tools"]
  }
};

export async function fetchUserSubscription() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { plan: "free" as SubscriptionPlan, status: "active", expires_at: null };

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    // Return default free tier
    return { plan: "free" as SubscriptionPlan, status: "active", expires_at: null };
  }

  return {
    plan: data.plan as SubscriptionPlan,
    status: data.status,
    expires_at: data.expires_at
  };
}

export async function updateSubscriptionTier(plan: SubscriptionPlan) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: user.id,
      plan,
      status: "active",
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating subscription:", error);
    return null;
  }
  return data;
}

export async function checkFeatureAccess(
  feature: "subjects" | "tasks" | "notes" | "resumes" | "aiQueries",
  currentCount: number
): Promise<{ allowed: boolean; limit: number; remaining: number }> {
  const sub = await fetchUserSubscription();
  const limit = PLAN_LIMITS[sub.plan][feature];
  const allowed = currentCount < limit;
  const remaining = Math.max(0, limit - currentCount);

  return {
    allowed,
    limit,
    remaining
  };
}
