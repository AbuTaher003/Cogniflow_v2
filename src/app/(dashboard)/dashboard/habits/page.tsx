"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Plus, Trash2, Edit2, Check, Sparkles, Trophy,
  BarChart, Calendar, Award, CheckCircle2, ChevronRight, X, CheckSquare
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function HabitsPage() {
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<any[]>([]);
  const [habitLogs, setHabitLogs] = useState<any[]>([]);
  
  // Modals state
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);

  // Form fields
  const [habitTitle, setHabitTitle] = useState("");
  const [habitDesc, setHabitDesc] = useState("");
  const [habitFrequency, setHabitFrequency] = useState("daily"); // daily, weekly, custom
  const [habitTarget, setHabitTarget] = useState(1);
  const [habitColor, setHabitColor] = useState("#22C55E");
  const [habitCategory, setHabitCategory] = useState("study");

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: habitsData } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id);

      const { data: logsData } = await supabase
        .from("habit_logs")
        .select("*")
        .eq("user_id", user.id);

      setHabits(habitsData || []);
      setHabitLogs(logsData || []);
      setLoading(false);
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle log completion for TODAY
  const handleToggleHabit = async (habit: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const existingLog = habitLogs.find(
      l => l.habit_id === habit.id && l.completed_at.split("T")[0] === todayStr
    );

    if (existingLog) {
      // Uncheck (remove log)
      const { error } = await supabase
        .from("habit_logs")
        .delete()
        .eq("id", existingLog.id);

      if (!error) {
        setHabitLogs(prev => prev.filter(l => l.id !== existingLog.id));
        // Recalculate streak
        const nextStreak = Math.max(0, habit.streak - 1);
        await supabase
          .from("habits")
          .update({ streak: nextStreak })
          .eq("id", habit.id);
        setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, streak: nextStreak } : h));
      }
    } else {
      // Check (create log)
      const payload = {
        user_id: user.id,
        habit_id: habit.id,
        completed_at: new Date().toISOString(),
        count: 1
      };

      const { data: newLog, error } = await supabase
        .from("habit_logs")
        .insert(payload)
        .select()
        .single();

      if (!error && newLog) {
        setHabitLogs(prev => [...prev, newLog]);
        // Increment streak
        const nextStreak = habit.streak + 1;
        const nextBest = Math.max(habit.best_streak, nextStreak);
        await supabase
          .from("habits")
          .update({ streak: nextStreak, best_streak: nextBest })
          .eq("id", habit.id);
        setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, streak: nextStreak, best_streak: nextBest } : h));
      }
    }
  };

  // CRUD habit operations
  const handleOpenHabitModal = (habit: any = null) => {
    if (habit) {
      setEditingHabit(habit);
      setHabitTitle(habit.title);
      setHabitDesc(habit.description || "");
      setHabitFrequency(habit.frequency);
      setHabitTarget(habit.target_count || 1);
      setHabitColor(habit.color || "#22C55E");
      setHabitCategory(habit.category || "study");
    } else {
      setEditingHabit(null);
      setHabitTitle("");
      setHabitDesc("");
      setHabitFrequency("daily");
      setHabitTarget(1);
      setHabitColor("#22C55E");
      setHabitCategory("study");
    }
    setHabitModalOpen(true);
  };

  const handleSaveHabit = async () => {
    if (!habitTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      title: habitTitle,
      description: habitDesc || null,
      frequency: habitFrequency,
      target_count: habitTarget,
      color: habitColor,
      category: habitCategory,
      active: true
    };

    if (editingHabit) {
      const { error } = await supabase
        .from("habits")
        .update(payload)
        .eq("id", editingHabit.id);

      if (!error) {
        setHabits(prev => prev.map(h => h.id === editingHabit.id ? { ...h, ...payload } : h));
      }
    } else {
      const { data, error } = await supabase
        .from("habits")
        .insert({
          ...payload,
          streak: 0,
          best_streak: 0
        })
        .select()
        .single();

      if (!error && data) {
        setHabits(prev => [...prev, data]);
      }
    }
    setHabitModalOpen(false);
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (confirm("Are you sure you want to delete this habit and all its logged history?")) {
      const { error } = await supabase.from("habits").delete().eq("id", habitId);
      if (!error) {
        setHabits(prev => prev.filter(h => h.id !== habitId));
        setHabitLogs(prev => prev.filter(l => l.habit_id !== habitId));
      }
    }
  };

  // Check if completed today helper
  const isCompletedToday = (habitId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    return habitLogs.some(
      l => l.habit_id === habitId && l.completed_at.split("T")[0] === todayStr
    );
  };

  // Generate GitHub-Style heatmap data (last 24 weeks / 168 days)
  const getHeatmapGrid = () => {
    const grid = [];
    const today = new Date();
    
    // Create 24 columns representing weeks
    for (let w = 23; w >= 0; w--) {
      const weekCols = [];
      for (let d = 0; d < 7; d++) {
        // Calculate offset day
        const offset = (w * 7) + (6 - d);
        const cellDate = new Date(today.getTime() - offset * 86400000);
        const cellDateStr = cellDate.toISOString().split("T")[0];
        
        // Count completions on this date
        const dayLogs = habitLogs.filter(l => l.completed_at.split("T")[0] === cellDateStr);
        const dayCompletions = dayLogs.length;

        weekCols.push({
          date: cellDateStr,
          count: dayCompletions,
          totalActive: habits.length || 3 // Fallback total
        });
      }
      grid.push(weekCols);
    }
    return grid;
  };

  const heatmapGrid = getHeatmapGrid();

  // Color intensities based on completion percentage on a cell date
  const getIntensityClass = (count: number, total: number) => {
    if (count === 0) return "bg-white/5 border-white/5";
    const ratio = count / total;
    if (ratio <= 0.33) return "bg-emerald-500/20 border-emerald-500/10";
    if (ratio <= 0.66) return "bg-emerald-500/50 border-emerald-500/30 animate-pulse";
    return "bg-emerald-400 border-emerald-400 shadow-glow shadow-emerald-950/40";
  };

  // Streak summaries
  const bestStreakOverall = habits.length > 0 ? Math.max(...habits.map(h => h.best_streak)) : 0;
  const currentStreakOverall = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Habit Ledger</h1>
          <p className="text-slate-400">Log consistency streaks, schedule daily triggers, and observe contribution heatmaps.</p>
        </div>
        <Button onClick={() => handleOpenHabitModal()} variant="primary" size="lg">
          <Plus className="mr-2 h-4 w-4" /> Add Habit
        </Button>
      </div>

      {/* GitHub-style Contribution Heatmap */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-glow">
        <CardHeader className="px-0 pt-0 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            Productivity Contribution Grid (Last 24 Weeks)
          </CardTitle>
          <CardDescription>Visual heatmap tracking all check-in metrics logged per day.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 flex flex-col items-center">
          {/* Heatmap Grid Wrapper */}
          <div className="flex gap-1.5 overflow-x-auto w-full max-w-full pb-2 select-none justify-start sm:justify-center">
            {heatmapGrid.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5 shrink-0">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    className={`h-[15px] w-[15px] rounded border transition-all duration-150 ${getIntensityClass(day.count, day.totalActive)}`}
                    title={`${day.date}: ${day.count} check-ins`}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold mt-4">
            <span>Less consistent</span>
            <div className="h-3 w-3 rounded bg-white/5 border border-white/5" />
            <div className="h-3 w-3 rounded bg-emerald-500/20" />
            <div className="h-3 w-3 rounded bg-emerald-500/50" />
            <div className="h-3 w-3 rounded bg-emerald-400 shadow-glow" />
            <span>More consistent</span>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Current Best Streak */}
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">Current Best Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{currentStreakOverall} days</span>
              <span className="text-xs text-slate-500">active consistency</span>
            </div>
            <p className="mt-4 text-xs text-slate-400">Stretch your boundaries by checking items today.</p>
          </CardContent>
        </Card>

        {/* Record Streak */}
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">All-Time Record</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{bestStreakOverall} days</span>
              <span className="text-xs text-slate-500">personal best streak</span>
            </div>
            <p className="mt-4 text-xs text-slate-400">Maintain targets to secure new achievements.</p>
          </CardContent>
        </Card>

        {/* Completion rate overall */}
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">Habit count</CardTitle>
              <CheckSquare className="h-4 w-4 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{habits.length}</span>
              <span className="text-xs text-slate-500">habits monitored</span>
            </div>
            <p className="mt-4 text-xs text-slate-400">Supports daily, weekly, and monthly frequencies.</p>
          </CardContent>
        </Card>
      </div>

      {/* Habit List */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-glow">
        <CardHeader className="px-0 pt-0 pb-4">
          <CardTitle>Habits Ledger</CardTitle>
          <CardDescription>Click checkmarks to complete today's targets.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          {habits.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-12">No habits configured. Click Add Habit to build schedules.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {habits.map(habit => {
                const checked = isCompletedToday(habit.id);
                return (
                  <div 
                    key={habit.id}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition-all hover:bg-slate-950/60"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: habit.color }} />
                        {habit.title}
                      </h4>
                      {habit.description && (
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{habit.description}</p>
                      )}
                      
                      <div className="flex items-center gap-3 mt-3 text-[10px]">
                        <span className="text-slate-500 uppercase font-semibold">{habit.frequency}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-orange-400 flex items-center gap-0.5 font-bold">
                          <Flame className="h-3.5 w-3.5" /> {habit.streak} day streak (Best: {habit.best_streak})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Check Button */}
                      <button
                        onClick={() => handleToggleHabit(habit)}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition-all duration-150 ${
                          checked 
                            ? "bg-emerald-500 text-slate-950 border-emerald-500 scale-105" 
                            : "border-white/10 text-slate-500 hover:border-cyan-400 hover:text-white"
                        }`}
                      >
                        <Check className="h-4.5 w-4.5" />
                      </button>

                      {/* Edit actions */}
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => handleOpenHabitModal(habit)}
                          className="p-1 rounded text-slate-500 hover:text-white transition"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="p-1 rounded text-rose-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* HABIT CREATE / EDIT DIALOG */}
      <Dialog open={habitModalOpen} onOpenChange={setHabitModalOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingHabit ? "Edit Habit Card" : "Add Habit Card"}</DialogTitle>
            <DialogDescription>Setup daily goals, track streaking milestones, and assign colors.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Habit Title</label>
              <Input placeholder="E.g., Read for 30 minutes" value={habitTitle} onChange={e => setHabitTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Description</label>
              <Input placeholder="Add descriptive notes..." value={habitDesc} onChange={e => setHabitDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Frequency</label>
                <Select value={habitFrequency} onValueChange={setHabitFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Category</label>
                <Select value={habitCategory} onValueChange={setHabitCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study">Study</SelectItem>
                    <SelectItem value="health">Health & Body</SelectItem>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="leisure">Leisure & Mind</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">Intensity Color Tag</label>
              <div className="flex gap-2.5">
                {["#22C55E", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#EF4444"].map(c => (
                  <button 
                    key={c}
                    type="button"
                    onClick={() => setHabitColor(c)}
                    className={`h-7 w-7 rounded-full transition hover:scale-105 border-2 ${
                      habitColor === c ? "border-white scale-105" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setHabitModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveHabit}>Save Habit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
