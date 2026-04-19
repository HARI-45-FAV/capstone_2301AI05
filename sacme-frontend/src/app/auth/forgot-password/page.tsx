"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowLeft, Mail, ShieldCheck, KeyRound, Loader2 } from "lucide-react";

type ForgotStep = "EMAIL" | "OTP" | "RESET" | "SUCCESS";

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<ForgotStep>("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  // Step 1: Generate OTP (Send Email)
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Too many OTP requests. Try again later.");
      
      setStep("OTP");
      setResendTimer(30);
    } catch (err: any) {
      setError(err.message || "Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Too many OTP requests. Try again later.");
      setResendTimer(30);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setResetToken(data.passwordResetToken);
      setStep("RESET");
    } catch (err: any) {
      setError(err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          passwordResetToken: resetToken, 
          newPassword 
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setStep("SUCCESS");
      setTimeout(() => router.push("/auth"), 3000);
      
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <div className="w-full mb-8">
        <Link href="/auth" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to roles
        </Link>
      </div>

      <AnimatePresence mode="wait">
        
        {step === "EMAIL" && (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full bg-white dark:bg-[#111] p-8 sm:p-10 rounded-[2rem] shadow-xl border border-slate-100 dark:border-[#333] space-y-6"
          >
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Forgot Password?</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                No worries, we'll send you reset instructions.
              </p>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-6 flex flex-col">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@college.edu" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11 border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all font-medium rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

               {error && (
                <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-100 dark:border-red-500/20">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-12 mt-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all text-base border-0" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Send Reset Code"}
              </Button>
            </form>
          </motion.div>
        )}

        {step === "OTP" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full bg-white dark:bg-[#111] p-8 sm:p-10 rounded-[2rem] shadow-xl border border-slate-100 dark:border-[#333] space-y-6"
          >
            <div>
               <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Check your email</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                We sent a 6-digit confirmation code to <strong className="text-slate-700 dark:text-slate-300">{email}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6 flex flex-col">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-bold text-slate-700 dark:text-slate-300">Verification Code</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input 
                    id="otp" 
                    type="text" 
                    maxLength={6}
                    placeholder="XXXXXX" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="pl-10 h-11 tracking-[0.5em] font-mono text-center border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all font-medium rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

               {error && (
                <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-100 dark:border-red-500/20">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-12 mt-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all text-base border-0 disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading || otp.length < 6}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Verify Code"}
              </Button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  className="text-sm font-bold text-blue-600 dark:text-blue-400 disabled:text-slate-400 dark:disabled:text-slate-600 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === "RESET" && (
          <motion.div
            key="reset"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 space-y-6"
          >
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Create new password</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Your new password must be different from previous used passwords.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-6 flex flex-col">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-bold text-slate-700 dark:text-slate-300">New Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input 
                      id="newPassword" 
                      type="password" 
                      placeholder="Min 8 chars, 1 num, 1 special" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="pl-10 h-11 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all font-medium rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700 dark:text-slate-300">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11 border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all font-medium rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

               {error && (
                <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-100 dark:border-red-500/20">
                  {error}
                </div>
              )}
              
              <Button type="submit" className="w-full h-12 mt-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all text-base border-0" disabled={loading}>
                 {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Reset Password"}
              </Button>
            </form>
          </motion.div>
        )}

        {step === "SUCCESS" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-white dark:bg-[#111] text-center space-y-6 py-12 px-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-[#333]"
          >
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Password Reset</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Your password has been successfully reset. Redirecting back to login...
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
