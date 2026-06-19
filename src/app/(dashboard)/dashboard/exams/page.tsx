"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, Edit2, Trash2, Calendar, Clock, AlertTriangle,
  Award, TrendingUp, BarChart3, ChevronDown, CheckCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ExamsPage() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Modals state
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);

  // Form fields
  const [examTitle, setExamTitle] = useState("");
  const [examSubjectId, setExamSubjectId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("");
  const [examType, setExamType] = useState("midterm");
  const [examImportance, setExamImportance] = useState("medium"); // low, medium, high
  const [targetScore, setTargetScore] = useState("90");
  const [achievedScore, setAchievedScore] = useState("");
  const [examStatus, setExamStatus] = useState("upcoming");

  // Countdown clock state
  const [countdownText, setCountdownText] = useState("No upcoming exams");

  const supabase = createClient();

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: examsData } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", user.id)
      .order("exam_date", { ascending: true });

    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("*")
      .eq("user_id", user.id);

    const mappedExams = (examsData || []).map(e => ({
      ...e,
      importance_level: e.coverage || "medium"
    }));

    setExams(mappedExams);
    setSubjects(subjectsData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      loadData();
    };
    window.addEventListener("dashboard-refresh", handleRefresh);
    return () => window.removeEventListener("dashboard-refresh", handleRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ticking countdown clock calculation
  useEffect(() => {
    if (exams.length === 0) {
      setCountdownText("No upcoming exams");
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const upcoming = exams
        .filter(e => e.status === "upcoming" && new Date(`${e.exam_date}T${e.exam_time || "09:00:00"}`).getTime() > now)
        .sort((a, b) => new Date(`${a.exam_date}T${a.exam_time || "09:00:00"}`).getTime() - new Date(`${b.exam_date}T${b.exam_time || "09:00:00"}`).getTime());

      if (upcoming.length === 0) {
        setCountdownText("No immediate exams scheduled");
        clearInterval(interval);
        return;
      }

      const nextExam = upcoming[0];
      const examTimeMs = new Date(`${nextExam.exam_date}T${nextExam.exam_time || "09:00:00"}`).getTime();
      const difference = examTimeMs - now;

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdownText(`${days}d ${hours}h ${minutes}m ${seconds}s until ${nextExam.title}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [exams]);

  // Exam CRUD
  const handleOpenExamModal = (exam: any = null) => {
    if (exam) {
      setEditingExam(exam);
      setExamTitle(exam.title);
      setExamSubjectId(exam.subject_id);
      setExamDate(exam.exam_date);
      setExamTime(exam.exam_time || "09:00:00");
      setExamType(exam.exam_type);
      setExamImportance(exam.importance_level || "medium");
      setTargetScore(String(exam.target_score || 90));
      setAchievedScore(exam.achieved_score ? String(exam.achieved_score) : "");
      setExamStatus(exam.status);
    } else {
      setEditingExam(null);
      setExamTitle("");
      setExamSubjectId(subjects[0]?.id || "");
      setExamDate("");
      setExamTime("09:00:00");
      setExamType("midterm");
      setExamImportance("medium");
      setTargetScore("90");
      setAchievedScore("");
      setExamStatus("upcoming");
    }
    setExamModalOpen(true);
  };

  const handleSaveExam = async () => {
    if (!examTitle.trim() || !examSubjectId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      subject_id: examSubjectId,
      title: examTitle,
      exam_date: examDate,
      exam_time: examTime || null,
      exam_type: examType,
      coverage: examImportance,
      target_score: parseFloat(targetScore) || 90.0,
      achieved_score: achievedScore ? parseFloat(achievedScore) : null,
      status: examStatus
    };

    if (editingExam) {
      const { error } = await supabase
        .from("exams")
        .update(payload)
        .eq("id", editingExam.id);

      if (!error) {
        const updated = {
          ...editingExam,
          ...payload,
          importance_level: examImportance
        };
        setExams(prev => prev.map(e => e.id === editingExam.id ? updated : e));
        window.dispatchEvent(new CustomEvent("dashboard-refresh"));
      }
    } else {
      const { data, error } = await supabase
        .from("exams")
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        const created = {
          ...data,
          importance_level: data.coverage || "medium"
        };
        setExams(prev => [...prev, created]);
        window.dispatchEvent(new CustomEvent("dashboard-refresh"));
      }
    }
    setExamModalOpen(false);
  };

  const handleDeleteExam = async (examId: string) => {
    if (confirm("Are you sure you want to delete this exam schedule?")) {
      const { error } = await supabase.from("exams").delete().eq("id", examId);
      if (!error) {
        setExams(prev => prev.filter(e => e.id !== examId));
      }
    }
  };

  // Target grades vs. achieved grades stats
  const completedExams = exams.filter(e => e.status === "completed" && e.achieved_score !== null);
  const avgTargetScore = completedExams.length > 0
    ? Math.round(completedExams.reduce((acc, e) => acc + Number(e.target_score), 0) / completedExams.length)
    : 90;
  const avgAchievedScore = completedExams.length > 0
    ? Math.round(completedExams.reduce((acc, e) => acc + Number(e.achieved_score), 0) / completedExams.length)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
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
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Exam Center</h1>
          <p className="text-slate-400">Schedule midterms, track target grades, and observe active countdown clocks.</p>
        </div>
        <Button onClick={() => handleOpenExamModal()} variant="primary" size="lg">
          <Plus className="mr-2 h-4 w-4" /> Add Exam
        </Button>
      </div>

      {/* Ticking Countdown Dashboard Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-900/30 to-slate-900 p-6 shadow-glow">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-300">
              <Clock className="h-6 w-6 animate-pulse" />
            </span>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-fuchsia-400">Live Countdown clock</span>
              <h2 className="font-mono text-lg sm:text-xl font-bold text-white mt-1">{countdownText}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Exam statistics widgets */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Performance Target */}
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">Average target</CardTitle>
              <Award className="h-4 w-4 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{avgTargetScore}%</span>
              <span className="text-xs text-slate-500">semester goal score</span>
            </div>
            <Progress value={avgTargetScore} className="h-2 mt-3 bg-white/5" />
          </CardContent>
        </Card>

        {/* Realized GPA */}
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">Average achieved</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{avgAchievedScore}%</span>
              <span className="text-xs text-slate-500">of completed exams</span>
            </div>
            <Progress value={avgAchievedScore} className="h-2 mt-3 bg-white/5" />
          </CardContent>
        </Card>

        {/* Total Exam Metrics */}
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">Active Schedules</CardTitle>
              <BookOpen className="h-4 w-4 text-fuchsia-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{exams.filter(e => e.status === "upcoming").length}</span>
              <span className="text-xs text-slate-500">upcoming tests pending</span>
            </div>
            <p className="mt-4 text-xs text-slate-400">Check dates on the calendar layout below.</p>
          </CardContent>
        </Card>
      </div>

      {/* Main split grid */}
      <div className="grid gap-6 md:grid-cols-[1.4fr_1.6fr]">
        {/* Left pane: Exam Schedule List */}
        <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-glow">
          <CardHeader className="px-0 pt-0 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Schedule Ledger</CardTitle>
              <CardDescription>Upcoming and completed midterms.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 space-y-3">
            {exams.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-12">No exams scheduled. Click Add Exam to set target templates.</p>
            ) : (
              exams.map(exam => {
                const sub = subjects.find(s => s.id === exam.subject_id);
                return (
                  <div
                    key={exam.id}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition hover:bg-white/[0.02]"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold"
                        style={{ backgroundColor: sub?.color || "#555" }}
                      >
                        {exam.exam_type.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-normal">{exam.title}</h4>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3 w-3" /> {new Date(exam.exam_date).toLocaleDateString()}
                          {exam.exam_time && <><Clock className="h-3 w-3 ml-1" /> {exam.exam_time}</>}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                      {/* Targets */}
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Target / Ach</span>
                        <span className="text-xs font-bold text-white">
                          {exam.target_score}% / {exam.achieved_score !== null ? `${exam.achieved_score}%` : "—"}
                        </span>
                      </div>

                      {/* Importance Badge */}
                      <Badge
                        variant={
                          exam.importance_level === "high" ? "neon" :
                            exam.importance_level === "low" ? "outline" : "default"
                        }
                        className="text-[9px] uppercase font-bold"
                      >
                        {exam.importance_level} Importance
                      </Badge>

                      {/* Edit buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenExamModal(exam)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-white/10 hover:text-rose-300 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Right pane: Exam calendar */}
        <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-glow">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle>Exam Planner Calendar</CardTitle>
            <CardDescription>Highlights exam dates to plan focus study blocks.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {/* Generic calendar grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map(d => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => {
                const dateNum = (i - 2) % 31 + 1;
                const isCurrentMonth = i >= 3 && i <= 33;

                const today = new Date();
                const dayOffset = dateNum - today.getDate();
                const targetDate = new Date(today.getTime() + dayOffset * 86400000);

                const dayExams = exams.filter(e => {
                  const eDate = new Date(e.exam_date);
                  return eDate.getDate() === targetDate.getDate() && eDate.getMonth() === targetDate.getMonth();
                });

                return (
                  <div
                    key={i}
                    className={`min-h-[60px] rounded-xl border border-white/5 p-1.5 flex flex-col justify-between text-left transition hover:bg-white/5 ${isCurrentMonth ? "bg-slate-950/20" : "bg-transparent opacity-10"
                      } ${dayExams.length > 0 ? "ring-1 ring-fuchsia-400 bg-fuchsia-500/5" : ""}`}
                  >
                    <span className={`text-[9px] font-semibold ${isCurrentMonth && dateNum === today.getDate() ? "text-cyan-300 font-bold underline" : "text-slate-400"
                      }`}>
                      {isCurrentMonth ? dateNum : ""}
                    </span>

                    <div className="flex gap-0.5 overflow-hidden">
                      {dayExams.map(exam => {
                        const sub = subjects.find(s => s.id === exam.subject_id);
                        return (
                          <span
                            key={exam.id}
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub?.color || "#f43f5e" }}
                            title={exam.title}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EXAM CREATE / EDIT DIALOG */}
      <Dialog open={examModalOpen} onOpenChange={setExamModalOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingExam ? "Edit Exam Info" : "Create Exam Info"}</DialogTitle>
            <DialogDescription>Specify exam code parameters and target grades.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Exam Title / Chapter Scope</label>
              <Input placeholder="E.g. Calculus Midterm Examination" value={examTitle} onChange={e => setExamTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Subject</label>
                <Select value={examSubjectId} onValueChange={setExamSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Importance</label>
                <Select value={examImportance} onValueChange={setExamImportance}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Importance</SelectItem>
                    <SelectItem value="medium">Medium Importance</SelectItem>
                    <SelectItem value="high">High Importance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Date</label>
                <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Time</label>
                <Input type="time" value={examTime} onChange={e => setExamTime(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Target Score (%)</label>
                <Input type="number" min="0" max="100" value={targetScore} onChange={e => setTargetScore(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Achieved Score (%)</label>
                <Input type="number" min="0" max="100" placeholder="E.g. 95" value={achievedScore} onChange={e => setAchievedScore(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Status</label>
                <Select value={examStatus} onValueChange={setExamStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Exam Type</label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="midterm">Midterm</SelectItem>
                    <SelectItem value="final">Final Exam</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="competitive">Competitive Test</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setExamModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveExam}>Save Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
