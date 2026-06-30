"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Bug, Sparkles, CreditCard, Palette, Key,
  ShieldAlert, Send, ClipboardList, CheckCircle2, Clock, X, Search,
  AlertOctagon, AlertCircle, Sparkle, RefreshCw, Loader2, ArrowRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";

interface Feedback {
  id: string;
  category: "Bug Report" | "Feature Request" | "UI/UX" | "Payment Issue" | "Subscription Issue" | "General Feedback";
  title: string;
  message: string;
  status: "Pending" | "Reviewed" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High";
  admin_response?: string;
  created_at: string;
}

export default function FeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form States
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<Feedback["category"]>("General Feedback");
  const [priority, setPriority] = useState<Feedback["priority"]>("Medium");

  const supabase = createClient();

  useEffect(() => {
    loadFeedback();
  }, []);

  async function loadFeedback() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedbackList((data as any) || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load your feedback history.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in both the subject and the details of your feedback.");
      return;
    }

    if (message.length > 1000) {
      toast.error("Feedback details cannot exceed 1000 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to submit feedback.");
        return;
      }

      const { error } = await supabase.from("feedback").insert({
        user_id: user.id,
        title: title.trim(),
        message: message.trim(),
        category,
        priority,
        status: "Pending"
      });

      if (error) throw error;

      setTitle("");
      setMessage("");
      setCategory("General Feedback");
      setPriority("Medium");
      toast.success("Thank you! Feedback ticket submitted successfully.");
      await loadFeedback();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error submitting feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Visual Priorities Pill Config
  const priorityOptions: Array<{ value: Feedback["priority"]; label: string; desc: string; color: string; border: string; bg: string }> = [
    { value: "Low", label: "Low", desc: "Minor tweaks / logs", color: "text-zinc-400", border: "border-zinc-800", bg: "bg-zinc-950" },
    { value: "Medium", label: "Medium", desc: "General bugs & tools", color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-950/20" },
    { value: "High", label: "High", desc: "Blocking core features", color: "text-rose-450", border: "border-rose-500/25", bg: "bg-rose-950/25" }
  ];

  // Category Icons Map
  const categoryIcons: Record<Feedback["category"], React.ReactNode> = {
    "Bug Report": <Bug className="w-4 h-4 text-rose-400" />,
    "Feature Request": <Sparkles className="w-4 h-4 text-emerald-400" />,
    "UI/UX": <Palette className="w-4 h-4 text-cyan-400" />,
    "Payment Issue": <CreditCard className="w-4 h-4 text-indigo-400" />,
    "Subscription Issue": <Key className="w-4 h-4 text-purple-400" />,
    "General Feedback": <MessageSquare className="w-4 h-4 text-zinc-450" />
  };

  const statusColors = {
    Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Reviewed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Closed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
  };

  const priorityBadgeColors = {
    Low: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    High: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  };

  // Filter & Search Logic
  const filteredTickets = feedbackList.filter(ticket => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.admin_response || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading && feedbackList.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl bg-white/5" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[480px] rounded-3xl bg-white/5" />
          <Skeleton className="h-[480px] rounded-3xl lg:col-span-2 bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-cyan-400" />
          Feedback & Support Desk
        </h1>
        <p className="text-slate-400 text-sm mt-1">Submit bug reports, feature suggestions, or payment issues and track resolving timelines.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left Column: Form Card */}
        <Card className="border-white/10 bg-zinc-900/20 shadow-xl backdrop-blur-md rounded-3xl">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white">Create Ticket</CardTitle>
            <CardDescription className="text-slate-400">Compose feedback and log to administrators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Ticket Title</label>
              <Input
                placeholder="Brief summary..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-xs h-9 focus:border-cyan-500/40 rounded-xl"
              />
            </div>

            {/* Category selection list */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">Category</label>
              <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-9 rounded-xl flex items-center gap-2">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white text-xs">
                  {Object.keys(categoryIcons).map((catName) => (
                    <SelectItem key={catName} value={catName}>
                      <span className="flex items-center gap-2">
                        {categoryIcons[catName as Feedback["category"]]}
                        {catName}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visual Priority Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Priority level</label>
              <div className="grid grid-cols-3 gap-2">
                {priorityOptions.map((opt) => {
                  const isSelected = priority === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all duration-200 ${
                        isSelected
                          ? `${opt.border} ${opt.bg} ring-1 ring-cyan-500/25 scale-[1.02]`
                          : "border-white/5 bg-white/[0.02] opacity-60 hover:opacity-100 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className={`text-xs font-bold ${opt.color}`}>{opt.label}</span>
                      <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Details & Character counter */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-450">
                <label>Feedback Details</label>
                <span className={message.length > 900 ? "text-rose-400 font-bold" : "text-slate-500"}>
                  {message.length} / 1000
                </span>
              </div>
              <textarea
                className="w-full min-h-[140px] rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/10 leading-relaxed resize-none"
                placeholder="Provide complete descriptions or reproduction sequences (Max 1000 characters)..."
                value={message}
                onChange={e => {
                  if (e.target.value.length <= 1000) {
                    setMessage(e.target.value);
                  }
                }}
              />
            </div>

            {/* Submit progress */}
            {submitting && (
              <div className="w-full bg-zinc-950/80 rounded-full h-1 overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="bg-cyan-500 h-full rounded-full"
                />
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !message.trim()}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-9 rounded-xl shadow-md transition-all text-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Sending Ticket...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" /> Submit Ticket
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right Column: Search & Timeline history logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/10 p-3 rounded-2xl border border-white/5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 px-1">
              <ClipboardList className="h-4 w-4 text-cyan-400" /> Support Ticket Log
            </h2>
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Category selector filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-zinc-950 border-white/10 text-white text-2xs h-8 rounded-lg w-28">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white text-2xs">
                  <SelectItem value="all">All Tiers</SelectItem>
                  {Object.keys(categoryIcons).map((catName) => (
                    <SelectItem key={catName} value={catName}>
                      {catName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-zinc-950 border-white/10 text-white text-2xs h-8 rounded-lg w-28">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white text-2xs">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Reviewed">Reviewed</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <Input
              placeholder="Search ticket subjects, explanations or admin replies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900/10 border-white/5 text-white text-xs h-9 rounded-xl focus:border-white/10"
            />
          </div>

          {/* Timeline Feed */}
          {filteredTickets.length === 0 ? (
            <div className="text-center py-24 text-slate-500 border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20 text-zinc-600" />
              <p className="text-xs font-medium">No feedback tickets logged matching search parameters.</p>
            </div>
          ) : (
            <div className="relative border-l border-zinc-800 ml-4 pl-6 space-y-6 py-2">
              <AnimatePresence mode="popLayout">
                {filteredTickets.map((ticket, index) => {
                  const Icon = categoryIcons[ticket.category] || <MessageSquare className="w-4 h-4" />;
                  return (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: Math.min(index * 0.05, 0.4) }}
                      className="relative group"
                    >
                      {/* Left Timeline Indicator Node */}
                      <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-950 border border-zinc-800 text-[10px] shadow-sm group-hover:border-cyan-500/40 transition-colors">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      </span>

                      <Card className="border-white/10 bg-zinc-900/10 p-4 shadow-md backdrop-blur-md rounded-2xl hover:border-white/15 transition-all">
                        {/* Title line */}
                        <div className="flex justify-between items-start gap-4 flex-wrap pb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                              {Icon}
                              {ticket.title}
                            </span>
                            <Badge variant="outline" className={`text-[8px] font-extrabold uppercase ${statusColors[ticket.status]}`}>
                              {ticket.status}
                            </Badge>
                            <Badge variant="outline" className={`text-[8px] font-extrabold uppercase ${priorityBadgeColors[ticket.priority]}`}>
                              {ticket.priority}
                            </Badge>
                            <span className="text-[9px] bg-slate-500/10 border border-white/5 text-slate-400 px-2 py-0.5 rounded-md font-mono font-bold leading-none">
                              {ticket.category}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(ticket.created_at).toLocaleDateString()} {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Content message */}
                        <p className="text-xs text-slate-350 leading-relaxed pt-2 whitespace-pre-wrap font-medium">
                          {ticket.message}
                        </p>

                        {/* Admin response details */}
                        {ticket.admin_response ? (
                          <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-emerald-500/15 text-xs space-y-1.5 mt-3 relative overflow-hidden group/reply">
                            <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/[0.02] rounded-full blur-xl" />
                            <span className="font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Resolution Remarks:
                            </span>
                            <p className="text-slate-300 italic pl-5 leading-relaxed font-semibold">"{ticket.admin_response}"</p>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-zinc-950/20 border border-zinc-900 text-[10px] text-zinc-500 flex items-center gap-1.5 mt-3">
                            <AlertCircle className="w-3.5 h-3.5 text-zinc-650" />
                            <span>This ticket is pending administrator review and response logs.</span>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
