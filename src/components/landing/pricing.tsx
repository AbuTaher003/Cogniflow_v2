"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Free Sandbox",
    price: "৳0",
    description: "For students who want to track their basic schedule offline.",
    items: [
      "Up to 3 Active Subjects",
      "Up to 15 Kanban Tasks",
      "Up to 5 Notes in Notebooks",
      "1 ATS Resume Template Export",
      "5 AI Assistant Queries / Month"
    ],
    featured: false
  },
  {
    name: "Pro Student",
    price: "৳400",
    description: "For active learners tracking coding and internship workflows.",
    items: [
      "Up to 15 Active Subjects",
      "Up to 100 Kanban Tasks",
      "Up to 50 Notes",
      "Unlimited Resume Template Exports",
      "100 AI Queries / Month",
      "Competitive Programming Tracker",
      "Kaggle Submissions Tracker",
      "Habit Streaks Analytics"
    ],
    featured: true
  },
  {
    name: "Academic Elite",
    price: "৳1000",
    description: "Total un-gated access to all premium modules and global tools.",
    items: [
      "Unlimited Academic Subjects",
      "Unlimited Tasks & Notes",
      "Unlimited Resume Builders",
      "Unlimited AI Assistant Queries",
      "Advanced Metrics Dashboard",
      "Priority Support Channel",
      "Early Access to Beta Tools"
    ],
    featured: false
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8 relative isolate">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Pricing</p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-white sm:text-4xl">Simple plans. No campus-level confusion.</h2>
        </motion.div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
            >
              <Card
                className={`h-full ${
                  plan.featured
                    ? "border-cyan-400/30 bg-gradient-to-br from-cyan-400/10 to-fuchsia-500/10 shadow-neon"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    {plan.featured ? <Badge variant="neon">Most popular</Badge> : null}
                  </div>
                  <CardDescription className="text-base text-slate-300">{plan.description}</CardDescription>
                  <div className="pt-4 text-5xl font-semibold text-white">
                    {plan.price}
                    <span className="text-sm font-normal text-slate-400">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plan.items.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-slate-200">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {item}
                    </div>
                  ))}
                  <Link href="/sign-up" className="block pt-4">
                    <Button className="w-full" variant={plan.featured ? "primary" : "secondary"} size="lg">
                      {plan.name.includes("Free") ? "Start free" : "Upgrade now"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
