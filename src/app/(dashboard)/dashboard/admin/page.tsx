"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Users, Calendar, Megaphone, HelpCircle,
  TrendingUp, Settings, Plus, Send, BadgeAlert, BarChart3,
  Award, Trash2, Check, Lock, ShieldCheck, Mail
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "creator" | "admin";
  xp: number;
  level: number;
}

interface Feedback {
  id: string;
  user_id: string;
  feedback_type: "feedback" | "bug" | "feature";
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  admin_response?: string;
  created_at: string;
  profiles?: Profile;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: "update" | "maintenance" | "release" | "announcement";
  pinned: boolean;
  published: boolean;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState("analytics");

  // Admin Data States
  const [users, setUsers] = useState<Profile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  // Form States
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");
  const [newAnnCategory, setNewAnnCategory] = useState<any>("update");
  const [newAnnPinned, setNewAnnPinned] = useState(false);

  const [feedbackReply, setFeedbackReply] = useState<Record<string, string>>({});

  const supabase = createClient();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setCurrentProfile(profile);
      if (profile?.role === "admin") {
        setIsAdmin(true);
        await loadAdminData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimAdminAccess() {
    if (!currentProfile) return;
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", currentProfile.id)
      .select()
      .single();

    if (data) {
      setCurrentProfile(data);
      setIsAdmin(true);
      await loadAdminData();
    }
    setLoading(false);
  }

  async function loadAdminData() {
    const { data: usersData } = await supabase.from("profiles").select("*");
    const { data: annData } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    const { data: fbData } = await supabase.from("feedback").select("*, profiles:profiles(full_name, email)").order("created_at", { ascending: false });

    setUsers(usersData || []);
    setAnnouncements(annData || []);
    setFeedbacks(fbData || []);
  }

  async function handleCreateAnnouncement() {
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("announcements").insert({
      author_id: user?.id,
      title: newAnnTitle,
      content: newAnnContent,
      category: newAnnCategory,
      pinned: newAnnPinned,
      published: true
    });

    if (!error) {
      setNewAnnTitle("");
      setNewAnnContent("");
      setNewAnnPinned(false);
      // Reload announcements
      const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      setAnnouncements(data || []);
      alert("Announcement published successfully!");
    } else {
      alert("Error publishing announcement.");
    }
    setLoading(false);
  }

  async function handleDeleteAnnouncement(id: string) {
    if (!confirm("Delete this announcement?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }

  async function handleFeedbackReply(fbId: string) {
    const reply = feedbackReply[fbId];
    if (!reply || !reply.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from("feedback")
      .update({
        admin_response: reply,
        status: "resolved",
        updated_at: new Date().toISOString()
      })
      .eq("id", fbId);

    if (!error) {
      setFeedbackReply(prev => ({ ...prev, [fbId]: "" }));
      // Reload feedback
      const { data } = await supabase.from("feedback").select("*, profiles:profiles(full_name, email)").order("created_at", { ascending: false });
      setFeedbacks(data || []);
      alert("Reply sent and feedback marked as Resolved!");
    }
    setLoading(false);
  }

  async function handleUpdateUserRole(userId: string, newRole: "student" | "creator" | "admin") {
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    alert("User role updated!");
  }

  // Visual analytics mocked representations
  const userGrowthData = useMemo(() => [
    { name: "Jan", users: 120 },
    { name: "Feb", users: 240 },
    { name: "Mar", users: 480 },
    { name: "Apr", users: 650 },
    { name: "May", users: 920 },
    { name: "Jun", users: users.length * 10 + 20 }
  ], [users.length]);

  const planPieData = useMemo(() => [
    { name: "Free Sandbox", value: Math.max(1, users.length - 2), color: "#3B82F6" },
    { name: "Pro Plan", value: 4, color: "#06B6D4" },
    { name: "Elite Premium", value: 2, color: "#D946EF" }
  ], [users.length]);

  if (loading && !isAdmin) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md max-w-xl mx-auto my-12">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg text-white font-bold">Access Gated</CardTitle>
          <CardDescription className="text-xs text-slate-400 mt-1">
            This module is reserved for administrators to monitor platform health.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 border-t border-white/5">
          <p className="text-xs text-slate-400 text-center mb-6">
            For local evaluation and QA testing, you can click below to grant admin status to your profile role.
          </p>
          <Button onClick={handleClaimAdminAccess} variant="primary" className="w-full">
            <ShieldCheck className="h-4 w-4 mr-2" /> Grant Admin Permissions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-rose-400" />
            Admin Panel
          </h1>
          <p className="text-slate-400">Manage students, system announcements, feedback tickets, and usage statistics.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-slate-950/80 p-2 lg:col-span-1 h-fit">
          <button onClick={() => setActiveTab("analytics")} className={`w-full text-left rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition ${activeTab === "analytics" ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
            <BarChart3 className="h-4 w-4 text-cyan-400" /> Platform Metrics
          </button>
          <button onClick={() => setActiveTab("users")} className={`w-full text-left rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition ${activeTab === "users" ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
            <Users className="h-4 w-4 text-fuchsia-400" /> User Management
          </button>
          <button onClick={() => setActiveTab("announcements")} className={`w-full text-left rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition ${activeTab === "announcements" ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
            <Megaphone className="h-4 w-4 text-amber-400" /> Announcements
          </button>
          <button onClick={() => setActiveTab("feedback")} className={`w-full text-left rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition ${activeTab === "feedback" ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
            <HelpCircle className="h-4 w-4 text-rose-400" /> Feedback Tickets
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* ANALYTICS TAB */}
          {activeTab === "analytics" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Metric Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] uppercase font-bold text-slate-400">Total Registered Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{users.length}</div>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" /> +18% from last week
                    </span>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] uppercase font-bold text-slate-400">Total Feedback Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{feedbacks.length}</div>
                    <span className="text-[10px] text-slate-500 block mt-1">Open: {feedbacks.filter(f => f.status === "open").length}</span>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] uppercase font-bold text-slate-400">Avg Student Level</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {(users.reduce((acc, u) => acc + (u.level || 1), 0) / Math.max(1, users.length)).toFixed(1)}
                    </div>
                    <span className="text-[10px] text-fuchsia-400 flex items-center gap-1 mt-1">
                      <Award className="h-3 w-3" /> Peak XP: {Math.max(...users.map(u => u.xp || 0), 0)}
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Recharts Plots */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-white/10 bg-white/5 p-4 shadow-glow backdrop-blur-md">
                  <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">User Growth Trend</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={userGrowthData}>
                        <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                        <YAxis stroke="#64748B" fontSize={10} />
                        <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                        <Line type="monotone" dataKey="users" stroke="#06B6D4" strokeWidth={2} dot={{ fill: "#06B6D4" }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="border-white/10 bg-white/5 p-4 shadow-glow backdrop-blur-md">
                  <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Subscription Plan Share</h3>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={planPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" isAnimationActive={false}>
                          {planPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-white">Registered Users</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="pb-3 font-semibold">Name</th>
                        <th className="pb-3 font-semibold">Email</th>
                        <th className="pb-3 font-semibold">XP (Level)</th>
                        <th className="pb-3 font-semibold text-right">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 font-semibold text-white">{u.full_name || "Anonymous User"}</td>
                          <td className="py-3">{u.email}</td>
                          <td className="py-3">{u.xp || 0} XP (Lvl {u.level || 1})</td>
                          <td className="py-3 text-right">
                            <select
                              value={u.role || "student"}
                              onChange={e => handleUpdateUserRole(u.id, e.target.value as any)}
                              className="rounded bg-slate-950 border border-white/10 px-2 py-1 text-slate-300 text-xs font-semibold focus:outline-none"
                            >
                              <option value="student">Student</option>
                              <option value="creator">Creator</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ANNOUNCEMENTS TAB */}
          {activeTab === "announcements" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Creator Form */}
              <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-white">Create Announcement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase">Title</label>
                      <Input placeholder="System Updates..." value={newAnnTitle} onChange={e => setNewAnnTitle(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase">Category</label>
                      <Select value={newAnnCategory} onValueChange={setNewAnnCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="update">Platform Update</SelectItem>
                          <SelectItem value="release">New Feature Release</SelectItem>
                          <SelectItem value="maintenance">Maintenance Alert</SelectItem>
                          <SelectItem value="announcement">General Announcement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Announcement Body</label>
                    <textarea
                      className="w-full min-h-[100px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
                      placeholder="Write description content here..."
                      value={newAnnContent}
                      onChange={e => setNewAnnContent(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={newAnnPinned} onChange={e => setNewAnnPinned(e.target.checked)} id="pin-chk" className="rounded" />
                    <label htmlFor="pin-chk" className="text-xs text-slate-400">Pin Announcement to dashboard feed</label>
                  </div>
                  <Button onClick={handleCreateAnnouncement} variant="primary" disabled={loading} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Publish Announcement
                  </Button>
                </CardContent>
              </Card>

              {/* Feed manager list */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Active Announcements</h3>
                {announcements.map(ann => (
                  <Card key={ann.id} className="border-white/10 bg-white/5 p-4 shadow-glow backdrop-blur-md">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{ann.title}</span>
                          <Badge variant="outline" className="text-[8px] uppercase">{ann.category}</Badge>
                          {ann.pinned && <Badge variant="outline" className="text-[8px] uppercase bg-amber-500/10 text-amber-400">Pinned</Badge>}
                        </div>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                        <span className="text-[10px] text-slate-500 mt-2 block">{new Date(ann.created_at).toLocaleDateString()}</span>
                      </div>
                      <Button onClick={() => handleDeleteAnnouncement(ann.id)} variant="ghost" size="sm" className="text-rose-400 hover:text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* FEEDBACK TAB */}
          {activeTab === "feedback" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-sm font-semibold text-white">Active Feedback Tickets</h2>
              {feedbacks.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No feedback requests logged.
                </div>
              ) : (
                feedbacks.map(fb => (
                  <Card key={fb.id} className="border-white/10 bg-white/5 p-4 shadow-glow backdrop-blur-md space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-white">{fb.title}</span>
                          <Badge className="text-[8px] uppercase bg-violet-500/10 text-violet-400 border-violet-500/10">{fb.feedback_type}</Badge>
                          <Badge className={`text-[8px] uppercase ${fb.status === "resolved" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/10" : "bg-rose-500/15 text-rose-400 border-rose-500/10"}`}>{fb.status}</Badge>
                          <Badge className="text-[8px] uppercase bg-slate-500/10 text-slate-400 border-white/5">{fb.priority} priority</Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{fb.description}</p>
                        <div className="flex gap-2 text-[10px] text-slate-500 mt-2">
                          <span>By: {fb.profiles?.full_name || "Student"} ({fb.profiles?.email})</span>
                          <span>•</span>
                          <span>{new Date(fb.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {fb.admin_response ? (
                      <div className="p-3 rounded-xl bg-slate-950/40 border border-emerald-500/10 text-xs space-y-1">
                        <span className="font-semibold text-emerald-400 block">Admin Response:</span>
                        <p className="text-slate-300 italic">{fb.admin_response}</p>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <Input
                          placeholder="Type reply and resolve ticket..."
                          value={feedbackReply[fb.id] || ""}
                          onChange={e => setFeedbackReply(prev => ({ ...prev, [fb.id]: e.target.value }))}
                        />
                        <Button onClick={() => handleFeedbackReply(fb.id)} variant="primary" size="sm">
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
