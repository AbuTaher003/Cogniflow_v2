"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Calendar, CheckSquare, Flame, Trophy, Info,
  Trash2, Check, Sparkles, AlertCircle, RefreshCw
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "exam" | "reminder" | "system">("all");
  const supabase = createClient();

  const loadNotificationsData = async (shouldShowRefresh = false) => {
    if (shouldShowRefresh) setRefreshing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Fetch current notifications
    const { data: notices } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const currentNotices = notices || [];

    // 2. Fetch exams (read-only) to auto-generate reminders
    const { data: exams } = await supabase
      .from("exams")
      .select("*, subjects(name)")
      .eq("user_id", user.id);

    const currentExams = exams || [];

    // 3. Find exams that don't have notifications yet
    const existingExamIds = currentNotices
      .filter((n) => n.type === "exam_reminder" && n.data && n.data.exam_id)
      .map((n) => n.data.exam_id);

    const newNotificationsToInsert: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const exam of currentExams) {
      if (!existingExamIds.includes(exam.id)) {
        const examDate = new Date(exam.exam_date);
        examDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Generate notifications for future exams or today's exams
        if (daysLeft >= 0) {
          let urgencyText = "";
          if (daysLeft === 0) urgencyText = "TODAY!";
          else if (daysLeft === 1) urgencyText = "tomorrow!";
          else urgencyText = `in ${daysLeft} days.`;

          newNotificationsToInsert.push({
            user_id: user.id,
            type: "exam_reminder",
            title: `Upcoming Exam: ${exam.title}`,
            message: `Your exam "${exam.title}" for subject "${exam.subjects?.name || "Subject"}" is scheduled ${urgencyText}`,
            read: false,
            data: { exam_id: exam.id }
          });
        }
      }
    }

    // 4. Insert new notifications if any
    if (newNotificationsToInsert.length > 0) {
      const { error } = await supabase.from("notifications").insert(newNotificationsToInsert);
      if (!error) {
        // Fetch updated notifications list
        const { data: updatedNotices } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setNotifications(updatedNotices || []);
      } else {
        setNotifications(currentNotices);
      }
    } else {
      setNotifications(currentNotices);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadNotificationsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkRead = async (id: string, readState: boolean) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: readState })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: readState } : n))
      );
      // Dispatch custom event to trigger Topbar refresh
      window.dispatchEvent(new Event("realtime-notifications"));
    }
  };

  const handleMarkAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new Event("realtime-notifications"));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      window.dispatchEvent(new Event("realtime-notifications"));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "exam_reminder":
        return <Calendar className="h-5 w-5 text-amber-400" />;
      case "task_reminder":
        return <CheckSquare className="h-5 w-5 text-cyan-400" />;
      case "habit_reminder":
        return <Flame className="h-5 w-5 text-orange-400" />;
      case "achievement":
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "exam") return n.type === "exam_reminder";
    if (activeTab === "reminder") return n.type === "task_reminder" || n.type === "habit_reminder";
    if (activeTab === "system") return n.type === "system" || n.type === "info" || n.type === "achievement";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Bell className="h-8 w-8 text-cyan-400" /> Notification Center
          </h1>
          <p className="text-slate-400 mt-1">
            Stay updated with your study schedule, tasks, habits, and achievements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => loadNotificationsData(true)}
            variant="secondary"
            size="sm"
            disabled={refreshing}
            className="h-10 rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllRead}
              variant="primary"
              size="sm"
              className="h-10 rounded-xl"
            >
              <Check className="h-4 w-4 mr-1.5" /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-white/5 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition ${
            activeTab === "all" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          All
          {unreadCount > 0 && (
            <Badge variant="neon" className="ml-1 px-1.5 py-0.5 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("exam")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition ${
            activeTab === "exam" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          Exams
        </button>
        <button
          onClick={() => setActiveTab("reminder")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition ${
            activeTab === "reminder" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          Reminders
        </button>
        <button
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition ${
            activeTab === "system" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          System & Achievements
        </button>
      </div>

      {/* Notifications List */}
      <Card className="border-white/10 bg-white/5 shadow-glow">
        <CardContent className="p-6">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center text-slate-500"
              >
                <AlertCircle className="mx-auto h-12 w-12 text-slate-500/40 mb-3" />
                <h3 className="font-semibold text-lg text-white">No notifications</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                  There are no notifications in this category right now.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border transition ${
                      !notification.read
                        ? "bg-gradient-to-r from-cyan-950/20 to-purple-950/20 border-cyan-500/20 shadow-sm"
                        : "bg-slate-950/40 border-white/5 hover:bg-slate-950/60"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1">
                      <div className="mt-1 p-2 bg-white/5 rounded-xl border border-white/5 shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className={`text-sm font-bold ${!notification.read ? "text-white" : "text-slate-300"}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <Badge variant="neon" className="text-[9px] uppercase font-bold py-0.5 px-1.5">
                              New
                            </Badge>
                          )}
                        </div>
                        {notification.message && (
                          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                            {notification.message}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-600 block">
                          {new Date(notification.created_at).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        onClick={() => handleMarkRead(notification.id, !notification.read)}
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-white p-0"
                        title={notification.read ? "Mark as unread" : "Mark as read"}
                      >
                        <Check className={`h-4 w-4 ${!notification.read ? "text-cyan-400 font-bold" : ""}`} />
                      </Button>
                      <Button
                        onClick={() => handleDelete(notification.id)}
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 p-0"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
