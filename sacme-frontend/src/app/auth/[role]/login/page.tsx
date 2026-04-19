"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function RoleLoginPage() {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Map roles to their specific identifier labels
  const roleLabels: Record<string, string> = {
    "student": "Roll Number",
    "professor": "Instructor ID",
    "faculty-advisor": "Faculty ID",
    "main-admin": "Admin Email Address", // Updated from Admin ID to avoid confusion
  };
  const identifierLabel = roleLabels[role] || "Email / Identity";
  const roleName = role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.action === "REDIRECT_TO_ACTIVATION") {
          setError("Your account is not activated. Please use the First Time Account Verification option.");
        } else {
          setError(data.error || "Login failed.");
        }
        return;
      }

      // Enforce strict Role alignment preventing cross-portal entries
      const expectedRoleMap: Record<string, string> = {
        "student": "STUDENT",
        "professor": "PROFESSOR",
        "faculty-advisor": "FACULTY_ADVISOR",
        "main-admin": "MAIN_ADMIN",
      };

      if (data.user.role !== expectedRoleMap[role]) {
           setError(`Account role mismatch. This portal is for ${expectedRoleMap[role]}s, but your account is recognized as ${data.user.role}. Please log in through the correct portal.`);
           return;
      }

      // Store token with strict isolation
      if (data.token) {
        localStorage.setItem("user_role", role);
        if (role === 'student') localStorage.setItem("student_token", data.token);
        else if (role === 'professor') localStorage.setItem("professor_token", data.token);
        else if (role === 'faculty-advisor') localStorage.setItem("faculty-advisor_token", data.token);
        else if (role === 'main-admin') localStorage.setItem("admin_token", data.token);
        else localStorage.setItem("sacme_token", data.token); // Backward compat fallback
      }

      // Route to specific dashboard. Account for main-admin routing map.
      let dashboardPath = `/${role}/dashboard`;
      if (role === "main-admin") {
        dashboardPath = data.user.setupCompleted ? "/admin/dashboard" : "/admin/setup";
      }
      router.push(dashboardPath);
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
          <LogIn className="w-6 h-6" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          {roleName} Sign In
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
          Enter your <span className="lowercase">{identifierLabel}</span> and password to access your dashboard.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {identifierLabel}
            </Label>
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={`e.g. admin@college.edu`}
              required
              className="h-12 border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all font-medium rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Password
              </Label>
              <Link href="/auth/forgot-password" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-12 border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all font-medium rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-100 dark:border-red-500/20">
              {error}
            </motion.div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 mt-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all text-base border-0 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
