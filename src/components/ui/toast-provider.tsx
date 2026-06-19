"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Register PWA Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("SW registered: ", reg.scope))
        .catch((err) => console.error("SW registration failed: ", err));
    }

    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<Toast>;
      if (customEvent.detail) {
        const newToast = {
          id: customEvent.detail.id,
          message: customEvent.detail.message,
          type: customEvent.detail.type
        };
        setToasts(prev => [...prev, newToast]);

        // Auto remove after 4 seconds
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 4000);
      }
    };

    window.addEventListener("cogniflow-toast", handleToast);
    return () => {
      window.removeEventListener("cogniflow-toast", handleToast);
    };
  }, []);

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />,
    info: <Info className="h-4 w-4 text-cyan-400 shrink-0" />
  };

  const borders = {
    success: "border-emerald-500/20 bg-emerald-950/80 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    error: "border-rose-500/20 bg-rose-950/80 shadow-[0_0_15px_rgba(244,63,94,0.1)]",
    warning: "border-amber-500/20 bg-amber-950/80 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    info: "border-cyan-500/20 bg-cyan-950/80 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`flex items-start justify-between gap-3 rounded-2xl border p-4 backdrop-blur-xl pointer-events-auto ${borders[toast.type]}`}
          >
            <div className="flex gap-2.5 items-start">
              {icons[toast.type]}
              <p className="text-xs text-slate-200 font-semibold leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-white transition shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
