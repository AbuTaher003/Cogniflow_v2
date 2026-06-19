"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function handleResetRequest(values: ForgotValues) {
    if (loading) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      setLoading(false);

      if (resetError) {
        let msg = resetError.message;
        if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many requests") || resetError.status === 429) {
          msg = "For security purposes, you can only request password reset emails once every 60 seconds. Please wait a minute and try again.";
        }
        setError(msg);
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "An unexpected error occurred. Please try again.");
    }
  }

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="flex flex-col justify-center">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Recovery</p>
        <h1 className="mt-4 max-w-xl font-display text-5xl font-semibold text-white">Regain access to your workspace.</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
          Enter your registered email address and we will send you a secure link to reset your account password.
        </p>
        <p className="mt-8 text-sm text-slate-400">
          <Link href="/sign-in" className="inline-flex items-center text-cyan-300 transition hover:text-cyan-200">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
          </Link>
        </p>
      </div>

      <div className="mx-auto w-full max-w-xl">
        <Card className="border-white/10 bg-white/10 shadow-2xl shadow-cyan-950/20">
          <CardHeader className="space-y-4">
            <Badge variant="neon" className="w-fit">
              <ShieldCheck className="mr-2 h-3.5 w-3.5" />
              Account Recovery
            </Badge>
            <CardTitle className="font-display text-3xl">Forgot Password</CardTitle>
            <CardDescription className="text-base text-slate-300">
              We will email you a secure link to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-6 text-center text-emerald-100">
                <Mail className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
                <h3 className="font-semibold text-lg">Check your email</h3>
                <p className="mt-2 text-sm text-emerald-200/80">
                  We have sent a password reset link to <span className="font-medium">{form.getValues("email")}</span>.
                </p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={form.handleSubmit(handleResetRequest)}>
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Email Address</label>
                  <Input type="email" placeholder="student@university.edu" {...form.register("email")} />
                  {form.formState.errors.email ? (
                    <p className="text-sm text-rose-300">{form.formState.errors.email.message}</p>
                  ) : null}
                </div>

                {error ? (
                  <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </p>
                ) : null}

                <Button className="w-full" size="lg" type="submit" variant="primary" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Send Reset Link
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
