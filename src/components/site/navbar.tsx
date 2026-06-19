"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Why Us", href: "#why-us" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" }
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-white transition hover:opacity-90">
          <img src="/logo_1.png" alt="CogniFlow Logo" className="h-8 w-auto object-contain" />
          <span className="font-display text-xl font-bold tracking-wide">CogniFlow</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <a 
                key={link.href} 
                href={link.href} 
                className="text-xs font-medium text-slate-400 transition hover:text-white uppercase tracking-wider"
              >
                {link.label}
              </a>
            ))}
          </nav>
          
          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="secondary" size="sm" className="text-xs font-semibold">
                Log in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="text-xs font-semibold gap-1.5 shadow-md shadow-cyan-950/20">
                Start free
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white backdrop-blur-md md:hidden hover:bg-white/10 transition"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-2xl md:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-5">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="h-px bg-white/5 my-3" />
              <div className="grid gap-2 px-4">
                <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" size="lg" className="w-full text-sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                  <Button size="lg" className="w-full text-sm gap-2">
                    Start free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
