"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Plus, Edit2, Trash2, Search, Building2, MapPin,
  Calendar, ExternalLink, User, Mail, TrendingUp, BarChart3,
  CheckCircle2, XCircle, Clock, ArrowRight, Sparkles
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

const STATUSES = [
  { id: "applied", label: "Applied", color: "bg-blue-500", textColor: "text-blue-400", icon: Clock },
  { id: "assessment", label: "Assessment", color: "bg-amber-500", textColor: "text-amber-400", icon: BarChart3 },
  { id: "interview", label: "Interview", color: "bg-purple-500", textColor: "text-purple-400", icon: User },
  { id: "final_round", label: "Final Round", color: "bg-cyan-500", textColor: "text-cyan-400", icon: Sparkles },
  { id: "offer", label: "Offer", color: "bg-emerald-500", textColor: "text-emerald-400", icon: CheckCircle2 },
  { id: "rejected", label: "Rejected", color: "bg-rose-500", textColor: "text-rose-400", icon: XCircle },
];

interface Application {
  id: string;
  company_name: string;
  position: string;
  location: string;
  application_date: string;
  status: string;
  url: string;
  salary: string;
  notes: string;
  interview_date: string;
  contact_name: string;
  contact_email: string;
}

export default function InternshipTrackerPage() {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState("pipeline");

  // Form state
  const [formCompany, setFormCompany] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formStatus, setFormStatus] = useState("applied");
  const [formUrl, setFormUrl] = useState("");
  const [formSalary, setFormSalary] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formInterviewDate, setFormInterviewDate] = useState("");
  const [formContactName, setFormContactName] = useState("");
  const [formContactEmail, setFormContactEmail] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("internship_applications").select("*").eq("user_id", user.id).order("application_date", { ascending: false });
    setApps(data || []);
    setLoading(false);
  }

  function resetForm() {
    setFormCompany(""); setFormPosition(""); setFormLocation(""); setFormDate(new Date().toISOString().split("T")[0]);
    setFormStatus("applied"); setFormUrl(""); setFormSalary(""); setFormNotes("");
    setFormInterviewDate(""); setFormContactName(""); setFormContactEmail("");
  }

  function openModal(app?: Application) {
    if (app) {
      setEditing(app); setFormCompany(app.company_name); setFormPosition(app.position);
      setFormLocation(app.location || ""); setFormDate(app.application_date);
      setFormStatus(app.status); setFormUrl(app.url || ""); setFormSalary(app.salary || "");
      setFormNotes(app.notes || ""); setFormInterviewDate(app.interview_date?.split("T")[0] || "");
      setFormContactName(app.contact_name || ""); setFormContactEmail(app.contact_email || "");
    } else { setEditing(null); resetForm(); }
    setModalOpen(true);
  }

  async function handleSave() {
    if (!formCompany.trim() || !formPosition.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id, company_name: formCompany, position: formPosition,
      location: formLocation || null, application_date: formDate, status: formStatus,
      url: formUrl || null, salary: formSalary || null, notes: formNotes || null,
      interview_date: formInterviewDate ? new Date(formInterviewDate).toISOString() : null,
      contact_name: formContactName || null, contact_email: formContactEmail || null,
    };

    if (editing) {
      const { error } = await supabase.from("internship_applications").update(payload).eq("id", editing.id);
      if (!error) setApps(prev => prev.map(a => a.id === editing.id ? { ...a, ...payload } as Application : a));
    } else {
      const { data, error } = await supabase.from("internship_applications").insert(payload).select().single();
      if (!error && data) setApps(prev => [data, ...prev]);
    }
    setModalOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this application?")) return;
    await supabase.from("internship_applications").delete().eq("id", id);
    setApps(prev => prev.filter(a => a.id !== id));
  }

  async function handleStatusChange(id: string, newStatus: string) {
    await supabase.from("internship_applications").update({ status: newStatus }).eq("id", id);
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  }

  // Filters
  const filtered = apps.filter(a => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || a.company_name.toLowerCase().includes(q) || a.position.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Analytics
  const total = apps.length;
  const byStatus = STATUSES.map(s => ({ ...s, count: apps.filter(a => a.status === s.id).length }));
  const offerRate = total > 0 ? Math.round((apps.filter(a => a.status === "offer").length / total) * 100) : 0;
  const activeApps = apps.filter(a => !["offer", "rejected"].includes(a.status)).length;
  const interviewRate = total > 0 ? Math.round((apps.filter(a => ["interview", "final_round", "offer"].includes(a.status)).length / total) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Internship Tracker</h1>
          <p className="text-slate-400">Track applications, interviews, and offers across companies.</p>
        </div>
        <Button onClick={() => openModal()} variant="primary" size="lg">
          <Plus className="mr-2 h-4 w-4" /> Add Application
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Applications</p>
                <p className="text-3xl font-bold text-white mt-1">{total}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10"><Target className="h-5 w-5 text-blue-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Active Pipeline</p>
                <p className="text-3xl font-bold text-white mt-1">{activeApps}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10"><Clock className="h-5 w-5 text-cyan-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Interview Rate</p>
                <p className="text-3xl font-bold text-white mt-1">{interviewRate}%</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10"><TrendingUp className="h-5 w-5 text-purple-400" /></div>
            </div>
            <Progress value={interviewRate} className="h-1.5 mt-3 bg-white/5" />
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Offer Rate</p>
                <p className="text-3xl font-bold text-white mt-1">{offerRate}%</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-400" /></div>
            </div>
            <Progress value={offerRate} className="h-1.5 mt-3 bg-white/5" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Pipeline / List / Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 gap-1 flex w-fit">
            <TabsTrigger value="pipeline" className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">Pipeline</TabsTrigger>
            <TabsTrigger value="list" className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">List View</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">Analytics</TabsTrigger>
          </TabsList>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input placeholder="Search applications..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 w-56" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pipeline View */}
        <TabsContent value="pipeline">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {STATUSES.map(status => {
              const colApps = filtered.filter(a => a.status === status.id);
              return (
                <div key={status.id} className="rounded-2xl border border-white/5 p-3 min-h-[300px]">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/5">
                    <div className={`h-2 w-2 rounded-full ${status.color}`} />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{status.label}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">{colApps.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {colApps.map(app => (
                      <motion.div key={app.id} layout className="rounded-xl border border-white/10 bg-slate-950/60 p-3 cursor-pointer hover:bg-slate-950/90 transition-all group" onClick={() => openModal(app)}>
                        <p className="text-xs font-semibold text-white truncate">{app.company_name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{app.position}</p>
                        {app.location && <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1"><MapPin className="h-2.5 w-2.5" />{app.location}</p>}
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[9px] text-slate-500">{new Date(app.application_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }} className="text-rose-400 opacity-0 group-hover:opacity-100 transition"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </motion.div>
                    ))}
                    {colApps.length === 0 && (
                      <div className="text-center py-6 text-[10px] text-slate-600 border border-dashed border-white/5 rounded-xl">Empty</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardContent className="pt-4">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No applications found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-white/5">
                      <tr>
                        <th className="pb-3 pr-4">Company</th>
                        <th className="pb-3 pr-4">Position</th>
                        <th className="pb-3 pr-4">Location</th>
                        <th className="pb-3 pr-4">Applied</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(app => {
                        const statusInfo = STATUSES.find(s => s.id === app.status);
                        return (
                          <tr key={app.id} className="border-b border-white/5 hover:bg-white/5 transition">
                            <td className="py-3 pr-4">
                              <span className="font-semibold text-white text-xs">{app.company_name}</span>
                            </td>
                            <td className="py-3 pr-4 text-xs text-slate-300">{app.position}</td>
                            <td className="py-3 pr-4 text-xs text-slate-400">{app.location || "—"}</td>
                            <td className="py-3 pr-4 text-xs text-slate-400">{new Date(app.application_date).toLocaleDateString()}</td>
                            <td className="py-3 pr-4">
                              <Select value={app.status} onValueChange={(v) => handleStatusChange(app.id, v)}>
                                <SelectTrigger className="w-28 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="py-3">
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => openModal(app)}><Edit2 className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-rose-400" onClick={() => handleDelete(app.id)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
              <CardHeader><CardTitle className="text-sm text-white">Status Distribution</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {byStatus.map(s => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${s.color}`} />
                    <span className="text-xs text-slate-300 w-24">{s.label}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: total > 0 ? `${(s.count / total) * 100}%` : "0%" }} transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${s.color}`} />
                    </div>
                    <span className="text-xs font-bold text-white w-8 text-right">{s.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
              <CardHeader><CardTitle className="text-sm text-white">Success Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Application → Interview</span>
                    <span className="text-white font-bold">{interviewRate}%</span>
                  </div>
                  <Progress value={interviewRate} className="h-2 bg-white/5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Application → Offer</span>
                    <span className="text-white font-bold">{offerRate}%</span>
                  </div>
                  <Progress value={offerRate} className="h-2 bg-white/5" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="rounded-xl bg-slate-950/30 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{apps.filter(a => a.status === "offer").length}</p>
                    <p className="text-[10px] text-slate-500">Total Offers</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/30 p-3 text-center">
                    <p className="text-2xl font-bold text-rose-400">{apps.filter(a => a.status === "rejected").length}</p>
                    <p className="text-[10px] text-slate-500">Rejections</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Application" : "Add Application"}</DialogTitle>
            <DialogDescription>Track your internship application pipeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Company *</label><Input placeholder="Google, Meta..." value={formCompany} onChange={e => setFormCompany(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Position *</label><Input placeholder="SWE Intern" value={formPosition} onChange={e => setFormPosition(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Location</label><Input placeholder="San Francisco, CA" value={formLocation} onChange={e => setFormLocation(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Application Date</label><Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Status</label>
                <Select value={formStatus} onValueChange={setFormStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Salary</label><Input placeholder="$40/hr" value={formSalary} onChange={e => setFormSalary(e.target.value)} /></div>
            </div>
            <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Job URL</label><Input placeholder="https://..." value={formUrl} onChange={e => setFormUrl(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Contact Name</label><Input placeholder="Recruiter name" value={formContactName} onChange={e => setFormContactName(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Contact Email</label><Input placeholder="recruiter@company.com" value={formContactEmail} onChange={e => setFormContactEmail(e.target.value)} /></div>
            </div>
            <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Interview Date</label><Input type="date" value={formInterviewDate} onChange={e => setFormInterviewDate(e.target.value)} /></div>
            <div className="space-y-1"><label className="text-xs text-slate-400 font-semibold">Notes</label>
              <textarea className="w-full min-h-[60px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none" placeholder="Any notes..." value={formNotes} onChange={e => setFormNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editing ? "Update" : "Add"} Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
