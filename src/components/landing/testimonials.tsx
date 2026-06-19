"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Aarav",
    major: "Computer Science",
    quote: "CogniFlow replaced four different student tools. I can track syllabus tasks, compile notes, and maintain study streaks all in one viewport.",
    avatar: "A"
  },
  {
    name: "Maya",
    major: "Medical Student",
    quote: "The exam planners and analytics act like a cognitive coach. Revision cycles felt organized for the first time.",
    avatar: "M"
  },
  {
    name: "Jordan",
    major: "Engineering",
    quote: "The UI feels clean and fast. The ability to write notes in Markdown and immediately review stats is incredible.",
    avatar: "J"
  }
];

export function Testimonials() {
  return (
    <section id="testimonials" className="px-4 py-24 sm:px-6 lg:px-8 border-t border-white/5 relative overflow-hidden bg-slate-950/20 isolate">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <p className="text-[10px] uppercase font-bold tracking-[0.35em] text-cyan-300">Student Reviews</p>
          <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
            Built for consistency.
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border border-white/5 bg-white/5 p-6 backdrop-blur-md flex flex-col justify-between hover:border-white/10 transition-all duration-300">
                <CardHeader className="p-0 space-y-4">
                  <div className="flex items-center gap-1 text-cyan-300">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-cyan-300" />
                    ))}
                  </div>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed text-slate-300">
                    “{item.quote}”
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-0 pt-6 mt-6 border-t border-white/5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-300">
                    {item.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.major}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
