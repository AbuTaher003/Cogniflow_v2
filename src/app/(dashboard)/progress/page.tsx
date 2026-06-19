"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis
} from "recharts";
import {
  TrendingUp, Award, BookOpen, Clock, CheckCircle2,
  FileText, Percent, Target, Zap, AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [cgpaPredictions, setCgpaPredictions] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    async function loadProgressData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      // Fetch Subjects
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user.id);
      setSubjects(subjectsData || []);

      // Fetch Chapters
      const { data: chaptersData } = await supabase
        .from("chapters")
        .select("*")
        .eq("user_id", user.id);
      setChapters(chaptersData || []);

      // Fetch Exams
      const { data: examsData } = await supabase
        .from("exams")
        .select("*, subjects(name, code, color)")
        .eq("user_id", user.id);
      setExams(examsData || []);

      // Fetch Tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id);
      setTasks(tasksData || []);

      // Fetch Analytics
      const { data: analyticsData } = await supabase
        .from("analytics")
        .select("*")
        .eq("user_id", user.id)
        .order("metric_date", { ascending: true });
      setAnalytics(analyticsData || []);

      // Fetch CGPA Predictions
      const { data: cgpaPredict } = await supabase
        .from("cgpa_predictions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      setCgpaPredictions(cgpaPredict || []);

      setLoading(false);
    }
    loadProgressData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1. Calculate Consistency Score (based on productivity score average in analytics, fallback to completed habits/tasks)
  const consistencyScore = useMemo(() => {
    if (analytics.length === 0) return 75; // default fallback
    const sum = analytics.reduce((acc, curr) => acc + (curr.productivity_score || 0), 0);
    return Math.round(sum / analytics.length);
  }, [analytics]);

  // 2. Calculate Exam Readiness
  // Averaging the progress_pct of chapters associated with its subject
  const examReadinessList = useMemo(() => {
    return exams
      .filter((exam) => new Date(exam.exam_date) >= new Date(new Date().setHours(0, 0, 0, 0)))
      .map((exam) => {
        const subjectChapters = chapters.filter((c) => c.subject_id === exam.subject_id);
        let readiness = 0;
        if (subjectChapters.length > 0) {
          const sumPct = subjectChapters.reduce((acc, c) => acc + c.progress_pct, 0);
          readiness = Math.round(sumPct / subjectChapters.length);
        } else {
          // If no chapters defined, base on completed tasks of that subject
          const subjectTasks = tasks.filter((t) => t.subject_id === exam.subject_id);
          if (subjectTasks.length > 0) {
            const completed = subjectTasks.filter((t) => t.status === "done").length;
            readiness = Math.round((completed / subjectTasks.length) * 100);
          } else {
            readiness = 50; // standard base readiness
          }
        }

        return {
          id: exam.id,
          title: exam.title,
          subjectName: exam.subjects?.name || "Subject",
          subjectCode: exam.subjects?.code || "EXAM",
          subjectColor: exam.subjects?.color || "#3B82F6",
          readiness,
          examDate: exam.exam_date,
        };
      });
  }, [exams, chapters, tasks]);

  const overallReadiness = useMemo(() => {
    if (examReadinessList.length === 0) return 65; // fallback
    const sum = examReadinessList.reduce((acc, curr) => acc + curr.readiness, 0);
    return Math.round(sum / examReadinessList.length);
  }, [examReadinessList]);

  // 3. CGPA Target vs Progress
  const targetCGPA = profile?.target_cgpa || 3.8;
  const projectedCGPA = useMemo(() => {
    if (cgpaPredictions.length > 0) {
      return cgpaPredictions[cgpaPredictions.length - 1].predicted_cgpa;
    }
    // calculate simple prediction based on exams achieve scores vs target scores
    const achievedExams = exams.filter((e) => e.achieved_score !== null);
    if (achievedExams.length > 0) {
      const sumAchieved = achievedExams.reduce((acc, e) => acc + Number(e.achieved_score), 0);
      const sumTarget = achievedExams.reduce((acc, e) => acc + Number(e.target_score || 100), 0);
      const performanceRatio = sumAchieved / sumTarget;
      return Math.min(Math.round((targetCGPA * performanceRatio) * 100) / 100, 4.0);
    }
    return 3.65; // standard fallback
  }, [cgpaPredictions, exams, targetCGPA]);

  const cgpaGaugeData = useMemo(() => {
    return [
      {
        name: "Projected",
        value: projectedCGPA,
        fill: "url(#cyan-fuchsia-gradient)"
      }
    ];
  }, [projectedCGPA]);

  // 4. Study hours and task completion charts data
  const weeklyAnalyticsData = useMemo(() => {
    if (analytics.length > 0) {
      return analytics.map((a) => ({
        date: new Date(a.metric_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        hours: Math.round((a.study_minutes / 60) * 10) / 10,
        tasks: a.completed_tasks,
        score: a.productivity_score,
      }));
    }
    // default visual mockup data
    return [
      { date: "Mon", hours: 2.5, tasks: 2, score: 65 },
      { date: "Tue", hours: 4.0, tasks: 4, score: 85 },
      { date: "Wed", hours: 1.5, tasks: 1, score: 50 },
      { date: "Thu", hours: 5.5, tasks: 5, score: 95 },
      { date: "Fri", hours: 3.0, tasks: 3, score: 75 },
      { date: "Sat", hours: 2.0, tasks: 1, score: 60 },
      { date: "Sun", hours: 3.5, tasks: 4, score: 80 },
    ];
  }, [analytics]);

  // 5. Subject Cards Calculation
  const subjectProgressCards = useMemo(() => {
    return subjects.map((sub) => {
      const subChapters = chapters.filter((c) => c.subject_id === sub.id);
      const subExams = exams.filter((e) => e.subject_id === sub.id);
      const subTasks = tasks.filter((t) => t.subject_id === sub.id);

      const completionPct = subChapters.length > 0
        ? Math.round(subChapters.reduce((acc, c) => acc + c.progress_pct, 0) / subChapters.length)
        : 0;

      const pendingTasksCount = subTasks.filter((t) => t.status !== "done").length;

      return {
        id: sub.id,
        name: sub.name,
        code: sub.code,
        color: sub.color || "#8B5CF6",
        credits: sub.credits,
        chaptersCount: subChapters.length,
        examsCount: subExams.length,
        pendingTasksCount,
        completionPct,
      };
    });
  }, [subjects, chapters, exams, tasks]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl md:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-cyan-400" /> Progress Tracker
          </h1>
          <p className="text-slate-400 mt-1">
            Visual statistics of syllabus readiness, GPA forecasts, and study routine consistency.
          </p>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Consistency */}
        <Card className="border-white/10 bg-white/5 shadow-glow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Consistency Score</span>
              <h3 className="text-2xl font-bold text-white mt-1">{consistencyScore}%</h3>
            </div>
          </CardContent>
        </Card>

        {/* Readiness */}
        <Card className="border-white/10 bg-white/5 shadow-glow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-300">
              <Percent className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Exam Readiness</span>
              <h3 className="text-2xl font-bold text-white mt-1">{overallReadiness}%</h3>
            </div>
          </CardContent>
        </Card>

        {/* CGPA Projection */}
        <Card className="border-white/10 bg-white/5 shadow-glow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Projected CGPA</span>
              <h3 className="text-2xl font-bold text-white mt-1">{projectedCGPA} <span className="text-xs text-slate-500">/ 4.0</span></h3>
            </div>
          </CardContent>
        </Card>

        {/* Total Study hours logged */}
        <Card className="border-white/10 bg-white/5 shadow-glow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Study Mapped</span>
              <h3 className="text-2xl font-bold text-white mt-1">
                {Math.round(chapters.reduce((acc, curr) => acc + curr.estimated_minutes, 0) / 60)} hrs
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Study Routine Area Chart */}
        <Card className="border-white/10 bg-white/5 shadow-glow md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-300" /> Routine History
            </CardTitle>
            <CardDescription>Daily monitored study hours and completed tasks logs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyAnalyticsData}>
                  <defs>
                    <linearGradient id="colorHoursProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "16px" }}
                    labelStyle={{ color: "#fff", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="hours" name="Study Hours" stroke="#22d3ee" fillOpacity={1} fill="url(#colorHoursProgress)" strokeWidth={2} isAnimationActive={false} />
                  <Line type="monotone" dataKey="tasks" name="Tasks Done" stroke="#d946ef" strokeWidth={2} dot={{ fill: "#d946ef" }} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* CGPA target vs progress radial gauge */}
        <Card className="border-white/10 bg-white/5 shadow-glow flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-4 w-4 text-fuchsia-300" /> CGPA Target alignment
            </CardTitle>
            <CardDescription>Matching target goals with projected grades.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pb-8">
            <div className="relative h-44 w-full max-w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="80%"
                  outerRadius="105%"
                  barSize={12}
                  data={cgpaGaugeData}
                  startAngle={225}
                  endAngle={-45}
                >
                  <defs>
                    <linearGradient id="cyan-fuchsia-gradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                  </defs>
                  <PolarAngleAxis type="number" domain={[0, 4.0]} angleAxisId={0} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={10} angleAxisId={0} isAnimationActive={false} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white">{projectedCGPA}</span>
                <span className="text-[10px] text-cyan-300 uppercase tracking-widest mt-1">Projected</span>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-4 w-full justify-around border-t border-white/5 pt-4">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Target Goal</span>
                <span className="text-sm font-bold text-white">{targetCGPA}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Margin Difference</span>
                <span className={`text-sm font-bold ${projectedCGPA >= targetCGPA ? "text-emerald-400" : "text-amber-400"}`}>
                  {projectedCGPA >= targetCGPA ? "+" : ""}
                  {Math.round((projectedCGPA - targetCGPA) * 100) / 100}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam Readiness progress checklist */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Readiness indicators list */}
        <Card className="border-white/10 bg-white/5 shadow-glow lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Exam Readiness
            </CardTitle>
            <CardDescription>Readiness index calculated from subject chapter completions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {examReadinessList.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                <AlertCircle className="mx-auto h-8 w-8 text-slate-500/30 mb-2" />
                No upcoming exams found. Setup exams to track specific readiness.
              </div>
            ) : (
              examReadinessList.map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-3 relative overflow-hidden"
                >
                  <span
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: exam.subjectColor }}
                  />
                  <div className="flex items-start justify-between gap-2 pl-2">
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[140px]">{exam.title}</h4>
                      <span className="text-[9px] text-slate-500 block mt-0.5">{exam.subjectName}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                      {exam.readiness}% Ready
                    </Badge>
                  </div>
                  <div className="pl-2">
                    <Progress value={exam.readiness} className="h-1.5 bg-white/5" />
                    <p className="text-[9px] text-slate-500 mt-2">
                      Exam Date: {new Date(exam.examDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Subject wise cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-white px-1">Subject Progress breakdown</h3>
          {subjectProgressCards.length === 0 ? (
            <Card className="border-white/10 bg-white/5 shadow-glow p-8 text-center text-slate-500">
              <BookOpen className="mx-auto h-10 w-10 text-slate-500/30 mb-2" />
              <p className="text-sm">No subjects enrolled. Add subjects in Study Planner to begin.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {subjectProgressCards.map((sub) => (
                <Card
                  key={sub.id}
                  className="border-white/10 bg-white/5 shadow-glow relative overflow-hidden group hover:border-white/20 transition-all duration-300"
                >
                  {/* Decorative backdrop glow */}
                  <span
                    className="absolute -right-8 -top-8 h-20 w-20 rounded-full blur-[40px] opacity-10"
                    style={{ backgroundColor: sub.color }}
                  />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {sub.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {sub.code || "SUBJECT"} • {sub.credits} Credits
                        </span>
                      </div>
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3.5">
                    {/* Completion bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Syllabus Completion</span>
                        <span className="font-bold text-white">{sub.completionPct}%</span>
                      </div>
                      <Progress value={sub.completionPct} className="h-1.5 bg-white/5" />
                    </div>

                    <div className="flex gap-4 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                      <div>
                        <span className="font-bold text-white block">{sub.chaptersCount}</span>
                        Chapters
                      </div>
                      <div>
                        <span className="font-bold text-white block">{sub.examsCount}</span>
                        Exams
                      </div>
                      <div>
                        <span className={`font-bold block ${sub.pendingTasksCount > 0 ? "text-cyan-300" : "text-white"}`}>
                          {sub.pendingTasksCount}
                        </span>
                        Pending Tasks
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
