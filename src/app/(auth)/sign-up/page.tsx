import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";

export default function SignUpPage() {
  return (
    <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="flex flex-col justify-center">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Join CogniFlow</p>
        <h1 className="mt-4 max-w-xl font-display text-5xl font-semibold text-white">Build a calmer academic workflow.</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
          Start free, connect email or OAuth, and get a clean dashboard built for subjects, tasks, exams, and habit loops.
        </p>
        <p className="mt-8 text-sm text-slate-400">
          Already have an account? <Link href="/sign-in" className="text-cyan-300 transition hover:text-cyan-200">Sign in</Link>
        </p>
      </div>
      <div className="mx-auto w-full max-w-xl">
        <Suspense fallback={
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          </div>
        }>
          <AuthCard mode="sign-up" />
        </Suspense>
      </div>
    </div>
  );
}