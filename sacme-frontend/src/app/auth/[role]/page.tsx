"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { KeyRound, LogIn, ArrowLeft } from "lucide-react";

const roleDisplayNames: Record<string, string> = {
  "student": "Student",
  "professor": "Professor",
  "faculty-advisor": "Faculty Advisor",
  "main-admin": "Main Admin"
};

export default function RoleAuthOptionsPage() {
  const params = useParams();
  const role = params.role as string;
  const roleName = roleDisplayNames[role] || "User";

  return (
    <div className="w-full max-w-3xl py-12 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <Link href="/auth" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to roles
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            {roleName} Authentication
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-xl">
            Please choose how you want to proceed.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* First Time Activation Option */}
          <Link href={`/auth/${role}/activate`} className="group outline-none">
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-full p-8 rounded-3xl bg-white dark:bg-[#111] border-2 border-slate-200 dark:border-[#333] transition-all duration-300 hover:shadow-xl hover:ring-4 hover:border-blue-500 hover:ring-blue-500/20 text-left flex flex-col relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                First Time Account Verification
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-sm leading-relaxed">
                Activate your pre-registered account and set your permanent password for the first time.
              </p>
            </motion.div>
          </Link>

          {/* Regular Login Option */}
          <Link href={`/auth/${role}/login`} className="group outline-none">
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-full p-8 rounded-3xl bg-white dark:bg-[#111] border-2 border-slate-200 dark:border-[#333] transition-all duration-300 hover:shadow-xl hover:ring-4 hover:border-indigo-500 hover:ring-indigo-500/20 text-left flex flex-col relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <LogIn className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Regular Sign In
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-sm leading-relaxed">
                Log into your already activated dashboard using your credentials.
              </p>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
