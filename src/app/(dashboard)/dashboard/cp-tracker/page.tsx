"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Code2, Plus, Edit2, Trash2, Search, Trophy, Target, BarChart3,
  TrendingUp, Clock, Zap, Filter, ExternalLink, Calendar
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

const PLATFORMS = [
  { id: "leetcode", label: "LeetCode", color: "#FFA116" },
  { id: "codeforces", label: "Codeforces", color: "#1890FF" },
  { id: "atcoder", label: "AtCoder", color: "#68B6EF" },
  { id: "other", label: "Other", color: "#8B5CF6" },
];

const DIFFICULTIES = [
  { id: "easy", label: "Easy", color: "#22C55E" },
  { id: "medium", label: "Medium", color: "#F59E0B" },
  { id: "hard", label: "Hard", color: "#EF4444" },
];

interface Problem { id: string; platform: string; problem_name: string; problem_url: string; difficulty: string; status: string; topic: string; time_taken_minutes: number; notes: string; solved_at: string; }
interface Contest { id: string; platform: string; contest_name: string; contest_url: string; rank: number; problems_solved: number; total_problems: number; rating_change: number; contest_date: string; notes: string; }

export default function CPTrackerPage() {
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [activeTab, setActiveTab] = useState("problems");
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Problem Modal
  const [pModalOpen, setPModalOpen] = useState(false);
  const [editingP, setEditingP] = useState<Problem | null>(null);
  const [pName, setPName] = useState(""); const [pPlatform, setPPlatform] = useState("leetcode");
  const [pUrl, setPUrl] = useState(""); const [pDifficulty, setPDifficulty] = useState("medium");
  const [pStatus, setPStatus] = useState("solved"); const [pTopic, setPTopic] = useState("");
  const [pTime, setPTime] = useState(""); const [pNotes, setPNotes] = useState("");
  const [pUrlError, setPUrlError] = useState("");

  // Contest Modal
  const [cModalOpen, setCModalOpen] = useState(false);
  const [editingC, setEditingC] = useState<Contest | null>(null);
  const [cName, setCName] = useState(""); const [cPlatform, setCPlatform] = useState("leetcode");
  const [cUrl, setCUrl] = useState(""); const [cRank, setCRank] = useState("");
  const [cSolved, setCSolved] = useState(""); const [cTotal, setCTotal] = useState("");
  const [cRating, setCRating] = useState(""); const [cDate, setCDate] = useState(new Date().toISOString().split("T")[0]);
  const [cNotes, setCNotes] = useState("");

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const [{ data: pd }, { data: cd }] = await Promise.all([
      supabase.from("cp_problems").select("*").eq("user_id", user.id).order("solved_at", { ascending: false }),
      supabase.from("cp_contests").select("*").eq("user_id", user.id).order("contest_date", { ascending: false }),
    ]);
    setProblems(pd || []); setContests(cd || []); setLoading(false);
  }

  // Problem CRUD
  function openPModal(p?: Problem) {
    if (p) { setEditingP(p); setPName(p.problem_name); setPPlatform(p.platform); setPUrl(p.problem_url || ""); setPDifficulty(p.difficulty); setPStatus(p.status); setPTopic(p.topic || ""); setPTime(p.time_taken_minutes?.toString() || ""); setPNotes(p.notes || ""); }
    else { setEditingP(null); setPName(""); setPPlatform("leetcode"); setPUrl(""); setPDifficulty("medium"); setPStatus("solved"); setPTopic(""); setPTime(""); setPNotes(""); }
    setPUrlError("");
    setPModalOpen(true);
  }

  async function handleSaveP() {
    if (!pName.trim()) return;

    // Validate URL format and presence
    setPUrlError("");
    const trimmedUrl = pUrl.trim();
    if (!trimmedUrl) {
      setPUrlError("URL is required.");
      return;
    }

    let urlToSave = trimmedUrl;
    if (!/^https?:\/\//i.test(urlToSave)) {
      urlToSave = "https://" + urlToSave;
    }

    try {
      new URL(urlToSave);
    } catch (e) {
      setPUrlError("Please enter a valid URL (e.g., https://leetcode.com/problems/two-sum).");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = { user_id: user.id, platform: pPlatform, problem_name: pName, problem_url: urlToSave, difficulty: pDifficulty, status: pStatus, topic: pTopic || null, time_taken_minutes: pTime ? parseInt(pTime) : null, notes: pNotes || null };
    if (editingP) {
      await supabase.from("cp_problems").update(payload).eq("id", editingP.id);
      setProblems(prev => prev.map(p => p.id === editingP.id ? { ...p, ...payload } as Problem : p));
    } else {
      const { data } = await supabase.from("cp_problems").insert(payload).select().single();
      if (data) setProblems(prev => [data, ...prev]);
    }
    setPModalOpen(false);
  }

  async function deleteP(id: string) { await supabase.from("cp_problems").delete().eq("id", id); setProblems(prev => prev.filter(p => p.id !== id)); }

  // Contest CRUD
  function openCModal(c?: Contest) {
    if (c) { setEditingC(c); setCName(c.contest_name); setCPlatform(c.platform); setCUrl(c.contest_url || ""); setCRank(c.rank?.toString() || ""); setCSolved(c.problems_solved?.toString() || ""); setCTotal(c.total_problems?.toString() || ""); setCRating(c.rating_change?.toString() || ""); setCDate(c.contest_date); setCNotes(c.notes || ""); }
    else { setEditingC(null); setCName(""); setCPlatform("leetcode"); setCUrl(""); setCRank(""); setCSolved(""); setCTotal(""); setCRating(""); setCDate(new Date().toISOString().split("T")[0]); setCNotes(""); }
    setCModalOpen(true);
  }

  async function handleSaveC() {
    if (!cName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = { user_id: user.id, platform: cPlatform, contest_name: cName, contest_url: cUrl || null, rank: cRank ? parseInt(cRank) : null, problems_solved: parseInt(cSolved) || 0, total_problems: cTotal ? parseInt(cTotal) : null, rating_change: cRating ? parseInt(cRating) : null, contest_date: cDate, notes: cNotes || null };
    if (editingC) {
      await supabase.from("cp_contests").update(payload).eq("id", editingC.id);
      setContests(prev => prev.map(c => c.id === editingC.id ? { ...c, ...payload } as Contest : c));
    } else {
      const { data } = await supabase.from("cp_contests").insert(payload).select().single();
      if (data) setContests(prev => [data, ...prev]);
    }
    setCModalOpen(false);
  }

  async function deleteC(id: string) { await supabase.from("cp_contests").delete().eq("id", id); setContests(prev => prev.filter(c => c.id !== id)); }

  // Filtered
  const filteredP = problems.filter(p => {
    const q = searchQuery.toLowerCase();
    return (!q || p.problem_name.toLowerCase().includes(q)) && (platformFilter === "all" || p.platform === platformFilter) && (difficultyFilter === "all" || p.difficulty === difficultyFilter);
  });

  // Stats
  const totalSolved = problems.filter(p => p.status === "solved").length;
  const totalContests = contests.length;
  const avgRating = contests.length > 0 ? Math.round(contests.reduce((a, c) => a + (c.rating_change || 0), 0) / contests.length) : 0;

  // Chart data
  const diffData = useMemo(() => DIFFICULTIES.map(d => ({ name: d.label, count: problems.filter(p => p.difficulty === d.id && p.status === "solved").length, fill: d.color })), [problems]);
  const platData = useMemo(() => PLATFORMS.map(p => ({ name: p.label, count: problems.filter(pr => pr.platform === p.id).length, fill: p.color })), [problems]);

  // Rating progress chart (line)
  const ratingData = useMemo(() => [...contests].reverse().map((c, i) => ({
    name: c.contest_name.slice(0, 12),
    rating: c.rating_change || 0,
    idx: i + 1,
  })), [contests]);

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-48 rounded-xl" /><div className="grid gap-4 md:grid-cols-3">{Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Competitive Programming</h1>
          <p className="text-slate-400">Track problems, contests, and rating progress across platforms.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Problems Solved</p><p className="text-3xl font-bold text-white mt-1">{totalSolved}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10"><Zap className="h-5 w-5 text-emerald-400" /></div></div></CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Contests Attended</p><p className="text-3xl font-bold text-white mt-1">{totalContests}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10"><Trophy className="h-5 w-5 text-purple-400" /></div></div></CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Avg Rating Change</p><p className={`text-3xl font-bold mt-1 ${avgRating >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{avgRating >= 0 ? "+" : ""}{avgRating}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10"><TrendingUp className="h-5 w-5 text-cyan-400" /></div></div></CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Hard Problems</p><p className="text-3xl font-bold text-white mt-1">{problems.filter(p => p.difficulty === "hard" && p.status === "solved").length}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10"><Target className="h-5 w-5 text-rose-400" /></div></div></CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 gap-1 flex w-fit">
            <TabsTrigger value="problems" className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">Problems</TabsTrigger>
            <TabsTrigger value="contests" className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">Contests</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">Statistics</TabsTrigger>
          </TabsList>
          {activeTab === "problems" && (
            <div className="flex gap-3 flex-wrap">
              <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 w-48" /></div>
              <Select value={platformFilter} onValueChange={setPlatformFilter}><SelectTrigger className="w-32"><SelectValue placeholder="Platform" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{PLATFORMS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent></Select>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}><SelectTrigger className="w-28"><SelectValue placeholder="Difficulty" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{DIFFICULTIES.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}</SelectContent></Select>
              <Button variant="primary" size="sm" onClick={() => openPModal()}><Plus className="h-4 w-4 mr-1" /> Add Problem</Button>
            </div>
          )}
          {activeTab === "contests" && (
            <Button variant="primary" size="sm" onClick={() => openCModal()}><Plus className="h-4 w-4 mr-1" /> Add Contest</Button>
          )}
        </div>

        {/* Problems Tab */}
        <TabsContent value="problems">
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardContent className="pt-4">
              {filteredP.length === 0 ? <div className="text-center py-12 text-slate-500">No problems tracked yet.</div> : (
                <div className="space-y-2">
                  {filteredP.map(p => {
                    const plat = PLATFORMS.find(pl => pl.id === p.platform);
                    const diff = DIFFICULTIES.find(d => d.id === p.difficulty);
                    return (
                      <motion.div key={p.id} layout className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 p-3 hover:bg-slate-950/70 transition group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${plat?.color}20`, color: plat?.color }}>{plat?.label?.slice(0, 2)}</div>
                          <div className="min-w-0">
                            {p.problem_url ? (
                              <a
                                href={p.problem_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-white hover:text-cyan-400 cursor-pointer flex items-center gap-1.5 transition select-none"
                              >
                                <span className="truncate">{p.problem_name}</span>
                                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-cyan-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                              </a>
                            ) : (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs font-semibold text-slate-400 truncate">{p.problem_name}</span>
                                <Badge variant="outline" className="text-[8px] bg-slate-900/50 text-slate-500 border-white/5 font-normal py-0 px-1">
                                  No URL
                                </Badge>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[9px]" style={{ borderColor: diff?.color, color: diff?.color }}>{diff?.label}</Badge>
                              {p.topic && <span className="text-[9px] text-slate-500">{p.topic}</span>}
                              {p.time_taken_minutes && <span className="text-[9px] text-slate-500 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{p.time_taken_minutes}m</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={p.status === "solved" ? "neon" : "outline"} className="text-[9px]">{p.status}</Badge>
                          <Button variant="ghost" size="sm" className="h-7 px-2 opacity-0 group-hover:opacity-100" onClick={() => openPModal(p)}><Edit2 className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-rose-400 opacity-0 group-hover:opacity-100" onClick={() => deleteP(p.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contests Tab */}
        <TabsContent value="contests">
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardContent className="pt-4">
              {contests.length === 0 ? <div className="text-center py-12 text-slate-500">No contests tracked yet.</div> : (
                <div className="space-y-2">
                  {contests.map(c => {
                    const plat = PLATFORMS.find(pl => pl.id === c.platform);
                    return (
                      <motion.div key={c.id} layout className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 p-3 hover:bg-slate-950/70 transition group">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${plat?.color}20`, color: plat?.color }}><Trophy className="h-4 w-4" /></div>
                          <div>
                            <p className="text-xs font-semibold text-white">{c.contest_name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-500">
                              {c.rank && <span>Rank: #{c.rank}</span>}
                              <span>{c.problems_solved}/{c.total_problems || "?"} solved</span>
                              <span>{new Date(c.contest_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {c.rating_change !== null && (
                            <Badge variant={c.rating_change >= 0 ? "neon" : "outline"} className={`text-[9px] ${c.rating_change < 0 ? "text-rose-400 border-rose-400/30" : ""}`}>
                              {c.rating_change >= 0 ? "+" : ""}{c.rating_change}
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 px-2 opacity-0 group-hover:opacity-100" onClick={() => openCModal(c)}><Edit2 className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-rose-400 opacity-0 group-hover:opacity-100" onClick={() => deleteC(c.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Difficulty Distribution */}
            <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
              <CardHeader><CardTitle className="text-sm text-white">Difficulty Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={diffData}><XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} /><RTooltip contentStyle={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} /><Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>{diffData.map((d, i) => <Cell key={i} fill={d.fill} />)}</Bar></BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Platform Distribution */}
            <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
              <CardHeader><CardTitle className="text-sm text-white">Platform Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={platData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10} isAnimationActive={false}>{platData.map((p, i) => <Cell key={i} fill={p.fill} />)}</Pie><RTooltip contentStyle={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} /></PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Rating Progress */}
            {ratingData.length > 0 && (
              <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md md:col-span-2">
                <CardHeader><CardTitle className="text-sm text-white">Rating Progress</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={ratingData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10 }} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} /><RTooltip contentStyle={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} /><Line type="monotone" dataKey="rating" stroke="#22D3EE" strokeWidth={2} dot={{ fill: "#22D3EE", r: 4 }} isAnimationActive={false} /></LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Problem Modal */}
      <Dialog open={pModalOpen} onOpenChange={setPModalOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-md rounded-3xl">
          <DialogHeader><DialogTitle>{editingP ? "Edit Problem" : "Add Problem"}</DialogTitle><DialogDescription>Track competitive programming problems.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Problem Name *</label><Input placeholder="Two Sum" value={pName} onChange={e => setPName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Platform</label><Select value={pPlatform} onValueChange={setPPlatform}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLATFORMS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Difficulty</label><Select value={pDifficulty} onValueChange={setPDifficulty}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DIFFICULTIES.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Status</label><Select value={pStatus} onValueChange={setPStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="solved">Solved</SelectItem><SelectItem value="attempted">Attempted</SelectItem><SelectItem value="revisit">Revisit</SelectItem></SelectContent></Select></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Time (min)</label><Input type="number" placeholder="30" value={pTime} onChange={e => setPTime(e.target.value)} /></div>
            </div>
            <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Topic</label><Input placeholder="DP, Graphs, etc." value={pTopic} onChange={e => setPTopic(e.target.value)} /></div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">URL *</label>
              <Input
                placeholder="https://leetcode.com/..."
                value={pUrl}
                onChange={e => {
                  setPUrl(e.target.value);
                  if (pUrlError) setPUrlError("");
                }}
                className={pUrlError ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {pUrlError && <p className="text-[11px] text-rose-400 font-medium">{pUrlError}</p>}
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setPModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveP}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contest Modal */}
      <Dialog open={cModalOpen} onOpenChange={setCModalOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-md rounded-3xl">
          <DialogHeader><DialogTitle>{editingC ? "Edit Contest" : "Add Contest"}</DialogTitle><DialogDescription>Track contest performance.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Contest Name *</label><Input placeholder="Weekly Contest 400" value={cName} onChange={e => setCName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Platform</label><Select value={cPlatform} onValueChange={setCPlatform}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLATFORMS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Date</label><Input type="date" value={cDate} onChange={e => setCDate(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Rank</label><Input type="number" placeholder="1500" value={cRank} onChange={e => setCRank(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Solved</label><Input type="number" placeholder="3" value={cSolved} onChange={e => setCSolved(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Total</label><Input type="number" placeholder="4" value={cTotal} onChange={e => setCTotal(e.target.value)} /></div>
            </div>
            <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Rating Change</label><Input type="number" placeholder="+25" value={cRating} onChange={e => setCRating(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setCModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveC}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
