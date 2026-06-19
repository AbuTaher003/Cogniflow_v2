"use client";

import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, LineChart, Flame, Clock3, BookOpen } from "lucide-react";

const tasks = [
  { title: "Solve calculus worksheet", time: "Today 7:30 PM", status: "In progress" },
  { title: "Revise biology notes", time: "Tomorrow 6:00 AM", status: "Planned" },
  { title: "Physics exam sprint", time: "Fri 8:00 PM", status: "Focus" }
];

export function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative mx-auto w-full max-w-2xl"
    >
      <div className="absolute -left-8 top-10 h-24 w-24 rounded-full bg-cyan-400/30 blur-3xl" />
      <div className="absolute -right-10 bottom-8 h-28 w-28 rounded-full bg-fuchsia-500/25 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/65 p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur-2xl sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Today&apos;s dashboard</p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-white">Study flow score 92%</h3>
              </div>
              <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                +18% this week
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Tasks", value: "14", icon: CheckCircle2, accent: "from-cyan-400 to-sky-500" },
                { label: "Focus time", value: "6.2h", icon: Clock3, accent: "from-fuchsia-400 to-violet-500" },
                { label: "Streak", value: "21d", icon: Flame, accent: "from-amber-400 to-orange-500" }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r ${item.accent} text-white`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <p className="mt-4 text-sm text-slate-400">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Productivity trend</span>
                <span>Last 7 days</span>
              </div>
              <div className="mt-4 flex h-28 items-end gap-2">
                {[36, 52, 42, 74, 58, 88, 68].map((height, index) => (
                  <div key={index} className="flex-1">
                    <div
                      className="rounded-t-2xl bg-gradient-to-t from-cyan-500 via-sky-400 to-fuchsia-400 shadow-neon"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-slate-400">Upcoming exam</p>
                  <h4 className="font-medium text-white">Linear Algebra</h4>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/65 p-4 text-sm text-slate-300">
                3 days left to master eigenvalues, matrix decomposition, and transforms.
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-fuchsia-400/15 text-fuchsia-200">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-slate-400">Study plan</p>
                  <h4 className="font-medium text-white">Deep work session</h4>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {tasks.map((task) => (
                  <div key={task.title} className="rounded-2xl border border-white/10 bg-slate-950/65 p-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm text-white">{task.title}</p>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-slate-300">{task.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{task.time}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 p-5">
              <div className="flex items-center gap-3 text-white">
                <LineChart className="h-5 w-5" />
                <div>
                  <p className="text-sm text-white/70">CGPA projection</p>
                  <h4 className="font-medium">Target 9.1 predicted</h4>
                </div>
              </div>
              <div className="mt-4 flex items-end gap-2 text-white/80">
                <div className="h-10 flex-1 rounded-t-2xl bg-white/30" />
                <div className="h-16 flex-1 rounded-t-2xl bg-white/45" />
                <div className="h-20 flex-1 rounded-t-2xl bg-white/55" />
                <div className="h-28 flex-1 rounded-t-2xl bg-white/75" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
