"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { Loader2, MessageSquareText, Search, RefreshCw, Eye, Check, X, ShieldAlert } from "lucide-react";

interface Profile {
  full_name: string;
  email: string;
}

interface Feedback {
  id: string;
  user_id: string;
  category: string;
  title: string;
  message: string;
  priority: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  profiles?: Profile;
}

export default function AdminFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Detail & Response Modal State
  const [selectedTicket, setSelectedTicket] = useState<Feedback | null>(null);
  const [adminResponseText, setAdminResponseText] = useState("");
  const [ticketStatus, setTicketStatus] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadFeedback();
  }, []);

  async function loadFeedback() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load feedback tickets.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateTicket(ticketId: string, status: string, responseText = "") {
    setActioningId(ticketId);
    try {
      const updatePayload: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (responseText.trim()) {
        updatePayload.admin_response = responseText.trim();
      }

      const { error } = await supabase
        .from("feedback")
        .update(updatePayload)
        .eq("id", ticketId);

      if (error) throw error;

      toast.success(`Ticket status updated to ${status}`);
      setSelectedTicket(null);
      setAdminResponseText("");
      await loadFeedback();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update ticket.");
    } finally {
      setActioningId(null);
    }
  }

  const filtered = feedback.filter((ticket) => {
    const matchesSearch =
      (ticket.profiles?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.profiles?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.message || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const statusColors = {
    Pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    Reviewed: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    Resolved: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    Closed: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
  };

  const priorityColors = {
    Low: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
    Medium: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    High: "bg-rose-500/10 text-rose-400 border border-rose-500/20"
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-purple-400" /> User Feedback Tickets
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Audit bug reports, feature suggestions, or user queries and submit replies.</p>
        </div>
        <Button onClick={loadFeedback} variant="outline" size="sm" className="border-zinc-800 text-zinc-300 h-8">
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh Feed
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900/10 border-zinc-900/80 p-4 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search user, title, content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-950 border-zinc-900 focus:border-zinc-800 text-zinc-300 text-xs h-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs h-9">
              <SelectValue placeholder="Ticket Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Reviewed">Reviewed</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={categoryFilter => setCategoryFilter(categoryFilter)}>
            <SelectTrigger className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="General Feedback">General Feedback</SelectItem>
              <SelectItem value="Bug Report">Bug Report</SelectItem>
              <SelectItem value="Feature Request">Feature Request</SelectItem>
              <SelectItem value="UI/UX">UI/UX Issues</SelectItem>
              <SelectItem value="Payment Issue">Payment Issue</SelectItem>
              <SelectItem value="Subscription Issue">Subscription Issue</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={priorityFilter => setPriorityFilter(priorityFilter)}>
            <SelectTrigger className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs h-9">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Roster Table */}
      <Card className="bg-zinc-900/10 border-zinc-900/80 overflow-hidden shadow-xl rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs">
              No support feedback tickets found matching filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/40 text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="p-4">Sender Profile</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Ticket Subject</th>
                    <th className="p-4">Date Submitted</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {filtered.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-zinc-900/20 text-zinc-300 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-zinc-200">{ticket.profiles?.full_name || "Anonymous User"}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{ticket.profiles?.email}</p>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-purple-400 uppercase font-mono">
                          {ticket.category}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate">
                        <span className="font-semibold text-zinc-200 block">{ticket.title}</span>
                        <span className="text-[10px] text-zinc-500 truncate block mt-0.5">{ticket.message}</span>
                      </td>
                      <td className="p-4 text-zinc-500 font-mono">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${(priorityColors as any)[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${(statusColors as any)[ticket.status]}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setAdminResponseText(ticket.admin_response || "");
                            setTicketStatus(ticket.status);
                          }}
                          size="sm"
                          variant="outline"
                          className="border-zinc-800 text-zinc-400 hover:text-white h-7 px-2.5 rounded-lg text-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Audit ticket
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

      {/* DETAIL & REPLY MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setSelectedTicket(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <Card className="relative w-full max-w-xl bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <CardHeader className="p-0 pb-4 mb-4 border-b border-zinc-900">
              <CardTitle className="text-white text-md font-bold flex items-center gap-2">
                <MessageSquareText className="w-5 h-5 text-purple-400" /> Support Ticket Review
              </CardTitle>
              <CardDescription className="text-zinc-500 text-xs mt-1">Review feedback categories, change priority tags, and update responses.</CardDescription>
            </CardHeader>
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-zinc-900/20 p-4 rounded-xl border border-zinc-900">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">SENDER</span>
                  <span className="font-semibold text-zinc-200 mt-0.5 block">{selectedTicket.profiles?.full_name} ({selectedTicket.profiles?.email})</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">CATEGORY</span>
                  <span className="font-semibold text-purple-400 block mt-0.5 uppercase font-mono">{selectedTicket.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">PRIORITY</span>
                  <span className="font-semibold text-rose-400 block mt-0.5 uppercase">{selectedTicket.priority} Priority</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">DATE SUBMITTED</span>
                  <span className="font-mono text-zinc-400 block mt-0.5">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/10 border border-zinc-900/50 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">SUBJECT</span>
                <span className="font-bold text-white block">{selectedTicket.title}</span>
                <span className="text-[10px] text-zinc-500 uppercase font-mono block pt-3">DETAILS / MESSAGE</span>
                <p className="text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {/* Status Update Forms */}
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <Button
                    disabled={!!actioningId}
                    onClick={() => handleUpdateTicket(selectedTicket.id, "Reviewed", adminResponseText)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 text-2xs h-8"
                  >
                    Reviewed
                  </Button>
                  <Button
                    disabled={!!actioningId}
                    onClick={() => handleUpdateTicket(selectedTicket.id, "Resolved", adminResponseText)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 text-2xs h-8"
                  >
                    Mark Resolved
                  </Button>
                  <Button
                    disabled={!!actioningId}
                    onClick={() => handleUpdateTicket(selectedTicket.id, "Closed", adminResponseText)}
                    variant="outline"
                    className="border-zinc-800 text-zinc-400 hover:text-white font-bold px-3 text-2xs h-8"
                  >
                    Close Ticket
                  </Button>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-mono block">Submit Reply / Admin Remarks</label>
                  <textarea
                    placeholder="Log admin explanation or resolution details..."
                    value={adminResponseText}
                    onChange={(e) => setAdminResponseText(e.target.value)}
                    className="w-full min-h-[80px] bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
                <Button type="button" onClick={() => setSelectedTicket(null)} variant="outline" className="border-zinc-800 text-zinc-400">
                  Close Review
                </Button>
                <Button
                  type="button"
                  disabled={!!actioningId}
                  onClick={() => handleUpdateTicket(selectedTicket.id, ticketStatus, adminResponseText)}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  {actioningId ? "Saving..." : "Save Reply"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
