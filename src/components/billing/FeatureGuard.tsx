"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { canAccess, getPlan, PLAN_LIMITS } from "@/lib/billing-client";
import { SubscriptionPlanSlug } from "@/types/billing";
import { Lock, Sparkles, Crown, ArrowRight, Check, Loader2 } from "lucide-react";

// ============================================
// CUSTOM CLIENT HOOK
// ============================================

export function useFeatureAccess(feature: string, currentUsage?: number) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlanSlug>("free");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function checkAccess() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (active) {
            setLoading(false);
            setAllowed(false);
          }
          return;
        }

        if (active) {
          setUserId(user.id);
        }

        // Determine plan and custom permission rules
        const planDetails = await getPlan(user.id, supabase);
        const hasAccess = await canAccess(user.id, feature, currentUsage, supabase);

        if (active) {
          setPlan(planDetails.planSlug);
          setAllowed(hasAccess);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error evaluating feature access on client:", err);
        if (active) {
          setLoading(false);
          setAllowed(false);
        }
      }
    }

    checkAccess();

    // Listen for auth state modifications to recalculate access
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAccess();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [feature, currentUsage]);

  return { loading, allowed, plan, userId };
}

// ============================================
// COMPONENT IMPLEMENTATION
// ============================================

interface FeatureGuardProps {
  feature: string;
  currentUsage?: number;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGuard({
  feature,
  currentUsage,
  fallback,
  children
}: FeatureGuardProps) {
  const { loading, allowed, plan } = useFeatureAccess(feature, currentUsage);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 min-h-[250px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500/80 mb-3" />
        <p className="text-sm text-zinc-400 font-medium animate-pulse">Verifying feature access permissions...</p>
      </div>
    );
  }

  if (allowed) {
    return <>{children}</>;
  }

  // Renders premium glassmorphic upgrade prompt if user is blocked and no custom fallback is provided
  return fallback !== undefined ? (
    <>{fallback}</>
  ) : (
    <UpgradeCallout feature={feature} currentPlan={plan} />
  );
}

// ============================================
// PREMIUM GLASSMORPHIC CALLOUT CARD
// ============================================

interface UpgradeCalloutProps {
  feature: string;
  currentPlan: SubscriptionPlanSlug;
}

export function UpgradeCallout({ feature, currentPlan }: UpgradeCalloutProps) {
  // Format resource name for display
  const formatFeatureName = (slug: string) => {
    return slug
      .replace(/-limit$/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const featureName = formatFeatureName(feature);

  return (
    <div className="relative w-full max-w-2xl mx-auto my-8 overflow-hidden rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-xl p-8 md:p-10 shadow-2xl flex flex-col items-center text-center">
      {/* Dynamic Animated background ambient glow */}
      <div className="absolute -top-24 -left-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" />

      {/* Hexagonal premium icon lock ring */}
      <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-b from-purple-500/10 to-indigo-500/10 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] mb-6">
        <Lock className="w-6 h-6 text-purple-400" />
        <div className="absolute inset-0 rounded-full border border-purple-400/20 animate-ping opacity-25 duration-1000" />
      </div>

      <h3 className="text-2xl font-bold tracking-tight text-white mb-3">
        Upgrade to unlock {featureName}
      </h3>
      <p className="text-zinc-400 text-sm max-w-md mb-8 leading-relaxed">
        You've hit the limits of the <span className="font-semibold text-purple-400">{currentPlan.toUpperCase()}</span> plan. Unlock unlimited access, advanced tools, and premium features.
      </p>

      {/* Plan feature list comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left mb-8 max-w-lg">
        <div className="flex items-start space-x-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/40">
          <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-zinc-200">PRO Plan (৳400/mo)</h4>
            <p className="text-xs text-zinc-500 mt-0.5">Includes CP tracker, Kaggle tracker, 100 AI queries & 15 subjects.</p>
          </div>
        </div>
        <div className="flex items-start space-x-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/40">
          <Crown className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-zinc-200">ELITE Plan (৳1000/mo)</h4>
            <p className="text-xs text-zinc-500 mt-0.5">Everything unlocked. Unlimited AI assistant queries & advanced analytics.</p>
          </div>
        </div>
      </div>

      {/* Interactive Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
        <a
          href="/dashboard/billing"
          className="relative group flex items-center justify-center space-x-2 w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-8 rounded-xl shadow-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>View Pricing Plans</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </a>
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center w-full sm:w-auto border border-zinc-800 hover:bg-zinc-900/60 text-zinc-300 font-semibold py-3 px-8 rounded-xl transition-all"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
