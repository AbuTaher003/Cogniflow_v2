"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Notebook, CalendarRange, CheckSquare,
  Flame, Timer, Clock, Activity, ShieldCheck,
  Search, ChevronRight, ArrowLeft, Lightbulb, ListTodo
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { HELP_DOCS, HelpDoc } from "@/lib/help-docs";
import { cn } from "@/lib/utils";

// Map icon string names to actual Lucide components
const IconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  Notebook,
  CalendarRange,
  CheckSquare,
  Flame,
  Timer,
  Clock,
  Activity,
  ShieldCheck
};

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

export function HelpModal({ isOpen, onClose, currentPath }: HelpModalProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  // Map pathnames to default help category IDs
  const getInitialCategory = (path: string): string => {
    if (path.includes("/dashboard/notes")) return "notes";
    if (path.includes("/dashboard/exams")) return "exams";
    if (path.includes("/dashboard/tasks")) return "tasks";
    if (path.includes("/dashboard/habits")) return "habits";
    if (path.includes("/dashboard/focus")) return "focus";
    if (path.includes("/dashboard/study-planner")) return "study-planner";
    if (path.includes("/dashboard/analytics")) return "analytics";
    if (path.includes("/dashboard/admin")) return "admin";
    return "dashboard";
  };

  // Reset tab/search and set initial page context on open
  useEffect(() => {
    if (isOpen) {
      const initialTab = getInitialCategory(currentPath);
      setActiveTab(initialTab);
      setSearch("");
      // If we are on a specific page that has contextual help, open directly to details on mobile
      if (initialTab !== "dashboard") {
        setMobileView("detail");
      } else {
        setMobileView("list");
      }
    }
  }, [isOpen, currentPath]);

  const activeDoc = HELP_DOCS.find((doc) => doc.id === activeTab) || HELP_DOCS[0];

  // Filtering based on search query
  const filteredDocs = HELP_DOCS.filter((doc) => {
    const query = search.toLowerCase();
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.description.toLowerCase().includes(query) ||
      doc.whatItIs.toLowerCase().includes(query) ||
      doc.howToUse.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] md:w-full h-[85vh] md:h-[600px] flex flex-col md:flex-row p-0 overflow-hidden bg-slate-950/95 border-white/10 shadow-2xl backdrop-blur-xl">
        <DialogTitle className="sr-only">CogniFlow Workspace Guide</DialogTitle>

        {/* SIDEBAR / TOPIC LIST SECTION */}
        <div
          className={cn(
            "flex-col w-full md:w-[280px] shrink-0 border-r border-white/5 bg-slate-950/40 p-4 h-full",
            mobileView === "list" ? "flex" : "hidden md:flex"
          )}
        >
          {/* Header Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              placeholder="Search guide topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-900/60 border-white/5 text-xs text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-cyan-500/30"
            />
          </div>

          {/* Topics List Scroll */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 py-1.5 block">
              Feature Guides
            </span>
            {filteredDocs.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-8">No matching topics found.</p>
            ) : (
              filteredDocs.map((doc) => {
                const IconComponent = IconMap[doc.iconName] || LayoutDashboard;
                const isActive = doc.id === activeTab;
                return (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setActiveTab(doc.id);
                      setMobileView("detail");
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition duration-200",
                      isActive
                        ? "bg-cyan-500/10 text-cyan-300 shadow-glow/10 border border-cyan-500/20"
                        : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent className={cn("h-4 w-4 shrink-0", isActive ? "text-cyan-400" : "text-slate-500")} />
                      <span className="truncate">{doc.title}</span>
                    </div>
                    <ChevronRight className="h-3 w-3 text-slate-600 md:opacity-0 group-hover:opacity-100 transition" />
                  </button>
                );
              })
            )}
          </div>

          {/* Shortcut hint at sidebar footer */}
          <div className="border-t border-white/5 pt-3 mt-2 text-[10px] text-slate-500 flex justify-between items-center px-1">
            <span>Toggle Help</span>
            <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[9px]">?</kbd>
          </div>
        </div>

        {/* DOCUMENT VIEW SECTION */}
        <div
          className={cn(
            "flex-1 flex flex-col h-full bg-slate-950/20 relative",
            mobileView === "detail" ? "flex" : "hidden md:flex"
          )}
        >
          {/* Mobile Back Header */}
          <div className="flex items-center md:hidden border-b border-white/5 bg-slate-950/40 p-4 shrink-0">
            <button
              onClick={() => setMobileView("list")}
              className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to topics
            </button>
          </div>

          {/* Documentation Details Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin">
            {/* Topic Title */}
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              {React.createElement(IconMap[activeDoc.iconName] || LayoutDashboard, {
                className: "h-7 w-7 text-cyan-400 shrink-0"
              })}
              <div>
                <h2 className="text-xl font-bold text-white">{activeDoc.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{activeDoc.description}</p>
              </div>
            </div>

            {/* What is it */}
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-bold tracking-wider text-cyan-300">Overview</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">{activeDoc.whatItIs}</p>
            </div>

            {/* How to use */}
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-bold tracking-wider text-fuchsia-300">Core Concept</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">{activeDoc.howToUse}</p>
            </div>

            {/* Steps list */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-slate-400">
                <ListTodo className="h-4 w-4 text-cyan-400" />
                <span>How to Get Started</span>
              </div>
              <ol className="space-y-2.5 pl-4 list-decimal text-xs text-slate-300 leading-relaxed">
                {activeDoc.steps.map((step, idx) => (
                  <li key={idx} className="pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips panel */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-amber-400">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span>Pro Tips</span>
              </div>
              <ul className="space-y-2.5 pl-4 list-disc text-xs text-slate-300 leading-relaxed">
                {activeDoc.tips.map((tip, idx) => (
                  <li key={idx} className="pl-1">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
