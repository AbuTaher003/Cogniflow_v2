"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarRange, Plus, Edit2, Trash2, BookOpen, Clock, CheckCircle2,
  Calendar, Layers, CheckSquare, Sparkles, BarChart, ChevronDown, ChevronRight, X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function StudyPlannerPage() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"tracker" | "calendar" | "timeline">("tracker");
  
  // Modals state
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  
  // Form fields
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectColor, setSubjectColor] = useState("#3B82F6");
  const [subjectCredits, setSubjectCredits] = useState("3");
  const [subjectSemester, setSubjectSemester] = useState("1");
  
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterSubjectId, setChapterSubjectId] = useState("");
  const [chapterStatus, setChapterStatus] = useState("todo");
  const [chapterProgress, setChapterProgress] = useState(0);
  const [chapterEstimatedTime, setChapterEstimatedTime] = useState(60);
  const [chapterCompletedAt, setChapterCompletedAt] = useState("");

  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Weekly target settings state
  const [weeklyTarget, setWeeklyTarget] = useState<number>(20);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [inputTarget, setInputTarget] = useState<string>("20");
  const [savingTarget, setSavingTarget] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSaveTarget = async () => {
    const val = Number(inputTarget);
    if (isNaN(val) || val < 1 || val > 100) {
      setTargetError("Target must be between 1 and 100 hours.");
      return;
    }
    setTargetError(null);
    setSavingTarget(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_preferences")
      .update({ weekly_study_target: val })
      .eq("user_id", user.id);

    setSavingTarget(false);
    if (!error) {
      setWeeklyTarget(val);
      setIsEditingTarget(false);
    } else {
      setTargetError(error.message);
    }
  };

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      const { data: chaptersData } = await supabase
        .from("chapters")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      const { data: prefsData } = await supabase
        .from("user_preferences")
        .select("weekly_study_target")
        .eq("user_id", user.id)
        .single();

      setSubjects(subjectsData || []);
      setChapters(chaptersData || []);
      
      if (prefsData) {
        setWeeklyTarget(prefsData.weekly_study_target);
        setInputTarget(String(prefsData.weekly_study_target));
      } else {
        // Fallback default starting value: 20 hours
        setWeeklyTarget(20);
        setInputTarget("20");
      }
      
      // Auto expand first subject
      if (subjectsData && subjectsData.length > 0) {
        setExpandedSubjects({ [subjectsData[0].id]: true });
      }
      
      setLoading(false);
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expand toggle
  const toggleSubjectExpand = (subId: string) => {
    setExpandedSubjects(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  // SUBJECT CRUD
  const handleOpenSubjectModal = (sub: any = null) => {
    if (sub) {
      setEditingSubject(sub);
      setSubjectName(sub.name);
      setSubjectCode(sub.code || "");
      setSubjectColor(sub.color || "#3B82F6");
      setSubjectCredits(String(sub.credits));
      setSubjectSemester(sub.semester || "1");
    } else {
      setEditingSubject(null);
      setSubjectName("");
      setSubjectCode("");
      setSubjectColor("#3B82F6");
      setSubjectCredits("3");
      setSubjectSemester("1");
    }
    setSubjectModalOpen(true);
  };

  const handleSaveSubject = async () => {
    if (!subjectName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      name: subjectName,
      code: subjectCode || null,
      color: subjectColor,
      credits: parseInt(subjectCredits) || 3,
      semester: subjectSemester
    };

    if (editingSubject) {
      const { error } = await supabase
        .from("subjects")
        .update(payload)
        .eq("id", editingSubject.id);
      
      if (!error) {
        setSubjects(prev => prev.map(s => s.id === editingSubject.id ? { ...s, ...payload } : s));
      }
    } else {
      const { data, error } = await supabase
        .from("subjects")
        .insert(payload)
        .select()
        .single();
      
      if (!error && data) {
        setSubjects(prev => [...prev, data]);
        toggleSubjectExpand(data.id);
      }
    }
    setSubjectModalOpen(false);
  };

  const handleDeleteSubject = async (subId: string) => {
    if (confirm("Are you sure you want to delete this subject and all its chapters?")) {
      const { error } = await supabase.from("subjects").delete().eq("id", subId);
      if (!error) {
        setSubjects(prev => prev.filter(s => s.id !== subId));
        setChapters(prev => prev.filter(c => c.subject_id !== subId));
      }
    }
  };

  // CHAPTER CRUD
  const handleOpenChapterModal = (subId: string, chap: any = null) => {
    setChapterSubjectId(subId);
    if (chap) {
      setEditingChapter(chap);
      setChapterTitle(chap.title);
      setChapterStatus(chap.status);
      setChapterProgress(chap.progress_pct);
      setChapterEstimatedTime(chap.estimated_minutes);
      setChapterCompletedAt(chap.completed_at ? chap.completed_at.split("T")[0] : "");
    } else {
      setEditingChapter(null);
      setChapterTitle("");
      setChapterStatus("todo");
      setChapterProgress(0);
      setChapterEstimatedTime(60);
      setChapterCompletedAt("");
    }
    setChapterModalOpen(true);
  };

  const handleSaveChapter = async () => {
    if (!chapterTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      subject_id: chapterSubjectId,
      title: chapterTitle,
      status: chapterStatus,
      progress_pct: Number(chapterProgress),
      estimated_minutes: Number(chapterEstimatedTime),
      completed_at: chapterStatus === "completed" 
        ? (chapterCompletedAt ? new Date(chapterCompletedAt).toISOString() : new Date().toISOString())
        : null
    };

    if (editingChapter) {
      const { error } = await supabase
        .from("chapters")
        .update(payload)
        .eq("id", editingChapter.id);

      if (!error) {
        setChapters(prev => prev.map(c => c.id === editingChapter.id ? { ...c, ...payload } : c));
      }
    } else {
      const { data, error } = await supabase
        .from("chapters")
        .insert(payload)
        .select()
        .single();
      
      if (!error && data) {
        setChapters(prev => [...prev, data]);
      }
    }
    setChapterModalOpen(false);
  };

  const handleDeleteChapter = async (chapId: string) => {
    if (confirm("Are you sure you want to delete this chapter?")) {
      const { error } = await supabase.from("chapters").delete().eq("id", chapId);
      if (!error) {
        setChapters(prev => prev.filter(c => c.id !== chapId));
      }
    }
  };

  // Helper calculation
  const getSubjectProgress = (subId: string) => {
    const subChaps = chapters.filter(c => c.subject_id === subId);
    if (subChaps.length === 0) return 0;
    const totalProgress = subChaps.reduce((acc, c) => acc + c.progress_pct, 0);
    return Math.round(totalProgress / subChaps.length);
  };

  const getSubjectEstTime = (subId: string) => {
    const subChaps = chapters.filter(c => c.subject_id === subId);
    return subChaps.reduce((acc, c) => acc + c.estimated_minutes, 0);
  };

  // Weekly Goals: Custom study target hours per week
  const targetWeeklyHours = weeklyTarget;
  const totalStudyMinutes = chapters.reduce((acc, c) => acc + c.estimated_minutes, 0);
  const totalStudyHours = Math.round((totalStudyMinutes / 60) * 10) / 10;
  const weeklyGoalPct = targetWeeklyHours > 0
    ? Math.min(Math.round((totalStudyHours / targetWeeklyHours) * 100), 100)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
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
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Study Planner</h1>
          <p className="text-slate-400">Map subjects, track chapter milestones, and visual targets.</p>
        </div>
        <Button onClick={() => handleOpenSubjectModal()} variant="primary" size="lg">
          <Plus className="mr-2 h-4 w-4" /> Add Subject
        </Button>
      </div>

      {/* Overview Tracker Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Weekly Goals Card */}
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">Weekly Study Target</CardTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditingTarget(!isEditingTarget);
                    setInputTarget(String(weeklyTarget));
                    setTargetError(null);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition duration-200"
                  title="Edit study target"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <Clock className="h-4 w-4 text-cyan-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isEditingTarget ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{totalStudyHours} hrs</span>
                  <span className="text-xs text-slate-500">/ {targetWeeklyHours} hrs weekly</span>
                </div>
                <Progress value={weeklyGoalPct} className="h-2 mt-3 bg-white/5" />
                <p className="mt-2 text-xs text-slate-400">
                  {weeklyGoalPct}% of targeted semester hours mapped to chapters.
                </p>
              </>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300">Target (hrs)</span>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={inputTarget}
                    onChange={(e) => {
                      setInputTarget(e.target.value);
                      const val = Number(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= 100) {
                        setTargetError(null);
                      }
                    }}
                    className="w-20 h-8 text-right text-xs bg-slate-900 border-white/10 rounded-lg text-white"
                  />
                </div>
                
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={Number(inputTarget) || 20}
                  onChange={(e) => setInputTarget(e.target.value)}
                  className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />

                {targetError && (
                  <p className="text-[10px] text-rose-300 font-semibold">{targetError}</p>
                )}

                <div className="flex justify-end gap-1.5 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingTarget(false)}
                    className="h-7 text-[10px] px-2.5 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSaveTarget}
                    disabled={savingTarget}
                    className="h-7 text-[10px] px-3.5 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 border-none transition"
                  >
                    {savingTarget ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Chapters Progress */}
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">Chapters Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {chapters.filter(c => c.status === "completed").length}
              </span>
              <span className="text-xs text-slate-500">/ {chapters.length} total chapters</span>
            </div>
            <Progress 
              value={chapters.length > 0 ? (chapters.filter(c => c.status === "completed").length / chapters.length) * 100 : 0} 
              className="h-2 mt-3 bg-white/5" 
            />
            <p className="mt-2 text-xs text-slate-400">Keep going! Consistency leads to top GPA prediction.</p>
          </CardContent>
        </Card>

        {/* Subjects Enrolled */}
        <Card className="border-white/10 bg-white/5 shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">Active Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-fuchsia-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{subjects.length}</span>
              <span className="text-xs text-slate-500">enrolled this semester</span>
            </div>
            <div className="flex gap-1 mt-4">
              {subjects.map(sub => (
                <span 
                  key={sub.id} 
                  className="h-2 w-8 rounded-full" 
                  style={{ backgroundColor: sub.color }} 
                  title={sub.name}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 bg-white/5 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("tracker")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition ${
            activeTab === "tracker" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="h-4 w-4" /> Syllabus Tracker
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition ${
            activeTab === "calendar" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="h-4 w-4" /> Calendar View
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition ${
            activeTab === "timeline" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          <CalendarRange className="h-4 w-4" /> Timeline Path
        </button>
      </div>

      {/* Content tabs */}
      <AnimatePresence mode="wait">
        {activeTab === "tracker" && (
          <motion.div
            key="tracker"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {subjects.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl bg-white/5">
                <BookOpen className="mx-auto h-12 w-12 text-slate-500 mb-3" />
                <h3 className="font-semibold text-lg">No Subjects Configured</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                  Get started by adding subjects for your current semester.
                </p>
                <Button onClick={() => handleOpenSubjectModal()} className="mt-4" variant="secondary">
                  Add First Subject
                </Button>
              </div>
            ) : (
              subjects.map(sub => {
                const subProgress = getSubjectProgress(sub.id);
                const subEstTime = getSubjectEstTime(sub.id);
                const isExpanded = !!expandedSubjects[sub.id];
                const subChaps = chapters.filter(c => c.subject_id === sub.id);

                return (
                  <div 
                    key={sub.id} 
                    className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-glow transition-all"
                  >
                    {/* Subject Row */}
                    <div 
                      onClick={() => toggleSubjectExpand(sub.id)}
                      className="flex cursor-pointer flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-4">
                        <span 
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white font-bold"
                          style={{ backgroundColor: sub.color }}
                        >
                          {sub.code ? sub.code.slice(0, 2).toUpperCase() : sub.name[0].toUpperCase()}
                        </span>
                        <div>
                          <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                            {sub.name}
                            {sub.code && <span className="text-xs text-slate-500 font-mono">({sub.code})</span>}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span>Credits: {sub.credits}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {Math.round(subEstTime / 60)} hrs study est.</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Progress Meter */}
                        <div className="flex flex-col items-end gap-1.5 min-w-[150px]">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">Subject progress</span>
                            <span className="font-bold text-white">{subProgress}%</span>
                          </div>
                          <Progress value={subProgress} className="h-1.5 w-full bg-white/5" />
                        </div>

                        {/* Edit Buttons */}
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => handleOpenSubjectModal(sub)}
                            className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSubject(sub.id)}
                            className="p-2 rounded-xl text-rose-400 hover:bg-white/10 hover:text-rose-300 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => toggleSubjectExpand(sub.id)}
                            className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Chapters List */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden bg-slate-950/45 border-t border-white/5"
                        >
                          <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                              <h4 className="text-sm font-semibold text-cyan-300">Chapters list ({subChaps.length})</h4>
                              <Button 
                                onClick={() => handleOpenChapterModal(sub.id)} 
                                variant="secondary" 
                                size="sm" 
                                className="h-8 rounded-lg text-xs"
                              >
                                <Plus className="mr-1 h-3 w-3" /> Add Chapter
                              </Button>
                            </div>

                            {subChaps.length === 0 ? (
                              <p className="text-center py-6 text-sm text-slate-500">No chapters added. Click Add Chapter to build your syllabus.</p>
                            ) : (
                              <div className="space-y-2">
                                {subChaps.map(chap => (
                                  <div 
                                    key={chap.id} 
                                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition hover:bg-white/[0.02]"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                                        chap.status === "completed" ? "bg-emerald-400" :
                                        chap.status === "in_progress" ? "bg-cyan-400" : "bg-slate-600"
                                      }`} />
                                      <div>
                                        <h5 className="text-sm font-semibold text-white">{chap.title}</h5>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                          Est: {chap.estimated_minutes} mins 
                                          {chap.completed_at && ` • Done: ${new Date(chap.completed_at).toLocaleDateString()}`}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
                                      {/* Status tag */}
                                      <Badge 
                                        variant={
                                          chap.status === "completed" ? "neon" : 
                                          chap.status === "in_progress" ? "default" : "outline"
                                        }
                                        className="text-[10px] uppercase font-bold"
                                      >
                                        {chap.status.replace("_", " ")}
                                      </Badge>

                                      {/* Progress slider bar */}
                                      <div className="flex items-center gap-2 min-w-[120px]">
                                        <Progress value={chap.progress_pct} className="h-1 w-20 bg-white/5" />
                                        <span className="text-xs font-mono text-slate-400">{chap.progress_pct}%</span>
                                      </div>

                                      {/* Edit actions */}
                                      <div className="flex items-center gap-1">
                                        <button 
                                          onClick={() => handleOpenChapterModal(sub.id, chap)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteChapter(chap.id)}
                                          className="p-1.5 rounded-lg text-rose-400 hover:bg-white/10 hover:text-rose-300 transition"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {/* 2. Calendar View */}
        {activeTab === "calendar" && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-glow">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle>Study Milestones Calendar</CardTitle>
                <CardDescription>Visual tracker of completion deadlines and schedules.</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="py-2">{d}</div>)}
                </div>
                {/* Visual Month calendar grid for mock. 
                    Let's render a generic grid representation of the current month. */}
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, i) => {
                    const dateNum = (i - 2) % 31 + 1; // mock starting offset
                    const isCurrentMonth = i >= 3 && i <= 33;
                    
                    // Filter chapters completed on this relative day offset from today
                    const today = new Date();
                    const dayOffset = dateNum - today.getDate();
                    const targetDate = new Date(today.getTime() + dayOffset * 86400000);
                    
                    const dayChaps = chapters.filter(c => {
                      if (!c.completed_at) return false;
                      const cDate = new Date(c.completed_at);
                      return cDate.getDate() === targetDate.getDate() && cDate.getMonth() === targetDate.getMonth();
                    });

                    return (
                      <div 
                        key={i} 
                        className={`min-h-[85px] rounded-2xl border border-white/5 p-2 flex flex-col justify-between text-left transition hover:bg-white/5 ${
                          isCurrentMonth ? "bg-slate-950/20" : "bg-transparent opacity-20"
                        }`}
                      >
                        <span className={`text-[10px] font-bold ${
                          isCurrentMonth && dateNum === today.getDate() ? "text-cyan-300 underline" : "text-slate-400"
                        }`}>
                          {isCurrentMonth ? dateNum : ""}
                        </span>
                        
                        <div className="mt-1 flex flex-col gap-1 overflow-hidden max-h-[60px]">
                          {dayChaps.slice(0, 2).map(chap => {
                            const sub = subjects.find(s => s.id === chap.subject_id);
                            return (
                              <span 
                                key={chap.id}
                                className="truncate text-[8px] font-semibold text-white px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: sub?.color || "#555" }}
                              >
                                {chap.title}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 3. Timeline Path */}
        {activeTab === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-glow">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Academic Learning Paths</CardTitle>
                <CardDescription>Horizontal sequence maps mapping chapter progression milestones.</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="relative border-l border-white/10 pl-6 ml-4 space-y-8 py-2">
                  {chapters.slice(0, 6).map((chap, idx) => {
                    const sub = subjects.find(s => s.id === chap.subject_id);
                    return (
                      <div key={chap.id} className="relative group">
                        {/* Dot indicator */}
                        <span 
                          className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-slate-950 transition group-hover:scale-110"
                          style={{ backgroundColor: sub?.color || "#fff" }}
                        />
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-[9px] font-mono shrink-0">Step {idx + 1}</Badge>
                          <h4 className="text-sm font-bold text-white truncate max-w-[200px]">{chap.title}</h4>
                          <span 
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${sub?.color}15`, color: sub?.color }}
                          >
                            {sub?.name || "Subject"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 ml-14">
                          Status: <span className="capitalize">{chap.status}</span> ({chap.progress_pct}% complete)
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUBJECT DIALOG MODAL */}
      <Dialog open={subjectModalOpen} onOpenChange={setSubjectModalOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Subject" : "Create Subject"}</DialogTitle>
            <DialogDescription>Setup code descriptors and preset colors for your syllabus.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Subject Name</label>
              <Input placeholder="E.g., Computer Networks" value={subjectName} onChange={e => setSubjectName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Subject Code</label>
                <Input placeholder="E.g., CS 402" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Credits</label>
                <Input type="number" min="1" max="10" value={subjectCredits} onChange={e => setSubjectCredits(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">Color Tag</label>
              <div className="flex gap-2.5">
                {["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6"].map(c => (
                  <button 
                    key={c}
                    type="button"
                    onClick={() => setSubjectColor(c)}
                    className={`h-7 w-7 rounded-full transition hover:scale-105 border-2 ${
                      subjectColor === c ? "border-white scale-105" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setSubjectModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveSubject}>Save Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CHAPTER DIALOG MODAL */}
      <Dialog open={chapterModalOpen} onOpenChange={setChapterModalOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingChapter ? "Edit Chapter" : "Add Chapter"}</DialogTitle>
            <DialogDescription>Specify completion statistics and estimated minutes of focus study.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Chapter Title</label>
              <Input placeholder="E.g., Recursion Basics" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Estimated Time (mins)</label>
                <Input type="number" value={chapterEstimatedTime} onChange={e => setChapterEstimatedTime(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Status</label>
                <Select value={chapterStatus} onValueChange={setChapterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Progress Percentage ({chapterProgress}%)</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={chapterProgress} 
                onChange={e => {
                  const val = Number(e.target.value);
                  setChapterProgress(val);
                  if (val === 100) setChapterStatus("completed");
                  else if (val > 0) setChapterStatus("in_progress");
                  else setChapterStatus("todo");
                }}
                className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            {chapterStatus === "completed" && (
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Completion Date</label>
                <Input type="date" value={chapterCompletedAt} onChange={e => setChapterCompletedAt(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setChapterModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveChapter}>Save Chapter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
