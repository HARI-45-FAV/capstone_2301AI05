"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function ActivatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate Token existence
  useEffect(() => {
    if (!token) {
      setError("No activation token provided. Please use the link sent to your email or contact support.");
    }
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activationToken: token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to activate account");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);

    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Account Activated!</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Your password has been set successfully. Redirecting you to login...
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Activate Account</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Welcome to SACME. Please set a secure password to activate your account.
        </p>
      </div>

      <form onSubmit={handleActivate} className="space-y-6">
        {error && (
          <div className="p-3 flex items-start gap-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-md">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Set Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Min 8 chars, 1 number, 1 special char" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!token}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={!token}
              className="h-11"
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11 text-base" disabled={loading || !token}>
          {loading ? "Activating..." : "Activate & Set Password"}
        </Button>
      </form>
    </motion.div>
  );
}
