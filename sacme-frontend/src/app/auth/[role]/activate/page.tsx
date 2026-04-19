"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function RoleActivationPage() {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;

  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Map roles to their specific identifier labels and backend endpoint
  const roleConfig: Record<string, { label: string, endpoint: string, bodyKey: string }> = {
    "student": { label: "Roll Number", endpoint: "activate/student", bodyKey: "rollNo" },
    "professor": { label: "Instructor ID", endpoint: "activate/professor", bodyKey: "instructorId" },
    "faculty-advisor": { label: "Faculty ID", endpoint: "activate/faculty-advisor", bodyKey: "facultyId" },
    "main-admin": { label: "Admin Email Address", endpoint: "activate/main-admin", bodyKey: "adminId" },
  };
  
  const config = roleConfig[role] || roleConfig["student"];
  const roleName = role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/auth/${config.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          [config.bodyKey]: identifier,
          email, 
          newPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Activation failed. Please check your details.");
        return;
      }

      setSuccessMsg("Account successfully activated! Redirecting to login...");
      setTimeout(() => {
        router.push(`/auth/${role}/login`);
      }, 2000);

    } catch (err) {
      setError("Network error. Please make sure the server is running.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <div className="w-full mb-8">
        <Link href={`/auth/${role}`} className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Options
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-white dark:bg-[#111] p-8 sm:p-10 rounded-[2rem] shadow-xl border border-slate-100 dark:border-[#333]"
      >
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/50">
          <KeyRound className="w-6 h-6" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          {roleName} Activation
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
          Verify your pre-registered identity to set your permanent password.
        </p>

        <form onSubmit={handleActivate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {config.label}
            </Label>
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={`Enter your ${config.label.toLowerCase()}`}
              required
              className="h-11 border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all font-medium rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Registered College Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@college.edu"
              required
              className="h-11 border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all font-medium rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
             <Label htmlFor="newPassword" className="text-sm font-bold text-slate-700 dark:text-slate-300">
               Create Password
             </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-11 border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all font-medium rounded-xl text-slate-900 dark:text-white"
            />
          </div>

           <div className="space-y-2">
             <Label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700 dark:text-slate-300">
               Confirm Password
             </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-11 border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all font-medium rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-100 dark:border-red-500/20 mt-4">
              {error}
            </motion.div>
          )}

          {successMsg && (
             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20 mt-4">
              {successMsg}
            </motion.div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !!successMsg}
            className="w-full h-12 mt-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all text-base border-0 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Activate Account"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
