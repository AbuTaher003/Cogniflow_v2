import { createClient } from "@/lib/supabase/client";
import { getAchievementUnlockEmail, sendMockEmail } from "@/lib/email/templates";

export interface Badge {
  id: string;
  title: string;
  description: string;
  category: "study" | "tasks" | "habits" | "focus" | "career" | "general";
  xpReward: number;
}

export const BADGES: Badge[] = [
  { id: "first_steps", title: "First Steps", description: "Complete onboarding and setup your profile", category: "general", xpReward: 100 },
  { id: "subject_creator", title: "Planner Architect", description: "Create your first subject in Study Planner", category: "study", xpReward: 150 },
  { id: "chapter_conqueror", title: "Chapter Conqueror", description: "Complete study of your first chapter", category: "study", xpReward: 200 },
  { id: "task_slayer", title: "Task Slayer", description: "Complete 5 tasks on your Kanban board", category: "tasks", xpReward: 200 },
  { id: "focus_guru", title: "Focus Guru", description: "Complete a Pomodoro session in Focus Mode", category: "focus", xpReward: 250 },
  { id: "streak_master", title: "Streak Master", description: "Maintain a 5-day habit streak", category: "habits", xpReward: 300 },
  { id: "resume_builder", title: "Resume Ready", description: "Build and print your first resume", category: "career", xpReward: 200 },
  { id: "intern_hunter", title: "Intern Hunter", description: "Track your first internship application", category: "career", xpReward: 150 },
  { id: "cp_coder", title: "CP Coder", description: "Track your first competitive programming problem", category: "general", xpReward: 150 },
  { id: "kaggle_competitor", title: "Data Scientist", description: "Log your first Kaggle competition entry", category: "career", xpReward: 200 }
];

// 1000 XP per level scaling
export function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 1000) + 1;
}

export function getXpProgress(xp: number) {
  const level = getLevelFromXP(xp);
  const prevLevelXp = (level - 1) * 1000;
  const nextLevelXp = level * 1000;
  const currentLevelProgress = xp - prevLevelXp;
  const pct = Math.min(Math.max((currentLevelProgress / 1000) * 100, 0), 100);

  return {
    level,
    currentLevelXp: currentLevelProgress,
    nextLevelXp: 1000,
    pct,
    totalXp: xp
  };
}

export async function fetchUserProgress() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { xp: 0, level: 1, achievements: [] };

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", user.id)
    .single();

  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_key")
    .eq("user_id", user.id);

  const xp = profile?.xp || 0;
  const level = profile?.level || getLevelFromXP(xp);
  const achievements = (unlocked || []).map((a: any) => a.achievement_key);

  return {
    xp,
    level,
    achievements
  };
}

export async function awardXP(amount: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp")
    .eq("id", user.id)
    .single();

  const currentXp = profile?.xp || 0;
  const newXp = currentXp + amount;
  const newLevel = getLevelFromXP(newXp);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      xp: newXp,
      level: newLevel,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error awarding XP:", error);
    return null;
  }

  // Check if level up occurred and notify/save
  return {
    xp: newXp,
    level: newLevel,
    leveledUp: newLevel > (profile?.level || 1)
  };
}

export async function unlockAchievement(key: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, alreadyUnlocked: true };

  // Check if already unlocked
  const { data: existing } = await supabase
    .from("user_achievements")
    .select("id")
    .eq("user_id", user.id)
    .eq("achievement_key", key)
    .maybeSingle();

  if (existing) {
    return { success: false, alreadyUnlocked: true };
  }

  const badge = BADGES.find(b => b.id === key);
  const xpReward = badge?.xpReward || 50;

  const { error } = await supabase
    .from("user_achievements")
    .insert({
      user_id: user.id,
      achievement_key: key,
      xp_earned: xpReward
    });

  if (error) {
    console.error("Error unlocking achievement:", error);
    return { success: false, error };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const xpResult = await awardXP(xpReward);

  if (badge) {
    try {
      const emailTemplate = getAchievementUnlockEmail(profile?.full_name || "Student", badge.title, xpReward);
      await sendMockEmail("Achievement Unlock", user.email || "", emailTemplate);
    } catch (emailErr) {
      console.error("Failed to send achievement unlock email:", emailErr);
    }
  }

  return {
    success: true,
    alreadyUnlocked: false,
    xpReward,
    leveledUp: xpResult?.leveledUp || false,
    newLevel: xpResult?.level || 1
  };
}
