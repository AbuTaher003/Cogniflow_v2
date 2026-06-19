"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Plus, Send, ClipboardList, CheckCircle2, MessageSquareText, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Feedback {
  id: string;
  feedback_type: "feedback" | "bug" | "feature";
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  admin_response?: string;
  created_at: string;
}

export default function FeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"feedback" | "bug" | "feature">("feedback");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const supabase = createClient();

  useEffect(() => {
    loadFeedback();
  }, []);

  async function loadFeedback() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("feedback")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setFeedbackList(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      title,
      description,
      feedback_type: type,
      priority,
      status: "open"
    });

    if (!error) {
      setTitle("");
      setDescription("");
      await loadFeedback();
      alert("Feedback ticket submitted! The admins will review it shortly.");
    } else {
      alert("Error submitting feedback. Please try again.");
    }
    setLoading(false);
  }

  const statusColors = {
    open: "bg-blue-500/10 text-blue-400 border-blue-500/10",
    in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/10",
    resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
    closed: "bg-slate-500/10 text-slate-400 border-white/5"
  };

  const priorityColors = {
    low: "text-slate-400 border-white/5",
    medium: "text-amber-400 border-amber-500/10",
    high: "text-rose-400 border-rose-500/10"
  };

  if (loading && feedbackList.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <MessageSquareText className="h-8 w-8 text-cyan-400" />
          Feedback & Support
        </h1>
        <p className="text-slate-400">Request features, submit bugs, or share feedback directly with platform admins.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Panel */}
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white">Create Support Ticket</CardTitle>
            <CardDescription>Tell us what we can improve or fix.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Subject / Title</label>
              <Input placeholder="Describe brief issue..." value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">Ticket Type</label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feedback">General Suggestion</SelectItem>
                    <SelectItem value="bug">Report a Bug</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">Priority</label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Details</label>
              <textarea
                className="w-full min-h-[120px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
                placeholder="Include screenshots descriptions or reproduction steps..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <Button onClick={handleSubmit} variant="primary" className="w-full">
              <Send className="h-4 w-4 mr-2" /> Submit Ticket
            </Button>
          </CardContent>
        </Card>

        {/* History Tickets Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-cyan-400" /> Your Support Tickets
          </h2>

          {feedbackList.length === 0 ? (
            <div className="text-center py-20 text-slate-500 border border-dashed border-white/10 rounded-3xl">
              <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">You haven't submitted any tickets yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbackList.map((ticket) => (
                <Card key={ticket.id} className="border-white/10 bg-white/5 p-4 shadow-glow backdrop-blur-md space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white">{ticket.title}</span>
                        <Badge variant="outline" className={`text-[8px] uppercase ${statusColors[ticket.status]}`}>
                          {ticket.status}
                        </Badge>
                        <Badge variant="outline" className={`text-[8px] uppercase ${priorityColors[ticket.priority]}`}>
                          {ticket.priority} Priority
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{ticket.description}</p>
                      <span className="text-[10px] text-slate-500 mt-2 block">
                        Submitted on: {new Date(ticket.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {ticket.admin_response && (
                    <div className="p-3 rounded-2xl bg-slate-950/40 border border-emerald-500/10 text-xs space-y-1">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Admin Reply:
                      </span>
                      <p className="text-slate-300 italic">{ticket.admin_response}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
