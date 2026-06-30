"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { Loader2, Megaphone, Plus, Edit2, Trash2, Power, PowerOff, Calendar, RefreshCw } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export default function AdminAnnouncementsPage() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Form Modals State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("General");
  const [priority, setPriority] = useState("Medium");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setType("General");
    setPriority("Medium");
    setExpiresAt("");
    setIsActive(true);
    setShowModal(true);
  }

  function handleOpenEdit(ann: Announcement) {
    setEditingId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    setType(ann.type);
    setPriority(ann.priority);
    setExpiresAt(ann.expires_at ? new Date(ann.expires_at).toISOString().split("T")[0] : "");
    setIsActive(ann.is_active);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setActioningId("submit");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthenticated Admin Session.");

      const payload: any = {
        title: title.trim(),
        content: content.trim(),
        type,
        priority,
        is_active: isActive,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
      };

      if (editingId) {
        const { error } = await supabase
          .from("announcements")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Announcement updated successfully.");
      } else {
        payload.created_by = user.id;
        const { error } = await supabase
          .from("announcements")
          .insert(payload);

        if (error) throw error;
        toast.success("Announcement created successfully.");
      }

      setShowModal(false);
      await loadAnnouncements();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to save announcement.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleToggleStatus(ann: Announcement) {
    setActioningId(ann.id);
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !ann.is_active })
        .eq("id", ann.id);

      if (error) throw error;
      toast.success(`Announcement ${!ann.is_active ? "activated" : "deactivated"} successfully.`);
      await loadAnnouncements();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update status.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this announcement? This action cannot be undone.")) return;

    setActioningId(id);
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Announcement deleted successfully.");
      await loadAnnouncements();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to delete announcement.");
    } finally {
      setActioningId(null);
    }
  }

  const typeColors: Record<string, string> = {
    General: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    Update: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Billing: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "Feature Release": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Emergency: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  };

  const priorityColors: Record<string, string> = {
    Low: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    Medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    High: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Critical: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-purple-400" /> Global Announcements
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Compose, activate, expire, or delete global notification announcements for all users.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAnnouncements} variant="outline" size="sm" className="border-zinc-800 text-zinc-300 h-8">
            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
          </Button>
          <Button onClick={handleOpenCreate} className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs h-8 px-3 rounded-lg shadow-md">
            <Plus className="w-4 h-4 mr-1.5" /> Compose Announcement
          </Button>
        </div>
      </div>

      {/* Roster list */}
      <Card className="bg-zinc-900/10 border-zinc-900/80 overflow-hidden shadow-xl rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs">
              No global announcements found. Click "Compose Announcement" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/40 text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="p-4">Announcement details</th>
                    <th className="p-4">Category / Type</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {announcements.map((ann) => {
                    const isExpired = ann.expires_at ? new Date(ann.expires_at) < new Date() : false;
                    const statusText = !ann.is_active ? "Inactive" : isExpired ? "Expired" : "Active";
                    const statusBadgeColor =
                      statusText === "Active"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : statusText === "Expired"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

                    return (
                      <tr key={ann.id} className="hover:bg-zinc-900/20 text-zinc-300 transition-colors">
                        <td className="p-4 max-w-sm">
                          <p className="font-bold text-zinc-200 text-sm leading-tight">{ann.title}</p>
                          <p className="text-[10px] text-zinc-500 leading-relaxed mt-1 whitespace-pre-wrap">{ann.content}</p>
                          <span className="text-[9px] text-zinc-650 block mt-1.5 font-mono">
                            Posted: {new Date(ann.created_at).toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${typeColors[ann.type] || typeColors.General}`}>
                            {ann.type}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${priorityColors[ann.priority] || priorityColors.Medium}`}>
                            {ann.priority}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[10px] text-zinc-500">
                          {ann.expires_at ? (
                            <span className={isExpired ? "text-rose-450 font-bold" : ""}>
                              {new Date(ann.expires_at).toLocaleDateString()}
                            </span>
                          ) : (
                            "No Expiry / Permanent"
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${statusBadgeColor}`}>
                            {statusText}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1.5">
                          <Button
                            disabled={actioningId === ann.id}
                            onClick={() => handleToggleStatus(ann)}
                            size="sm"
                            variant="outline"
                            className="border-zinc-800 text-zinc-400 hover:text-white h-7 px-2.5 rounded-lg text-2xs"
                          >
                            {ann.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5 text-emerald-400" />}
                          </Button>
                          <Button
                            onClick={() => handleOpenEdit(ann)}
                            size="sm"
                            variant="outline"
                            className="border-zinc-800 text-zinc-400 hover:text-white h-7 px-2.5 rounded-lg text-2xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            disabled={actioningId === ann.id}
                            onClick={() => handleDelete(ann.id)}
                            size="sm"
                            className="bg-rose-600 hover:bg-rose-500 text-white h-7 px-2.5 rounded-lg text-2xs font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      {/* CREATE & EDIT FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <Card className="relative w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-white text-md font-bold">
                {editingId ? "Edit Announcement" : "Compose Announcement"}
              </CardTitle>
              <CardDescription className="text-zinc-500 text-xs mt-1">Write notification subjects, configure visual priorities, and set active ranges.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono text-zinc-500">Announcement Title</label>
                <Input
                  placeholder="Enter notice title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono text-zinc-500">Notice Type</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs h-10">
                      <SelectValue placeholder="Notice Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
                      <SelectItem value="General">General Announcement</SelectItem>
                      <SelectItem value="Update">System Update</SelectItem>
                      <SelectItem value="Maintenance">Scheduled Maintenance</SelectItem>
                      <SelectItem value="Billing">Billing Alert</SelectItem>
                      <SelectItem value="Feature Release">Feature Release</SelectItem>
                      <SelectItem value="Emergency">Emergency Broadcast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono text-zinc-500">Priority Level</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs h-10">
                      <SelectValue placeholder="Priority Level" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
                      <SelectItem value="Low">Low Priority</SelectItem>
                      <SelectItem value="Medium">Medium Priority</SelectItem>
                      <SelectItem value="High">High Priority</SelectItem>
                      <SelectItem value="Critical">Critical Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono text-zinc-500">Expiry Date (Optional)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-300 text-xs h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2 flex flex-col justify-end pb-2.5">
                  <label className="flex items-center gap-2 text-[10px] uppercase font-mono text-zinc-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded bg-zinc-900 border-zinc-800 text-purple-600 focus:ring-0 cursor-pointer h-4 w-4"
                    />
                    Publish & Activate
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono text-zinc-500">Announcement Details</label>
                <textarea
                  placeholder="Include complete details and content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full min-h-[100px] bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder:text-zinc-650 text-xs rounded-xl p-3 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
                <Button type="button" onClick={() => setShowModal(false)} variant="outline" className="border-zinc-800 text-zinc-400">
                  Cancel
                </Button>
                <Button type="submit" disabled={actioningId === "submit"} className="bg-purple-600 hover:bg-purple-500 text-white font-bold">
                  {actioningId === "submit" ? "Saving..." : editingId ? "Update Notice" : "Broadcast Announcement"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
