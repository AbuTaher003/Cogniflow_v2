"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Does CogniFlow support email and social login?",
    a: "Yes. The auth layer is fully integrated for email credentials along with secure Google and GitHub OAuth providers."
  },
  {
    q: "Is the database isolated per user?",
    a: "Absolutely. Every table utilizes Row Level Security (RLS) policies matching your unique user ID, so your notes, tasks, and habits remain private."
  },
  {
    q: "Can I track study hours on mobile devices?",
    a: "Yes. CogniFlow is engineered mobile-first. The landing page, dashboards, and charts adjust dynamically for mobile viewports."
  },
  {
    q: "Is the workspace ready for future features?",
    a: "Yes. The architecture is modularly structured, dividing components and files into distinct directories to easily enable scaling."
  }
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="px-4 py-24 sm:px-6 lg:px-8 border-t border-white/5 bg-slate-950/40 relative isolate">
      <div className="mx-auto max-w-4xl">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <p className="text-[10px] uppercase font-bold tracking-[0.35em] text-cyan-300">Support</p>
          <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">Answers to common questions.</h2>
        </div>

        <div className="space-y-3 max-w-3xl mx-auto">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className={`rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? "border-cyan-500/30 bg-white/10 shadow-lg shadow-cyan-950/20"
                    : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/15"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(index)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-450 rounded-2xl"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span className="leading-snug">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-cyan-300 transition-transform duration-300 shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      role="region"
                      aria-labelledby={`faq-question-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 max-w-2xl text-xs sm:text-sm text-slate-400 leading-relaxed">
                        <p>{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
