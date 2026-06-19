"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, FileText, CheckSquare, BookOpen, Flame, Sparkles, X,
  Clock, AlertTriangle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const [subjects, setSubjects] = useState<any[]>([]);

  // Modals
  const [activeModal, setActiveModal] = useState<"task" | "note" | "habit" | "subject" | "exam" | null>(null);

  // Form Fields
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubjectId, setTaskSubjectId] = useState("none");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueAt, setTaskDueAt] = useState("");

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectColor, setSubjectColor] = useState("#3B82F6");

  const [habitTitle, setHabitTitle] = useState("");
  const [habitFrequency, setHabitFrequency] = useState("daily");
  const [habitColor, setHabitColor] = useState("#22C55E");

  const [examTitle, setExamTitle] = useState("");
  const [examSubjectId, setExamSubjectId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examType, setExamType] = useState("midterm");

  useEffect(() => {
    async function loadSubjects() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("subjects").select("*").eq("user_id", user.id);
      setSubjects(data || []);
      if (data && data.length > 0) {
        setExamSubjectId(data[0].id);
      }
    }
    if (activeModal) loadSubjects();
  }, [activeModal, supabase]);

  const handleCreateNote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      title: "Untitled Note",
      content: "",
      pinned: false,
      tags: [],
      format: "markdown"
    };

    const { data, error } = await supabase
      .from("notes")
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      router.push("/dashboard/notes");
      window.dispatchEvent(new CustomEvent("dashboard-refresh"));
      setIsOpen(false);
    }
  };

  const handleSaveTask = async () => {
    if (!taskTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      title: taskTitle,
      subject_id: taskSubjectId === "none" ? null : taskSubjectId,
      status: "todo",
      priority: taskPriority,
      due_at: taskDueAt ? new Date(taskDueAt).toISOString() : null,
      tags: []
    };

    await supabase.from("tasks").insert(payload);
    alert("Task added!");
    setTaskTitle("");
    setActiveModal(null);
    setIsOpen(false);
    router.refresh();
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
      credits: 3,
      semester: "1"
    };

    await supabase.from("subjects").insert(payload);
    alert("Subject added!");
    setSubjectName("");
    setSubjectCode("");
    setActiveModal(null);
    setIsOpen(false);
    router.refresh();
  };

  const handleSaveHabit = async () => {
    if (!habitTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      title: habitTitle,
      frequency: habitFrequency,
      color: habitColor,
      category: "study",
      streak: 0,
      best_streak: 0,
      active: true
    };

    await supabase.from("habits").insert(payload);
    alert("Habit added!");
    setHabitTitle("");
    setActiveModal(null);
    setIsOpen(false);
    router.refresh();
  };

  const handleSaveExam = async () => {
    if (!examTitle.trim() || !examSubjectId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      subject_id: examSubjectId,
      title: examTitle,
      exam_date: examDate || new Date().toISOString().split("T")[0],
      exam_type: examType,
      status: "upcoming",
      target_score: 90
    };

    await supabase.from("exams").insert(payload);
    alert("Exam added!");
    setExamTitle("");
    setExamDate("");
    setActiveModal(null);
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("dashboard-refresh"));
    router.refresh();
  };

  return (
    <>
      {/* Floating Speed Dial Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 select-none">

        {/* Expanded Speed Dial options */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="flex flex-col items-end gap-2.5"
            >
              {/* Add Note */}
              <button
                onClick={handleCreateNote}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-950 hover:text-white"
              >
                <span>Add Note</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
                  <FileText className="h-4 w-4" />
                </span>
              </button>

              {/* Add Task */}
              <button
                onClick={() => setActiveModal("task")}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-950 hover:text-white"
              >
                <span>Add Task</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                  <CheckSquare className="h-4 w-4" />
                </span>
              </button>

              {/* Add Habit */}
              <button
                onClick={() => setActiveModal("habit")}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-950 hover:text-white"
              >
                <span>Add Habit</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                  <Flame className="h-4 w-4" />
                </span>
              </button>

              {/* Add Subject */}
              <button
                onClick={() => setActiveModal("subject")}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-950 hover:text-white"
              >
                <span>Add Subject</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-300">
                  <BookOpen className="h-4 w-4" />
                </span>
              </button>

              {/* Add Exam */}
              <button
                onClick={() => setActiveModal("exam")}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-950 hover:text-white"
              >
                <span>Add Exam</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
                  <Sparkles className="h-4 w-4" />
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Master floater trigger button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-glow transition-all hover:scale-105 hover:bg-cyan-300 duration-200 ${isOpen ? "rotate-45 bg-rose-500 hover:bg-rose-400 text-white" : ""
            }`}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* QUICK TASK MODAL */}
      <Dialog open={activeModal === "task"} onOpenChange={(open: boolean) => !open && setActiveModal(null)}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Quick Add Task</DialogTitle>
            <DialogDescription>Quickly log a deliverable to your Kanban system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Title</label>
              <Input placeholder="E.g. Math homework" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Subject</label>
                <Select value={taskSubjectId} onValueChange={setTaskSubjectId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Priority</label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Due Date</label>
              <Input type="date" value={taskDueAt} onChange={e => setTaskDueAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveTask}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUICK SUBJECT MODAL */}
      <Dialog open={activeModal === "subject"} onOpenChange={(open: boolean) => !open && setActiveModal(null)}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Quick Add Subject</DialogTitle>
            <DialogDescription>Add a subject to your semester tracking dashboard.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Name</label>
              <Input placeholder="E.g. Discrete Math" value={subjectName} onChange={e => setSubjectName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Code</label>
              <Input placeholder="E.g. MATH 201" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">Color</label>
              <div className="flex gap-2">
                {["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6"].map(c => (
                  <button
                    key={c}
                    onClick={() => setSubjectColor(c)}
                    className={`h-7 w-7 rounded-full transition ${subjectColor === c ? "ring-2 ring-white scale-105" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveSubject}>Add Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUICK HABIT MODAL */}
      <Dialog open={activeModal === "habit"} onOpenChange={(open: boolean) => !open && setActiveModal(null)}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Quick Add Habit</DialogTitle>
            <DialogDescription>Setup a daily trigger checklist.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Habit Title</label>
              <Input placeholder="E.g. Hydrate 2L" value={habitTitle} onChange={e => setHabitTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Frequency</label>
              <Select value={habitFrequency} onValueChange={setHabitFrequency}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">Color</label>
              <div className="flex gap-2">
                {["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"].map(c => (
                  <button
                    key={c}
                    onClick={() => setHabitColor(c)}
                    className={`h-7 w-7 rounded-full transition ${habitColor === c ? "ring-2 ring-white scale-105" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveHabit}>Add Habit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUICK EXAM MODAL */}
      <Dialog open={activeModal === "exam"} onOpenChange={(open: boolean) => !open && setActiveModal(null)}>
        <DialogContent className="border-white/10 bg-slate-950 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Quick Add Exam</DialogTitle>
            <DialogDescription>Schedule a test checkpoint.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Exam Title</label>
              <Input placeholder="E.g. CS Midterm" value={examTitle} onChange={e => setExamTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Subject</label>
                <Select value={examSubjectId} onValueChange={setExamSubjectId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Type</label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="midterm">Midterm</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold">Exam Date</label>
              <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveExam}>Add Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
