"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Shield, Sparkles, CreditCard, HelpCircle,
  TrendingUp, Activity, Lock, Users, Zap, AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PLAN_LIMITS,
  fetchUserSubscription,
  updateSubscriptionTier,
  SubscriptionPlan
} from "@/lib/subscription";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>("free");
  const [subStatus, setSubStatus] = useState("active");
  const [usage, setUsage] = useState({
    subjects: 0,
    tasks: 0,
    notes: 0,
    resumes: 0
  });

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch active plan
      const sub = await fetchUserSubscription();
      setCurrentPlan(sub.plan);
      setSubStatus(sub.status);

      // Fetch usage metrics counts
      const { count: subjectsCount } = await supabase.from("subjects").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: tasksCount } = await supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: notesCount } = await supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: resumesCount } = await supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", user.id);

      setUsage({
        subjects: subjectsCount || 0,
        tasks: tasksCount || 0,
        notes: notesCount || 0,
        resumes: resumesCount || 0
      });
    } catch (err) {
      console.error("Error loading subscription page", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(plan: SubscriptionPlan) {
    setLoading(true);
    const updated = await updateSubscriptionTier(plan);
    if (updated) {
      setCurrentPlan(plan);
      setSubStatus("active");
      alert(`Successfully upgraded to the ${plan.toUpperCase()} Plan!`);
    } else {
      alert("Failed to update subscription.");
    }
    setLoading(false);
  }

  const plans = [
    {
      id: "free" as SubscriptionPlan,
      name: "Free Sandbox",
      price: "$0",
      period: "forever",
      desc: "Perfect for students getting started with tracking studies and habits.",
      color: "border-slate-800 bg-white/5",
      badgeColor: "bg-slate-500/10 text-slate-400",
      buttonText: "Active Plan",
      buttonVariant: "secondary" as const
    },
    {
      id: "pro" as SubscriptionPlan,
      name: "Pro Student",
      price: "$4.99",
      period: "month",
      desc: "Ideal for competitive programmers, career seekers, and active study learners.",
      color: "border-cyan-500/30 bg-gradient-to-b from-cyan-500/10 to-transparent",
      badgeColor: "bg-cyan-500/10 text-cyan-400",
      buttonText: "Upgrade to Pro",
      buttonVariant: "primary" as const,
      popular: true
    },
    {
      id: "premium" as SubscriptionPlan,
      name: "Academic Elite",
      price: "$9.99",
      period: "month",
      desc: "Total access to AI tools, unlimited resumes, and maximum priority pipelines.",
      color: "border-fuchsia-500/30 bg-gradient-to-b from-fuchsia-500/10 to-transparent",
      badgeColor: "bg-fuchsia-500/10 text-fuchsia-400",
      buttonText: "Get Academic Elite",
      buttonVariant: "primary" as const
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-6 md:grid-cols-3"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-cyan-400" />
          Subscription & Billing
        </h1>
        <p className="text-slate-400">Unlock full capability, AI assistants, and un-gated career tracker limits.</p>
      </div>

      {/* Current Limits Tracker */}
      <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" /> Feature Usage meter
          </CardTitle>
          <CardDescription>Visualizing active caps for your account under the <strong>{currentPlan.toUpperCase()}</strong> plan.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(["subjects", "tasks", "notes", "resumes"] as const).map(key => {
            const current = usage[key];
            const max = PLAN_LIMITS[currentPlan][key];
            const pct = Math.min(100, (current / max) * 100);

            return (
              <div key={key} className="space-y-2 rounded-2xl border border-white/5 bg-slate-950/20 p-4">
                <div className="flex justify-between text-xs">
                  <span className="capitalize font-semibold text-slate-400">{key}</span>
                  <span className="text-white font-bold">{current} / {max === 9999 ? "∞" : max}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct > 85 ? "bg-rose-500" : "bg-gradient-to-r from-cyan-400 to-cyan-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Pricing Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map(plan => {
          const isCurrent = currentPlan === plan.id;
          const limits = PLAN_LIMITS[plan.id];

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col justify-between border backdrop-blur-md rounded-3xl ${plan.color} ${plan.popular ? "shadow-cyan-500/10 border-cyan-500/40" : "border-white/10"}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 right-4 rounded-full bg-cyan-500 px-3 py-1 text-[10px] font-bold text-slate-950 tracking-wider uppercase">
                  Most Popular
                </span>
              )}
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${plan.badgeColor}`}>
                    {plan.id}
                  </span>
                </div>
                <CardTitle className="text-xl font-bold text-white mt-2">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-3xl font-display font-extrabold text-white">{plan.price}</span>
                  <span className="text-xs text-slate-500">/{plan.period}</span>
                </div>
                <CardDescription className="text-xs text-slate-400 mt-2 min-h-[40px]">{plan.desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0 flex-1 flex flex-col justify-between">
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {limits.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-6 mt-auto">
                  {isCurrent ? (
                    <Button className="w-full" variant="secondary" disabled>
                      Active Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      className={`w-full ${plan.id === "premium" ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600" : ""}`}
                      variant={plan.buttonVariant}
                    >
                      {plan.buttonText}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
