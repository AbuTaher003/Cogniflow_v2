"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, CheckSquare, BookOpen, Flame, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import type { Route } from "next";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);


  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Query database/mock client
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    async function performSearch() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const q = query.toLowerCase();

      // Fetch all sources for search matching
      const [
        { data: notes },
        { data: tasks },
        { data: subjects },
        { data: exams },
        { data: habits }
      ] = await Promise.all([
        supabase.from("notes").select("id, title, tags").eq("user_id", user.id),
        supabase.from("tasks").select("id, title, tags").eq("user_id", user.id),
        supabase.from("subjects").select("id, name, code").eq("user_id", user.id),
        supabase.from("exams").select("id, title, exam_type").eq("user_id", user.id),
        supabase.from("habits").select("id, title, category").eq("user_id", user.id),
      ]);

      const matchedResults: any[] = [];

      if (notes) {
        notes.forEach((n: any) => {
          if (n.title.toLowerCase().includes(q) || (n.tags && n.tags.some((t: string) => t.toLowerCase().includes(q)))) {
            matchedResults.push({ id: n.id, title: n.title, type: "note", path: "/dashboard/notes" });
          }
        });
      }

      if (tasks) {
        tasks.forEach((t: any) => {
          if (t.title.toLowerCase().includes(q) || (t.tags && t.tags.some((tg: string) => tg.toLowerCase().includes(q)))) {
            matchedResults.push({ id: t.id, title: t.title, type: "task", path: "/dashboard/tasks" });
          }
        });
      }

      if (subjects) {
        subjects.forEach((s: any) => {
          if (s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q))) {
            matchedResults.push({ id: s.id, title: `${s.name} (${s.code || "Syllabus"})`, type: "subject", path: "/dashboard/study-planner" });
          }
        });
      }

      if (exams) {
        exams.forEach((e: any) => {
          if (e.title.toLowerCase().includes(q) || e.exam_type.toLowerCase().includes(q)) {
            matchedResults.push({ id: e.id, title: e.title, type: "exam", path: "/dashboard/exams" });
          }
        });
      }

      if (habits) {
        habits.forEach((h: any) => {
          if (h.title.toLowerCase().includes(q) || h.category.toLowerCase().includes(q)) {
            matchedResults.push({ id: h.id, title: h.title, type: "habit", path: "/dashboard/habits" });
          }
        });
      }

      setResults(matchedResults.slice(0, 8)); // limit to 8 results
      setSelectedIndex(0);
    }

    const delay = setTimeout(performSearch, 200); // debounce input
    return () => clearTimeout(delay);
  }, [query, supabase]);

  // Navigate on Select
  const handleSelect = (item: any) => {
    router.push(item.path as Route);
    onClose();
  };

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "note": return <FileText className="h-4 w-4 text-amber-300" />;
      case "task": return <CheckSquare className="h-4 w-4 text-cyan-300" />;
      case "subject": return <BookOpen className="h-4 w-4 text-fuchsia-300" />;
      case "exam": return <Sparkles className="h-4 w-4 text-purple-300" />;
      case "habit": return <Flame className="h-4 w-4 text-orange-300" />;
      default: return <FileText className="h-4 w-4 text-slate-300" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="border-white/10 bg-slate-950/95 text-white max-w-lg p-0 overflow-hidden rounded-3xl backdrop-blur-2xl shadow-glow">
        {/* Search header bar */}
        <div className="relative border-b border-white/10 p-4">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            ref={inputRef}
            placeholder="Type a query to search subjects, notes, tasks..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent pl-9 pr-6 text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results layout */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {query === "" ? (
            <div className="py-6 text-center text-xs text-slate-500">
              <Sparkles className="mx-auto h-5 w-5 text-slate-600 mb-1.5 animate-pulse" />
              Tip: Use shortcuts <strong>cmd + k</strong> to launch search anywhere.
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching pages or notes found.
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 transition duration-150 ${isSelected ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {getIcon(item.type)}
                    <span className="text-xs font-semibold">{item.title}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase font-mono tracking-wider">
                    {item.type}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
