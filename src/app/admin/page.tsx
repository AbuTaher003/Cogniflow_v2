"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Wallet,
  Users,
  ShieldCheck,
  ArrowRight,
  Clock,
  Loader2,
  Calendar,
  DollarSign,
  Activity,
  PlusCircle,
  FileText,
  MessageSquare,
  ClipboardList
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardMetrics {
  total_revenue: number;
  monthly_revenue: number;
  daily_revenue: number;
  pending_revenue: number;
  revenue_growth_pct: number;
  revenue_by_plan: Record<string, number>;
  total_users: number;
  active_users: number;
  free_users: number;
  pro_users: number;
  elite_users: number;
  premium_users: number;
  total_subscriptions: number;
  expired_subscriptions: number;
  total_payments: number;
  pending_payments: number;
  approved_payments: number;
  rejected_payments: number;
  total_tasks: number;
  total_notes: number;
  total_sessions: number;
  total_resumes: number;
  total_ai_requests: number;
}

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardMetrics>({
    total_revenue: 0,
    monthly_revenue: 0,
    daily_revenue: 0,
    pending_revenue: 0,
    revenue_growth_pct: 0,
    revenue_by_plan: {},
    total_users: 0,
    active_users: 0,
    free_users: 0,
    pro_users: 0,
    elite_users: 0,
    premium_users: 0,
    total_subscriptions: 0,
    expired_subscriptions: 0,
    total_payments: 0,
    pending_payments: 0,
    approved_payments: 0,
    rejected_payments: 0,
    total_tasks: 0,
    total_notes: 0,
    total_sessions: 0,
    total_resumes: 0,
    total_ai_requests: 0
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    loadOverviewData();
  }, []);

  async function loadOverviewData() {
    setLoading(true);
    try {
      // 1. Fetch aggregated admin metrics from RPC helper
      const { data: metricsData, error: metricsErr } = await supabase.rpc("get_admin_dashboard_metrics");
      if (metricsErr) throw metricsErr;

      // 2. Fetch recent payment requests
      const { data: recPayments } = await supabase
        .from("payment_requests")
        .select("*, profiles(full_name, email), subscription_plans(name)")
        .order("created_at", { ascending: false })
        .limit(5);

      // 3. Fetch audit logs (recent subscription history)
      const { data: logs } = await supabase
        .from("subscription_history")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(5);

      if (metricsData) {
        setStats(metricsData);
      }
      setRecentPayments(recPayments || []);
      setRecentLogs(logs || []);
    } catch (e) {
      console.error("Error loading admin overview stats:", e);
    } finally {
      setLoading(false);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
        <p className="text-xs font-medium animate-pulse text-zinc-500">Loading system metrics...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Title */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Super Admin Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-1">Real-time health, cashflow reconciliation, and active student pipelines audit.</p>
        </div>
        <Button onClick={loadOverviewData} variant="outline" size="sm" className="border-zinc-800/80 bg-zinc-900/30 text-zinc-300 hover:text-white text-xs h-8">
          Refresh Overview
        </Button>
      </div>

      {/* Main KPI Grid - Revenue & Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/20 backdrop-blur-md border-zinc-800/80 hover:border-zinc-700/60 shadow-xl transition-all rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign className="w-16 h-16 text-emerald-400" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Revenue</CardDescription>
              <CardTitle className="text-2xl font-black text-emerald-400 mt-1">৳{stats.total_revenue.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col gap-1">
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> 
                {stats.revenue_growth_pct > 0 ? `+${stats.revenue_growth_pct.toFixed(1)}%` : `${stats.revenue_growth_pct.toFixed(1)}%`} month-over-month
              </span>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Revenue */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/20 backdrop-blur-md border-zinc-800/80 hover:border-zinc-700/60 shadow-xl transition-all rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Calendar className="w-16 h-16 text-indigo-400" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Monthly Sales</CardDescription>
              <CardTitle className="text-2xl font-black text-indigo-400 mt-1">৳{stats.monthly_revenue.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-[10px] text-zinc-500">Current calendar month sales BDT</span>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Revenue */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/20 backdrop-blur-md border-zinc-800/80 hover:border-zinc-700/60 shadow-xl transition-all rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Wallet className="w-16 h-16 text-amber-500" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pending Collections</CardDescription>
              <CardTitle className="text-2xl font-black text-amber-500 mt-1">৳{stats.pending_revenue.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-[10px] text-zinc-500">Reconciliation value in checkout pipeline</span>
            </CardContent>
          </Card>
        </motion.div>

        {/* Users & Activity */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/20 backdrop-blur-md border-zinc-800/80 hover:border-zinc-700/60 shadow-xl transition-all rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users className="w-16 h-16 text-purple-400" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active / Total Users</CardDescription>
              <CardTitle className="text-2xl font-black text-purple-400 mt-1">
                {stats.active_users} <span className="text-zinc-500 font-normal text-sm">/ {stats.total_users}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-[10px] text-zinc-500">Active users within the last 30 days</span>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* User Tiers & Payment Status Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Account Tiers Split */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/10 border-zinc-900/80 rounded-2xl shadow-lg p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Subscriber Seat Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-xl">
                <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold">FREE TIER</span>
                <p className="text-lg font-bold text-zinc-300 mt-1">{stats.free_users}</p>
              </div>
              <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-xl">
                <span className="text-[10px] text-purple-400 uppercase font-mono font-bold">PRO SEATS</span>
                <p className="text-lg font-bold text-white mt-1">{stats.pro_users}</p>
              </div>
              <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-xl">
                <span className="text-[10px] text-indigo-400 uppercase font-mono font-bold">ELITE SEATS</span>
                <p className="text-lg font-bold text-white mt-1">{stats.elite_users}</p>
              </div>
              <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-xl">
                <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold">PREMIUM</span>
                <p className="text-lg font-bold text-white mt-1">{stats.premium_users}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Card: Payment Request Split */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/10 border-zinc-900/80 rounded-2xl shadow-lg p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" /> Checkout Transactions Split
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-xl">
                <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold">TOTAL ACTIONS</span>
                <p className="text-lg font-bold text-zinc-300 mt-1">{stats.total_payments}</p>
              </div>
              <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-xl">
                <span className="text-[10px] text-amber-500 uppercase font-mono font-bold">PENDING</span>
                <p className="text-lg font-bold text-white mt-1">{stats.pending_payments}</p>
              </div>
              <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-xl">
                <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold">APPROVED</span>
                <p className="text-lg font-bold text-white mt-1">{stats.approved_payments}</p>
              </div>
              <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-xl">
                <span className="text-[10px] text-rose-500 uppercase font-mono font-bold">REJECTED</span>
                <p className="text-lg font-bold text-white mt-1">{stats.rejected_payments}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Platform Activity Metrics */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/10 border-zinc-900/80 rounded-2xl shadow-lg p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" /> Aggregated Platform Entitlements & Features Usage
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="p-4 bg-zinc-950/30 border border-zinc-900/50 rounded-xl flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-500 block leading-tight">Total Tasks</span>
                <span className="text-lg font-black text-zinc-200 mt-1">{stats.total_tasks}</span>
              </div>
            </div>
            <div className="p-4 bg-zinc-950/30 border border-zinc-900/50 rounded-xl flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-500 block leading-tight">Total Notes</span>
                <span className="text-lg font-black text-zinc-200 mt-1">{stats.total_notes}</span>
              </div>
            </div>
            <div className="p-4 bg-zinc-950/30 border border-zinc-900/50 rounded-xl flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-500 block leading-tight">Focus Sessions</span>
                <span className="text-lg font-black text-zinc-200 mt-1">{stats.total_sessions}</span>
              </div>
            </div>
            <div className="p-4 bg-zinc-950/30 border border-zinc-900/50 rounded-xl flex items-center gap-3">
              <PlusCircle className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-500 block leading-tight">Resumes Built</span>
                <span className="text-lg font-black text-zinc-200 mt-1">{stats.total_resumes}</span>
              </div>
            </div>
            <div className="p-4 bg-zinc-950/30 border border-zinc-900/50 rounded-xl flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-500 block leading-tight">AI Requests</span>
                <span className="text-lg font-black text-zinc-200 mt-1">{stats.total_ai_requests}</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Main Grid: Recent Payments & Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Approval Queue Snippet */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-purple-400" /> Recent Payment Submissions
            </h3>
            <Link href="/admin/payments" className="text-xs text-purple-400 hover:underline flex items-center gap-1 font-semibold">
              Payments queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="bg-zinc-900/10 border-zinc-900/80 overflow-hidden rounded-xl shadow-xl">
            <CardContent className="p-0 divide-y divide-zinc-900">
              {recentPayments.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No payment submissions found.
                </div>
              ) : (
                recentPayments.map((pay) => (
                  <div key={pay.id} className="p-4 flex items-center justify-between text-xs hover:bg-zinc-900/20 transition-all">
                    <div>
                      <p className="font-semibold text-zinc-200">{pay.profiles?.full_name || "Unknown User"}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{pay.profiles?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-zinc-200">৳{pay.amount} <span className="text-[10px] text-zinc-500 font-normal">({pay.subscription_plans?.name || "Pro"})</span></p>
                      <span className={`inline-block text-[9px] mt-1 px-2 py-0.5 rounded-full font-bold uppercase ${pay.status === "pending"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : pay.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                        {pay.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Column 2: Audit Logs / Subscription History Snippet */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" /> Recent Security & Sub Timeline
            </h3>
            <Link href="/admin/audit-logs" className="text-xs text-purple-400 hover:underline flex items-center gap-1 font-semibold">
              System Audit <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="bg-zinc-900/10 border-zinc-900/80 overflow-hidden rounded-xl shadow-xl">
            <CardContent className="p-0 divide-y divide-zinc-900">
              {recentLogs.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No system timeline activities registered.
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="p-4 text-xs hover:bg-zinc-900/20 transition-all">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-zinc-300">
                        {log.profiles?.full_name || "System Trigger"}
                      </p>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-[10px] mt-1.5 leading-relaxed bg-zinc-950/30 p-2 rounded-lg border border-zinc-900/40">
                      {log.notes || `Plan transition to ${upper(log.current_plan || "free")}`}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function upper(str: string) {
  if (!str) return "";
  return str.toUpperCase();
}
