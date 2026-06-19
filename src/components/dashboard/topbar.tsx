"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell, LogOut, Moon, Search, Settings, Sun, User, Menu,
  Trash2, Check, Trophy, Calendar, Flame, CheckSquare, Info, Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/dashboard/sidebar";

interface TopbarProps {
  user: { email?: string; full_name?: string; avatar_url?: string } | null;
  notificationCount?: number;
  theme: "dark" | "light";
  onThemeToggle: () => void;
  notifications?: any[];
  onMarkAsRead?: (id: string) => void;
  onDeleteNotification?: (id: string) => void;
  onSearchClick?: () => void;
}

const PRESET_AVATARS = [
  { id: "preset-1", name: "Cyan Spark", bg: "from-cyan-400 to-blue-500" },
  { id: "preset-2", name: "Fuchsia Dream", bg: "from-fuchsia-500 to-purple-600" },
  { id: "preset-3", name: "Sunset Horizon", bg: "from-orange-400 to-rose-500" },
  { id: "preset-4", name: "Emerald Forest", bg: "from-emerald-400 to-teal-500" },
  { id: "preset-5", name: "Neon Glow", bg: "from-indigo-500 to-cyan-500" },
  { id: "preset-6", name: "Royal Purple", bg: "from-violet-500 to-fuchsia-500" },
];

export function Topbar({
  user,
  notificationCount = 0,
  theme,
  onThemeToggle,
  notifications = [],
  onMarkAsRead,
  onDeleteNotification,
  onSearchClick
}: TopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  // Check if avatar is a preset or custom URL
  const presetAvatar = PRESET_AVATARS.find((a) => a.id === user?.avatar_url);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "exam_reminder":
        return <Calendar className="h-4 w-4 text-amber-400" />;
      case "task_reminder":
        return <CheckSquare className="h-4 w-4 text-cyan-400" />;
      case "habit_reminder":
        return <Flame className="h-4 w-4 text-orange-400" />;
      case "achievement":
        return <Trophy className="h-4 w-4 text-yellow-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/10 bg-slate-950/80 px-4 backdrop-blur-xl sm:px-6">
      {/* Mobile menu trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 pt-12">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div
        onClick={onSearchClick}
        className="relative hidden flex-1 sm:block cursor-pointer"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          readOnly
          placeholder="Search tasks, notes, exams... (cmd + k)"
          className="h-10 w-full max-w-md cursor-pointer rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 backdrop-blur-md transition focus:border-cyan-400/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <Button variant="ghost" size="sm" onClick={onThemeToggle} className="text-slate-400 hover:text-white">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative text-slate-400 hover:text-white">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2">
            <DropdownMenuLabel className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Notifications ({notificationCount} unread)</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto space-y-1 py-1">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex flex-col gap-1 rounded-xl p-2 text-left transition hover:bg-white/5 border border-transparent ${!notification.read ? "bg-white/[0.02] border-white/5" : ""
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <span className={`text-xs font-semibold ${!notification.read ? "text-white" : "text-slate-400"}`}>
                          {notification.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.read && onMarkAsRead && (
                          <button
                            onClick={() => onMarkAsRead(notification.id)}
                            className="rounded p-0.5 text-cyan-400 hover:bg-white/10 transition"
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                        {onDeleteNotification && (
                          <button
                            onClick={() => onDeleteNotification(notification.id)}
                            className="rounded p-0.5 text-rose-400 hover:bg-white/10 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {notification.message && (
                      <p className="pl-6 text-[11px] leading-relaxed text-slate-400">{notification.message}</p>
                    )}
                    <span className="pl-6 text-[9px] text-slate-600">
                      {new Date(notification.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="p-1">
              <Link
                href="/notifications"
                className="flex w-full items-center justify-center rounded-xl bg-white/5 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-white/10"
              >
                View All Notifications
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-white/5 cursor-pointer">
              {presetAvatar ? (
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${presetAvatar.bg} text-xs font-bold text-white uppercase`}>
                  {initials}
                </div>
              ) : (
                <Avatar className="h-8 w-8">
                  {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name ?? ""} />}
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              )}
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-white">{user?.full_name ?? "Student"}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm text-white">{user?.full_name ?? "Student"}</span>
              <span className="text-xs text-slate-500">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-rose-400 hover:text-rose-300 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
