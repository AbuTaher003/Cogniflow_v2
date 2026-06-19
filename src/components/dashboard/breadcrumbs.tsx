"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

import type { Route } from "next";

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  "study-planner": "Study Planner",
  tasks: "Tasks",
  notes: "Notes",
  exams: "Exams",
  habits: "Habits",
  focus: "Focus Mode",
  analytics: "Analytics",
  resume: "Resume Builder",
  internships: "Internship Tracker",
  "cp-tracker": "CP Tracker",
  kaggle: "Kaggle Tracker",
  settings: "Settings",
  profile: "Profile",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500">
      <Link href="/dashboard" className="flex items-center gap-1 transition hover:text-white">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.slice(1).map((segment, index) => {
        const href = "/" + segments.slice(0, index + 2).join("/");
        const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        const isLast = index === segments.length - 2;

        return (
          <span key={href} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="text-white">{label}</span>
            ) : (
              <Link href={href as Route} className="transition hover:text-white">{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
