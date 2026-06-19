"use client";

import { motion } from "framer-motion";
import { UserPlus, CalendarRange, Award } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Account",
    description: "Quick signup via email or secure Google and GitHub OAuth to establish your personal student space."
  },
  {
    number: "02",
    icon: CalendarRange,
    title: "Organize Your Study",
    description: "Input course subjects, write markdown lecture notes, setup deadline priority queues, and map exam coverages."
  },
  {
    number: "03",
    icon: Award,
    title: "Achieve Your Goals",
    description: "Start Pomodoro timers with ambient sounds, track consistency streaks, and watch your CGPA move up."
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-24 sm:px-6 lg:px-8 border-t border-white/5 bg-slate-950/40 relative isolate">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <p className="text-[10px] uppercase font-bold tracking-[0.35em] text-cyan-300">Methodology</p>
          <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
            Three steps to study calm.
          </h2>
          <p className="text-slate-400 text-sm">
            CogniFlow integrates into your existing daily routine, taking you from setup to academic mastery.
          </p>
        </div>

        {/* Timeline Layout */}
        <div className="relative">
          {/* Connecting Line Desktop */}
          <div className="hidden lg:block absolute left-[15%] right-[15%] top-1/2 h-0.5 bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-cyan-500/20 -translate-y-1/2 z-0" />

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-md flex flex-col justify-between group hover:border-white/10 hover:bg-white/10 transition-all duration-300 z-10"
              >
                <div>
                  {/* Step Number Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 group-hover:scale-105 transition duration-300">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="font-display text-2xl font-black text-white/10 group-hover:text-cyan-300/10 transition duration-300">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-6 group-hover:text-cyan-300 transition duration-300">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
