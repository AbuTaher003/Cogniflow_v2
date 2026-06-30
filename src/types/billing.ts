import { z } from "zod";

// ============================================
// TYPESCRIPT TYPES
// ============================================

export type SubscriptionPlanSlug = "free" | "pro" | "elite";
export type SubscriptionStatus = "active" | "expired" | "cancelled" | "past_due" | "pending";
export type PaymentMethod =
  | "bkash" | "nagad" | "rocket" | "upay"
  | "visa" | "mastercard" | "amex"
  | "dutch_bangla" | "islami_bank" | "brac_bank" | "city_bank" | "ebl" | "prime_bank"
  | "bank_asia" | "mtb" | "southeast_bank" | "pubali_bank" | "sonali_bank"
  | "janata_bank" | "agrani_bank" | "rupali_bank"
  | "nexus" | "qcash" | "sslcommerz";
export type PaymentRequestStatus = "pending" | "approved" | "rejected";

export interface PlanDetails {
  planSlug: SubscriptionPlanSlug;
  planId: string;
  name: string;
  price: number;
  durationDays: number;
  features: string[];
  subscriptionStatus: string;
  expiresAt: string | null;
}

export interface SubscriptionFeature {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  duration_days: number;
  features: string[]; // Array of feature slugs
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  plan_id: string;
  payment_method: PaymentMethod;
  transaction_id: string;
  sender_number: string;
  amount: number;
  status: PaymentRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  payment_request_id: string;
  approved_by: string | null; // Admin user profile ID
  approved_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistory {
  id: string;
  user_id: string;
  previous_plan: string | null; // Previous plan slug
  current_plan: string | null; // Current plan slug
  action: string;
  created_at: string;
}

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const subscriptionFeatureSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const subscriptionPlanSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Plan name is required"),
  slug: z.string().min(1, "Slug is required"),
  price: z.number().nonnegative("Price must be greater than or equal to 0"),
  duration_days: z.number().int().nonnegative("Duration must be a positive integer"),
  features: z.array(z.string()).default([]),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const userSubscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid("Invalid user ID"),
  plan_id: z.string().uuid("Invalid plan ID"),
  status: z.enum(["active", "expired", "cancelled", "past_due", "pending"] as const),
  started_at: z.string().datetime().optional(),
  expires_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const paymentRequestInsertSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  plan_id: z.string().uuid("Invalid plan ID"),
  payment_method: z.enum([
    "bkash", "nagad", "rocket", "upay",
    "visa", "mastercard", "amex",
    "dutch_bangla", "islami_bank", "brac_bank", "city_bank", "ebl", "prime_bank",
    "bank_asia", "mtb", "southeast_bank", "pubali_bank", "sonali_bank",
    "janata_bank", "agrani_bank", "rupali_bank",
    "nexus", "qcash", "sslcommerz"
  ] as const),
  transaction_id: z.string().min(4, "Transaction ID must be at least 4 characters long").trim(),
  sender_number: z.string().min(10, "Sender mobile number must be valid").trim(),
  amount: z.number().positive("Amount must be greater than 0"),
  status: z.enum(["pending", "approved", "rejected"] as const).default("pending")
});

export const paymentRequestUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"] as const),
  plan_id: z.string().uuid().optional(),
  amount: z.number().positive().optional()
});

export const paymentTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  payment_request_id: z.string().uuid("Invalid payment request ID"),
  approved_by: z.string().uuid().nullable().optional(),
  approved_at: z.string().datetime().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const subscriptionHistorySchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid("Invalid user ID"),
  previous_plan: z.string().nullable().optional(),
  current_plan: z.string().nullable().optional(),
  action: z.string().min(1),
  created_at: z.string().datetime().optional()
});
