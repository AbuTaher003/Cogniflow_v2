"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3, BookOpen, Brain, CalendarRange, CheckCircle2, Code2, FileText,
  Flame, Home, LineChart, Settings, Sparkles, Target, Timer, Trophy, Briefcase,
  Award, CreditCard, Megaphone, MessageSquareText, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Study Planner", href: "/dashboard/study-planner", icon: CalendarRange },
  { label: "Tasks", href: "/dashboard/tasks", icon: CheckCircle2 },
  { label: "Notes", href: "/dashboard/notes", icon: FileText },
  { label: "Exams", href: "/dashboard/exams", icon: BookOpen },
  { label: "Habits", href: "/dashboard/habits", icon: Flame },
  { label: "Focus Mode", href: "/dashboard/focus", icon: Timer },
  { label: "Analytics", href: "/dashboard/analytics", icon: LineChart },
];

const toolsNav = [
  { label: "Resume Builder", href: "/dashboard/resume", icon: Briefcase },
  { label: "Internship Tracker", href: "/dashboard/internships", icon: Target },
  { label: "CP Tracker", href: "/dashboard/cp-tracker", icon: Code2 },
  { label: "Kaggle Tracker", href: "/dashboard/kaggle", icon: Trophy },
  { label: "AI Assistant", href: "/dashboard/ai", icon: Sparkles },
  { label: "Achievements", href: "/dashboard/achievements", icon: Award },
  { label: "Auto Study Plan", href: "/study-plan", icon: CalendarRange },
  { label: "Progress Tracker", href: "/progress", icon: LineChart },
];

const saasNav = [
  { label: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
  { label: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
  { label: "Feedback", href: "/dashboard/feedback", icon: MessageSquareText },
  { label: "Admin Panel", href: "/dashboard/admin", icon: ShieldAlert },
];

const bottomNav = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

import type { Route } from "next";

function NavItem({ item, collapsed, isActive, isMobile = false }: { item: typeof mainNav[0]; collapsed: boolean; isActive: boolean; isMobile?: boolean }) {
  const content = (
    <Link
      href={item.href as Route}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-white/10 text-white shadow-sm"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      {isActive && (
        <motion.div
          layoutId={isMobile ? "sidebar-active-mobile" : "sidebar-active-desktop"}
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 border border-white/10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <item.icon className={cn("relative z-10 h-[18px] w-[18px] shrink-0", isActive && "text-cyan-300")} />
      {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-white/10 bg-slate-950/80 backdrop-blur-xl transition-all duration-300 lg:flex",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div className={cn("flex h-16 items-center border-b border-white/10 px-4", collapsed && "justify-center")}>
          <Link href="/dashboard" className="flex items-center gap-3 text-white">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 text-cyan-300">
              <img src="/logo_1.png" alt="CogniFlow Logo" className="h-5 w-5 object-contain" />
            </span>
            {!collapsed && <span className="font-display text-lg font-semibold tracking-wide">CogniFlow</span>}
          </Link>
        </div>

        {/* Main nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className={cn("mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500", collapsed && "sr-only")}>
            Main
          </p>
          {mainNav.map((item) => (
            <NavItem key={item.href} item={item} collapsed={collapsed} isActive={pathname === item.href} />
          ))}

          <Separator className="my-4" />

          <p className={cn("mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500", collapsed && "sr-only")}>
            Tools
          </p>
          {toolsNav.map((item) => (
            <NavItem key={item.href} item={item} collapsed={collapsed} isActive={pathname === item.href} />
          ))}

          <Separator className="my-4" />

          <p className={cn("mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500", collapsed && "sr-only")}>
            SaaS Platform
          </p>
          {saasNav.map((item) => (
            <NavItem key={item.href} item={item} collapsed={collapsed} isActive={pathname === item.href} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/10 p-3">
          {bottomNav.map((item) => (
            <NavItem key={item.href} item={item} collapsed={collapsed} isActive={pathname === item.href} />
          ))}

          {/* Collapse toggle */}
          <button
            onClick={onToggle}
            className="mt-2 flex w-full items-center justify-center rounded-xl px-3 py-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
          >
            <Brain className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && <span className="ml-3 text-xs">Collapse</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

/** Renders sidebar nav content for mobile sheet usage */
export function SidebarContent() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-4">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Main</p>
      {mainNav.map((item) => (
        <NavItem key={item.href} item={item} collapsed={false} isActive={pathname === item.href} isMobile={true} />
      ))}
      <Separator className="my-3" />
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Tools</p>
      {toolsNav.map((item) => (
        <NavItem key={item.href} item={item} collapsed={false} isActive={pathname === item.href} isMobile={true} />
      ))}
      <Separator className="my-3" />
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">SaaS</p>
      {saasNav.map((item) => (
        <NavItem key={item.href} item={item} collapsed={false} isActive={pathname === item.href} isMobile={true} />
      ))}
      <Separator className="my-3" />
      {bottomNav.map((item) => (
        <NavItem key={item.href} item={item} collapsed={false} isActive={pathname === item.href} isMobile={true} />
      ))}
    </nav>
  );
}
