"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from "recharts";
import { Loader2, TrendingUp, RefreshCw, BarChart3, Users2, ShieldAlert, Award, Wallet } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    monthlyRev: [] as any[],
    userGrowth: [] as any[],
    subTrend: [] as any[],
    planDistribution: [] as any[],
    gatewayVolume: [] as any[]
  });

  const supabase = createClient();

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();

      // 1. Query approved payments for revenue & gateway volume
      const { data: payments } = await supabase
        .from("payment_requests")
        .select("*, subscription_plans(name, slug)")
        .eq("status", "approved");

      // 2. Query all active subscriptions for plan distribution
      const { data: subs } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(name, slug)");

      // 3. Query profiles for user growth
      const { data: profiles } = await supabase
        .from("profiles")
        .select("created_at");

      const approved = payments || [];
      const activeSubs = subs || [];
      const usersList = profiles || [];

      // A. Calculate payment gateway volumes
      const gateMap: Record<string, number> = {};
      approved.forEach((p) => {
        const method = (p.payment_method || "unknown").toUpperCase();
        gateMap[method] = (gateMap[method] || 0) + parseFloat(p.amount);
      });
      const gatewayVolume = Object.keys(gateMap).map((k) => ({
        name: k,
        volume: gateMap[k]
      }));

      // B. Calculate plan distribution
      const planMap: Record<string, number> = {};
      activeSubs.forEach((s) => {
        const planName = s.subscription_plans?.name || "FREE";
        planMap[planName] = (planMap[planName] || 0) + 1;
      });
      const planDistribution = Object.keys(planMap).map((k) => ({
        name: k,
        value: planMap[k]
      }));

      // C. Calculate monthly revenues (last 12 months)
      const monthlyMap: Record<string, number> = {};
      approved.forEach((p) => {
        const d = new Date(p.created_at);
        const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
        monthlyMap[label] = (monthlyMap[label] || 0) + parseFloat(p.amount);
      });

      // Sort monthly revenue chronologically
      const monthlyRev = Object.keys(monthlyMap)
        .map((k) => ({ month: k, revenue: monthlyMap[k] }))
        .sort((a, b) => {
          const [aM, aY] = a.month.split(" ");
          const [bM, bY] = b.month.split(" ");
          return new Date(`${aM} 1, ${aY}`).getTime() - new Date(`${bM} 1, ${bY}`).getTime();
        });

      // D. Calculate monthly user growth (last 12 months)
      const userGrowthMap: Record<string, number> = {};
      usersList.forEach((u) => {
        const d = new Date(u.created_at);
        const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
        userGrowthMap[label] = (userGrowthMap[label] || 0) + 1;
      });

      const userGrowth = Object.keys(userGrowthMap)
        .map((k) => ({ month: k, newUsers: userGrowthMap[k] }))
        .sort((a, b) => {
          const [aM, aY] = a.month.split(" ");
          const [bM, bY] = b.month.split(" ");
          return new Date(`${aM} 1, ${aY}`).getTime() - new Date(`${bM} 1, ${bY}`).getTime();
        });

      // E. Calculate monthly subscription activations trend
      const subTrendMap: Record<string, number> = {};
      activeSubs.forEach((s) => {
        const d = new Date(s.started_at);
        const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
        subTrendMap[label] = (subTrendMap[label] || 0) + 1;
      });

      const subTrend = Object.keys(subTrendMap)
        .map((k) => ({ month: k, activeSeats: subTrendMap[k] }))
        .sort((a, b) => {
          const [aM, aY] = a.month.split(" ");
          const [bM, bY] = b.month.split(" ");
          return new Date(`${aM} 1, ${aY}`).getTime() - new Date(`${bM} 1, ${bY}`).getTime();
        });

      setMetrics({
        monthlyRev,
        userGrowth,
        subTrend,
        planDistribution,
        gatewayVolume
      });
    } catch (e) {
      console.error("Error loading analytics data:", e);
    } finally {
      setLoading(false);
    }
  }

  const CHART_COLORS = ["#a855f7", "#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#ec4899"];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" /> Reconciliation Analytics
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Aggregated platform analytics, student registers growth, monthly licenses, and transaction channels.</p>
        </div>
        <Button onClick={loadAnalytics} variant="outline" size="sm" className="border-zinc-800 text-zinc-300 h-8">
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh Charts
        </Button>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Revenue Timeline (AreaChart) */}
          <Card className="bg-zinc-900/10 border-zinc-900/80 shadow-xl rounded-2xl p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-white text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Revenue Growth Trend
              </CardTitle>
              <CardDescription className="text-zinc-500 text-[10px]">Historical monthly gross revenue collections in BDT.</CardDescription>
            </CardHeader>
            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.monthlyRev}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", color: "#fff", fontSize: 11 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 2: Student Growth (BarChart) */}
          <Card className="bg-zinc-900/10 border-zinc-900/80 shadow-xl rounded-2xl p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-white text-sm font-bold flex items-center gap-2">
                <Users2 className="w-4 h-4 text-purple-400" /> User Registration Growth
              </CardTitle>
              <CardDescription className="text-zinc-500 text-[10px]">Total number of new student registrations per calendar month.</CardDescription>
            </CardHeader>
            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", color: "#fff", fontSize: 11 }} />
                  <Bar dataKey="newUsers" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 3: Subscriptions Activations (LineChart) */}
          <Card className="bg-zinc-900/10 border-zinc-900/80 shadow-xl rounded-2xl p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-white text-sm font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" /> Monthly Subscriptions Activated
              </CardTitle>
              <CardDescription className="text-zinc-500 text-[10px]">Licensing seat activation timeline history logs.</CardDescription>
            </CardHeader>
            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.subTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", color: "#fff", fontSize: 11 }} />
                  <Line type="monotone" dataKey="activeSeats" stroke="#6366f1" strokeWidth={2} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 4: Subscription Distribution (PieChart) */}
          <Card className="bg-zinc-900/10 border-zinc-900/80 shadow-xl rounded-2xl p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-white text-sm font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" /> Subscription Plan Distribution
              </CardTitle>
              <CardDescription className="text-zinc-500 text-[10px]">Share breakdown of current active member licenses.</CardDescription>
            </CardHeader>
            <CardContent className="h-64 p-0 mt-2 flex flex-col md:flex-row items-center justify-around">
              {metrics.planDistribution.length === 0 ? (
                <div className="text-zinc-500 text-xs">No distribution data found.</div>
              ) : (
                <>
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.planDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {metrics.planDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", color: "#fff", fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-2xs">
                    {metrics.planDistribution.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span className="text-zinc-400 font-semibold uppercase">{item.name}:</span>
                        <span className="font-bold text-white">{item.value} seats</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Chart 5: Gateway BDT Volumes (BarChart) */}
          <Card className="bg-zinc-900/10 border-zinc-900/80 shadow-xl rounded-2xl p-6 col-span-1 lg:col-span-2">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-white text-sm font-bold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-500" /> Payment Methods Distribution
              </CardTitle>
              <CardDescription className="text-zinc-500 text-[10px]">Aggregated transaction volume (BDT) processed across transaction gateways.</CardDescription>
            </CardHeader>
            <div className="h-64 mt-2">
              {metrics.gatewayVolume.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500 text-xs">No transaction records found.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.gatewayVolume} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                    <XAxis type="number" stroke="#71717a" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={10} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", color: "#fff", fontSize: 11 }} />
                    <Bar dataKey="volume" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
