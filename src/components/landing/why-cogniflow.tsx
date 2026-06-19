"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

export function WhyCogniFlow() {
  return (
    <section id="why-us" className="px-4 py-24 sm:px-6 lg:px-8 border-t border-white/5 bg-slate-950/20 relative isolate">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <p className="text-[10px] uppercase font-bold tracking-[0.35em] text-fuchsia-400">The Difference</p>
          <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
            Why study with CogniFlow?
          </h2>
          <p className="text-slate-400 text-sm">
            Compare the friction of scattered resources against a centralized academic console.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          
          {/* Traditional Study Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-rose-500/10 bg-rose-500/5 p-6 backdrop-blur-md relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-24 w-24 bg-rose-500/5 rounded-full blur-2xl z-0" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-rose-300">Traditional Study</h3>
              <p className="text-xs text-slate-400 mt-1">Fragmented and predictable friction</p>
            
            <div className="mt-8 space-y-4">
              {[
                "Scattered notebooks, folders, and lost course sheets.",
                "Unpredictable schedule leading to missed assignment dates.",
                "Disjointed Pomodoro clocks with no metrics history.",
                "No clear insight into course timelines or CGPA projections."
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 mt-0.5">
                    <X className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs sm:text-sm text-slate-300 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
            </div>
          </motion.div>

          {/* CogniFlow Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-6 backdrop-blur-md relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-24 w-24 bg-cyan-400/10 rounded-full blur-2xl z-0" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-cyan-300">CogniFlow Workspace</h3>
              <p className="text-xs text-slate-400 mt-1">Streamlined cognitive flow</p>
            
            <div className="mt-8 space-y-4">
              {[
                "Centralized lecture notes, subjects, and tagged catalog files.",
                "Integrated semester planner with priorities and estimated credits.",
                "Native focus timers equipped with study sound loops and logs.",
                "Real-time CGPA targets and grade predictions computed automatically."
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs sm:text-sm text-slate-300 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
