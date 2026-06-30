"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { Loader2, Users, Search, RefreshCw, Eye, Calendar, Sparkles, Shield, User, FileText, ClipboardList, Clock, CheckCircle2, X, Wallet } from "lucide-react";

interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
  xp: number;
  level: number;
  last_sign_in_at: string | null;
  plan_name: string;
  plan_slug: string;
  subscription_status: string;
  expires_at: string | null;
}

interface UserActivityPayload {
  focus_sessions: Array<{
    id: string;
    session_type: string;
    duration_minutes: number;
    score: number;
    completed_at: string;
    created_at: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    created_at: string;
  }>;
  notes: Array<{
    id: string;
    title: string;
    format: string;
    created_at: string;
    updated_at: string;
  }>;
  resumes: Array<{
    id: string;
    title: string;
    template: string;
    created_at: string;
  }>;
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // User details modal state
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [userDetails, setUserDetails] = useState<{
    profile: any;
    payments: any[];
    subHistory: any[];
    activities: UserActivityPayload;
  } | null>(null);

  const supabase = createClient();

  // Search filter query parameter (if redirecting from search)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const search = params.get("search");
      if (search) {
        setSearchQuery(search);
      }
    }
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_admin_users");
      if (error) throw error;
      setUsers(data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load user directory.");
    } finally {
      setLoading(false);
    }
  }

  async function loadUserDetails(user: AdminUserRow) {
    setSelectedUser(user);
    setLoadingDetails(true);
    setUserDetails(null);
    try {
      // 1. Query full profile details
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // 2. Query user payment requests
      const { data: payments } = await supabase
        .from("payment_requests")
        .select("*, subscription_plans(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // 3. Query user subscription logs
      const { data: subHistory } = await supabase
        .from("subscription_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // 4. Query user tasks, notes, sessions, resumes via RPC helper (bypasses core RLS)
      const { data: activities } = await supabase.rpc("get_user_activities", {
        target_user_id: user.id
      });

      setUserDetails({
        profile: profile || {},
        payments: payments || [],
        subHistory: subHistory || [],
        activities: activities || { focus_sessions: [], tasks: [], notes: [], resumes: [] }
      });
    } catch (e) {
      console.error("Error loading user profile metadata details:", e);
      toast.error("Failed to load detailed profile logs.");
    } finally {
      setLoadingDetails(false);
    }
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlan = planFilter === "all" || u.plan_slug === planFilter;
    const matchesStatus = statusFilter === "all" || u.subscription_status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" /> User Directory
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Roster of all registered student accounts, role assignments, and active payment statuses.</p>
        </div>
        <Button onClick={loadUsers} variant="outline" size="sm" className="border-zinc-800 text-zinc-300 h-8">
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh Directory
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900/10 border-zinc-900/80 p-4 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search user profile records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-950 border-zinc-900 focus:border-zinc-800 text-zinc-300 text-xs h-9"
            />
          </div>

          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs h-9">
              <SelectValue placeholder="Subscription Plan" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free">FREE</SelectItem>
              <SelectItem value="pro">PRO</SelectItem>
              <SelectItem value="elite">ELITE</SelectItem>
              <SelectItem value="premium">PREMIUM</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs h-9">
              <SelectValue placeholder="Subscription Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* User Table */}
      <Card className="bg-zinc-900/10 border-zinc-900/80 overflow-hidden shadow-xl rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs">
              No matching user profile records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/40 text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Current Plan</th>
                    <th className="p-4">Sub Status</th>
                    <th className="p-4">Join Date</th>
                    <th className="p-4">Last Activity</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-900/20 text-zinc-300 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-purple-400">
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-200">{u.full_name || "New Student"}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{u.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          u.role === "admin"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-zinc-300 uppercase">
                        {u.plan_name}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          u.subscription_status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {u.subscription_status}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-zinc-500">
                        {u.last_sign_in_at ? (
                          <>
                            {new Date(u.last_sign_in_at).toLocaleDateString()} {new Date(u.last_sign_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </>
                        ) : (
                          "Never logged in"
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          onClick={() => loadUserDetails(u)}
                          size="sm"
                          variant="outline"
                          className="border-zinc-800 text-zinc-400 hover:text-white h-7 px-2.5 rounded-lg text-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* USER DETAILS SLIDE DRAWER / MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div onClick={() => setSelectedUser(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <Card className="relative w-full max-w-2xl h-screen bg-zinc-950 border-l border-zinc-900 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between rounded-none animate-in slide-in-from-right duration-250">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start pb-4 mb-6 border-b border-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center font-bold text-lg text-purple-400">
                    {selectedUser.full_name ? selectedUser.full_name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-none">{selectedUser.full_name || "New Student"}</h3>
                    <p className="text-xs text-zinc-500 mt-1.5">{selectedUser.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="text-zinc-500 hover:text-white hover:bg-zinc-900 h-8 w-8 p-0 rounded-full">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {loadingDetails ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : userDetails ? (
                <div className="space-y-6">
                  {/* Grid 1: Basic Profile Details */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-zinc-900/10 p-4 border border-zinc-900 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block">Level / XP</span>
                      <span className="font-semibold text-zinc-200 mt-0.5 block">Level {userDetails.profile.level || 1} ({userDetails.profile.xp || 0} XP)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block">University</span>
                      <span className="font-semibold text-zinc-200 mt-0.5 block">{userDetails.profile.university || "Not configured"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block">Target CGPA</span>
                      <span className="font-semibold text-zinc-200 mt-0.5 block">{userDetails.profile.target_cgpa || "Not configured"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block">Joined</span>
                      <span className="font-semibold text-zinc-200 mt-0.5 block">{new Date(userDetails.profile.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block">Timezone</span>
                      <span className="font-semibold text-zinc-200 mt-0.5 block">{userDetails.profile.timezone || "UTC"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block">Onboarded</span>
                      <span className="font-semibold text-zinc-200 mt-0.5 block">{userDetails.profile.onboarding_completed ? "Completed" : "Pending"}</span>
                    </div>
                  </div>

                  {/* Section 2: Platform Activities Counts */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Platform Usage & Activities
                    </h4>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-zinc-900/20 border border-zinc-900/60 rounded-xl">
                        <ClipboardList className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                        <span className="text-[9px] text-zinc-500 block leading-tight">Tasks</span>
                        <span className="text-sm font-black text-white mt-1 block">{userDetails.activities.tasks?.length || 0}</span>
                      </div>
                      <div className="p-3 bg-zinc-900/20 border border-zinc-900/60 rounded-xl">
                        <FileText className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                        <span className="text-[9px] text-zinc-500 block leading-tight">Notes</span>
                        <span className="text-sm font-black text-white mt-1 block">{userDetails.activities.notes?.length || 0}</span>
                      </div>
                      <div className="p-3 bg-zinc-900/20 border border-zinc-900/60 rounded-xl">
                        <Clock className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <span className="text-[9px] text-zinc-500 block leading-tight">Sessions</span>
                        <span className="text-sm font-black text-white mt-1 block">{userDetails.activities.focus_sessions?.length || 0}</span>
                      </div>
                      <div className="p-3 bg-zinc-900/20 border border-zinc-900/60 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                        <span className="text-[9px] text-zinc-500 block leading-tight">Resumes</span>
                        <span className="text-sm font-black text-white mt-1 block">{userDetails.activities.resumes?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Subscriptions Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-400" /> Subscription Licenses Log
                    </h4>
                    <div className="border border-zinc-900 rounded-xl overflow-hidden text-[10px] divide-y divide-zinc-900">
                      {userDetails.subHistory.length === 0 ? (
                        <div className="p-4 text-zinc-500 text-center">No license log history recorded.</div>
                      ) : (
                        userDetails.subHistory.map((h) => (
                          <div key={h.id} className="p-3 flex justify-between items-start bg-zinc-950/20">
                            <div>
                              <p className="font-semibold text-zinc-200 capitalize">{h.action} - <span className="text-purple-400">{h.current_plan ? h.current_plan.toUpperCase() : "FREE"}</span></p>
                              <p className="text-[9px] text-zinc-500 mt-1 italic">"{h.notes || "System update log."}"</p>
                            </div>
                            <span className="text-zinc-500 font-mono">{new Date(h.created_at).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Section 4: Payments history */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Payments History
                    </h4>
                    <div className="border border-zinc-900 rounded-xl overflow-hidden text-[10px] divide-y divide-zinc-900">
                      {userDetails.payments.length === 0 ? (
                        <div className="p-4 text-zinc-500 text-center">No payment transactions found.</div>
                      ) : (
                        userDetails.payments.map((p) => (
                          <div key={p.id} className="p-3 flex justify-between items-center bg-zinc-950/20">
                            <div>
                              <p className="font-semibold text-zinc-200">৳{p.amount} for <span className="text-purple-400 uppercase">{p.subscription_plans?.name || "Pro"}</span></p>
                              <p className="text-[9px] text-zinc-500 mt-0.5">Method: {p.payment_method} | TransID: {p.transaction_id}</p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                p.status === "approved"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : p.status === "pending"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}>
                                {p.status}
                              </span>
                              <p className="text-zinc-500 font-mono mt-1 text-[8px]">{new Date(p.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-4 border-t border-zinc-900 mt-6 flex justify-end">
              <Button onClick={() => setSelectedUser(null)} variant="outline" className="border-zinc-800 text-zinc-400">
                Close User Profile
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
