"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Pin, Calendar, Info, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "General" | "Update" | "Maintenance" | "Billing" | "Feature Release" | "Emergency";
  priority: "Low" | "Medium" | "High" | "Critical";
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  read: boolean;
}

export default function AnnouncementsPage() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const supabase = createClient();

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "system");

      if (error) throw error;

      const mapped = (data || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.message,
        type: n.data?.type || "General",
        priority: n.data?.priority || "Medium",
        expires_at: null,
        is_active: true,
        created_at: n.created_at,
        read: n.read
      }));

      // Sort in JS: Critical announcements first, then chronological
      const sorted = mapped.sort((a, b) => {
        const aCritical = a.priority === "Critical" ? 1 : 0;
        const bCritical = b.priority === "Critical" ? 1 : 0;
        if (aCritical !== bCritical) return bCritical - aCritical;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setAnnouncements(sorted);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load announcements board.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = announcements.filter(ann => {
    if (filter === "all") return true;
    return ann.type.toLowerCase() === filter.toLowerCase();
  });

  const categories = [
    { id: "all", label: "All Board" },
    { id: "General", label: "General" },
    { id: "Update", label: "Updates" },
    { id: "Maintenance", label: "Maintenance" },
    { id: "Billing", label: "Billing" },
    { id: "Feature Release", label: "Releases" },
    { id: "Emergency", label: "Emergency" }
  ];

  const categoryColors: Record<string, string> = {
    General: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
    Update: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    Maintenance: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    Billing: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    "Feature Release": "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    Emergency: "bg-rose-500/10 text-rose-400 border border-rose-500/20"
  };

  const priorityColors: Record<string, string> = {
    Low: "bg-zinc-500/10 text-zinc-450 border-zinc-500/10",
    Medium: "bg-blue-500/10 text-blue-440 border-blue-500/10",
    High: "bg-amber-500/10 text-amber-440 border-amber-500/10",
    Critical: "bg-rose-500/15 text-rose-400 border-rose-500/25 font-black uppercase"
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl bg-white/5" />
        <Skeleton className="h-44 rounded-2xl bg-white/5" />
        <Skeleton className="h-44 rounded-2xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-amber-400" />
            System Announcements
          </h1>
          <p className="text-slate-400 text-sm mt-1">Keep up to date with the latest releases, feature guides, and platform maintenance cycles.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition ${
              filter.toLowerCase() === cat.id.toLowerCase()
                ? "bg-white/10 text-white border-white/20 shadow-sm"
                : "text-slate-400 border-white/5 hover:border-white/10 hover:text-white"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* List Feed */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 border border-dashed border-white/10 rounded-3xl">
            <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30 text-zinc-600" />
            <h3 className="text-sm font-semibold text-white">No announcements found</h3>
            <p className="text-xs text-slate-450 mt-1">Check back later for system upgrades and guides.</p>
          </div>
        ) : (
          filtered.map((ann, index) => {
            const isCritical = ann.priority === "Critical";
            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`border backdrop-blur-md relative overflow-hidden rounded-3xl ${
                  isCritical
                    ? "border-rose-500/30 bg-rose-950/[0.04] shadow-[0_0_15px_rgba(244,63,94,0.06)]"
                    : "border-white/10 bg-white/5 shadow-glow"
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white leading-relaxed">{ann.title}</h3>
                        <Badge variant="outline" className={`text-[8px] uppercase ${categoryColors[ann.type] || categoryColors.General}`}>
                          {ann.type}
                        </Badge>
                        <Badge variant="outline" className={`text-[8px] uppercase ${priorityColors[ann.priority] || priorityColors.Medium}`}>
                          {ann.priority} Priority
                        </Badge>
                        {ann.read ? (
                          <Badge variant="outline" className="text-[8px] uppercase bg-zinc-500/10 text-zinc-400 border border-zinc-500/10">
                            Read
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[8px] uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            Unread
                          </Badge>
                        )}
                        {isCritical && (
                          <span className="text-[8px] uppercase font-black text-rose-450 bg-rose-550/10 px-2 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-0.5">
                            <Pin className="h-2.5 w-2.5" /> Pinned Notice
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                        {new Date(ann.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
