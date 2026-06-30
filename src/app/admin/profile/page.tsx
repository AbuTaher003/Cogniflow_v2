"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { Loader2, User, Mail, Shield, ShieldAlert, Award, Clock, RefreshCw } from "lucide-react";

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [adminStats, setAdminStats] = useState({
    approvals: 0,
    rejections: 0
  });
  const [recentActions, setRecentActions] = useState<any[]>([]);

  // Settings form state
  const [fullName, setFullName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadAdminProfile();
  }, []);

  async function loadAdminProfile() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch admin profile data
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setAdminProfile(profile);
      setFullName(profile.full_name || "");
      setTimezone(profile.timezone || "UTC");

      // 2. Fetch admin stats (approvals vs rejections)
      const { count: approvalsCount } = await supabase
        .from("payment_transactions")
        .select("id", { count: "exact", head: true })
        .eq("approved_by", user.id)
        .eq("status", "approved");

      const { count: rejectionsCount } = await supabase
        .from("payment_transactions")
        .select("id", { count: "exact", head: true })
        .eq("approved_by", user.id)
        .eq("status", "rejected");

      setAdminStats({
        approvals: approvalsCount || 0,
        rejections: rejectionsCount || 0
      });

      // 3. Fetch recent administrative actions
      const { data: recTx } = await supabase
        .from("payment_transactions")
        .select("*, payment_requests(*, profiles(*))")
        .eq("approved_by", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentActions(recTx || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load admin profile.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!adminProfile) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          timezone,
          updated_at: new Date().toISOString()
        })
        .eq("id", adminProfile.id);

      if (error) throw error;

      toast.success("Settings updated successfully.");
      await loadAdminProfile();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to save settings.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
        <p className="text-xs font-medium animate-pulse text-zinc-500">Loading admin profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" /> Admin Profile Settings
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Review active role statistics, audit personal processing metrics, and adjust profile parameters.</p>
        </div>
        <Button onClick={loadAdminProfile} variant="outline" size="sm" className="border-zinc-800 text-zinc-300 h-8">
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card & Stats (Left) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card: Profile Summary */}
          <Card className="bg-zinc-900/10 border-zinc-900/80 rounded-2xl shadow-xl p-6 text-center">
            <div className="h-16 w-16 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center font-bold text-2xl text-purple-400 mx-auto mb-4">
              {fullName ? fullName.charAt(0).toUpperCase() : "A"}
            </div>
            <h3 className="text-sm font-bold text-white leading-none">{fullName || "Super Administrator"}</h3>
            <p className="text-2xs text-zinc-500 font-mono mt-1.5 flex items-center justify-center gap-1">
              <Mail className="w-3 h-3 text-zinc-600" /> {adminProfile?.email}
            </p>

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full uppercase font-mono font-bold tracking-wider">
                Role: Super Admin
              </span>
            </div>
          </Card>

          {/* Card: personal Stats */}
          <Card className="bg-zinc-900/10 border-zinc-900/80 rounded-2xl shadow-xl p-6">
            <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" /> Audit Log Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-xl text-center">
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wide block">Approvals</span>
                <span className="text-xl font-black text-white mt-1 block">{adminStats.approvals}</span>
              </div>
              <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-xl text-center">
                <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wide block">Rejections</span>
                <span className="text-xl font-black text-white mt-1 block">{adminStats.rejections}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Configuration settings & activities (Right) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Account Configuration */}
          <Card className="bg-zinc-900/10 border-zinc-900/80 rounded-2xl shadow-xl p-6">
            <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" /> Account Settings
            </h3>
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono text-zinc-500">Super Admin Email</label>
                <Input
                  value={adminProfile?.email}
                  disabled
                  className="bg-zinc-950 border-zinc-900 text-zinc-500 text-xs h-10 select-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono text-zinc-500">Admin Display Name</label>
                <Input
                  placeholder="Enter admin display name..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-zinc-950 border-zinc-900 focus:border-zinc-800 text-zinc-300 text-xs h-10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono text-zinc-500">System Timezone</label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs h-10">
                    <SelectValue placeholder="System Timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Asia/Dhaka">Asia/Dhaka</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={submitting} className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs h-10 px-4 rounded-xl transition-all">
                  {submitting ? "Saving changes..." : "Save settings"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Card: Recent Actions Timeline */}
          <Card className="bg-zinc-900/10 border-zinc-900/80 rounded-2xl shadow-xl p-6">
            <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" /> Recent Actions Logs
            </h3>
            <div className="space-y-4 text-xs">
              {recentActions.length === 0 ? (
                <div className="text-zinc-500 text-center py-4">You have not processed any transactions recently.</div>
              ) : (
                recentActions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-zinc-200">
                        {tx.status === "approved" ? "Approved payment" : "Rejected payment"} for ৳{tx.payment_requests?.amount}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1 font-semibold block uppercase text-purple-400">
                        Subscriber: {tx.payment_requests?.profiles?.full_name || tx.payment_requests?.profiles?.email || "Student"}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1.5 italic">Remarks: "{tx.notes}"</p>
                    </div>
                    <span className="text-zinc-500 font-mono text-[10px]">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
