"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock3, Flame, BookOpen, Target, FileText, Sparkles, BarChart3, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PreviewTab = "dashboard" | "notes" | "focus" | "analytics";

const tabs = [
  { id: "dashboard", label: "Student Dashboard", icon: Target },
  { id: "notes", label: "Lecture Notes", icon: FileText },
  { id: "focus", label: "Focus Timer", icon: Clock3 },
  { id: "analytics", label: "Performance Analytics", icon: BarChart3 }
];

export function LivePreview() {
  const [activeTab, setActiveTab] = useState<PreviewTab>("dashboard");
  const [pomodoroSeconds, setPomodoroSeconds] = useState(1500); // 25:00
  const [focusTicking, setFocusTicking] = useState(true);

  // Ticking pomodoro timer preview logic
  useEffect(() => {
    if (!focusTicking) return;
    const interval = setInterval(() => {
      setPomodoroSeconds((prev) => (prev <= 1 ? 1500 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [focusTicking]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <section id="preview" className="px-4 py-24 sm:px-6 lg:px-8 border-t border-white/5 bg-slate-950/20 relative isolate">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <p className="text-[10px] uppercase font-bold tracking-[0.35em] text-fuchsia-400">Live Preview</p>
          <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
            Experience the active workspace.
          </h2>
          <p className="text-slate-400 text-sm">
            Toggle between core layouts below to see how CogniFlow manages your academic schedule.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PreviewTab)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-300 shadow-neon/10"
                    : "border-white/5 bg-white/5 text-slate-400 hover:border-white/10 hover:text-white"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Interactive Mockups Screen */}
        <div className="relative mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-slate-950/80 p-3 sm:p-5 shadow-2xl backdrop-blur-2xl">
          {/* Subtle lighting overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-fuchsia-500/5 rounded-[2rem] z-0 animate-pulse" />

          <div className="relative z-10 min-h-[580px] md:min-h-[16rem]">
            <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard-mock"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid gap-4 md:grid-cols-3"
              >
                {/* Score Widget */}
                <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 flex flex-col justify-between h-48">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Semester Goals</span>
                    <h4 className="text-xl font-bold text-white mt-1">Study Flow: 92%</h4>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[92%] bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-full" />
                  </div>
                  <p className="text-[10px] text-slate-400">Based on task completion and Pomodoro compliance.</p>
                </div>

                {/* Tasks Queue Widget */}
                <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 space-y-3 h-48 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Today&apos;s Tasks</span>
                    <Badge variant="neon" className="text-[8px]">3 remaining</Badge>
                  </div>
                  <div className="space-y-2">
                    {[
                      { title: "Calculus Worksheet", subject: "Math" },
                      { title: "Physics Lab Outline", subject: "Phys" },
                      { title: "Revise Bio Notes", subject: "Bio" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-slate-950/50 p-2.5 border border-white/5">
                        <span className="text-xs text-white truncate max-w-[120px]">{item.title}</span>
                        <span className="text-[9px] text-cyan-300 font-semibold uppercase">{item.subject}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exams Widget */}
                <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 space-y-3 h-48">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Upcoming Exams</span>
                    <BookOpen className="h-3.5 w-3.5 text-fuchsia-400" />
                  </div>
                  <div className="rounded-xl bg-slate-950/60 p-3 border border-white/5 space-y-1">
                    <h5 className="text-xs font-bold text-white">Linear Algebra Midterm</h5>
                    <p className="text-[10px] text-fuchsia-300">Scheduled: In 3 Days</p>
                    <p className="text-[9px] text-slate-500">Coverage: Eigenvalues, Decomposition, Spaces.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "notes" && (
              <motion.div
                key="notes-mock"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid gap-4 md:grid-cols-[0.8fr_2.2fr] min-h-[16rem]"
              >
                {/* Notes list panel */}
                <div className="rounded-2xl border border-white/5 bg-slate-900/30 p-4 space-y-2 text-xs">
                  <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold block mb-3">Pages</span>
                  <div className="rounded-lg bg-cyan-400/5 border border-cyan-400/20 p-2.5 text-white">
                    Neural Networks.md
                  </div>
                  <div className="p-2.5 text-slate-400 hover:text-white transition cursor-pointer">
                    Calculus Limits.md
                  </div>
                  <div className="p-2.5 text-slate-400 hover:text-white transition cursor-pointer">
                    Syllabus.md
                  </div>
                </div>

                {/* Markdown editor mockup */}
                <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <h4 className="text-sm font-bold text-white">Neural Networks.md</h4>
                      <Badge variant="outline" className="text-[8px]">Compiled Markdown</Badge>
                    </div>
                    <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                      <h1 className="text-base font-bold text-white mt-2"># Introduction to Neural Nets</h1>
                      <p>Deep learning networks modeled roughly after biological synaptic pathways.</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-400 mt-2">
                        <li><strong>Input Layer</strong>: Receives dimensional vector metrics.</li>
                        <li><strong>Hidden States</strong>: Computes weights via activations (ReLU).</li>
                      </ul>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between text-[9px] text-slate-500">
                    <span>Format: Markdown</span>
                    <span>Words: 154</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "focus" && (
              <motion.div
                key="focus-mock"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid gap-4 md:grid-cols-[1.3fr_0.7fr] min-h-[16rem]"
              >
                {/* Timer Clock */}
                <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-4">Pomodoro Active</span>
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-cyan-400/20 bg-slate-950 shadow-neon/10">
                    {/* Ring progress simulation */}
                    <div className="absolute inset-0 rounded-full border-t-4 border-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
                    <span className="text-2xl font-bold text-white font-mono">{formatTime(pomodoroSeconds)}</span>
                  </div>
                  <button 
                    onClick={() => setFocusTicking(!focusTicking)}
                    className="mt-4 text-[10px] uppercase font-bold text-cyan-300 hover:text-cyan-200 transition"
                  >
                    {focusTicking ? "Pause Timer" : "Start Timer"}
                  </button>
                </div>

                {/* Soundscapes */}
                <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block border-b border-white/5 pb-2">Soundscapes</span>
                    {[
                      { name: "Rainforest 🌲", vol: "80%", active: true },
                      { name: "Ocean Waves 🌊", vol: "0%", active: false },
                      { name: "Coffee Shop ☕", vol: "0%", active: false }
                    ].map((sound) => (
                      <div key={sound.name} className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs border ${
                        sound.active ? "border-cyan-400/20 bg-cyan-400/5 text-white" : "border-white/5 bg-slate-950/40 text-slate-400"
                      }`}>
                        <span>{sound.name}</span>
                        {sound.active ? <Volume2 className="h-3.5 w-3.5 text-cyan-300 animate-pulse" /> : <span className="text-[9px] text-slate-600">Off</span>}
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-500 mt-2 leading-relaxed">Loop audio layers in focus mode for cognitive calm.</p>
                </div>
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics-mock"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid gap-4 md:grid-cols-2 min-h-[16rem]"
              >
                {/* Chart 1: Study hours */}
                <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Study hours (Week)</span>
                    <span className="text-[10px] text-cyan-300 font-bold">Total: 28.5 hrs</span>
                  </div>
                  <div className="flex h-28 items-end gap-3 mt-4">
                    {[3.2, 4.5, 2.8, 5.0, 4.8, 3.5, 4.7].map((hrs, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full rounded-t-lg bg-gradient-to-t from-cyan-500 to-sky-400 shadow-neon/10" 
                          style={{ height: `${(hrs / 5.5) * 100}%` }}
                        />
                        <span className="text-[8px] text-slate-500 mt-1">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart 2: Task completions */}
                <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Completions</span>
                    <span className="text-[10px] text-fuchsia-300 font-bold">Goal Met</span>
                  </div>
                  <div className="flex h-28 items-end gap-3 mt-4">
                    {[2, 4, 1, 5, 3, 2, 4].map((tasks, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full rounded-t-lg bg-gradient-to-t from-fuchsia-500 to-purple-400" 
                          style={{ height: `${(tasks / 5.5) * 100}%` }}
                        />
                        <span className="text-[8px] text-slate-500 mt-1">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
