"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { Loader2, SearchCode, Search, RefreshCw, Eye, ArrowRight } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string;
}

interface MergedAuditLog {
  id: string;
  user_id: string;
  timestamp: string;
  operator: string;
  operatorEmail: string;
  studentName: string;
  studentEmail: string;
  action: string;
  category: "activation" | "upgrade" | "downgrade" | "rejection" | "cancellation" | "status_change";
  notes: string;
  prevValue: string;
  newValue: string;
}

export default function AdminAuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<MergedAuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const supabase = createClient();

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      // 1. Fetch subscription history changes
      const { data: subHistory, error: subErr } = await supabase
        .from("subscription_history")
        .select("*, profiles(*)")
        .order("created_at", { ascending: false });

      if (subErr) throw subErr;

      // 2. Fetch rejected payment transactions
      const { data: payTx, error: txErr } = await supabase
        .from("payment_transactions")
        .select("*, approved_by_profile:profiles!payment_transactions_approved_by_fkey(full_name, email), payment_requests(*, profiles(*), subscription_plans(name))")
        .eq("status", "rejected")
        .order("created_at", { ascending: false });

      if (txErr) throw txErr;

      // 3. Merge logs
      const merged: MergedAuditLog[] = [];

      (subHistory || []).forEach((sh) => {
        let cat: MergedAuditLog["category"] = "status_change";
        if (sh.transition_type === "activation" || sh.action === "activation") cat = "activation";
        else if (sh.transition_type === "upgrade" || sh.action === "upgrade") cat = "upgrade";
        else if (sh.transition_type === "downgrade" || sh.action === "downgrade") cat = "downgrade";
        else if (sh.action === "cancel") cat = "cancellation";

        merged.push({
          id: sh.id,
          user_id: sh.user_id,
          timestamp: sh.created_at,
          operator: "System / Trigger",
          operatorEmail: "system@cogniflow.ai",
          studentName: sh.profiles?.full_name || "Unknown Student",
          studentEmail: sh.profiles?.email || "",
          action: sh.transition_type || sh.action || "Status Update",
          category: cat,
          notes: sh.notes || `Plan update to ${sh.current_plan || "free"}`,
          prevValue: sh.previous_plan || "FREE",
          newValue: sh.current_plan || "FREE"
        });
      });

      (payTx || []).forEach((pt) => {
        merged.push({
          id: pt.id,
          user_id: pt.payment_requests?.user_id || "",
          timestamp: pt.created_at,
          operator: pt.approved_by_profile?.full_name || "Admin",
          operatorEmail: pt.approved_by_profile?.email || "admin@cogniflow.ai",
          studentName: pt.payment_requests?.profiles?.full_name || "Student",
          studentEmail: pt.payment_requests?.profiles?.email || "",
          action: "Rejection",
          category: "rejection",
          notes: pt.notes || "Payment request rejected.",
          prevValue: pt.payment_requests?.subscription_plans?.name || "Premium",
          newValue: "REJECTED (FREE)"
        });
      });

      // Sort chronological
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setLogs(merged);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.notes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <SearchCode className="w-5 h-5 text-purple-400" /> System Audit Logs
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Chronological history tracking payment approvals, rejections, manual adjustments, and license transitions.</p>
        </div>
        <Button onClick={loadLogs} variant="outline" size="sm" className="border-zinc-800 text-zinc-300 h-8">
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh Logs
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900/10 border-zinc-900/80 p-4 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search logs by action, username, email or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-950 border-zinc-900 focus:border-zinc-800 text-zinc-300 text-xs h-9"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs h-9">
              <SelectValue placeholder="Log Category" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="activation">Seat Activations</SelectItem>
              <SelectItem value="upgrade">Plan Upgrades</SelectItem>
              <SelectItem value="downgrade">Seat Downgrades</SelectItem>
              <SelectItem value="cancellation">Cancellations</SelectItem>
              <SelectItem value="rejection">Payment Rejections</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="bg-zinc-900/10 border-zinc-900/80 overflow-hidden shadow-xl rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs">
              No matching system audit logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/40 text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Subscriber</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Value Transition</th>
                    <th className="p-4">Audit Notes & Remarks</th>
                    <th className="p-4 text-right">Log ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-900/20 text-zinc-300 transition-colors">
                      <td className="p-4 text-zinc-500 font-mono text-[10px]">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-zinc-200">{log.studentName}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{log.studentEmail}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          log.category === "activation" || log.category === "upgrade"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : log.category === "downgrade" || log.category === "rejection" || log.category === "cancellation"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[10px] text-zinc-400">
                        <div className="flex items-center gap-1.5 uppercase font-bold text-zinc-400">
                          <span className="text-zinc-500">{log.prevValue}</span>
                          <ArrowRight className="w-3 h-3 text-zinc-600" />
                          <span className="text-purple-400">{log.newValue}</span>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-300 max-w-xs truncate font-medium">
                        {log.notes || "No remarks."}
                      </td>
                      <td className="p-4 text-right font-mono text-zinc-600 text-[10px]">{log.id.substring(0, 8)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
