"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Trophy, Flame, Clock3, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardPreview } from "@/components/landing/dashboard-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-28 pt-20 sm:px-6 lg:px-8 lg:pb-36 lg:pt-32 isolate">
      {/* Premium gradient mesh background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,_rgba(34,211,238,0.18),_transparent_40%),radial-gradient(circle_at_70%_60%,_rgba(217,70,239,0.15),_transparent_40%),linear-gradient(180deg,_rgba(6,11,29,1),_rgba(2,4,12,1))]" />

      {/* Decorative sweep light lines */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[linear-gradient(90deg,rgba(34,211,238,0.15),rgba(168,85,247,0.1),rgba(59,130,246,0.15))] bg-[length:200%_200%] opacity-40 blur-3xl animate-sweep" />

      <div className="mx-auto max-w-7xl relative">

        {/* Subtle Watermark Logo / Brand Badge above headline */}
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-1.5 text-xs text-cyan-200 backdrop-blur-md shadow-neon/10"
          >
            <img src="/logo_1.png" alt="CogniFlow mark" className="h-4.5 w-auto object-contain opacity-80" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">Academic Operating System</span>
          </motion.div>
        </div>

        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl leading-tight"
          >
            Plan classes, crush deadlines, and build consistency.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto"
          >
            CogniFlow brings tasks, notes, exams, habits, focus sessions, and analytics into one premium workspace built for students who want high performance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4"
          >
            <Link href="/sign-up">
              <Button size="lg" variant="primary" className="h-12 px-8 font-semibold shadow-lg shadow-cyan-950/20 text-sm gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#preview">
              <Button size="lg" variant="secondary" className="h-12 px-8 font-semibold text-sm gap-2">
                <Play className="h-4 w-4 fill-white text-white" />
                Watch Demo
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Dashboard Preview mockup container with animated floating cards */}
        <div className="relative mt-20 max-w-4xl mx-auto">
          {/* Ambient light glow behind the mockup */}
          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-[2.2rem] opacity-10 blur-xl z-0" />

          {/* Floating Glass Card Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
            transition={{
              x: { duration: 0.8, delay: 0.4 },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }}
            className="hidden lg:flex absolute -left-16 top-1/4 z-20 items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">GPA Target</p>
              <h5 className="text-xs font-bold text-white mt-0.5">Predicted 3.92</h5>
            </div>
          </motion.div>

          {/* Floating Glass Card Right */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0, y: [0, 10, 0] }}
            transition={{
              x: { duration: 0.8, delay: 0.5 },
              y: { duration: 7, repeat: Infinity, ease: "easeInOut" }
            }}
            className="hidden lg:flex absolute -right-16 top-1/3 z-20 items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-400/10 text-fuchsia-300">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Daily Focus</p>
              <h5 className="text-xs font-bold text-white mt-0.5">Deep Work: 1.5h</h5>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.8, delay: 0.6 },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="hidden lg:flex absolute -right-10 bottom-12 z-20 items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400/10 text-orange-300 animate-pulse">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Daily Streak</p>
              <h5 className="text-xs font-bold text-white mt-0.5">18 Days Active</h5>
            </div>
          </motion.div>

          <div className="relative z-10">
            <DashboardPreview />
          </div>
        </div>

      </div>
    </section>
  );
}
