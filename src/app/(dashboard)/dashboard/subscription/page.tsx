"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SubscriptionRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/billing");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
      <p className="text-sm font-medium animate-pulse">Redirecting to Billing & Plans dashboard...</p>
    </div>
  );
}
