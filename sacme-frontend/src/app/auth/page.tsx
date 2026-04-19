"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { User, ShieldUser, GraduationCap, Users, ShieldAlert } from "lucide-react";

export default function RoleSelectionPage() {
  const roles = [
    {
      id: "student",
      title: "Student",
      description: "Access your courses, grades, and profile.",
      icon: <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
      themePrefix: "hover:border-blue-500 hover:ring-blue-500/20",
      iconBg: "bg-blue-50 dark:bg-blue-900/30",
      href: "/auth/student",
      delay: 0.1,
    },
    {
      id: "professor",
      title: "Professor",
      description: "Manage classes, grading, and students.",
      icon: <GraduationCap className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />,
      themePrefix: "hover:border-indigo-500 hover:ring-indigo-500/20",
      iconBg: "bg-indigo-50 dark:bg-indigo-900/30",
      href: "/auth/professor",
      delay: 0.2,
    },
    {
      id: "faculty-advisor",
      title: "Faculty Advisor",
      description: "Institute Admin portal for academic setup.",
      icon: <ShieldUser className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
      themePrefix: "hover:border-purple-500 hover:ring-purple-500/20",
      iconBg: "bg-purple-50 dark:bg-purple-900/30",
      href: "/auth/faculty-advisor",
      delay: 0.3,
    },
    {
      id: "main-admin",
      title: "Main Admin",
      description: "Super admin access for system monitoring.",
      icon: <ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-400" />,
      themePrefix: "hover:border-rose-500 hover:ring-rose-500/20",
      iconBg: "bg-rose-50 dark:bg-rose-900/30",
      href: "/auth/main-admin",
      delay: 0.4,
    },
  ];

  return (
    <div className="w-full max-w-5xl py-12 flex flex-col items-center">
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm">
          <User className="w-8 h-8" />
        </div>
        
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
          Select Your Workspace
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-xl mx-auto">
          Choose your role to authenticate securely in the SACME platform.
        </p>
      </motion.div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        {roles.map((role) => (
          <Link key={role.id} href={role.href} className="group outline-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: role.delay }}
              className={`h-full p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-xl hover:ring-4 ${role.themePrefix} flex flex-col text-left relative overflow-hidden`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${role.iconBg}`}>
                {role.icon}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {role.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-sm leading-relaxed">
                {role.description}
              </p>
              
              {/* Subtle accent arrow indicating clickability */}
              <div className="absolute top-8 right-8 text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
