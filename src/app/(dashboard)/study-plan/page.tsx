"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarRange, Calendar, Clock, AlertTriangle, BookOpen,
  Sparkles, Timer, ChevronRight, CheckCircle, Info
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface StudySlot {
  time: string;
  subject: string;
  color: string;
  code: string;
  strategy: string;
  task: string;
  duration: number;
}

export default function StudyPlanPage() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("Mon");
  const supabase = createClient();

  useEffect(() => {
    async function loadExamsData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: examsData } = await supabase
        .from("exams")
        .select("*, subjects(name, code, color)")
        .eq("user_id", user.id)
        .order("exam_date", { ascending: true });

      setExams(examsData || []);
      setLoading(false);
    }
    loadExamsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute days left and strategy profile for each exam
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const processedExams = exams
    .map((exam) => {
      const examDate = new Date(exam.exam_date);
      examDate.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let strategy = "Slow Syllabus Coverage";
      let strategyDesc = "Cover 1 major topic daily, read text, take detailed summary notes.";
      let colorClass = "text-cyan-400 border-cyan-400/20 bg-cyan-400/5";
      let focusMins = 60;

      if (daysLeft < 0) {
        strategy = "Exam Completed";
        strategyDesc = "This exam has already passed.";
        colorClass = "text-slate-500 border-slate-500/20 bg-slate-500/5";
        focusMins = 0;
      } else if (daysLeft <= 7) {
        strategy = "Intensive Revision";
        strategyDesc = "Active recall, solve mock question papers, do practice exams, study 3-4 hours daily.";
        colorClass = "text-rose-400 border-rose-400/20 bg-rose-400/5";
        focusMins = 180;
      } else if (daysLeft <= 14) {
        strategy = "Balanced Preparation";
        strategyDesc = "Review key notes, solve textbook problems, focus on weak chapters, study 2 hours daily.";
        colorClass = "text-amber-400 border-amber-400/20 bg-amber-400/5";
        focusMins = 120;
      }

      return {
        ...exam,
        daysLeft,
        strategy,
        strategyDesc,
        colorClass,
        focusMins,
      };
    })
    .filter((e) => e.daysLeft >= 0); // show only future/today exams

  // Generate study slots for a week dynamically based on rule strategies
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Helper to generate schedule for each day
  const generateScheduleForDay = (dayName: string): StudySlot[] => {
    const slots: StudySlot[] = [];
    if (processedExams.length === 0) return slots;

    // Distribute slots across exams based on their strategy
    // Sort exams by urgency
    const sortedExams = [...processedExams].sort((a, b) => a.daysLeft - b.daysLeft);

    let morningSlotAdded = false;
    let afternoonSlotAdded = false;
    let eveningSlotAdded = false;

    for (const exam of sortedExams) {
      const subjectName = exam.subjects?.name || "Syllabus Study";
      const subjectColor = exam.subjects?.color || "#7C3AED";
      const subjectCode = exam.subjects?.code || "STUDY";

      if (exam.strategy === "Intensive Revision") {
        // Needs multiple slots (Morning, Afternoon, Evening)
        if (!morningSlotAdded) {
          slots.push({
            time: "09:00 - 10:30",
            subject: subjectName,
            color: subjectColor,
            code: subjectCode,
            strategy: "Intensive Revision",
            task: "Active Recall & Flashcards review",
            duration: 90,
          });
          morningSlotAdded = true;
        }
        if (!afternoonSlotAdded) {
          slots.push({
            time: "14:00 - 16:00",
            subject: subjectName,
            color: subjectColor,
            code: subjectCode,
            strategy: "Intensive Revision",
            task: "Solve Past/Mock Exam papers",
            duration: 120,
          });
          afternoonSlotAdded = true;
        }
        if (!eveningSlotAdded) {
          slots.push({
            time: "19:30 - 21:00",
            subject: subjectName,
            color: subjectColor,
            code: subjectCode,
            strategy: "Intensive Revision",
            task: "Formulas rewrite & active rehearsal",
            duration: 90,
          });
          eveningSlotAdded = true;
        }
      } else if (exam.strategy === "Balanced Preparation") {
        // Needs 1-2 slots
        if (!afternoonSlotAdded) {
          slots.push({
            time: "15:00 - 16:30",
            subject: subjectName,
            color: subjectColor,
            code: subjectCode,
            strategy: "Balanced Prep",
            task: "Review tough chapters & assignments",
            duration: 90,
          });
          afternoonSlotAdded = true;
        } else if (!eveningSlotAdded) {
          slots.push({
            time: "20:00 - 21:30",
            subject: subjectName,
            color: subjectColor,
            code: subjectCode,
            strategy: "Balanced Prep",
            task: "Practice textbook exercise problems",
            duration: 90,
          });
          eveningSlotAdded = true;
        }
      } else {
        // Slow Coverage: Needs 1 slot
        if (!eveningSlotAdded) {
          slots.push({
            time: "19:00 - 20:00",
            subject: subjectName,
            color: subjectColor,
            code: subjectCode,
            strategy: "Slow Syllabus",
            task: "Read new lecture slides & take notes",
            duration: 60,
          });
          eveningSlotAdded = true;
        } else if (!morningSlotAdded) {
          slots.push({
            time: "08:30 - 09:30",
            subject: subjectName,
            color: subjectColor,
            code: subjectCode,
            strategy: "Slow Syllabus",
            task: "Review yesterday's lecture slides",
            duration: 60,
          });
          morningSlotAdded = true;
        }
      }
    }

    // Sort slots by start time
    return slots.sort((a, b) => a.time.localeCompare(b.time));
  };

  const selectedDaySlots = generateScheduleForDay(selectedDay);

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
          <h1 className="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <CalendarRange className="h-8 w-8 text-cyan-400" /> Auto Study Scheduler
          </h1>
          <p className="text-slate-400 mt-1">
            Rule-based revision strategies automatically generated from your upcoming exam schedules.
          </p>
        </div>
      </div>

      {/* Strategy Legend Guide */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-rose-500/10 bg-rose-500/[0.02] shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge className="border-rose-400/30 bg-rose-400/10 text-rose-300 text-[10px] uppercase font-bold py-0.5 px-2">
                Intensive
              </Badge>
              <Timer className="h-4 w-4 text-rose-400" />
            </div>
          </CardHeader>
          <CardContent>
            <h4 className="text-sm font-semibold text-white">Within 7 Days</h4>
            <p className="text-xs text-slate-400 mt-1">
              Intensive Revision: 3-4 hours daily. Active recall focus, practice test questions, mock exams.
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/10 bg-amber-500/[0.02] shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge className="border-amber-400/30 bg-amber-400/10 text-amber-300 text-[10px] uppercase font-bold py-0.5 px-2">
                Balanced
              </Badge>
              <Timer className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <h4 className="text-sm font-semibold text-white">Within 14 Days</h4>
            <p className="text-xs text-slate-400 mt-1">
              Balanced Prep: 2 hours daily. solving textbook questions, review chapter keynotes, study weak topics.
            </p>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/10 bg-cyan-500/[0.02] shadow-glow backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-300 text-[10px] uppercase font-bold py-0.5 px-2">
                Slow Pace
              </Badge>
              <Timer className="h-4 w-4 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <h4 className="text-sm font-semibold text-white">Above 14 Days</h4>
            <p className="text-xs text-slate-400 mt-1">
              Syllabus Coverage: 1 hour daily. Read slides, make detailed summary notes, cover 1 new topic daily.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Countdown Timeline */}
        <Card className="border-white/10 bg-white/5 shadow-glow lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-300" /> Upcoming Deadlines
            </CardTitle>
            <CardDescription>Countdown targets with rule-assigned strategies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {processedExams.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                <CheckCircle className="mx-auto h-8 w-8 text-cyan-500/30 mb-2" />
                No upcoming exams found. Add exams in the exams tab to trigger plan.
              </div>
            ) : (
              processedExams.map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-3 relative overflow-hidden"
                >
                  {/* Color strip accent */}
                  <span
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: exam.subjects?.color || "#555" }}
                  />
                  <div className="flex items-start justify-between gap-2 pl-2">
                    <div>
                      <h4 className="text-sm font-bold text-white truncate max-w-[140px]">
                        {exam.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {exam.subjects?.name} ({exam.subjects?.code})
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                      {exam.daysLeft === 0
                        ? "TODAY"
                        : exam.daysLeft === 1
                        ? "1 day left"
                        : `${exam.daysLeft} days left`}
                    </Badge>
                  </div>

                  <div className="pl-2 pt-2 border-t border-white/5">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">
                      Assigned Strategy
                    </span>
                    <Badge className={`mt-1.5 text-[10px] border font-bold ${exam.colorClass}`}>
                      {exam.strategy}
                    </Badge>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {exam.strategyDesc}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Weekly Slot Grid & Daily Schedule Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly slot card */}
          <Card className="border-white/10 bg-white/5 shadow-glow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4 text-fuchsia-300" /> Weekly Plan view
              </CardTitle>
              <CardDescription>Dynamically distributed revision blocks per weekday.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {daysOfWeek.map((day) => {
                  const daySlots = generateScheduleForDay(day);
                  const isSelected = selectedDay === day;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`rounded-2xl p-3 flex flex-col items-center justify-between text-center min-h-[90px] border transition ${
                        isSelected
                          ? "bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 border-cyan-400/40 text-white shadow-glow"
                          : "bg-slate-950/40 border-white/5 hover:bg-slate-950/60 text-slate-400"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase">{day}</span>
                      <div className="flex flex-col gap-1 my-2">
                        {daySlots.map((slot, i) => (
                          <span
                            key={i}
                            className="h-1.5 w-6 rounded-full shrink-0"
                            style={{ backgroundColor: slot.color }}
                            title={slot.subject}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-medium text-slate-500">
                        {daySlots.length === 0 ? "Free" : `${daySlots.length} blocks`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Daily Schedule Breakdown */}
          <Card className="border-white/10 bg-white/5 shadow-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Daily Schedule Breakdown</CardTitle>
                <CardDescription>Hourly recommended study timetable for {selectedDay}</CardDescription>
              </div>
              <Clock className="h-5 w-5 text-cyan-400" />
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDaySlots.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-500 border border-dashed border-white/5 rounded-2xl">
                  <Info className="mx-auto h-8 w-8 text-slate-500/40 mb-2" />
                  No study sessions scheduled for this day. Enjoy your free time!
                </div>
              ) : (
                <div className="relative border-l border-white/10 pl-6 ml-4 space-y-6 py-2">
                  {selectedDaySlots.map((slot, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-white/5 bg-slate-950/40 rounded-2xl hover:bg-slate-950/60 transition"
                    >
                      {/* Timeline dot indicator */}
                      <span
                        className="absolute -left-[31px] top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-slate-950 shrink-0"
                        style={{ backgroundColor: slot.color }}
                      />
                      <div className="space-y-1 pl-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-cyan-300">
                            {slot.time}
                          </span>
                          <span className="text-[10px] text-slate-500">({slot.duration} mins)</span>
                          <Badge
                            className="text-[9px] font-bold py-0.5"
                            style={{ backgroundColor: `${slot.color}15`, color: slot.color }}
                          >
                            {slot.code}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{slot.subject}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                          {slot.task}
                        </p>
                      </div>
                      <div className="sm:self-center shrink-0 pr-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold border-white/10 text-slate-300">
                          {slot.strategy}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
