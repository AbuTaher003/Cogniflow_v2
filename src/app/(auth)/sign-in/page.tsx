import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";

export default function SignInPage() {
  return (
    <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="flex flex-col justify-center">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Welcome back</p>
        <h1 className="mt-4 max-w-xl font-display text-5xl font-semibold text-white">Resume the semester with focus.</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
          Pick up where you left off, manage your tasks, and keep your academic plan in one secure workspace.
        </p>
        <p className="mt-8 text-sm text-slate-400">
          New here? <Link href="/sign-up" className="text-cyan-300 transition hover:text-cyan-200">Create an account</Link>
        </p>
      </div>
      <div className="mx-auto w-full max-w-xl">
        <Suspense fallback={
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          </div>
        }>
          <AuthCard mode="sign-in" />
        </Suspense>
      </div>
    </div>
  );
}