"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  ArrowLeft,
  LayoutDashboard,
  Wallet,
  ShieldCheck,
  Users,
  TrendingUp,
  SearchCode,
  Bell,
  Search,
  ChevronRight,
  Activity,
  PlusCircle,
  Command,
  User,
  Settings,
  MessageSquareText,
  Megaphone
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface AdminHeaderProps {
  userEmail: string | null;
}

const segmentLabels: Record<string, string> = {
  admin: "Dashboard",
  payments: "Payments Queue",
  subscriptions: "Subscriptions",
  users: "User Directory",
  feedback: "Feedback Tickets",
  announcements: "Announcements",
  analytics: "Reconciliation Charts",
  "audit-logs": "System Audit Logs",
  profile: "Admin Profile"
};

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const { count, error } = await supabase
          .from("payment_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        if (!error && count !== null) {
          setPendingCount(count);
        }
      } catch (err) {
        console.error("Error fetching pending approvals:", err);
      }
    }
    
    fetchPendingCount();
    // Poll every 30 seconds for pending payments
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [supabase]);

  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Payments Queue", href: "/admin/payments", icon: Wallet },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: ShieldCheck },
    { label: "User Directory", href: "/admin/users", icon: Users },
    { label: "Feedback Tickets", href: "/admin/feedback", icon: MessageSquareText },
    { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
    { label: "Reconciliation Charts", href: "/admin/analytics", icon: TrendingUp },
    { label: "System Audit Logs", href: "/admin/audit-logs", icon: SearchCode },
    { label: "Admin Profile", href: "/admin/profile", icon: Settings }
  ];

  // Parse path segments for breadcrumbs
  const segments = pathname.split("/").filter(Boolean);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/admin/users?search=${encodeURIComponent(searchVal.trim())}` as any);
      setSearchVal("");
    }
  };

  return (
    <header className="h-16 border-b border-zinc-900/60 bg-zinc-950/40 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Left Side: Mobile Trigger + Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-zinc-400 hover:text-white p-2 hover:bg-zinc-900/60"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-6 flex flex-col bg-zinc-950 border-r border-zinc-900/60">
            {/* Drawer Logo */}
            <div className="flex h-12 items-center px-2 mb-6 border-b border-zinc-900/60">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-white font-semibold"
                onClick={() => setOpen(false)}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold text-sm">
                  CF
                </span>
                <span className="font-display tracking-wide text-zinc-100">Super Admin</span>
              </Link>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 border ${
                      isActive
                        ? "bg-purple-600/10 border-purple-500/20 text-purple-400"
                        : "text-zinc-400 hover:bg-zinc-900/60 hover:text-white border-transparent"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-purple-400" : "text-zinc-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Footer */}
            <div className="border-t border-zinc-900/60 pt-4 mt-auto space-y-4">
              <div className="px-3 text-[11px] text-zinc-500 font-mono truncate">
                Admin: <span className="text-zinc-300 font-normal">{userEmail}</span>
              </div>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:text-white transition-all shadow-md"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to App</span>
              </Link>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Breadcrumbs */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-zinc-500">
          <span className="text-zinc-400 font-semibold hover:text-zinc-200 transition-colors cursor-pointer" onClick={() => router.push("/admin" as any)}>
            Super Admin
          </span>
          {segments.map((seg, idx) => {
            const label = segmentLabels[seg] || seg;
            const isLast = idx === segments.length - 1;
            return (
              <React.Fragment key={seg}>
                <ChevronRight className="h-3 w-3 text-zinc-600" />
                <span className={isLast ? "text-zinc-200 font-semibold" : "hover:text-zinc-300 transition-colors cursor-pointer"} onClick={() => {
                  if (!isLast) {
                    router.push(("/" + segments.slice(0, idx + 1).join("/")) as any);
                  }
                }}>
                  {label}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Right Side: Search, Quick Actions, Notifications, User Profile & Back to App */}
      <div className="flex items-center gap-4">
        {/* Global User Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-48 xl:w-60 pl-9 pr-8 py-1.5 bg-zinc-900/40 focus:bg-zinc-900/80 border border-zinc-800 focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-purple-500/20 text-xs rounded-lg text-zinc-300 transition-all placeholder-zinc-500"
          />
          <div className="absolute right-2.5 top-2 px-1 py-0.5 rounded bg-zinc-800 text-[9px] text-zinc-500 font-mono flex items-center border border-zinc-700/50 pointer-events-none">
            <Command className="h-2 w-2 mr-0.5" />K
          </div>
        </form>

        {/* Quick Actions Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="text-xs font-semibold text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800/80 bg-zinc-900/20 px-3 py-1.5 h-8 rounded-lg transition-all"
          >
            Quick Actions
          </Button>
          {showQuickActions && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowQuickActions(false)} />
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-zinc-950 border border-zinc-900 p-2 shadow-2xl z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  href="/admin/payments?status=pending"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 transition-all font-medium"
                >
                  <Wallet className="h-3.5 w-3.5 text-amber-400" />
                  <span>Review Pending Payments</span>
                </Link>
                <Link
                  href="/admin/subscriptions"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 transition-all font-medium"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                  <span>Manage Active Seats</span>
                </Link>
                <Link
                  href="/admin/audit-logs"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 transition-all font-medium"
                >
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Inspect Audit Timelines</span>
                </Link>
                <Link
                  href="/admin/profile"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 transition-all font-medium"
                >
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  <span>View Admin Profile</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Notifications (Pending count) */}
        <Link href="/admin/payments?status=pending" className="relative group p-2 hover:bg-zinc-900/50 rounded-lg transition-all border border-transparent hover:border-zinc-900">
          <Bell className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[8px] font-bold text-white shadow-lg animate-pulse">
              {pendingCount}
            </span>
          )}
        </Link>

        {/* Return to student dashboard button */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 px-4 py-2 h-9 text-xs font-semibold text-zinc-200 hover:text-white transition-all shadow-md group shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </header>
  );
}
