"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Shield,
  Clock,
  History,
  FileText,
  Check,
  Crown,
  Sparkles,
  ChevronRight,
  Loader2,
  DollarSign,
  AlertCircle,
  HelpCircle,
  X,
  Wallet,
  Building2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getPlan, PLAN_LIMITS } from "@/lib/billing-client";
import { PlanDetails, PaymentMethod, PaymentRequest, SubscriptionHistory } from "@/types/billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";

interface ProviderDetails {
  id: PaymentMethod;
  name: string;
  category: "mfs" | "card" | "bank" | "other";
  merchantNumber: string;
  instructions: string;
  logo: React.ReactNode;
  brandColor: string;
}

const PROVIDERS: ProviderDetails[] = [
  // MFS
  {
    id: "bkash",
    name: "bKash",
    category: "mfs",
    merchantNumber: "01712-345678",
    instructions: "Make a Merchant Payment or Send Money to our bKash account.",
    brandColor: "bg-[#E2136E]/10 hover:bg-[#E2136E]/20 text-[#E2136E] border-[#E2136E]/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#E2136E" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="bold" fontFamily="sans-serif">bKash</text>
      </svg>
    )
  },
  {
    id: "nagad",
    name: "Nagad",
    category: "mfs",
    merchantNumber: "01912-345678",
    instructions: "Send Money to our Nagad personal account.",
    brandColor: "bg-[#F7941D]/10 hover:bg-[#F7941D]/20 text-[#F7941D] border-[#F7941D]/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <defs>
          <linearGradient id="nagadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F7941D" />
            <stop offset="100%" stopColor="#E31B23" />
          </linearGradient>
        </defs>
        <rect width="120" height="40" rx="8" fill="url(#nagadGrad)" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="bold" fontFamily="sans-serif">nagad</text>
      </svg>
    )
  },
  {
    id: "rocket",
    name: "Rocket",
    category: "mfs",
    merchantNumber: "01512-345678-9",
    instructions: "Send Money to our Rocket 12-digit account.",
    brandColor: "bg-[#8C3494]/10 hover:bg-[#8C3494]/20 text-[#8C3494] border-[#8C3494]/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#8C3494" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold" fontFamily="sans-serif">🚀 Rocket</text>
      </svg>
    )
  },
  {
    id: "upay",
    name: "Upay",
    category: "mfs",
    merchantNumber: "01812-345678",
    instructions: "Send Money to our Upay account.",
    brandColor: "bg-[#005C9E]/10 hover:bg-[#005C9E]/20 text-[#005C9E] border-[#005C9E]/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#005C9E" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFC72C" fontSize="15" fontWeight="bold" fontFamily="sans-serif">upay</text>
      </svg>
    )
  },
  // Cards
  {
    id: "visa",
    name: "Visa",
    category: "card",
    merchantNumber: "Visa Gateway #98765",
    instructions: "Submit payment details through the Visa checkout portal.",
    brandColor: "bg-[#1A1F71]/10 hover:bg-[#1A1F71]/20 text-[#1A1F71] border-[#1A1F71]/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#1A1F71" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#F7B600" fontSize="17" fontWeight="bold" fontStyle="italic" fontFamily="sans-serif">VISA</text>
      </svg>
    )
  },
  {
    id: "mastercard",
    name: "Mastercard",
    category: "card",
    merchantNumber: "Mastercard Gateway #87654",
    instructions: "Submit payment details through the Mastercard gateway.",
    brandColor: "bg-red-500/10 hover:bg-red-500/20 text-orange-500 border-red-500/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#111" />
        <circle cx="50" cy="20" r="9" fill="#EB001B" opacity="0.9" />
        <circle cx="70" cy="20" r="9" fill="#F79E1B" opacity="0.9" />
      </svg>
    )
  },
  {
    id: "amex",
    name: "AMEX",
    category: "card",
    merchantNumber: "AMEX Gateway #76543",
    instructions: "Submit payment details through the AMEX secure checkout.",
    brandColor: "bg-[#0070CD]/10 hover:bg-[#0070CD]/20 text-[#0070CD] border-[#0070CD]/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#0070CD" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="sans-serif">AMEX</text>
      </svg>
    )
  },
  {
    id: "nexus",
    name: "Nexus Card",
    category: "card",
    merchantNumber: "DBBL Nexus Portal",
    instructions: "Verify via DBBL Nexus Gateway with PIN authentication.",
    brandColor: "bg-[#00529B]/10 hover:bg-[#00529B]/20 text-[#00529B] border-[#00529B]/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#00529B" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">NEXUS CARD</text>
      </svg>
    )
  },
  {
    id: "qcash",
    name: "Q-Cash",
    category: "card",
    merchantNumber: "Q-Cash Network",
    instructions: "Submit payment through any member Q-Cash card.",
    brandColor: "bg-[#009245]/10 hover:bg-[#009245]/20 text-[#009245] border-[#009245]/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#009245" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Q-CASH</text>
      </svg>
    )
  },
  // Banks
  {
    id: "dutch_bangla",
    name: "Dutch-Bangla",
    category: "bank",
    merchantNumber: "DBBL: 123.120.45678",
    instructions: "Transfer to Dutch-Bangla Bank using internet banking/app.",
    brandColor: "bg-[#0B3A60]/10 hover:bg-[#0B3A60]/20 text-[#0B3A60] border-[#0B3A60]/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#0B3A60" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">DBBL BANK</text>
      </svg>
    )
  },
  {
    id: "islami_bank",
    name: "Islami Bank",
    category: "bank",
    merchantNumber: "IBBL: 2050.321.01.456",
    instructions: "Transfer to Islami Bank Bangladesh via CellFin or app.",
    brandColor: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#15803d" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold" fontFamily="sans-serif">IBBL</text>
      </svg>
    )
  },
  {
    id: "brac_bank",
    name: "BRAC Bank",
    category: "bank",
    merchantNumber: "BRAC: 1512.204.896.001",
    instructions: "Transfer to BRAC Bank using Astha app or online portal.",
    brandColor: "bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border-blue-600/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#1e40af" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">BRAC BANK</text>
      </svg>
    )
  },
  {
    id: "city_bank",
    name: "City Bank",
    category: "bank",
    merchantNumber: "City: 1102.458.789",
    instructions: "Transfer to City Bank using CityTouch app.",
    brandColor: "bg-red-600/10 hover:bg-red-600/20 text-red-400 border-red-600/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#991b1b" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">THE CITY BANK</text>
      </svg>
    )
  },
  {
    id: "ebl",
    name: "Eastern Bank",
    category: "bank",
    merchantNumber: "EBL: 1042.879.456",
    instructions: "Transfer to Eastern Bank via EBL Skybanking app.",
    brandColor: "bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 border-sky-600/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#0369a1" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold" fontFamily="sans-serif">EBL</text>
      </svg>
    )
  },
  {
    id: "prime_bank",
    name: "Prime Bank",
    category: "bank",
    merchantNumber: "Prime: 2113.456.890",
    instructions: "Transfer to Prime Bank using Prime Altitude app.",
    brandColor: "bg-teal-600/10 hover:bg-teal-600/20 text-teal-400 border-teal-600/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#0f766e" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">PRIME BANK</text>
      </svg>
    )
  },
  {
    id: "bank_asia",
    name: "Bank Asia",
    category: "bank",
    merchantNumber: "Bank Asia: 0023.890.123",
    instructions: "Transfer to Bank Asia via internet banking.",
    brandColor: "bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border-indigo-600/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#3730a3" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">BANK ASIA</text>
      </svg>
    )
  },
  {
    id: "mtb",
    name: "Mutual Trust Bank",
    category: "bank",
    merchantNumber: "MTB: 0045.123.890",
    instructions: "Transfer to Mutual Trust Bank via MTB Smart Banking.",
    brandColor: "bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border-rose-600/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#e11d48" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">MTB BANK</text>
      </svg>
    )
  },
  {
    id: "southeast_bank",
    name: "Southeast Bank",
    category: "bank",
    merchantNumber: "SEBL: 0089.456.123",
    instructions: "Transfer to Southeast Bank via TeleCash or internet banking.",
    brandColor: "bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border-cyan-600/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#0891b2" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">SOUTHEAST</text>
      </svg>
    )
  },
  {
    id: "pubali_bank",
    name: "Pubali Bank",
    category: "bank",
    merchantNumber: "Pubali: 3552.901.456",
    instructions: "Transfer to Pubali Bank via PI Banking application.",
    brandColor: "bg-emerald-700/10 hover:bg-emerald-700/20 text-emerald-300 border-emerald-700/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#047857" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">PUBALI BANK</text>
      </svg>
    )
  },
  {
    id: "sonali_bank",
    name: "Sonali Bank",
    category: "bank",
    merchantNumber: "Sonali: 4402.123.456",
    instructions: "Transfer to Sonali Bank account via Sonali e-Wallet.",
    brandColor: "bg-green-700/10 hover:bg-green-700/20 text-green-300 border-green-700/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#15803d" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">SONALI BANK</text>
      </svg>
    )
  },
  {
    id: "janata_bank",
    name: "Janata Bank",
    category: "bank",
    merchantNumber: "Janata: 5502.456.789",
    instructions: "Transfer to Janata Bank via e-Janata app.",
    brandColor: "bg-emerald-800/10 hover:bg-emerald-800/20 text-emerald-200 border-emerald-800/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#065f46" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">JANATA BANK</text>
      </svg>
    )
  },
  {
    id: "agrani_bank",
    name: "Agrani Bank",
    category: "bank",
    merchantNumber: "Agrani: 6602.789.012",
    instructions: "Transfer to Agrani Bank via Agrani Smart Banking.",
    brandColor: "bg-green-800/10 hover:bg-green-800/20 text-green-200 border-green-800/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#14532d" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">AGRANI BANK</text>
      </svg>
    )
  },
  {
    id: "rupali_bank",
    name: "Rupali Bank",
    category: "bank",
    merchantNumber: "Rupali: 7702.012.345",
    instructions: "Transfer to Rupali Bank via Rupali e-Sheba.",
    brandColor: "bg-lime-700/10 hover:bg-lime-700/20 text-lime-300 border-lime-700/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#4d7c0f" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">RUPALI BANK</text>
      </svg>
    )
  },
  // Other
  {
    id: "sslcommerz",
    name: "SSLCommerz",
    category: "other",
    merchantNumber: "Store ID: cogniflow_live",
    instructions: "Pay via SSLCommerz aggregated digital gateway.",
    brandColor: "bg-fuchsia-600/10 hover:bg-fuchsia-600/20 text-fuchsia-400 border-fuchsia-600/30",
    logo: (
      <svg viewBox="0 0 120 40" className="w-full h-8">
        <rect width="120" height="40" rx="8" fill="#701a75" />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">SSLCOMMERZ</text>
      </svg>
    )
  }
];

const categories = [
  { id: "mfs", label: "Mobile", icon: Wallet },
  { id: "card", label: "Cards", icon: CreditCard },
  { id: "bank", label: "Banks", icon: Building2 },
  { id: "other", label: "Other", icon: Sparkles }
] as const;

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanDetails | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [history, setHistory] = useState<SubscriptionHistory[]>([]);

  // Checkout modal states
  const [checkoutPlan, setCheckoutPlan] = useState<{ name: string; price: number; id: string; slug: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bkash");
  const [activeProviderTab, setActiveProviderTab] = useState<"mfs" | "card" | "bank" | "other">("mfs");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const supabase = createClient();

  const currentAmountPaid = customAmount ? parseFloat(customAmount) : (checkoutPlan?.price ?? 0);
  const isAmountInvalid = checkoutPlan
    ? (checkoutPlan.slug === "pro" && (isNaN(currentAmountPaid) || currentAmountPaid !== 400)) ||
      (checkoutPlan.slug === "elite" && (isNaN(currentAmountPaid) || currentAmountPaid !== 1000))
    : false;

  useEffect(() => {
    loadBillingData();
  }, []);

  async function loadBillingData() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);

      // Fetch active plan details
      const planDetails = await getPlan(authUser.id, supabase);
      setCurrentPlan(planDetails);

      // Fetch payment requests
      const { data: reqData } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });
      setPaymentRequests(reqData || []);

      // Fetch subscription history
      const { data: histData } = await supabase
        .from("subscription_history")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });
      setHistory(histData || []);

    } catch (e) {
      console.error("Error loading billing data:", e);
      toast.error("Failed to load billing records.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!checkoutPlan || !user) return;

    const trimmedSender = senderNumber.trim();
    const trimmedTx = transactionId.trim();

    if (!trimmedSender) {
      toast.warning("Sender account number is required.");
      return;
    }
    if (!trimmedTx) {
      toast.warning("Transaction ID is required.");
      return;
    }

    // 1. Transaction ID Placeholder Checking
    const blacklist = ["12345", "test", "txid", "transaction", "none", "null", "demo", "placeholder", "11111", "1234567890", "123456", "abcdef", "12345678"];
    if (blacklist.includes(trimmedTx.toLowerCase())) {
      toast.warning("Please enter a valid Transaction ID. Do not use test placeholders.");
      return;
    }

    // 2. Transaction ID Format Validation (e.g. Alphanumeric, between 6 and 20 characters)
    const txRegex = /^[a-zA-Z0-9_-]{6,20}$/;
    if (!txRegex.test(trimmedTx)) {
      toast.warning("Invalid Transaction ID format. Must be alphanumeric and 6-20 characters long.");
      return;
    }

    // 3. Sender Number format checking
    const senderRegex = /^[0-9+\s-]{8,20}$/;
    if (!senderRegex.test(trimmedSender)) {
      toast.warning("Invalid Sender Account Mobile or Account Number format.");
      return;
    }

    const amountToPay = customAmount ? parseFloat(customAmount) : checkoutPlan.price;

    // Validate payment amount based on plan (exact price check)
    if (checkoutPlan.slug === "pro") {
      if (isNaN(amountToPay) || amountToPay !== 400) {
        toast.error("Invalid payment amount. PRO subscription requires exactly ৳400.");
        return;
      }
    } else if (checkoutPlan.slug === "elite") {
      if (isNaN(amountToPay) || amountToPay !== 1000) {
        toast.error("Invalid payment amount. ELITE subscription requires exactly ৳1000.");
        return;
      }
    }

    setSubmittingPayment(true);

    try {
      const { error } = await supabase
        .from("payment_requests")
        .insert({
          user_id: user.id,
          plan_id: checkoutPlan.id,
          payment_method: paymentMethod,
          transaction_id: trimmedTx,
          sender_number: trimmedSender,
          amount: amountToPay,
          status: "pending"
        });

      if (error) {
        throw error;
      }

      toast.success("Payment request submitted successfully! Admins are verifying.");
      setCheckoutPlan(null);
      setSenderNumber("");
      setTransactionId("");
      setCustomAmount("");
      
      // Reload lists
      await loadBillingData();
    } catch (err: any) {
      console.error("Payment submission error:", err);
      // Intercept unique key constraint (Postgres error code 23505)
      if (err.code === "23505" || err.message?.includes("unique constraint") || err.message?.includes("already exists")) {
        toast.error("This Transaction ID has already been submitted for verification. Please verify your receipt.");
      } else {
        toast.error(err.message || "Failed to submit payment request.");
      }
    } finally {
      setSubmittingPayment(false);
    }
  }

  const planTiers = [
    {
      slug: "free",
      name: "FREE",
      price: 0,
      description: "Essential tools for students starting out.",
      features: [
        "Up to 3 Active Subjects",
        "Up to 15 Kanban Tasks",
        "Up to 5 Notes in Notebooks",
        "1 ATS Resume Template Export",
        "5 AI Assistant Queries / Month"
      ],
      icon: Shield,
      color: "from-zinc-400 to-zinc-600",
      glowColor: "rgba(161,161,170,0.1)"
    },
    {
      slug: "pro",
      name: "PRO",
      price: 400,
      description: "Advance your tracking and competitive workflow.",
      features: [
        "Up to 15 Active Subjects",
        "Up to 100 Kanban Tasks",
        "Up to 50 Notes",
        "Unlimited Resume Template Exports",
        "100 AI Queries / Month",
        "Competitive Programming Tracker",
        "Kaggle Submissions Tracker",
        "Habit Streaks Analytics"
      ],
      icon: Sparkles,
      color: "from-purple-500 to-indigo-500",
      glowColor: "rgba(147,51,234,0.15)",
      badge: "Most Popular"
    },
    {
      slug: "elite",
      name: "ELITE",
      price: 1000,
      description: "Ultimate toolkit with complete, limitless access.",
      features: [
        "Unlimited Academic Subjects",
        "Unlimited Tasks & Notes",
        "Unlimited Resume Builders",
        "Unlimited AI Assistant Queries",
        "Advanced Metrics Dashboard",
        "Priority Support Channel",
        "Early Access to Beta Tools"
      ],
      icon: Crown,
      color: "from-amber-400 to-orange-500",
      glowColor: "rgba(245,158,11,0.15)"
    }
  ];

  const methodNames: Record<PaymentMethod, string> = {
    bkash: "bKash",
    nagad: "Nagad",
    rocket: "Rocket",
    upay: "Upay",
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    dutch_bangla: "Dutch-Bangla Bank",
    islami_bank: "Islami Bank",
    brac_bank: "BRAC Bank",
    city_bank: "City Bank",
    ebl: "Eastern Bank",
    prime_bank: "Prime Bank",
    bank_asia: "Bank Asia",
    mtb: "Mutual Trust Bank",
    southeast_bank: "Southeast Bank",
    pubali_bank: "Pubali Bank",
    sonali_bank: "Sonali Bank",
    janata_bank: "Janata Bank",
    agrani_bank: "Agrani Bank",
    rupali_bank: "Rupali Bank",
    nexus: "Nexus Card",
    qcash: "Q-Cash",
    sslcommerz: "SSLCommerz"
  };

  const statusBadges = {
    pending: <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/10">Pending Approval</Badge>,
    approved: <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10">Approved & Active</Badge>,
    rejected: <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/10">Rejected</Badge>
  };

  const planBadgeColors = {
    free: "bg-zinc-800 text-zinc-300 border-zinc-700",
    pro: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    elite: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  };

  // Helper to format timestamps
  const formatDate = (isoString: string | null) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 bg-zinc-900" />
          <Skeleton className="h-4 w-96 bg-zinc-900" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-xl bg-zinc-900" />
          <Skeleton className="h-48 rounded-xl bg-zinc-900" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <Skeleton className="h-96 rounded-xl bg-zinc-900" />
          <Skeleton className="h-96 rounded-xl bg-zinc-900" />
          <Skeleton className="h-96 rounded-xl bg-zinc-900" />
        </div>
      </div>
    );
  }

  const selectedProvider = PROVIDERS.find(p => p.id === paymentMethod) || PROVIDERS[0];
  const filteredProviders = PROVIDERS.filter(p => p.category === activeProviderTab);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-10 min-h-screen text-zinc-200">
      {/* Title Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-6"
      >
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Billing & Subscriptions
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage your subscription details, check usages limits, and explore upgrade paths.
          </p>
        </div>
        <Badge className={`px-3 py-1 text-xs border ${planBadgeColors[currentPlan?.planSlug || "free"]}`}>
          Active Plan: {currentPlan?.planSlug.toUpperCase()}
        </Badge>
      </motion.div>

      {/* Subscription Summary Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Current Plan */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-zinc-950/40 backdrop-blur-md border border-zinc-900/60 overflow-hidden relative min-h-[220px]">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <CreditCard className="w-24 h-24 text-white" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500 font-semibold tracking-wider text-xs uppercase">Current Plan</CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-2 mt-1">
                {currentPlan?.name} Plan
                {currentPlan?.planSlug !== "free" && (
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-3xl font-extrabold text-white">
                  ৳{currentPlan?.price}
                </span>
                <span className="text-zinc-400 text-sm ml-1">
                  / {currentPlan?.durationDays === 36500 ? "Lifetime" : "month"}
                </span>
              </div>
              <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-zinc-400 pt-2 border-t border-zinc-900/60">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Status: <span className="font-semibold text-zinc-200 capitalize">{currentPlan?.subscriptionStatus}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                  {currentPlan?.planSlug === "free" ? (
                    <span>Perpetual License</span>
                  ) : (
                    <span>Expires: <span className="font-semibold text-zinc-200">{formatDate(currentPlan?.expiresAt || null)}</span></span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 2: Limit Quick Overview */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-zinc-950/40 backdrop-blur-md border border-zinc-900/60 min-h-[220px]">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500 font-semibold tracking-wider text-xs uppercase">Usage Capacities</CardDescription>
              <CardTitle className="text-lg font-bold mt-1">Tier Features & Quotas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs block">AI Query Quota</span>
                <span className="font-semibold text-zinc-200">
                  {PLAN_LIMITS[currentPlan?.planSlug || "free"].aiQueries === 9999 ? "Unlimited" : `${PLAN_LIMITS[currentPlan?.planSlug || "free"].aiQueries} Queries / mo`}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs block">Subjects Cap</span>
                <span className="font-semibold text-zinc-200">
                  {PLAN_LIMITS[currentPlan?.planSlug || "free"].subjects === 9999 ? "Unlimited" : `${PLAN_LIMITS[currentPlan?.planSlug || "free"].subjects} Active Subjects`}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs block">Resume Exports</span>
                <span className="font-semibold text-zinc-200">
                  {PLAN_LIMITS[currentPlan?.planSlug || "free"].resumes === 9999 ? "Unlimited" : `${PLAN_LIMITS[currentPlan?.planSlug || "free"].resumes} Resume Builder`}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs block">Advanced Dashboards</span>
                <span className="font-semibold text-zinc-200">
                  {currentPlan?.planSlug !== "free" ? "Unlocked" : "Locked (Upgrade required)"}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Upgrade Section: Pricing Tiers Grid */}
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            Pricing Plans & Tiers
          </h2>
          <p className="text-sm text-zinc-400 mt-0.5">Choose the right tier to accelerate your academic and coding success.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {planTiers.map((tier, index) => {
            const isCurrent = currentPlan?.planSlug === tier.slug;
            const isFree = tier.slug === "free";
            const PlanIcon = tier.icon;
            
            // Database UUID for plans (stored in currentPlan or queried dynamically)
            // If the tier represents currentPlan, we get its ID. Else we resolve it if plans table is mapped
            // For checkout, we fetch plans catalog when user clicks it, or we resolve the ID from DB plans array
            
            return (
              <motion.div
                key={tier.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + index * 0.05 }}
                className="relative group rounded-2xl border border-zinc-900 bg-zinc-950/30 backdrop-blur-md p-6 flex flex-col justify-between overflow-hidden min-h-[460px] hover:border-zinc-800/80 transition-all duration-300"
              >
                {/* Glowing radial backdrop */}
                <div
                  className="absolute inset-0 -z-10 opacity-30 group-hover:opacity-40 transition-opacity blur-3xl rounded-full"
                  style={{
                    background: `radial-gradient(120px at 50% 10%, ${tier.glowColor}, transparent)`
                  }}
                />

                {tier.badge && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-2xs uppercase tracking-wider font-bold">
                      {tier.badge}
                    </Badge>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${tier.color} bg-opacity-10 text-white shrink-0`}>
                      <PlanIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold tracking-tight text-white">{tier.name}</h3>
                      <p className="text-zinc-500 text-xs mt-0.5">{tier.description}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-4xl font-extrabold text-white">৳{tier.price}</span>
                    <span className="text-zinc-500 text-xs ml-1">/ month</span>
                  </div>

                  <ul className="space-y-3 pt-3 border-t border-zinc-900/60 text-sm">
                    {tier.features.map(feat => (
                      <li key={feat} className="flex items-start gap-2.5 text-zinc-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  {isCurrent ? (
                    <Button disabled className="w-full bg-zinc-900 border border-zinc-800/40 text-zinc-400 py-3 rounded-xl">
                      Current Subscription
                    </Button>
                  ) : isFree ? (
                    <Button disabled className="w-full bg-zinc-900 border border-zinc-800/40 text-zinc-500 py-3 rounded-xl">
                      Free Basic Access
                    </Button>
                  ) : (
                    <Button
                      onClick={async () => {
                        setLoading(true);
                        try {
                          // Fetch plans from DB to resolve current ID
                          const { data: dbPlans } = await supabase
                            .from("subscription_plans")
                            .select("*")
                            .eq("slug", tier.slug)
                            .single();
                          
                          if (dbPlans) {
                            setCheckoutPlan({
                              name: dbPlans.name,
                              price: parseFloat(dbPlans.price),
                              id: dbPlans.id,
                              slug: dbPlans.slug
                            });
                          } else {
                            toast.error("Subscription plan details not synced in database.");
                          }
                        } catch (err) {
                          console.error(err);
                          toast.error("Error retrieving plan details.");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="w-full relative overflow-hidden group/btn bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        Upgrade to {tier.name}
                        <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                      </span>
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Transaction & Billing Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Column 1 & 2: Active Payment Requests */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-400" />
            Payment Submissions
          </h3>
          <Card className="bg-zinc-950/30 backdrop-blur-md border border-zinc-900/60">
            <CardContent className="p-0">
              {paymentRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-12">
                  <div className="p-4 rounded-full bg-zinc-900/40 border border-zinc-800/40 mb-4">
                    <FileText className="w-8 h-8 text-zinc-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-300">No payment requests</h4>
                  <p className="text-zinc-500 text-xs mt-1 max-w-xs">You haven't submitted any payment transactions receipt confirmations yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                        <th className="px-6 py-4">Method / Number</th>
                        <th className="px-6 py-4">Transaction ID</th>
                        <th className="px-6 py-4">Amount Paid</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/40">
                      {paymentRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-zinc-900/20 transition-colors">
                          <td className="px-6 py-4 font-medium text-zinc-200">
                            <span className="block">{methodNames[req.payment_method]}</span>
                            <span className="text-xs text-zinc-500 font-mono">{req.sender_number}</span>
                          </td>
                          <td className="px-6 py-4 font-mono text-zinc-400 text-xs">
                            {req.transaction_id}
                          </td>
                          <td className="px-6 py-4 font-semibold text-white">
                            ৳{req.amount}
                          </td>
                          <td className="px-6 py-4">
                            {statusBadges[req.status]}
                          </td>
                          <td className="px-6 py-4 text-right text-zinc-500 text-xs">
                            {formatDate(req.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 3: Subscription History Audit Log */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            < AnimatePresence />
            <History className="w-5 h-5 text-purple-400" />
            Billing History
          </h3>
          <Card className="bg-zinc-950/30 backdrop-blur-md border border-zinc-900/60 max-h-[400px] overflow-y-auto">
            <CardContent className="p-4 space-y-4">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <History className="w-8 h-8 text-zinc-500 mb-3" />
                  <h4 className="text-xs font-semibold text-zinc-300">No history found</h4>
                  <p className="text-zinc-500 text-2xs mt-0.5">Logs appear upon plan adjustments.</p>
                </div>
              ) : (
                <div className="relative border-l border-zinc-900/80 ml-3 space-y-5">
                  {history.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      {/* Timeline dot */}
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-purple-500 border border-black" />
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-xs font-semibold text-white uppercase tracking-wider">
                          {log.action}
                        </span>
                        <p className="text-zinc-400 text-xs">
                          {log.previous_plan ? `${log.previous_plan.toUpperCase()} → ` : ""}
                          <span className="font-semibold text-purple-400">{log.current_plan?.toUpperCase()}</span>
                        </p>
                        <span className="text-3xs text-zinc-500 mt-1">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CHECKOUT MODAL COMPONENT */}
      <AnimatePresence>
        {checkoutPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark glass overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCheckoutPlan(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto z-50"
            >
              {/* Top ambient color ring */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-600 to-indigo-600" />
              
              <button
                onClick={() => setCheckoutPlan(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 bg-zinc-900/50 hover:bg-zinc-900 z-50"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-2">
                <h4 className="text-lg font-bold text-white">Submit Payment Receipt</h4>
                <p className="text-zinc-400 text-xs mt-0.5">
                  You are upgrading to the <span className="font-semibold text-purple-400">{checkoutPlan.name}</span> plan.
                </p>
              </div>

              {/* Grid Layout Container */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-4">
                {/* Left Column: Payment Summary Info Panel */}
                <div className="md:col-span-5 bg-zinc-900/20 border border-zinc-900 p-4 rounded-xl flex flex-col justify-between space-y-3.5">
                  <div className="space-y-3.5 text-xs text-zinc-400">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-900">
                      <Shield className="w-4.5 h-4.5 text-purple-400 shrink-0" />
                      <div>
                        <h5 className="font-bold text-zinc-200 text-xs">Payment Information</h5>
                        <p className="text-[9px] text-zinc-500">Secure checkout panel</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-0.5">Plan</label>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-200 text-xs">{checkoutPlan.name}</span>
                        <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] px-1.5 py-0.2">30 Days</Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-0.5">Amount</label>
                      <span className="text-lg font-bold text-white">৳{checkoutPlan.price} BDT</span>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-0.5">Payment Method</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-14 h-7 bg-zinc-950 rounded border border-zinc-900 flex items-center justify-center p-1">
                          {selectedProvider.logo}
                        </div>
                        <span className="font-semibold text-zinc-300 text-xs">{selectedProvider.name}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-0.5">Merchant Number</label>
                      <div className="bg-zinc-950/80 border border-zinc-900 p-2 rounded-lg font-mono text-zinc-300 text-[10px] select-all flex justify-between items-center group">
                        <span>{selectedProvider.merchantNumber}</span>
                        <span className="text-[8px] text-purple-400 font-sans tracking-normal opacity-0 group-hover:opacity-100 transition-opacity">Copy</span>
                      </div>
                    </div>

                    <div className="pt-0.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-0.5">Instructions</label>
                      <p className="text-zinc-400 text-[10.5px] leading-relaxed bg-zinc-900/10 p-2 rounded border border-zinc-900/30">
                        {selectedProvider.instructions}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-[8px] text-zinc-500 text-center border-t border-zinc-900 pt-2.5">
                    Automatic activation once payment is reconciled by the admin team.
                  </div>
                </div>

                {/* Right Column: Provider Selection Grid + Inputs */}
                <div className="md:col-span-7 flex flex-col space-y-3.5">
                  {/* Category Tab Selector */}
                  <div className="flex bg-zinc-900/60 p-0.5 rounded-xl border border-zinc-900">
                    {categories.map((cat) => {
                      const isActive = activeProviderTab === cat.id;
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setActiveProviderTab(cat.id);
                            // Select the first provider of this category automatically
                            const firstOfCat = PROVIDERS.find(p => p.category === cat.id);
                            if (firstOfCat) setPaymentMethod(firstOfCat.id);
                          }}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-0.5 text-[10.5px] font-medium rounded-lg transition-all duration-200 ${
                            isActive
                              ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/30"
                              : "text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Grid Layout for Payment Options */}
                  <div className="max-h-[140px] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {filteredProviders.map((prov) => {
                        const isSelected = paymentMethod === prov.id;
                        return (
                          <button
                            key={prov.id}
                            type="button"
                            onClick={() => setPaymentMethod(prov.id)}
                            className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 ${
                              isSelected
                                ? "border-purple-500 bg-purple-500/10 shadow-[0_0_10px_rgba(147,51,234,0.1)] ring-1 ring-purple-500/20"
                                : "border-zinc-900 bg-zinc-900/30 hover:border-zinc-800 hover:bg-zinc-900/50"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-purple-500 text-white scale-90">
                                <Check className="h-2.5 w-2.5" />
                              </div>
                            )}
                            <div className="h-6 w-full flex items-center justify-center p-0.5">
                              {prov.logo}
                            </div>
                            <span className="text-[9px] mt-0.5 font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                              {prov.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input Form Fields */}
                  <form onSubmit={handlePaymentSubmit} className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-zinc-400">Sender / Account Mobile Number</label>
                      <Input
                        type="text"
                        required
                        placeholder="e.g. 017XXXXXXXX"
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                        className="w-full h-8.5 bg-zinc-900 border-zinc-800 text-zinc-300 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-zinc-400">Transaction ID (TxID)</label>
                      <Input
                        type="text"
                        required
                        placeholder="e.g. A9B8C7D6E5"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full h-8.5 bg-zinc-900 border-zinc-800 text-zinc-300 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                        Amount Paid (BDT)
                        <span title="Modify ONLY if you paid a different amount than standard price">
                          <HelpCircle className="w-3 h-3 text-zinc-500" />
                        </span>
                      </label>
                      <Input
                        type="number"
                        placeholder={`Standard: ৳${checkoutPlan.price}`}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full h-8.5 bg-zinc-900 border-zinc-800 text-zinc-300 text-xs"
                      />
                      {isAmountInvalid && (
                        <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>
                            {checkoutPlan.slug === "pro"
                              ? "Invalid payment amount. PRO subscription requires exactly ৳400."
                              : "Invalid payment amount. ELITE subscription requires exactly ৳1000."}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="pt-1.5 flex gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCheckoutPlan(null)}
                        className="flex-1 h-8.5 text-xs border border-zinc-900 text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submittingPayment || isAmountInvalid}
                        className="flex-1 h-8.5 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold flex justify-center items-center gap-1.5"
                      >
                        {submittingPayment ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Receipt"
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
