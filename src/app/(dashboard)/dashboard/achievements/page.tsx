"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Flame, Award, Lock, Sparkles, TrendingUp,
  Medal, Star, Calendar, ArrowRight, ShieldCheck, Zap
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BADGES, getXpProgress, getLevelFromXP, fetchUserProgress, unlockAchievement } from "@/lib/achievements";
import { Skeleton } from "@/components/ui/skeleton";

interface HistoryLog {
  id: string;
  achievement_key: string;
  unlocked_at: string;
  xp_earned: number;
}

export default function AchievementsPage() {
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [unlockedKeys, setUnlockedKeys] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [streak, setStreak] = useState(0);
  const [progress, setProgress] = useState<Record<string, { current: number; target: number }>>({});

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch Profile for XP / Level
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, level, onboarding_completed")
        .eq("id", user.id)
        .single();

      // Fetch Achievements
      const { data: unlocked } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: false });

      // Fetch Habits to calculate best streak
      const { data: habits } = await supabase
        .from("habits")
        .select("streak")
        .eq("user_id", user.id);

      const maxStreak = habits && habits.length > 0
        ? Math.max(...habits.map((h: any) => h.streak || 0))
        : 0;

      // Fetch all counts for badge validation
      const [
        { count: subjectsCount },
        { count: chaptersCount },
        { count: tasksCount },
        { count: focusCount },
        { count: resumesCount },
        { count: internshipsCount },
        { count: cpCount },
        { count: kaggleCount },
      ] = await Promise.all([
        supabase.from("subjects").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("chapters").select("*", { count: "exact", head: true }).eq("user_id", user.id).or("status.eq.completed,progress_pct.eq.100"),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "done"),
        supabase.from("focus_sessions").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("session_type", "pomodoro").not("ended_at", "is", null),
        supabase.from("resumes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("internship_applications").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("cp_problems").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("kaggle_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("entry_type", "competition"),
      ]);

      const badgeProgress: Record<string, { current: number; target: number }> = {
        first_steps: { current: profile?.onboarding_completed ? 1 : 0, target: 1 },
        subject_creator: { current: subjectsCount || 0, target: 1 },
        chapter_conqueror: { current: chaptersCount || 0, target: 1 },
        task_slayer: { current: tasksCount || 0, target: 5 },
        focus_guru: { current: focusCount || 0, target: 1 },
        streak_master: { current: maxStreak, target: 5 },
        resume_builder: { current: resumesCount || 0, target: 1 },
        intern_hunter: { current: internshipsCount || 0, target: 1 },
        cp_coder: { current: cpCount || 0, target: 1 },
        kaggle_competitor: { current: kaggleCount || 0, target: 1 },
      };

      setProgress(badgeProgress);

      const currentUnlocked = (unlocked || []).map((a: any) => a.achievement_key);
      let didUnlockNew = false;

      for (const badge of BADGES) {
        const prog = badgeProgress[badge.id];
        if (prog && prog.current >= prog.target) {
          if (!currentUnlocked.includes(badge.id)) {
            // Unlock it!
            const res = await unlockAchievement(badge.id);
            if (res && res.success) {
              didUnlockNew = true;
            }
          }
        }
      }

      let finalXp = profile?.xp || 0;
      let finalLevel = profile?.level || getLevelFromXP(finalXp);
      let finalUnlocked = unlocked || [];

      if (didUnlockNew) {
        const { data: updatedProfile } = await supabase
          .from("profiles")
          .select("xp, level")
          .eq("id", user.id)
          .single();
        if (updatedProfile) {
          finalXp = updatedProfile.xp;
          finalLevel = updatedProfile.level;
        }

        const { data: updatedUnlocked } = await supabase
          .from("user_achievements")
          .select("*")
          .eq("user_id", user.id)
          .order("unlocked_at", { ascending: false });
        if (updatedUnlocked) {
          finalUnlocked = updatedUnlocked;
        }
      }

      setStreak(maxStreak);
      setXp(finalXp);
      setLevel(finalLevel);
      setUnlockedKeys(finalUnlocked.map((a: any) => a.achievement_key));
      setHistory(finalUnlocked);
    } catch (error) {
      console.error("Failed to load achievements data", error);
    } finally {
      setLoading(false);
    }
  }

  const xpProgress = getXpProgress(xp);

  // Category Colors/Icons map
  const categoryMeta: Record<string, { color: string; bg: string; border: string }> = {
    study: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    tasks: { color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
    habits: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    focus: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    career: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    general: { color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-44 rounded-2xl md:col-span-2" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Trophy className="h-8 w-8 text-amber-400" />
          Achievements & Gamification
        </h1>
        <p className="text-slate-400">Complete tasks, study subjects, and form habits to gain XP, unlock badges, and level up!</p>
      </div>

      {/* Profile XP Progress & Streaks Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Level Progress Card */}
        <Card className="md:col-span-2 border-white/10 bg-white/5 shadow-glow backdrop-blur-md overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-fuchsia-500/5 pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 font-medium flex justify-between items-center">
              <span>LEVEL {level} PROGRESS</span>
              <span className="text-cyan-400 text-xs font-semibold">{xpProgress.currentLevelXp} / {xpProgress.nextLevelXp} XP</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-white font-display text-2xl font-bold shadow-lg">
                {level}
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-300 animate-pulse" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Level {level}</span>
                  <span>Level {level + 1}</span>
                </div>
                <div className="relative h-3 w-full rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress.pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-cyan-400" /> Total XP Earned: {xp}</span>
              <span className="flex items-center gap-1"><Medal className="h-3.5 w-3.5 text-fuchsia-400" /> Badges Unlocked: {unlockedKeys.length} / {BADGES.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Streaks Card */}
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md overflow-hidden relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 font-medium">CURRENT STREAKS</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center py-4 text-center">
            <div className="relative flex items-center justify-center mb-2">
              <Flame className="h-14 w-14 text-orange-500 animate-pulse filter drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
              <span className="absolute text-white font-display text-lg font-bold mt-1.5">{streak}</span>
            </div>
            <h3 className="text-white font-bold text-sm">Best Habit Streak</h3>
            <p className="text-xs text-slate-400 max-w-[150px] mt-1">Keep checking off habits daily to extend your streak!</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Badges Gallery</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {BADGES.map((badge) => {
            const isUnlocked = unlockedKeys.includes(badge.id);
            const meta = categoryMeta[badge.category] || categoryMeta.general;

            return (
              <motion.div
                key={badge.id}
                whileHover={isUnlocked ? { scale: 1.03, y: -2 } : {}}
                className={`relative rounded-2xl border p-4 backdrop-blur-md transition-all ${
                  isUnlocked
                    ? `border-white/10 bg-white/5 shadow-glow`
                    : "border-white/5 bg-white/[0.01] opacity-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl ${isUnlocked ? meta.bg : "bg-white/5"} ${isUnlocked ? meta.color : "text-slate-600"}`}>
                    <Award className="h-6 w-6" />
                  </div>
                  {isUnlocked ? (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className={`text-sm font-semibold transition ${isUnlocked ? "text-white" : "text-slate-500"}`}>{badge.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[32px]">{badge.description}</p>
                  
                  {/* Badge Progress Bar */}
                  {(() => {
                    const prog = progress[badge.id] || { current: 0, target: 1 };
                    const displayCurrent = Math.min(prog.current, prog.target);
                    const pct = Math.min((prog.current / prog.target) * 100, 100);
                    return (
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Progress</span>
                          <span>{displayCurrent} / {prog.target}</span>
                        </div>
                        <Progress value={pct} className="h-1.5 bg-white/5" />
                      </div>
                    );
                  })()}
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="capitalize">{badge.category}</span>
                  <span className="font-semibold text-cyan-400">+{badge.xpReward} XP</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* History Log */}
      <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-fuchsia-400" /> Unlock History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              No achievements unlocked yet. Keep working to gain your first badge!
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((log) => {
                const badge = BADGES.find(b => b.id === log.achievement_key);
                return (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-950/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                        <Star className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block">{badge?.title || log.achievement_key}</span>
                        <span className="text-[10px] text-slate-500">{new Date(log.unlocked_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400">+{log.xp_earned} XP</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
