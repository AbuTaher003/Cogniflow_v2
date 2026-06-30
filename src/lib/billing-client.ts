import { PlanDetails, SubscriptionPlanSlug, SubscriptionStatus } from "@/types/billing";
import { createClient } from "@/lib/supabase/client";

// Hardcoded default fallback plan details to guarantee zero runtime failures
// if DB seed data has not been loaded or queries fail.
export const STATIC_PLANS: Record<SubscriptionPlanSlug, Omit<PlanDetails, 'planId' | 'subscriptionStatus' | 'expiresAt'>> = {
  free: {
    planSlug: "free",
    name: "FREE",
    price: 0,
    durationDays: 36500,
    features: ["subjects-limit", "tasks-limit", "notes-limit", "resumes-limit", "ai-queries-limit"]
  },
  pro: {
    planSlug: "pro",
    name: "PRO",
    price: 400,
    durationDays: 30,
    features: ["subjects-limit", "tasks-limit", "notes-limit", "resumes-limit", "ai-queries-limit", "cp-tracker", "kaggle-tracker"]
  },
  elite: {
    planSlug: "elite",
    name: "ELITE",
    price: 1000,
    durationDays: 30,
    features: ["subjects-limit", "tasks-limit", "notes-limit", "resumes-limit", "ai-queries-limit", "cp-tracker", "kaggle-tracker", "unlimited-ai", "advanced-analytics", "priority-support"]
  }
};

// Plan Limit Configurations
export const PLAN_LIMITS: Record<SubscriptionPlanSlug, Record<string, number | boolean>> = {
  free: {
    subjects: 3,
    tasks: 15,
    notes: 5,
    resumes: 1,
    aiQueries: 5,
    storageMb: 10,
    analytics: false
  },
  pro: {
    subjects: 15,
    tasks: 100,
    notes: 50,
    resumes: 9999, // practically unlimited
    aiQueries: 100,
    storageMb: 100,
    analytics: true
  },
  elite: {
    subjects: 9999,
    tasks: 9999,
    notes: 9999,
    resumes: 9999,
    aiQueries: 9999,
    storageMb: 9999,
    analytics: true
  }
};

/**
 * Universal helper to instantiate the appropriate Supabase client
 * depending on whether execution environment is server or client (browser).
 */
export function getClient(customClient?: any) {
  if (customClient) return customClient;
  return createClient();
}

/**
 * Fetches user's active subscription plan from public.user_subscriptions.
 * Automatically checks for expiration and downgrades status to 'expired' if needed.
 */
export async function getPlan(userId: string, supabaseClient?: any): Promise<PlanDetails> {
  try {
    const supabase = getClient(supabaseClient);
    
    // Query active user subscription
    const { data: subData, error: subError } = await supabase
      .from("user_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("user_id", userId)
      .maybeSingle();

    if (subError || !subData) {
      // Fallback: Default to free tier
      return getStaticFallback("free");
    }

    // Check expiration date
    const now = new Date();
    if (subData.expires_at && new Date(subData.expires_at) < now) {
      if (subData.status === "active") {
        // Automatically mark the subscription as expired in background
        await supabase
          .from("user_subscriptions")
          .update({ status: "expired", updated_at: now.toISOString() })
          .eq("id", subData.id);
      }
      return getStaticFallback("free", "expired", subData.expires_at);
    }

    if (subData.status !== "active") {
      return getStaticFallback("free", subData.status, subData.expires_at);
    }

    const plan = subData.subscription_plans;
    return {
      planSlug: plan.slug as SubscriptionPlanSlug,
      planId: plan.id,
      name: plan.name,
      price: parseFloat(plan.price),
      durationDays: plan.duration_days,
      features: plan.features || [],
      subscriptionStatus: subData.status,
      expiresAt: subData.expires_at
    };
  } catch (err) {
    console.error("Error in getPlan:", err);
    return getStaticFallback("free");
  }
}

/**
 * Checks if a planSlug is allowed to access a specific feature.
 * ELITE plan has access to everything.
 */
export function hasFeature(planSlug: SubscriptionPlanSlug, featureSlug: string): boolean {
  if (planSlug === "elite") return true;
  
  const planConfig = STATIC_PLANS[planSlug];
  if (!planConfig) return false;

  // Check direct boolean flags
  if (featureSlug === "cp-tracker" || featureSlug === "kaggle-tracker" || featureSlug === "advanced-analytics" || featureSlug === "priority-support") {
    return planConfig.features.includes(featureSlug);
  }

  // Limit check permissions
  return planConfig.features.includes(featureSlug);
}

/**
 * Checks whether current usage is below the plan threshold for a limit-based feature.
 */
export async function hasUsage(
  userId: string,
  resource: "subjects" | "tasks" | "notes" | "resumes" | "aiQueries",
  currentUsage?: number,
  planSlug?: SubscriptionPlanSlug,
  supabaseClient?: any
): Promise<boolean> {
  try {
    const slug = planSlug || (await getPlan(userId, supabaseClient)).planSlug;
    if (slug === "elite") return true;

    const limit = PLAN_LIMITS[slug][resource];
    
    // If currentUsage is provided, compare directly
    if (currentUsage !== undefined) {
      return currentUsage < (limit as number);
    }

    // Auto-query DB to count current active resource count
    const supabase = getClient(supabaseClient);
    let count = 0;

    if (resource === "subjects") {
      const { count: dbCount } = await supabase
        .from("subjects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("archived", false);
      count = dbCount || 0;
    } else if (resource === "tasks") {
      const { count: dbCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .neq("status", "done");
      count = dbCount || 0;
    } else if (resource === "notes") {
      const { count: dbCount } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("archived", false);
      count = dbCount || 0;
    } else if (resource === "resumes") {
      const { count: dbCount } = await supabase
        .from("resumes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      count = dbCount || 0;
    } else if (resource === "aiQueries") {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("cogniflow_ai_queries_count");
        count = stored ? parseInt(stored, 10) : 0;
      } else {
        count = 0;
      }
    }

    return count < (limit as number);
  } catch (err) {
    console.error("Error in hasUsage:", err);
    return false; // Fail secure
  }
}

/**
 * General validator merging hasFeature and hasUsage checks.
 */
export async function canAccess(
  userId: string,
  featureSlug: string,
  currentUsage?: number,
  supabaseClient?: any
): Promise<boolean> {
  const planDetails = await getPlan(userId, supabaseClient);
  
  // If requesting a resource limit check
  const usageKeys: Array<"subjects" | "tasks" | "notes" | "resumes" | "aiQueries"> = ["subjects", "tasks", "notes", "resumes", "aiQueries"];
  const matchedKey = usageKeys.find(k => k === featureSlug || `${k}-limit` === featureSlug);
  
  if (matchedKey) {
    return hasUsage(userId, matchedKey, currentUsage, planDetails.planSlug, supabaseClient);
  }

  // Else check boolean permissions
  return hasFeature(planDetails.planSlug, featureSlug);
}

/**
 * Inspects, validates, and cleans up user subscription state.
 */
export async function checkSubscription(
  userId: string,
  supabaseClient?: any
): Promise<{ status: SubscriptionStatus; plan: SubscriptionPlanSlug }> {
  const planDetails = await getPlan(userId, supabaseClient);
  return {
    status: planDetails.subscriptionStatus as SubscriptionStatus,
    plan: planDetails.planSlug
  };
}

// Utility: Generate static fallback plan details
function getStaticFallback(
  slug: SubscriptionPlanSlug,
  status: string = "active",
  expiresAt: string | null = null
): PlanDetails {
  const defaults = STATIC_PLANS[slug];
  return {
    ...defaults,
    planId: "00000000-0000-0000-0000-000000000000",
    subscriptionStatus: status,
    expiresAt
  };
}
