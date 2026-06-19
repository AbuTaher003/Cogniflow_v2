"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { createClient } from "@/lib/supabase/client";

import { SearchModal } from "@/components/dashboard/search-modal";
import { QuickActions } from "@/components/dashboard/quick-actions";

interface DashboardShellProps {
  children: React.ReactNode;
  user: { email?: string; full_name?: string; avatar_url?: string } | null;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const supabase = createClient();

  // Handle global keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    async function loadNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        setNotifications(data);
      }
    }
    loadNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleMarkAsRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function handleDeleteNotification(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div className={cn("flex flex-col transition-all duration-300", collapsed ? "lg:pl-[68px]" : "lg:pl-[240px]")}>
        <Topbar
          user={user}
          theme={theme === "light" ? "light" : "dark"}
          onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
          notifications={notifications}
          notificationCount={unreadCount}
          onMarkAsRead={handleMarkAsRead}
          onDeleteNotification={handleDeleteNotification}
          onSearchClick={() => setSearchOpen(true)}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </div>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <QuickActions />
    </div>
  );
}
