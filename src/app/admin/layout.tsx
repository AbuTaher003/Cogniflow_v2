import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LayoutDashboard,
  Wallet,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  SearchCode,
  ArrowLeft,
  MessageSquareText,
  Megaphone
} from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "ataherrizon@gmail.com";

  if (!user || user.email !== superAdminEmail) {
    redirect("/dashboard");
  }

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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans antialiased">
      {/* Admin Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-zinc-900/60 bg-zinc-950/80 backdrop-blur-xl flex-col p-4 shrink-0 sticky top-0 h-screen">
        <div className="flex h-16 items-center px-4 mb-6 border-b border-zinc-900/60">
          <Link href="/admin" className="flex items-center gap-3 text-white font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-500/20">
              CF
            </span>
            <div className="flex flex-col">
              <span className="font-semibold tracking-wide text-zinc-100 leading-none">CogniFlow</span>
              <span className="text-[10px] text-zinc-500 mt-1 font-mono uppercase tracking-wider">Super Admin</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1.5 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href as any}
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-semibold text-zinc-400 hover:bg-zinc-900/60 hover:text-white transition-all duration-200 group border border-transparent hover:border-zinc-900/30"
            >
              <item.icon className="h-4.5 w-4.5 shrink-0 text-zinc-500 group-hover:text-purple-400 transition-colors" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-zinc-900/60 pt-4 mt-auto px-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-semibold text-zinc-400 hover:bg-zinc-900/60 hover:text-white transition-all duration-200 border border-transparent hover:border-zinc-800"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-zinc-500" />
            <span>Back to App</span>
          </Link>
        </div>
      </aside>

      {/* Content wrapper */}
      <main className="flex-1 min-w-0 flex flex-col bg-zinc-950/20 relative">
        {/* Admin Header */}
        <AdminHeader userEmail={user?.email || null} />

        {/* Inner Page Content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
