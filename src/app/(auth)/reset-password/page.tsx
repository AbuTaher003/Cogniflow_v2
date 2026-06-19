"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const resetSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(8, "Use at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function handleResetPassword(values: ResetValues) {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.updateUser({
        password: values.password,
      });

      setLoading(false);

      if (resetError) {
        let msg = resetError.message;
        if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many requests") || resetError.status === 429) {
          msg = "For security purposes, password updates are restricted. Please wait a moment and try again.";
        }
        setError(msg);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.replace("/dashboard" as Route);
      }, 2000);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "An unexpected error occurred. Please try again.");
    }
  }

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="flex flex-col justify-center">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Security</p>
        <h1 className="mt-4 max-w-xl font-display text-5xl font-semibold text-white">Create a secure new password.</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
          Make sure your new password is at least 8 characters long and contains a mix of letters, numbers, and symbols.
        </p>
      </div>

      <div className="mx-auto w-full max-w-xl">
        <Card className="border-white/10 bg-white/10 shadow-2xl shadow-cyan-950/20">
          <CardHeader className="space-y-4">
            <Badge variant="neon" className="w-fit">
              <ShieldCheck className="mr-2 h-3.5 w-3.5" />
              Reset Password
            </Badge>
            <CardTitle className="font-display text-3xl">Set New Password</CardTitle>
            <CardDescription className="text-base text-slate-300">
              Enter your new credentials below to secure your account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-6 text-center text-emerald-100">
                <KeyRound className="mx-auto h-12 w-12 text-emerald-400 mb-3 animate-pulse" />
                <h3 className="font-semibold text-lg">Password Reset Successfully</h3>
                <p className="mt-2 text-sm text-emerald-200/80">
                  Your password has been updated. Redirecting to your dashboard...
                </p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={form.handleSubmit(handleResetPassword)}>
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">New Password</label>
                  <Input type="password" placeholder="Minimum 8 characters" {...form.register("password")} />
                  {form.formState.errors.password ? (
                    <p className="text-sm text-rose-300">{form.formState.errors.password.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Confirm Password</label>
                  <Input type="password" placeholder="Repeat new password" {...form.register("confirmPassword")} />
                  {form.formState.errors.confirmPassword ? (
                    <p className="text-sm text-rose-300">{form.formState.errors.confirmPassword.message}</p>
                  ) : null}
                </div>

                {error ? (
                  <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </p>
                ) : null}

                <Button className="w-full" size="lg" type="submit" variant="primary" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Update Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
