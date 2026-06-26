"use client";

import React, { useState, useEffect } from "react";
import { X, HelpCircle } from "lucide-react";
import { HelpModal } from "./help-modal";
import { AnimatePresence, motion } from "framer-motion";

interface HelpSystemProps {
  currentPath: string;
}

export function HelpSystem({ currentPath }: HelpSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Global hotkey and custom event triggers listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.getAttribute("role") === "textbox"
      ) {
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    const handleCustomToggle = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("toggle-help", handleCustomToggle);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle-help", handleCustomToggle);
    };
  }, []);

  // Onboarding Hint Trigger (First-time user lightweight check)
  useEffect(() => {
    const isHintSeen = localStorage.getItem("cogniflow_help_hint_seen");
    if (!isHintSeen) {
      // Delay showing the hint toast for 2 seconds after load so it is non-intrusive
      const timer = setTimeout(() => {
        setShowHint(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissHint = () => {
    localStorage.setItem("cogniflow_help_hint_seen", "true");
    setShowHint(false);
  };

  return (
    <>
      {/* Notion-style Interactive Modal Guide */}
      <HelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} currentPath={currentPath} />

      {/* Onboarding hint slide-in toast */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-4 right-4 z-50 flex items-center gap-3.5 max-w-sm w-[calc(100vw-32px)] sm:w-auto bg-slate-900/90 border border-white/10 p-3.5 rounded-2xl shadow-glow backdrop-blur-md"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-white">Need help getting started?</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Press <kbd className="px-1 py-0.2 rounded bg-white/5 border border-white/10 font-mono text-[9px]">?</kbd> anytime to open the guide.</p>
            </div>
            <button
              onClick={dismissHint}
              className="p-1 rounded-lg text-slate-500 hover:bg-white/10 hover:text-slate-300 transition shrink-0"
              aria-label="Dismiss help hint"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
