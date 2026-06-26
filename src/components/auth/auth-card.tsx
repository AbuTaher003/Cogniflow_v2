"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Github, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";

const authSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters")
});

type AuthValues = z.infer<typeof authSchema>;
type AuthMode = "sign-in" | "sign-up";

// Module-level global lock to guarantee protection against React StrictMode re-mounts,
// multiple active component instances, and synchronous double invocations.
let globalAuthLockActive = false;
let globalSignupRequestInProgress = false;
let globalSignupRequestActive = false;

export function AuthCard({ mode }: { mode: AuthMode }) {
  const [loading, setLoading] = useState<"email" | "google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownTime, setCooldownTime] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const isMountedRef = useRef(true);
  const isSubmittingRef = useRef(false);
  const isValidationPendingRef = useRef(false);
  const submitLockRef = useRef(false);

  // Synchronize mount/unmount and reset global lock to avoid locks across page routing transitions
  useEffect(() => {
    isMountedRef.current = true;
    isSubmittingRef.current = false;
    isValidationPendingRef.current = false;
    submitLockRef.current = false;
    if (!globalSignupRequestActive && !globalSignupRequestInProgress) {
      globalAuthLockActive = false;
    }
    return () => {
      isMountedRef.current = false;
      isSubmittingRef.current = false;
      isValidationPendingRef.current = false;
      submitLockRef.current = false;
      if (!globalSignupRequestActive && !globalSignupRequestInProgress) {
        globalAuthLockActive = false;
      }
    };
  }, []);

  // Cooldown countdown timer execution
  useEffect(() => {
    if (cooldownTime <= 0) return;
    const timer = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          globalAuthLockActive = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownTime]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const form = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" }
  });

  const isLocked =
    loading !== null ||
    globalAuthLockActive ||
    cooldownTime > 0 ||
    (mode === "sign-up" && (globalSignupRequestInProgress || globalSignupRequestActive));

  // Funnel all submission attempts into a single controlled gateset
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      submitLockRef.current ||
      isLocked ||
      isSubmittingRef.current ||
      isValidationPendingRef.current ||
      (mode === "sign-up" && (globalSignupRequestInProgress || globalSignupRequestActive))
    ) {
      e.stopPropagation();
      return;
    }

    if (mode === "sign-up") {
      globalSignupRequestInProgress = true;
    }

    submitLockRef.current = true;
    isValidationPendingRef.current = true;
    setLoading("email");
    setError(null);

    form.handleSubmit(
      async (values) => {
        isValidationPendingRef.current = false;
        try {
          await handleEmailAuth(values);
        } catch (err) {
          setLoading(null);
          submitLockRef.current = false;
          if (mode === "sign-up") {
            globalSignupRequestInProgress = false;
            globalSignupRequestActive = false;
          }
          console.error("[auth] Submission callback failed:", err);
        }
      },
      (errors) => {
        setLoading(null);
        isValidationPendingRef.current = false;
        submitLockRef.current = false;
        if (mode === "sign-up") {
          globalSignupRequestInProgress = false;
          globalSignupRequestActive = false;
        }
      }
    )(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" &&
      (isLocked || (mode === "sign-up" && (globalSignupRequestInProgress || globalSignupRequestActive)))
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  async function handleEmailAuth(values: AuthValues) {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    globalAuthLockActive = true;
    if (mode === "sign-up") {
      globalSignupRequestActive = true;
    }

    try {
      if (mode === "sign-up") {
        // Step 1: Sign up user via GoTrue
        const signupResult = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          },
        });

        if (!isMountedRef.current) {
          globalSignupRequestInProgress = false;
          globalSignupRequestActive = false;
          return;
        }

        if (signupResult.error) {
          let msg = signupResult.error.message;
          const status = signupResult.error.status;

          // Production-grade error matching
          if (status === 429 || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many requests") || msg.toLowerCase().includes("attempts")) {
            msg = "Too many attempts. Please wait a moment before trying again.";
          } else if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("failed to fetch")) {
            msg = "Network issue. Try again.";
          } else if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already been registered")) {
            msg = "An account with this email already exists. Please sign in instead.";
          }

          setError(msg);
          setLoading(null);
          isSubmittingRef.current = false;
          globalAuthLockActive = false;
          globalSignupRequestInProgress = false;
          globalSignupRequestActive = false;
          submitLockRef.current = false;

          // Initiate cooldown to avoid multiple rapid backend attempts
          setCooldownTime(15);
          return;
        }

        // If session is already created (confirmations disabled), proceed to onboarding immediately
        if (signupResult.data.session) {
          setLoading(null);
          isSubmittingRef.current = false;
          globalSignupRequestInProgress = false;
          globalSignupRequestActive = false;
          submitLockRef.current = false;

          globalAuthLockActive = true;
          setCooldownTime(15);
          window.location.href = "/onboarding";
          return;
        }

        // Step 2: Auto-confirm the user email so they don't have to verify
        const { error: confirmErr } = await supabase.rpc("confirm_user", { email_to_confirm: values.email });
        if (confirmErr) {
          console.error("[signup] confirm_user RPC failed:", confirmErr);
        }

        // Step 3: Sign in with the created credentials to get a session
        const loginResult = await supabase.auth.signInWithPassword(values);

        if (!isMountedRef.current) {
          globalSignupRequestInProgress = false;
          globalSignupRequestActive = false;
          return;
        }
        setLoading(null);
        isSubmittingRef.current = false;
        globalSignupRequestInProgress = false;
        globalSignupRequestActive = false;
        submitLockRef.current = false;

        if (loginResult.error) {
          let msg = loginResult.error.message;
          const status = loginResult.error.status;

          if (status === 429 || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many requests") || msg.toLowerCase().includes("attempts")) {
            msg = "Too many attempts. Please wait a moment before trying again.";
          } else if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("failed to fetch")) {
            msg = "Network issue. Try again.";
          }
          setError(msg);
          globalAuthLockActive = false;
          setCooldownTime(15);
          return;
        }

        // Lock permanently on successful redirect execution
        globalAuthLockActive = true;
        setCooldownTime(15);
        window.location.href = "/onboarding";
      } else {
        // --- SIGN IN ---
        let result = await supabase.auth.signInWithPassword(values);

        if (!isMountedRef.current) return;

        // If email not confirmed, auto-confirm and retry
        if (result.error) {
          const msg = result.error.message.toLowerCase();
          if (msg.includes("not confirmed") || msg.includes("email_not_confirmed") || msg.includes("confirm")) {
            console.log("[signin] Email not confirmed, auto-confirming...");
            const { error: confirmErr } = await supabase.rpc("confirm_user", { email_to_confirm: values.email });
            if (confirmErr) {
              console.error("[signin] confirm_user RPC failed:", confirmErr);
            } else {
              // Retry sign in after confirmation
              result = await supabase.auth.signInWithPassword(values);
            }
          }
        }

        if (!isMountedRef.current) return;
        setLoading(null);
        isSubmittingRef.current = false;
        submitLockRef.current = false;

        if (result.error) {
          let msg = result.error.message;
          const status = result.error.status;

          if (status === 429 || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many requests") || msg.toLowerCase().includes("attempts")) {
            msg = "Too many attempts. Please wait a moment before trying again.";
            setCooldownTime(15); // Apply lock/cooldown for sign-in 429s as well
          } else if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("failed to fetch")) {
            msg = "Network issue. Try again.";
            globalAuthLockActive = false;
          } else if (msg.toLowerCase().includes("invalid login credentials")) {
            msg = "Invalid email or password. Please check your credentials and try again.";
            globalAuthLockActive = false;
          } else {
            globalAuthLockActive = false;
          }
          setError(msg);
          return;
        }

        // Check onboarding completion
        if (result.data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", result.data.user.id)
            .single();

          if (!isMountedRef.current) return;

          globalAuthLockActive = true;
          window.location.href = profile?.onboarding_completed ? "/dashboard" : "/onboarding";
        }
      }
    } catch (err: any) {
      if (!isMountedRef.current) {
        globalSignupRequestInProgress = false;
        globalSignupRequestActive = false;
        return;
      }
      setLoading(null);
      isSubmittingRef.current = false;
      globalAuthLockActive = false;
      if (mode === "sign-up") {
        globalSignupRequestInProgress = false;
        globalSignupRequestActive = false;
      }
      submitLockRef.current = false;
      console.error("[auth] Unexpected error:", err);
      setError(err?.message || "An unexpected error occurred. Please try again.");
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    if (isSubmittingRef.current || isLocked) return;

    isSubmittingRef.current = true;
    globalAuthLockActive = true;
    setLoading(provider);
    setError(null);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
        }
      });

      if (!isMountedRef.current) return;

      if (oauthError) {
        let msg = oauthError.message;
        if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many requests") || msg.toLowerCase().includes("attempts")) {
          msg = "Too many attempts. Please wait a moment before trying again.";
          setCooldownTime(15);
        } else {
          globalAuthLockActive = false;
        }
        setError(msg);
        setLoading(null);
        isSubmittingRef.current = false;
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setLoading(null);
      isSubmittingRef.current = false;
      globalAuthLockActive = false;
      setError(err?.message || "OAuth login failed. Please try again.");
    }
  }

  return (
    <Card className="border-white/10 bg-white/10 shadow-2xl shadow-cyan-950/20">
      <CardHeader className="space-y-4">
        <Badge variant="neon" className="w-fit">
          <ShieldCheck className="mr-2 h-3.5 w-3.5" />
          Secure Supabase auth
        </Badge>
        <CardTitle className="font-display text-3xl">
          {mode === "sign-in" ? "Welcome back" : "Create your account"}
        </CardTitle>
        <CardDescription className="text-base text-slate-300">
          {mode === "sign-in"
            ? "Sign in with email, Google, or GitHub to continue your study workflow."
            : "Start with a free workspace for tasks, notes, exams, habits, and analytics."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleFormSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Email</label>
            <Input
              type="email"
              placeholder="student@university.edu"
              {...form.register("email")}
              disabled={isLocked}
              onKeyDown={handleKeyDown}
            />
            {form.formState.errors.email ? <p className="text-sm text-rose-300">{form.formState.errors.email.message}</p> : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">Password</label>
              {mode === "sign-in" && (
                <Link href="/forgot-password" className="text-xs text-cyan-300 transition hover:text-cyan-200">
                  Forgot password?
                </Link>
              )}
            </div>
            <Input
              type="password"
              placeholder="Minimum 8 characters"
              {...form.register("password")}
              disabled={isLocked}
              onKeyDown={handleKeyDown}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-rose-300">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          {mode === "sign-in" && (
            <div className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                id="remember-me"
                className="h-4 w-4 rounded border-white/10 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                defaultChecked
                disabled={isLocked}
              />
              <label htmlFor="remember-me" className="text-xs text-slate-300 cursor-pointer select-none">
                Remember me
              </label>
            </div>
          )}

          {error ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              <p>{error}</p>
            </div>
          ) : null}

          <Button
            className="w-full"
            size="lg"
            type="submit"
            variant="primary"
            disabled={isLocked}
          >
            {loading === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {cooldownTime > 0 && mode === "sign-up"
              ? `Please wait ${cooldownTime}s...`
              : mode === "sign-in"
                ? "Continue with email"
                : "Create account"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => handleOAuth("google")}
            type="button"
            disabled={isLocked}
          >
            {loading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />}
            Google OAuth
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => handleOAuth("github")}
            type="button"
            disabled={isLocked}
          >
            {loading === "github" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
            GitHub OAuth
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}