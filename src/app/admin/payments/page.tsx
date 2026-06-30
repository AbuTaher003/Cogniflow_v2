"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { Loader2, Wallet, Check, X, Search, RefreshCw, Eye, Calendar, ArrowUpDown, Shield } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface PaymentTransaction {
  id: string;
  approved_at: string;
  notes: string;
  status: "approved" | "rejected";
}

interface PaymentRequestWithUser {
  id: string;
  user_id: string;
  plan_id: string;
  payment_method: string;
  transaction_id: string;
  sender_number: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  subscription_plans?: {
    name: string;
    slug: string;
    price: number;
  };
  payment_transactions?: PaymentTransaction;
}

const methodNames: Record<string, { label: string; type: "mfs" | "card" | "bank" }> = {
  bkash: { label: "bKash", type: "mfs" },
  nagad: { label: "Nagad", type: "mfs" },
  rocket: { label: "Rocket", type: "mfs" },
  upay: { label: "Upay", type: "mfs" },
  visa: { label: "Visa Card", type: "card" },
  mastercard: { label: "Mastercard", type: "card" },
  amex: { label: "American Express", type: "card" },
  dutch_bangla: { label: "Dutch-Bangla Bank", type: "bank" },
  islami_bank: { label: "Islami Bank", type: "bank" },
  brac_bank: { label: "BRAC Bank", type: "bank" },
  city_bank: { label: "City Bank", type: "bank" },
  ebl: { label: "Eastern Bank (EBL)", type: "bank" },
  prime_bank: { label: "Prime Bank", type: "bank" },
  bank_asia: { label: "Bank Asia", type: "bank" },
  mtb: { label: "Mutual Trust Bank (MTB)", type: "bank" },
  southeast_bank: { label: "Southeast Bank", type: "bank" },
  pubali_bank: { label: "Pubali Bank", type: "bank" },
  sonali_bank: { label: "Sonali Bank", type: "bank" },
  janata_bank: { label: "Janata Bank", type: "bank" },
  agrani_bank: { label: "Agrani Bank", type: "bank" },
  rupali_bank: { label: "Rupali Bank", type: "bank" },
  nexus: { label: "DBBL Nexus", type: "card" },
  qcash: { label: "Q-Cash Card", type: "card" },
  sslcommerz: { label: "SSLCommerz Gate", type: "card" }
};

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRequestWithUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("date-desc");
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Rejection notes modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState("");

  // Details Modal State
  const [selectedPay, setSelectedPay] = useState<PaymentRequestWithUser | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*, profiles(*), subscription_plans(*), payment_transactions(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load payment requests.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(paymentId: string) {
    setActioningId(paymentId);
    try {
      // 1. Update request status to approved
      const { error } = await supabase
        .from("payment_requests")
        .update({ status: "approved" })
        .eq("id", paymentId);

      if (error) throw error;

      toast.success("Payment request approved. Subscription activated!");
      if (selectedPay && selectedPay.id === paymentId) {
        setSelectedPay(null);
      }
      await loadPayments();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to approve payment request.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingId) return;

    setActioningId(rejectingId);
    try {
      // 1. Update status in DB
      const { error } = await supabase
        .from("payment_requests")
        .update({ status: "rejected" })
        .eq("id", rejectingId);

      if (error) throw error;

      // 2. Log transaction with custom rejection notes
      const userRes = await supabase.auth.getUser();
      await supabase
        .from("payment_transactions")
        .insert({
          payment_request_id: rejectingId,
          approved_by: userRes.data.user?.id,
          status: "rejected",
          notes: rejectionNotes.trim() || "Rejected by administrator."
        });

      toast.warning("Payment request rejected.");
      setRejectingId(null);
      setRejectionNotes("");
      if (selectedPay && selectedPay.id === rejectingId) {
        setSelectedPay(null);
      }
      await loadPayments();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to reject payment.");
    } finally {
      setActioningId(null);
    }
  }

  const filteredPayments = payments
    .filter((pay) => {
      const matchesSearch =
        (pay.profiles?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pay.profiles?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pay.transaction_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pay.sender_number || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || pay.status === statusFilter;
      const matchesMethod = methodFilter === "all" || pay.payment_method.toLowerCase() === methodFilter;
      const matchesPlan = planFilter === "all" || pay.subscription_plans?.slug === planFilter;

      return matchesSearch && matchesStatus && matchesMethod && matchesPlan;
    })
    .sort((a, b) => {
      if (sortOption === "date-desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortOption === "date-asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortOption === "amount-desc") {
        return b.amount - a.amount;
      }
      if (sortOption === "amount-asc") {
        return a.amount - b.amount;
      }
      return 0;
    });

  // Extract unique plans and methods present in the data for filtering
  const paymentMethods = Array.from(new Set(payments.map((p) => p.payment_method.toLowerCase())));
  const subscriptionPlans = Array.from(new Set(payments.map((p) => p.subscription_plans?.slug).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-400" /> Payments Approval Queue
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Review pending checkout payments, approve licenses, and record transaction rejections.</p>
        </div>
        <Button onClick={loadPayments} variant="outline" size="sm" className="border-zinc-800 text-zinc-300 h-8">
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh Queue
        </Button>
      </div>

      {/* Filter panel */}
      <Card className="bg-zinc-900/10 border-zinc-900/80 p-4 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search user, transaction ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-950 border-zinc-900 focus:border-zinc-800 text-zinc-300 text-xs h-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs h-9">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs h-9">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
              <SelectItem value="all">All Methods</SelectItem>
              {paymentMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {methodNames[method]?.label || method.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs h-9">
              <SelectValue placeholder="Purchased Plan" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
              <SelectItem value="all">All Plans</SelectItem>
              {subscriptionPlans.map((plan) => (
                <SelectItem key={plan} value={plan || ""}>
                  {(plan || "").toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs h-9">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
                <SelectValue placeholder="Sort order" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="amount-desc">Highest Amount</SelectItem>
              <SelectItem value="amount-asc">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="bg-zinc-900/10 border-zinc-900/80 overflow-hidden shadow-xl rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs">
              No matching payment submissions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/40 text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="p-4">User Details</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Method / Bank</th>
                    <th className="p-4">Sender Number</th>
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {filteredPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-zinc-900/20 text-zinc-300 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-zinc-200">{pay.profiles?.full_name || "Unknown User"}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{pay.profiles?.email}</p>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-purple-400 uppercase">
                          {pay.subscription_plans?.name || "Pro"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-zinc-200">
                          {methodNames[pay.payment_method.toLowerCase()]?.label || pay.payment_method}
                        </span>
                        <span className="text-[9px] block text-zinc-500 capitalize">
                          {methodNames[pay.payment_method.toLowerCase()]?.type || "unknown"} gate
                        </span>
                      </td>
                      <td className="p-4 font-mono">{pay.sender_number}</td>
                      <td className="p-4 font-mono text-zinc-400">{pay.transaction_id}</td>
                      <td className="p-4 font-bold text-white">৳{pay.amount}</td>
                      <td className="p-4 text-zinc-500 font-mono">
                        {new Date(pay.created_at).toLocaleDateString()} {new Date(pay.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          pay.status === "pending"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : pay.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <Button
                          onClick={() => setSelectedPay(pay)}
                          size="sm"
                          variant="outline"
                          className="border-zinc-800 text-zinc-400 hover:text-white h-7 px-2.5 rounded-lg text-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {pay.status === "pending" && (
                          <>
                            <Button
                              disabled={!!actioningId}
                              onClick={() => handleApprove(pay.id)}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white h-7 px-2.5 rounded-lg text-2xs font-semibold"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              disabled={!!actioningId}
                              onClick={() => setRejectingId(pay.id)}
                              size="sm"
                              variant="default"
                              className="bg-rose-600 hover:bg-rose-500 text-white h-7 px-2.5 rounded-lg text-2xs font-semibold"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DETAIL MODAL */}
      {selectedPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setSelectedPay(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <Card className="relative w-full max-w-xl bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <CardHeader className="p-0 pb-4 mb-4 border-b border-zinc-900">
              <CardTitle className="text-white text-md font-bold flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-400" /> Payment Transaction Details
              </CardTitle>
              <CardDescription className="text-zinc-500 text-xs mt-1">Review complete transaction history and metadata verification.</CardDescription>
            </CardHeader>
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-zinc-900/20 p-4 rounded-xl border border-zinc-900">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">USER FULL NAME</span>
                  <span className="font-semibold text-zinc-200 block mt-0.5">{selectedPay.profiles?.full_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">USER EMAIL</span>
                  <span className="font-semibold text-zinc-200 block mt-0.5">{selectedPay.profiles?.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">PURCHASED PLAN</span>
                  <span className="font-semibold text-purple-400 block mt-0.5 uppercase">{selectedPay.subscription_plans?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">TRANSACTION AMOUNT</span>
                  <span className="font-bold text-white block mt-0.5">৳{selectedPay.amount}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-900/10 border border-zinc-900/50 rounded-xl">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">PAYMENT METHOD</span>
                  <span className="font-semibold text-zinc-300 block mt-0.5">{methodNames[selectedPay.payment_method.toLowerCase()]?.label || selectedPay.payment_method}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">SENDER NUMBER</span>
                  <span className="font-mono text-zinc-300 block mt-0.5">{selectedPay.sender_number}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">TRANSACTION ID</span>
                  <span className="font-mono text-zinc-200 block mt-0.5">{selectedPay.transaction_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">SUBMISSION DATE</span>
                  <span className="font-mono text-zinc-400 block mt-0.5">{new Date(selectedPay.created_at).toLocaleString()}</span>
                </div>
              </div>

              {selectedPay.payment_transactions && (
                <div className="p-4 bg-purple-950/10 border border-purple-500/10 rounded-xl space-y-2">
                  <span className="text-[10px] text-purple-400 uppercase font-mono block font-bold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Administrative audit details
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                    <div>
                      <span className="text-[10px] text-zinc-500">Processed Status:</span>
                      <span className="font-semibold capitalize text-zinc-300 block">{selectedPay.payment_transactions.status}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">Processed At:</span>
                      <span className="font-semibold block text-zinc-300">{new Date(selectedPay.payment_transactions.approved_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500">Remarks & Notes:</span>
                    <p className="font-medium text-zinc-300 italic mt-0.5">"{selectedPay.payment_transactions.notes || "No remarks logged."}"</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
                <Button type="button" onClick={() => setSelectedPay(null)} variant="outline" className="border-zinc-800 text-zinc-400">
                  Close details
                </Button>
                {selectedPay.status === "pending" && (
                  <>
                    <Button
                      disabled={!!actioningId}
                      onClick={() => handleApprove(selectedPay.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Approve request
                    </Button>
                    <Button
                      disabled={!!actioningId}
                      onClick={() => setRejectingId(selectedPay.id)}
                      variant="default"
                      className="bg-rose-600 hover:bg-rose-500 text-white"
                    >
                      Reject request
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* REJECTION NOTES MODAL */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setRejectingId(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <Card className="relative w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-xl shadow-2xl p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-white text-md font-bold">Reject Payment Request</CardTitle>
              <CardDescription className="text-zinc-500 text-xs mt-1">Specify reasons for rejecting the user's payment transaction code.</CardDescription>
            </CardHeader>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <Input
                placeholder="Reason for rejection (e.g. Transaction ID did not match records)..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs h-10"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setRejectingId(null)} variant="outline" className="border-zinc-800 text-zinc-400">
                  Cancel
                </Button>
                <Button type="submit" variant="default" className="bg-rose-600 hover:bg-rose-500 text-white">
                  Reject Receipt
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
