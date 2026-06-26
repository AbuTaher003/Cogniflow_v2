"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Plus, Edit2, Trash2, Search, Database, BookOpen, BarChart3, Medal, Users, Calendar, ExternalLink } from "lucide-react";
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

const ENTRY_TYPES = [
  { id: "competition", label: "Competition", icon: Trophy, color: "#F59E0B" },
  { id: "dataset", label: "Dataset", icon: Database, color: "#22D3EE" },
  { id: "notebook", label: "Notebook", icon: BookOpen, color: "#A855F7" },
];

const MEDALS = [
  { id: "gold", label: "Gold", color: "#FFD700" },
  { id: "silver", label: "Silver", color: "#C0C0C0" },
  { id: "bronze", label: "Bronze", color: "#CD7F32" },
];

interface KaggleEntry { id: string; entry_type: string; title: string; url: string; status: string; medal: string | null; team_size: number; description: string; started_at: string; ended_at: string; }

export default function KaggleTrackerPage() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<KaggleEntry[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KaggleEntry | null>(null);

  const [fTitle, setFTitle] = useState(""); const [fType, setFType] = useState("competition");
  const [fUrl, setFUrl] = useState(""); const [fStatus, setFStatus] = useState("active");
  const [fMedal, setFMedal] = useState("none"); const [fTeam, setFTeam] = useState("1");
  const [fDesc, setFDesc] = useState(""); const [fStart, setFStart] = useState("");
  const [fEnd, setFEnd] = useState("");
  const [fUrlError, setFUrlError] = useState("");

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("kaggle_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setEntries(data || []); setLoading(false);
  }

  function openModal(entry?: KaggleEntry) {
    if (entry) {
      setEditing(entry); setFTitle(entry.title); setFType(entry.entry_type); setFUrl(entry.url || "");
      setFStatus(entry.status); setFMedal(entry.medal || "none"); setFTeam(entry.team_size?.toString() || "1");
      setFDesc(entry.description || ""); setFStart(entry.started_at || ""); setFEnd(entry.ended_at || "");
    } else {
      setEditing(null); setFTitle(""); setFType("competition"); setFUrl(""); setFStatus("active");
      setFMedal("none"); setFTeam("1"); setFDesc(""); setFStart(""); setFEnd("");
    }
    setFUrlError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!fTitle.trim()) return;

    // Validate URL format and presence
    setFUrlError("");
    const trimmedUrl = fUrl.trim();
    if (!trimmedUrl) {
      setFUrlError("URL is required.");
      return;
    }

    let urlToSave = trimmedUrl;
    if (!/^https?:\/\//i.test(urlToSave)) {
      urlToSave = "https://" + urlToSave;
    }

    try {
      new URL(urlToSave);
    } catch (e) {
      setFUrlError("Please enter a valid URL (e.g., https://kaggle.com/c/...).");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      user_id: user.id, entry_type: fType, title: fTitle, url: urlToSave, status: fStatus,
      medal: fMedal === "none" ? null : fMedal, team_size: parseInt(fTeam) || 1,
      description: fDesc || null, started_at: fStart || null, ended_at: fEnd || null,
    };
    if (editing) {
      await supabase.from("kaggle_entries").update(payload).eq("id", editing.id);
      setEntries(prev => prev.map(e => e.id === editing.id ? { ...e, ...payload } as KaggleEntry : e));
    } else {
      const { data } = await supabase.from("kaggle_entries").insert(payload).select().single();
      if (data) setEntries(prev => [data, ...prev]);
    }
    setModalOpen(false);
  }

  async function handleDelete(id: string) { await supabase.from("kaggle_entries").delete().eq("id", id); setEntries(prev => prev.filter(e => e.id !== id)); }

  const filtered = entries.filter(e => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || e.title.toLowerCase().includes(q);
    const matchType = activeTab === "all" || e.entry_type === activeTab;
    return matchSearch && matchType;
  });

  const compCount = entries.filter(e => e.entry_type === "competition").length;
  const dataCount = entries.filter(e => e.entry_type === "dataset").length;
  const nbCount = entries.filter(e => e.entry_type === "notebook").length;
  const medalCount = entries.filter(e => e.medal).length;

  const typeData = useMemo(() => ENTRY_TYPES.map(t => ({ name: t.label, count: entries.filter(e => e.entry_type === t.id).length, fill: t.color })), [entries]);
  const statusData = useMemo(() => [
    { name: "Active", count: entries.filter(e => e.status === "active").length, fill: "#22D3EE" },
    { name: "Completed", count: entries.filter(e => e.status === "completed").length, fill: "#22C55E" },
    { name: "Abandoned", count: entries.filter(e => e.status === "abandoned").length, fill: "#EF4444" },
  ], [entries]);

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48 rounded-xl" /><Skeleton className="h-96 rounded-2xl" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Kaggle Tracker</h1>
          <p className="text-slate-400">Track competitions, datasets, and notebooks on Kaggle.</p>
        </div>
        <Button onClick={() => openModal()} variant="primary" size="lg"><Plus className="mr-2 h-4 w-4" /> Add Entry</Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Competitions", value: compCount, icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Datasets", value: dataCount, icon: Database, color: "text-cyan-400", bg: "bg-cyan-500/10" },
          { label: "Notebooks", value: nbCount, icon: BookOpen, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Medals", value: medalCount, icon: Medal, color: "text-yellow-400", bg: "bg-yellow-500/10" },
        ].map(kpi => (
          <Card key={kpi.label} className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
            <CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{kpi.label}</p><p className="text-3xl font-bold text-white mt-1">{kpi.value}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg}`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div></div></CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 gap-1 flex w-fit">
            <TabsTrigger value="all" className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">All</TabsTrigger>
            {ENTRY_TYPES.map(t => <TabsTrigger key={t.id} value={t.id} className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">{t.label}s</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 w-48" /></div>
      </div>

      {/* Entries Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <Card className="col-span-full border-white/10 bg-white/5"><CardContent className="flex flex-col items-center justify-center py-16"><Trophy className="h-12 w-12 text-slate-500 mb-4" /><p className="text-sm text-slate-400">No entries yet.</p></CardContent></Card>
        ) : filtered.map(entry => {
          const typeInfo = ENTRY_TYPES.find(t => t.id === entry.entry_type);
          const Icon = typeInfo?.icon || Trophy;
          return (
            <motion.div key={entry.id} layout>
              <Card className="border-white/10 bg-white/5 hover:bg-white/8 transition-all cursor-pointer group" onClick={() => openModal(entry)}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${typeInfo?.color}20` }}><Icon className="h-4 w-4" style={{ color: typeInfo?.color }} /></div>
                      <div className="min-w-0">
                        {entry.url ? (
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-semibold text-white hover:text-cyan-400 cursor-pointer flex items-center gap-1.5 transition select-none min-w-0"
                          >
                            <span className="truncate">{entry.title}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-cyan-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm font-semibold text-slate-400 truncate">{entry.title}</span>
                            <Badge variant="outline" className="text-[8px] bg-slate-900/50 text-slate-500 border-white/5 font-normal py-0 px-1 shrink-0">
                              No URL
                            </Badge>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-500">{typeInfo?.label}</p>
                      </div>
                    </div>
                    {entry.medal && <Badge className="text-[9px] shrink-0" style={{ backgroundColor: MEDALS.find(m => m.id === entry.medal)?.color + "30", color: MEDALS.find(m => m.id === entry.medal)?.color, borderColor: MEDALS.find(m => m.id === entry.medal)?.color }}>{entry.medal}</Badge>}
                  </div>
                  {entry.description && <p className="text-xs text-slate-400 mt-3 line-clamp-2">{entry.description}</p>}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                    <Badge variant={entry.status === "active" ? "neon" : entry.status === "completed" ? "default" : "outline"} className="text-[9px]">{entry.status}</Badge>
                    {entry.team_size > 1 && <span className="text-[9px] text-slate-500 flex items-center gap-1"><Users className="h-2.5 w-2.5" /> {entry.team_size} members</span>}
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }} className="text-rose-400 opacity-0 group-hover:opacity-100 transition"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Analytics */}
      {entries.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
            <CardHeader><CardTitle className="text-sm text-white">Type Distribution</CardTitle></CardHeader>
            <CardContent><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={typeData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label fontSize={10} isAnimationActive={false}>{typeData.map((d, i) => <Cell key={i} fill={d.fill} />)}</Pie><RTooltip contentStyle={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} /></PieChart></ResponsiveContainer></CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
            <CardHeader><CardTitle className="text-sm text-white">Status Overview</CardTitle></CardHeader>
            <CardContent><ResponsiveContainer width="100%" height={200}><BarChart data={statusData}><XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} /><RTooltip contentStyle={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} /><Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>{statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}</Bar></BarChart></ResponsiveContainer></CardContent>
          </Card>
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-md rounded-3xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Entry" : "Add Kaggle Entry"}</DialogTitle><DialogDescription>Track your Kaggle activity.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Title *</label><Input placeholder="Competition title..." value={fTitle} onChange={e => setFTitle(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Type</label><Select value={fType} onValueChange={setFType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ENTRY_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Status</label><Select value={fStatus} onValueChange={setFStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="abandoned">Abandoned</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Medal</label><Select value={fMedal} onValueChange={setFMedal}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{MEDALS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Team Size</label><Input type="number" min="1" value={fTeam} onChange={e => setFTeam(e.target.value)} /></div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">URL *</label>
              <Input
                placeholder="https://kaggle.com/..."
                value={fUrl}
                onChange={e => {
                  setFUrl(e.target.value);
                  if (fUrlError) setFUrlError("");
                }}
                className={fUrlError ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {fUrlError && <p className="text-[11px] text-rose-400 font-medium">{fUrlError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Start Date</label><Input type="date" value={fStart} onChange={e => setFStart(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">End Date</label><Input type="date" value={fEnd} onChange={e => setFEnd(e.target.value)} /></div>
            </div>
            <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Description</label><textarea className="w-full min-h-[60px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none" placeholder="Description..." value={fDesc} onChange={e => setFDesc(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSave}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
