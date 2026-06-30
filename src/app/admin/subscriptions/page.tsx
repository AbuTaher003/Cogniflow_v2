"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { Loader2, ShieldCheck, Search, RefreshCw, Calendar, AlertTriangle, Play, Ban, ShieldAlert } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
}

interface SubscriptionWithUser {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  profiles?: Profile;
  subscription_plans?: SubscriptionPlan;
}

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Expiry Extension Modal State
  const [extendingSub, setExtendingSub] = useState<SubscriptionWithUser | null>(null);
  const [extendDays, setExtendDays] = useState("30");
  const [customExpiryDate, setCustomExpiryDate] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*, profiles(*), subscription_plans(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load active subscriptions.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExtendSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!extendingSub) return;

    setActioningId(extendingSub.id);
    try {
      let newExpiry: Date;
      const currentExpiry = extendingSub.expires_at ? new Date(extendingSub.expires_at) : new Date();

      if (customExpiryDate) {
        newExpiry = new Date(customExpiryDate);
      } else {
        const days = parseInt(extendDays, 10);
        newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
      }

      if (isNaN(newExpiry.getTime())) {
        throw new Error("Invalid expiry date specified.");
      }

      // Update expires_at in DB
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          expires_at: newExpiry.toISOString(),
          status: "active", // Reactivate if it was expired
          updated_at: new Date().toISOString()
        })
        .eq("id", extendingSub.id);

      if (error) throw error;

      // Log subscription changes
      await supabase.from("subscription_history").insert({
        user_id: extendingSub.user_id,
        plan_id: extendingSub.plan_id,
        previous_plan: extendingSub.subscription_plans?.slug,
        current_plan: extendingSub.subscription_plans?.slug,
        action: "extend",
        transition_type: "upgrade",
        notes: `Subscription extended to ${newExpiry.toLocaleDateString()} by administrator.`
      });

      toast.success(`Subscription extended successfully to ${newExpiry.toLocaleDateString()}`);
      setExtendingSub(null);
      setCustomExpiryDate("");
      await loadSubscriptions();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to extend subscription.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleCancelSubscription(sub: SubscriptionWithUser) {
    if (!confirm(`Are you sure you want to cancel the active license for ${sub.profiles?.full_name}? The status will be set to cancelled.`)) return;

    setActioningId(sub.id);
    try {
      // 1. Update status to cancelled
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString()
        })
        .eq("id", sub.id);

      if (error) throw error;

      // 2. Log in history
      await supabase.from("subscription_history").insert({
        user_id: sub.user_id,
        plan_id: sub.plan_id,
        previous_plan: sub.subscription_plans?.slug,
        current_plan: sub.subscription_plans?.slug,
        action: "cancel",
        transition_type: "status_change",
        notes: "Subscription cancelled by administrator."
      });

      toast.success("Subscription license cancelled.");
      await loadSubscriptions();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to cancel subscription.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleDowngradeToFree(sub: SubscriptionWithUser) {
    if (!confirm(`Are you sure you want to completely downgrade ${sub.profiles?.full_name} to the Free Plan?`)) return;

    setActioningId(sub.id);
    try {
      // 1. Fetch free plan details
      const { data: freePlan } = await supabase
        .from("subscription_plans")
        .select("id")
        .eq("slug", "free")
        .single();

      if (!freePlan) throw new Error("Free Plan configuration not found in DB.");

      // 2. Downgrade plan
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          plan_id: freePlan.id,
          status: "expired", // Set to expired for free tier
          expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", sub.id);

      if (error) throw error;

      // 3. Log history
      await supabase.from("subscription_history").insert({
        user_id: sub.user_id,
        plan_id: freePlan.id,
        previous_plan: sub.subscription_plans?.slug,
        current_plan: "free",
        action: "downgrade",
        transition_type: "downgrade",
        notes: "License seat reverted and downgraded to Free by administrator."
      });

      toast.success("Subscription downgraded to Free Tier.");
      await loadSubscriptions();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to downgrade subscription.");
    } finally {
      setActioningId(null);
    }
  }

  const filtered = subscriptions.filter((sub) => {
    const matchesSearch =
      (sub.profiles?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.profiles?.email || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesPlan = planFilter === "all" || sub.subscription_plans?.slug === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate dynamic stats
  const totalActiveSeats = subscriptions.filter((s) => s.status === "active").length;
  const totalExpiredSeats = subscriptions.filter((s) => s.status === "expired" || s.status === "cancelled").length;

  const activePlanRevenues = subscriptions
    .filter((s) => s.status === "active" && s.subscription_plans)
    .reduce((acc, s) => {
      const slug = s.subscription_plans?.slug || "free";
      const price = parseFloat(s.subscription_plans?.price as any || 0);
      acc[slug] = (acc[slug] || 0) + price;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" /> Subscription Management
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Review active member seats, extend expiry licenses, cancel subscriptions, or downgrade tiers.</p>
        </div>
        <Button onClick={loadSubscriptions} variant="outline" size="sm" className="border-zinc-800 text-zinc-300 h-8">
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh seats
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/10 border-zinc-900/80 p-5 rounded-2xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Active Licenses</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">{totalActiveSeats} seats</span>
        </Card>
        <Card className="bg-zinc-900/10 border-zinc-900/80 p-5 rounded-2xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Expired / Cancelled</span>
          <span className="text-2xl font-black text-rose-400 mt-1 block">{totalExpiredSeats} seats</span>
        </Card>
        <Card className="bg-zinc-900/10 border-zinc-900/80 p-5 rounded-2xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Active Pro / Elite MRR Value</span>
          <span className="text-2xl font-black text-purple-400 mt-1 block">
            ৳{((activePlanRevenues["pro"] || 0) + (activePlanRevenues["elite"] || 0)).toLocaleString()} BDT
          </span>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900/10 border-zinc-900/80 p-4 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search active seats by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-950 border-zinc-900 focus:border-zinc-800 text-zinc-300 text-xs h-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs h-9">
              <SelectValue placeholder="License Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="past_due">Past Due</SelectItem>
            </SelectContent>
          </Select>

          <Select value={planFilter} onValueChange={planFilter => setPlanFilter(planFilter)}>
            <SelectTrigger className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs h-9">
              <SelectValue placeholder="Filter by Plan" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free">FREE</SelectItem>
              <SelectItem value="pro">PRO</SelectItem>
              <SelectItem value="elite">ELITE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="bg-zinc-900/10 border-zinc-900/80 overflow-hidden shadow-xl rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs">
              No subscription seats found matching filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/40 text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="p-4">Subscriber</th>
                    <th className="p-4">Plan Name</th>
                    <th className="p-4">Seat Value</th>
                    <th className="p-4">Activation Date</th>
                    <th className="p-4">Renewal / Expiry Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {filtered.map((sub) => (
                    <tr key={sub.id} className="hover:bg-zinc-900/20 text-zinc-300 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-zinc-200">{sub.profiles?.full_name || "Unknown User"}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{sub.profiles?.email}</p>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-purple-400 uppercase">
                          {sub.subscription_plans?.name || "Free"}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-white">৳{sub.subscription_plans?.price || 0}</td>
                      <td className="p-4 text-zinc-400 font-mono">
                        {new Date(sub.started_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-mono text-zinc-500">
                        {sub.expires_at ? (
                          <span className={new Date(sub.expires_at) < new Date() ? "text-rose-400" : ""}>
                            {new Date(sub.expires_at).toLocaleDateString()}
                          </span>
                        ) : (
                          "Lifetime / Perpetual"
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          sub.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <Button
                          disabled={!!actioningId}
                          onClick={() => setExtendingSub(sub)}
                          size="sm"
                          variant="outline"
                          className="border-zinc-800 text-zinc-300 hover:text-white h-7 px-2.5 rounded-lg text-2xs"
                        >
                          <Play className="w-3.5 h-3.5 mr-1" /> Extend Expiry
                        </Button>
                        {sub.subscription_plans?.slug !== "free" && (
                          <>
                            <Button
                              disabled={!!actioningId}
                              onClick={() => handleCancelSubscription(sub)}
                              size="sm"
                              className="bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-300 h-7 px-2.5 rounded-lg text-2xs"
                            >
                              <Ban className="w-3.5 h-3.5 mr-1" /> Cancel
                            </Button>
                            <Button
                              disabled={!!actioningId}
                              onClick={() => handleDowngradeToFree(sub)}
                              size="sm"
                              className="bg-rose-600 hover:bg-rose-500 text-white h-7 px-2.5 rounded-lg text-2xs"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Downgrade
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EXTEND EXPIRY MODAL */}
      {extendingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setExtendingSub(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <Card className="relative w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-white text-md font-bold">Extend Subscription License</CardTitle>
              <CardDescription className="text-zinc-500 text-xs mt-1">
                Extend the current premium seat license duration for <strong>{extendingSub.profiles?.full_name}</strong>.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleExtendSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono text-zinc-500">Extension Period</label>
                <Select value={extendDays} onValueChange={(val) => { setExtendDays(val); setCustomExpiryDate(""); }}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs">
                    <SelectValue placeholder="Select Extension Period" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs">
                    <SelectItem value="7">Extend by 7 Days (1 week)</SelectItem>
                    <SelectItem value="30">Extend by 30 Days (1 month)</SelectItem>
                    <SelectItem value="90">Extend by 90 Days (3 months)</SelectItem>
                    <SelectItem value="365">Extend by 365 Days (1 year)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-900"></div>
                <span className="flex-shrink mx-4 text-zinc-500 text-[10px] font-mono">OR SPECIFY DATE</span>
                <div className="flex-grow border-t border-zinc-900"></div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono text-zinc-500">Custom Expiry Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    type="date"
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-300 text-xs h-10"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
                <Button type="button" onClick={() => setExtendingSub(null)} variant="outline" className="border-zinc-800 text-zinc-400">
                  Cancel
                </Button>
                <Button type="submit" disabled={!!actioningId} className="bg-purple-600 hover:bg-purple-500 text-white">
                  {actioningId ? "Updating DB..." : "Confirm Extension"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
