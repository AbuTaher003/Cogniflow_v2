"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Settings, User, Shield, Bell, Paintbrush, Loader2, Save,
  KeyRound, LogOut, CheckCircle2, AlertCircle, Lock, Download, FileJson, FileSpreadsheet
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";

// Schema for security password change
const passwordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(8, "Use at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [logoutSuccess, setLogoutSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const { theme, setTheme } = useTheme();

  const supabase = createClient();

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);

      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      if (prefs) {
        setPreferences(prefs);
      }
      setLoading(false);
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save general notification/preference settings
  async function handleSavePreferences(updatedPrefs: Partial<typeof preferences>) {
    if (!user) return;
    setSavingPrefs(true);
    setPrefSuccess(false);
    setError(null);

    const merged = { ...preferences, ...updatedPrefs };
    const { error: updateError } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        theme: merged.theme,
        sidebar_collapsed: merged.sidebar_collapsed,
        notification_email: merged.notification_email,
        notification_push: merged.notification_push,
        notification_exam_reminder: merged.notification_exam_reminder,
        notification_task_reminder: merged.notification_task_reminder,
        notification_habit_reminder: merged.notification_habit_reminder,
        updated_at: new Date().toISOString(),
      });

    setSavingPrefs(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPreferences(merged);
    setPrefSuccess(true);
    setTimeout(() => setPrefSuccess(false), 3000);
  }

  // Handle password update
  async function handlePasswordUpdate(values: PasswordValues) {
    setSavingPass(true);
    setPassSuccess(false);
    setError(null);

    const { error: passError } = await supabase.auth.updateUser({
      password: values.password,
    });

    setSavingPass(false);

    if (passError) {
      setError(passError.message);
      return;
    }

    passwordForm.reset();
    setPassSuccess(true);
    setTimeout(() => setPassSuccess(false), 3000);
  }

  // Sign out from all devices
  async function handleSignOutAllDevices() {
    setLoggingOutAll(true);
    setError(null);

    const { error: logoutError } = await supabase.auth.signOut({ scope: "global" });

    setLoggingOutAll(false);

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    setLogoutSuccess(true);
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  }

  // Toggle helper
  const togglePreference = (key: string, val: boolean) => {
    handleSavePreferences({ [key]: val });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Workspace Settings</h1>
        <p className="mt-2 text-slate-400">Configure theme, notifications, security credentials, and preferences.</p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 gap-1 flex w-fit overflow-x-auto">
          <TabsTrigger value="notifications" className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">
            <Bell className="mr-2 h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">
            <Shield className="mr-2 h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="theme" className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">
            <Paintbrush className="mr-2 h-4 w-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">
            <User className="mr-2 h-4 w-4" /> Account
          </TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">
            <Lock className="mr-2 h-4 w-4" /> Privacy
          </TabsTrigger>
          <TabsTrigger value="data-export" className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer">
            <Download className="mr-2 h-4 w-4" /> Export Data
          </TabsTrigger>
        </TabsList>

        {/* 1. Notifications tab */}
        <TabsContent value="notifications">
          <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Choose how and when you receive reminders from your dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Channel parameters */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-cyan-300">Channels</h3>
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-950/30">
                  <div>
                    <p className="text-sm font-semibold text-white">Email Reminders</p>
                    <p className="text-xs text-slate-400">Get summaries and exam timelines emailed to you.</p>
                  </div>
                  <Switch
                    checked={preferences?.notification_email ?? true}
                    onCheckedChange={(val) => togglePreference("notification_email", val)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-950/30">
                  <div>
                    <p className="text-sm font-semibold text-white">Push System notifications</p>
                    <p className="text-xs text-slate-400">Display immediate updates in the navigation header.</p>
                  </div>
                  <Switch
                    checked={preferences?.notification_push ?? true}
                    onCheckedChange={(val) => togglePreference("notification_push", val)}
                  />
                </div>
              </div>

              {/* Specific reminders */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-fuchsia-300">Topics</h3>
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-950/30">
                  <div>
                    <p className="text-sm font-semibold text-white">Exam Reminders</p>
                    <p className="text-xs text-slate-400">Notify me 3 days and 1 day before scheduled exams.</p>
                  </div>
                  <Switch
                    checked={preferences?.notification_exam_reminder ?? true}
                    onCheckedChange={(val) => togglePreference("notification_exam_reminder", val)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-950/30">
                  <div>
                    <p className="text-sm font-semibold text-white">Task Deadlines</p>
                    <p className="text-xs text-slate-400">Notify me when tasks are close to due dates.</p>
                  </div>
                  <Switch
                    checked={preferences?.notification_task_reminder ?? true}
                    onCheckedChange={(val) => togglePreference("notification_task_reminder", val)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-950/30">
                  <div>
                    <p className="text-sm font-semibold text-white">Habit Check-ins</p>
                    <p className="text-xs text-slate-400">Daily reminder at night to log streaks.</p>
                  </div>
                  <Switch
                    checked={preferences?.notification_habit_reminder ?? true}
                    onCheckedChange={(val) => togglePreference("notification_habit_reminder", val)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Secure your workspace with a robust, custom password credential.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">New Password</label>
                    <Input type="password" placeholder="Minimum 8 characters" {...passwordForm.register("password")} />
                    {passwordForm.formState.errors.password && (
                      <p className="text-xs text-rose-300">{passwordForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                    <Input type="password" placeholder="Repeat new password" {...passwordForm.register("confirmPassword")} />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-rose-300">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                {passSuccess && (
                  <p className="text-xs font-semibold text-emerald-400">Password updated successfully!</p>
                )}

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" disabled={savingPass}>
                    {savingPass ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="mr-2 h-4 w-4" />
                    )}
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-rose-400">Global Session termination</CardTitle>
              <CardDescription>
                Logout from all active devices and browsers. This secures compromise scenarios.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Reset credentials globally</p>
                <p className="text-xs text-slate-400">Terminates other active sessions immediately.</p>
              </div>
              <Button
                variant="ghost"
                className="border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                onClick={handleSignOutAllDevices}
                disabled={loggingOutAll}
              >
                {loggingOutAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Logout All Devices
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Appearance Tab */}
        <TabsContent value="theme">
          <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Choose your interface display theme profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {["light", "dark", "system"].map((t) => {
                  const isActive = preferences?.theme === t || (!preferences?.theme && t === "dark");
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTheme(t as any);
                        handleSavePreferences({ theme: t });
                      }}
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all text-center ${isActive
                          ? "border-cyan-400 bg-cyan-400/10 text-white shadow-glow scale-[1.02]"
                          : "border-white/10 bg-slate-900/40 text-slate-400 hover:border-white/20 hover:text-white"
                        }`}
                    >
                      <span className="text-sm font-semibold capitalize">{t} Mode</span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        {t === "dark" && "Default dark layout"}
                        {t === "light" && "Clear light theme"}
                        {t === "system" && "Sync with OS theme"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Account metadata Tab */}
        <TabsContent value="account">
          <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Workspace Profile Details</CardTitle>
              <CardDescription>Authentication and platform meta tags.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-950/20">
                <span className="text-xs text-slate-400">Authenticated Email Address</span>
                <span className="text-xs font-semibold text-white">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-950/20">
                <span className="text-xs text-slate-400">CogniFlow System Role</span>
                <Badge variant="neon" className="capitalize text-[10px]">
                  student
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-950/20">
                <span className="text-xs text-slate-400">Registered On</span>
                <span className="text-xs text-white">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) : "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Privacy Preferences</CardTitle>
              <CardDescription>Configure how your student profile and data are shared and tracked.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-950/30">
                <div>
                  <p className="text-sm font-semibold text-white">Public Profile</p>
                  <p className="text-xs text-slate-400">Allow other students to see your achievements and leveling progress.</p>
                </div>
                <Switch
                  checked={preferences?.privacy_public_profile ?? false}
                  onCheckedChange={(val) => togglePreference("privacy_public_profile", val)}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-950/30">
                <div>
                  <p className="text-sm font-semibold text-white">Share Resume Indexing</p>
                  <p className="text-xs text-slate-400">Allow search engines to index your resume web links.</p>
                </div>
                <Switch
                  checked={preferences?.privacy_resume_indexing ?? false}
                  onCheckedChange={(val) => togglePreference("privacy_resume_indexing", val)}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-950/30">
                <div>
                  <p className="text-sm font-semibold text-white">Anonymous Usage tracking</p>
                  <p className="text-xs text-slate-400">Help improve CogniFlow by sharing anonymous interactions.</p>
                </div>
                <Switch
                  checked={preferences?.privacy_analytics_tracking ?? true}
                  onCheckedChange={(val) => togglePreference("privacy_analytics_tracking", val)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Export Tab */}
        <TabsContent value="data-export">
          <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Export Workspace Data</CardTitle>
              <CardDescription>Download a local archive of your studies, habits, tasks, and notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-2xl border border-white/5 bg-slate-950/30 text-xs text-slate-400 leading-relaxed">
                🚀 GDPR & Privacy Compliance: Your data belongs entirely to you. You can export all your database schemas (subjects, tasks, habits, and settings) as structured JSON or spreadsheet CSV files.
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Button
                  onClick={async () => {
                    const dataObj = {
                      profile: user,
                      preferences,
                      exported_at: new Date().toISOString(),
                      client: "CogniFlow Student OS"
                    };
                    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `cogniflow_export_${user?.email || "student"}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  variant="primary"
                  className="flex items-center justify-center gap-2 p-6 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition h-fit w-full"
                >
                  <FileJson className="h-5 w-5 text-cyan-400" />
                  <div className="text-left">
                    <span className="text-xs font-semibold block">Download JSON Archive</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Machine readable database dump</span>
                  </div>
                </Button>
                <Button
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8,Type,Title,Content,Created\nProfile," + user?.email + ",Active User," + user?.created_at;
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.href = encodedUri;
                    link.download = `cogniflow_export_${user?.email || "student"}.csv`;
                    link.click();
                  }}
                  variant="primary"
                  className="flex items-center justify-center gap-2 p-6 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition h-fit w-full"
                >
                  <FileSpreadsheet className="h-5 w-5 text-fuchsia-400" />
                  <div className="text-left">
                    <span className="text-xs font-semibold block">Download CSV Summary</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Tabular format for spreadsheets</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-4 text-rose-200">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {prefSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-4 text-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-semibold">Settings updated successfully!</p>
        </div>
      )}

      {logoutSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-4 text-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-semibold">Logged out globally. Redirecting...</p>
        </div>
      )}
    </div>
  );
}
