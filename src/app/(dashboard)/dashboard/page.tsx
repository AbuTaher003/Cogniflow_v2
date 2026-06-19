"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2, Clock3, Flame, BookOpen, Target, LineChart,
  Sparkles, Calendar, FileText, Plus, Award, BarChart3, TrendingUp,
  Activity
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis
} from "recharts";

const MOTIVATIONAL_QUOTES = [
  "Focus on progress, not perfection. You've got this!",
  "The secret of getting ahead is getting started.",
  "Your target CGPA is just a reflection of your daily habits.",
  "Consistent daily study hours compound into extraordinary results.",
  "Every expert was once a beginner. Keep pushed!",
];

export default function DashboardHomePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [allNotes, setAllNotes] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [focusSessions, setFocusSessions] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [habitLogs, setHabitLogs] = useState<any[]>([]);
  const [recentHabitLogs, setRecentHabitLogs] = useState<any[]>([]);
  const [quote, setQuote] = useState("");

  const supabase = createClient();
  const router = useRouter();

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(profileData);

    // Fetch Tasks
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*, subjects(name, color)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTasks(tasksData || []);

    // Fetch Exams
    const { data: examsData } = await supabase
      .from("exams")
      .select("*, subjects(name, code, color)")
      .eq("user_id", user.id)
      .order("exam_date", { ascending: true });

    const mappedExams = (examsData || []).map(e => ({
      ...e,
      importance_level: e.coverage || "medium"
    }));
    setExams(mappedExams);

    // Fetch Habits
    const { data: habitsData } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setHabits(habitsData || []);

    // Fetch Notes (exclude archived)
    const { data: notesData } = await supabase
      .from("notes")
      .select("*, subjects(name, color)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setAllNotes(notesData || []);

    // Fetch Analytics / Productivity History
    const { data: analyticsData } = await supabase
      .from("analytics")
      .select("*")
      .eq("user_id", user.id)
      .order("metric_date", { ascending: true })
      .limit(7);
    setAnalytics(analyticsData || []);

    // Fetch Study Plans
    const { data: studyPlansData } = await supabase
      .from("study_plans")
      .select("*, subjects(name, color)")
      .eq("user_id", user.id);
    setStudyPlans(studyPlansData || []);

    // Fetch Focus Sessions
    const { data: focusData } = await supabase
      .from("focus_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false });
    setFocusSessions(focusData || []);

    // Fetch Achievements
    const { data: achievementsData } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", user.id)
      .order("unlocked_at", { ascending: false });
    setAchievements(achievementsData || []);

    // Fetch Habit Logs for Today
    const { data: habitLogsData } = await supabase
      .from("habit_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed_date", new Date().toISOString().split("T")[0]);
    setHabitLogs(habitLogsData || []);

    // Fetch Recent Habit Logs with joined habits title
    const { data: recentHabitLogsData } = await supabase
      .from("habit_logs")
      .select("*, habits(title)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(5);
    setRecentHabitLogs(recentHabitLogsData || []);

    setLoading(false);
  };

  useEffect(() => {
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      loadDashboardData();
    };
    window.addEventListener("dashboard-refresh", handleRefresh);
    return () => window.removeEventListener("dashboard-refresh", handleRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler to toggle task completed
  async function handleToggleTask(taskId: string, currentStatus: string) {
    const nextStatus = currentStatus === "done" ? "todo" : "done";
    const completedAt = nextStatus === "done" ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("tasks")
      .update({ status: nextStatus, completed_at: completedAt })
      .eq("id", taskId);

    if (!error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus, completed_at: completedAt } : t))
      );
    }
  }

  // Handler to log habit check-off
  async function handleLogHabit(habitId: string, currentStreak: number) {
    const { error } = await supabase
      .from("habits")
      .update({ streak: currentStreak + 1, updated_at: new Date().toISOString() })
      .eq("id", habitId);

    if (!error) {
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, streak: currentStreak + 1 } : h))
      );

      // Create a habit log row
      await supabase.from("habit_logs").insert({
        habit_id: habitId,
        completed_at: new Date().toISOString(),
      });
    }
  }

  // Calculate Productivity Score (tasks done, habits checked, study target)
  const completedTasksCount = tasks.filter((t) => t.status === "done").length;
  const totalTasksCount = tasks.length;
  const taskProgressRatio = totalTasksCount > 0 ? completedTasksCount / totalTasksCount : 0.6; // default fallback if empty

  const totalHabitsCount = habits.length;
  const completedHabitsCount = habits.filter((h) => h.streak > 0).length;
  const habitProgressRatio = totalHabitsCount > 0 ? completedHabitsCount / totalHabitsCount : 0.7;

  // Aggregate Productivity Score
  const rawScore = Math.round((taskProgressRatio * 40) + (habitProgressRatio * 30) + 30);
  const productivityScoreData = useMemo(() => [{ name: "Productivity", value: rawScore, fill: "url(#cyan-fuchsia-gradient)" }], [rawScore]);

  // Date helpers for charts
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
  }, []);

  const startOfWeek = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  // Prepare chart data for study hours
  const studyHoursChartData = useMemo(() => {
    return last7Days.map((date) => {
      const dateStr = date.toDateString();
      const mins = focusSessions
        .filter((s) => s.started_at && new Date(s.started_at).toDateString() === dateStr)
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      return {
        date: date.toLocaleDateString(undefined, { weekday: "short" }),
        hours: Math.round((mins / 60) * 10) / 10,
      };
    });
  }, [focusSessions, last7Days]);

  // Prepare chart data for tasks completed weekly
  const weeklyTasksChartData = useMemo(() => {
    return last7Days.map((date) => {
      const dateStr = date.toDateString();
      const count = tasks.filter(
        (t) => t.status === "done" && t.completed_at && new Date(t.completed_at).toDateString() === dateStr
      ).length;
      return {
        date: date.toLocaleDateString(undefined, { weekday: "short" }),
        tasks: count,
      };
    });
  }, [tasks, last7Days]);

  // Exclude archived and map active notes slice
  const notes = useMemo(() => {
    return (allNotes || [])
      .filter(n => !(n.tags && n.tags.includes("_archived_")))
      .slice(0, 3)
      .map(n => ({
        ...n,
        tags: n.tags ? n.tags.filter((t: string) => t !== "_archived_") : []
      }));
  }, [allNotes]);

  // Statistics calculations for Section 2 Weekly Summary
  const completedThisWeek = useMemo(() => {
    return tasks.filter(
      (t) => t.status === "done" && t.completed_at && new Date(t.completed_at) >= startOfWeek
    ).length;
  }, [tasks, startOfWeek]);

  const pendingTasksCount = useMemo(() => {
    return tasks.filter((t) => t.status !== "done").length;
  }, [tasks]);

  const upcomingExamsCount = useMemo(() => {
    return exams.filter(
      (e) => e.status === "upcoming" || new Date(e.exam_date) >= new Date()
    ).length;
  }, [exams]);

  const notesCreatedThisWeek = useMemo(() => {
    const active = (allNotes || []).filter(n => !(n.tags && n.tags.includes("_archived_")));
    return active.filter((n) => new Date(n.created_at) >= startOfWeek).length;
  }, [allNotes, startOfWeek]);

  // Daily targets mapping
  const dailyTargets = useMemo(() => {
    const todayStr = new Date().toDateString();
    
    // 1. Tasks due today
    const todayTasks = tasks
      .filter((t) => t.due_at && new Date(t.due_at).toDateString() === todayStr)
      .map((t) => ({
        id: `task-${t.id}`,
        title: `Task: ${t.title}`,
        completed: t.status === "done"
      }));

    // 2. Exams today
    const todayExams = exams
      .filter((e) => e.exam_date && new Date(e.exam_date).toDateString() === todayStr)
      .map((e) => ({
        id: `exam-${e.id}`,
        title: `Exam: ${e.title}`,
        completed: e.status === "completed"
      }));

    // 3. Study plans today
    const todayPlans = studyPlans
      .filter((sp) => sp.scheduled_for && new Date(sp.scheduled_for).toDateString() === todayStr)
      .map((sp) => ({
        id: `plan-${sp.id}`,
        title: `Study: ${sp.title}`,
        completed: sp.status === "completed"
      }));

    // 4. Active habits and check logs for today
    const todayHabits = habits
      .filter((h) => h.active)
      .map((h) => {
        const isCompleted = habitLogs.some((log) => log.habit_id === h.id);
        return {
          id: `habit-${h.id}`,
          title: `Habit: ${h.title}`,
          completed: isCompleted
        };
      });

    return [...todayTasks, ...todayExams, ...todayPlans, ...todayHabits];
  }, [tasks, exams, studyPlans, habits, habitLogs]);

  // Relative Time Formatter
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hrs ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "yesterday";
    return `${diffDays} days ago`;
  };

  // Activity Feed aggregate
  const allActivities = useMemo(() => {
    const activities: Array<{
      id: string;
      typeText: string;
      detailsText: string;
      timestamp: Date;
      displayTime: string;
    }> = [];

    // Note creation
    (allNotes || []).forEach((n) => {
      activities.push({
        id: `note-act-${n.id}`,
        typeText: "Created note",
        detailsText: n.title,
        timestamp: new Date(n.created_at),
        displayTime: getRelativeTime(new Date(n.created_at))
      });
    });

    // Exam added
    (exams || []).forEach((e) => {
      activities.push({
        id: `exam-act-${e.id}`,
        typeText: "Added exam",
        detailsText: e.title,
        timestamp: new Date(e.created_at),
        displayTime: getRelativeTime(new Date(e.created_at))
      });
    });

    // Task completed
    tasks.filter((t) => t.status === "done" && t.completed_at).forEach((t) => {
      activities.push({
        id: `task-act-${t.id}`,
        typeText: "Completed task",
        detailsText: t.title,
        timestamp: new Date(t.completed_at),
        displayTime: getRelativeTime(new Date(t.completed_at))
      });
    });

    // Focus session finished
    focusSessions.filter((s) => s.ended_at).forEach((s) => {
      activities.push({
        id: `focus-act-${s.id}`,
        typeText: "Finished focus session",
        detailsText: `${s.duration_minutes} mins`,
        timestamp: new Date(s.ended_at),
        displayTime: getRelativeTime(new Date(s.ended_at))
      });
    });

    // Habits checked off
    recentHabitLogs.forEach((hl) => {
      activities.push({
        id: `habit-act-${hl.id}`,
        typeText: "Checked off habit",
        detailsText: hl.habits?.title || "Daily Habit",
        timestamp: new Date(hl.completed_at),
        displayTime: getRelativeTime(new Date(hl.completed_at))
      });
    });

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }, [allNotes, exams, tasks, focusSessions, recentHabitLogs]);

  // Achievement Metadata Map
  const ACHIEVEMENT_METADATA: Record<string, { title: string; desc: string }> = {
    "streak_master": { title: "Streak Master", desc: "Maintain any daily habit for 5 days in a row." },
    "first_note": { title: "First Note", desc: "Create your first lecture note page." },
    "focus_pioneer": { title: "Focus Pioneer", desc: "Complete your first deep work session." },
    "exam_slayer": { title: "Exam Slayer", desc: "Complete an exam with your target score." },
  };

  const latestAchievement = useMemo(() => {
    if (achievements.length === 0) return null;
    const key = achievements[0].achievement_key;
    return ACHIEVEMENT_METADATA[key] || { title: key, desc: "Unlocked a special student badge!" };
  }, [achievements]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-5 w-40 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-44 rounded-2xl md:col-span-2" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Welcome Card & Quick Info */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-900/20 to-purple-900/10 p-6 md:col-span-2 shadow-glow"
        >
          {/* Glassmorphic lighting effect */}
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-500/10 blur-[80px]" />
          <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-fuchsia-500/10 blur-[80px]" />

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <Badge variant="neon" className="mb-4">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Active Session
              </Badge>
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                Welcome back, {profile?.full_name?.split(" ")[0] ?? "Student"}!
              </h2>
              <p className="mt-2 text-slate-300 max-w-lg text-sm sm:text-base">
                {profile?.university ? `${profile.department} at ${profile.university}` : "Setup your profile details in settings."}
              </p>
            </div>
            <div className="mt-8 border-t border-white/5 pt-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Daily Focus Quote</span>
              <p className="mt-1 text-xs sm:text-sm italic text-slate-400">&ldquo;{quote}&rdquo;</p>
            </div>
          </div>
        </motion.div>

        {/* 2. Productivity Score Radial Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col items-center justify-center text-center relative shadow-glow"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent rounded-3xl -z-10" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Productivity Score</h3>
          <div className="relative h-32 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="75%"
                outerRadius="100%"
                barSize={12}
                data={productivityScoreData}
                startAngle={225}
                endAngle={-45}
              >
                <defs>
                  <linearGradient id="cyan-fuchsia-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={10} angleAxisId={0} isAnimationActive={false} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{rawScore}%</span>
              <span className="text-[10px] text-cyan-300 uppercase tracking-widest mt-0.5">Optimal</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Based on active tasks completed, habit streaks, and goal compliance.
          </p>
        </motion.div>
      </div>

      {/* Grid for core dashboard widgets */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 3. Today's Tasks */}
        <Card className="border-white/10 bg-white/5 shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Today&apos;s Tasks</CardTitle>
              <CardDescription>Direct deadlines and status</CardDescription>
            </div>
            <CheckCircle2 className="h-5 w-5 text-cyan-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.filter((t) => t.status !== "done").slice(0, 3).length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                <CheckCircle2 className="mx-auto h-8 w-8 text-cyan-500/40 mb-2" />
                No pending tasks. Great job!
              </div>
            ) : (
              tasks.filter((t) => t.status !== "done").slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id, task.status)}
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-white/5 bg-slate-950/40 px-3.5 py-3 transition hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/20 group-hover:border-cyan-400" />
                    <span className="text-xs text-white truncate max-w-[150px]">{task.title}</span>
                  </div>
                  {task.subjects && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px]"
                      style={{ backgroundColor: `${task.subjects.color}15`, color: task.subjects.color }}
                    >
                      {task.subjects.name.slice(0, 8)}
                    </span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 4. Upcoming Exams */}
        <Card className="border-white/10 bg-white/5 shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Upcoming Exams</CardTitle>
              <CardDescription>Preparation timeline</CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-fuchsia-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            {exams.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                <BookOpen className="mx-auto h-8 w-8 text-fuchsia-500/40 mb-2" />
                No exams scheduled yet.
              </div>
            ) : (
              exams.slice(0, 3).map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/40 px-3.5 py-3"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-white">{exam.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(exam.exam_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      • Target: {exam.target_score ?? "—"}
                    </p>
                  </div>
                  {exam.subjects && (
                    <Badge
                      className="text-[9px]"
                      style={{ backgroundColor: `${exam.subjects.color}15`, color: exam.subjects.color }}
                    >
                      {exam.subjects.code ?? "EXAM"}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 5. Habit Progress */}
        <Card className="border-white/10 bg-white/5 shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Habit Progress</CardTitle>
              <CardDescription>Keep up your daily streaks</CardDescription>
            </div>
            <Flame className="h-5 w-5 text-orange-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            {habits.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                <Flame className="mx-auto h-8 w-8 text-orange-500/40 mb-2" />
                No habits configured.
              </div>
            ) : (
              habits.slice(0, 3).map((habit) => (
                <div
                  key={habit.id}
                  onClick={() => handleLogHabit(habit.id, habit.streak)}
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-white/5 bg-slate-950/40 px-3.5 py-3 transition hover:bg-white/5"
                >
                  <div>
                    <span className="text-xs text-white">{habit.title}</span>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                      <Flame className="h-3.5 w-3.5 text-orange-400" />
                      <span>{habit.streak} day streak</span>
                    </div>
                  </div>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300 transition group-hover:bg-cyan-400 group-hover:text-slate-950">
                    <Plus className="h-4 w-4" />
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 6. Study Hours Chart */}
        <Card className="border-white/10 bg-white/5 shadow-glow md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Study Hours</CardTitle>
              <CardDescription>Daily study times monitored this week</CardDescription>
            </div>
            <Clock3 className="h-5 w-5 text-cyan-300" />
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studyHoursChartData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    labelStyle={{ color: "#fff", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#22d3ee" fillOpacity={1} fill="url(#colorHours)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 7. Weekly Summary (Tasks Completed Chart) */}
        <Card className="border-white/10 bg-white/5 shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Weekly Summary</CardTitle>
              <CardDescription>Completed assignments</CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-fuchsia-400" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-[11px] leading-snug">
              <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Completed</span>
                <span className="text-base font-bold text-white mt-1 block">{completedThisWeek} Tasks</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Pending</span>
                <span className="text-base font-bold text-white mt-1 block">{pendingTasksCount} Tasks</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Upcoming Exams</span>
                <span className="text-base font-bold text-white mt-1 block">{upcomingExamsCount}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider">New Notes</span>
                <span className="text-base font-bold text-white mt-1 block">{notesCreatedThisWeek}</span>
              </div>
            </div>
            <div className="h-40 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTasksChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    labelStyle={{ color: "#fff", fontSize: "12px" }}
                  />
                  <Bar dataKey="tasks" fill="#d946ef" radius={[4, 4, 0, 0]} barSize={14} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 8. Recent Notes */}
        <Card className="border-white/10 bg-white/5 shadow-glow md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Recent Notes</CardTitle>
              <CardDescription>Quick access to your study logs</CardDescription>
            </div>
            <FileText className="h-5 w-5 text-amber-300" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {notes.length === 0 ? (
                <div className="sm:col-span-3 py-6 text-center text-sm text-slate-500">
                  <FileText className="mx-auto h-8 w-8 text-amber-500/40 mb-2" />
                  No notes yet. Create your first note.
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => router.push("/dashboard/notes")}
                    className="flex flex-col justify-between rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition hover:-translate-y-0.5 hover:bg-white/5 cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{note.title}</h4>
                        {note.subjects && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[9px]"
                            style={{ backgroundColor: `${note.subjects.color}15`, color: note.subjects.color }}
                          >
                            {note.subjects.name.slice(0, 10)}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-3 text-[11px] text-slate-400 leading-relaxed">
                        {note.content || "Empty note content."}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1">
                      {note.tags && note.tags.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="rounded bg-white/5 px-1.5 py-0.5 text-[8px] text-slate-500">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 9. Daily Goals, Activity Feed, and Achievements */}
        <div className="grid gap-6 md:grid-cols-3 md:col-span-3">
          {/* Daily Goals */}
          <Card className="border-white/10 bg-white/5 shadow-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Daily Targets</CardTitle>
              <Target className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent className="space-y-3.5">
              {dailyTargets.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  <Target className="mx-auto h-6 w-6 text-cyan-500/30 mb-1.5" />
                  No targets scheduled for today.
                </div>
              ) : (
                dailyTargets.slice(0, 3).map((target) => (
                  <div key={target.id} className="flex items-center justify-between text-xs text-slate-300">
                    <span className="truncate max-w-[150px]">{target.title}</span>
                    <Badge variant={target.completed ? "neon" : "outline"}>
                      {target.completed ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="border-white/10 bg-white/5 shadow-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Activity Feed</CardTitle>
              <Activity className="h-4 w-4 text-fuchsia-400" />
            </CardHeader>
            <CardContent className="space-y-3 max-h-[140px] overflow-y-auto">
              {allActivities.length === 0 ? (
                <div className="text-[11px] text-slate-500 py-4 text-center">
                  No recent activity.
                </div>
              ) : (
                allActivities.map((act) => (
                  <div key={act.id} className="text-[11px] text-slate-400 leading-snug">
                    <span className="font-semibold text-white">{act.typeText}</span> {act.detailsText} • <span className="text-[9px] text-slate-500">{act.displayTime}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Achievement Cards */}
          <Card className="border-white/10 bg-white/5 shadow-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Achievements</CardTitle>
              <Award className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              {latestAchievement ? (
                <>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{latestAchievement.title}</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">{latestAchievement.desc}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">No Achievements Yet</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Complete tasks and habits to unlock student medals.</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
