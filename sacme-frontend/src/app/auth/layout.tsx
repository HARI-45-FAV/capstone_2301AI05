import React from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-black font-sans selection:bg-blue-200 dark:selection:bg-blue-900">
      
      {/* Left Branding Side (Dark SaaS Aesthetic) */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-950 p-12 text-white relative overflow-hidden border-r border-slate-800">
        
        {/* Subtle Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        
        {/* Top Branding */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-16 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
              S
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">SACME</span>
          </Link>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-6 text-white max-w-lg">
            Manage academic workflows, <span className="text-blue-400">all in one place.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md font-medium leading-relaxed">
            The unified, strictly role-based ecosystem designed to streamline course management and administrative tracking.
          </p>
        </div>

        {/* Decorative Dashboard Mockup */}
        <div className="relative z-10 mt-12 w-[140%] -ml-4 flex-1 min-h-[300px]">
          <div className="absolute inset-0 bg-slate-900 rounded-tl-2xl rounded-tr-2xl border border-b-0 border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Fake Header */}
            <div className="h-10 border-b border-slate-800 flex items-center px-4 gap-2 bg-slate-900/50">
               <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
            </div>
            {/* Fake Body */}
            <div className="flex-1 p-6 flex gap-6">
              {/* Fake Sidebar */}
              <div className="w-40 flex flex-col gap-3">
                <div className="h-4 w-24 bg-slate-800 rounded mb-4"></div>
                <div className="h-8 w-full bg-blue-600/20 border border-blue-500/30 rounded"></div>
                <div className="h-8 w-full bg-slate-800/50 rounded"></div>
                <div className="h-8 w-full bg-slate-800/50 rounded"></div>
              </div>
              {/* Fake Content Area */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex gap-4">
                   <div className="flex-1 h-24 bg-slate-800/50 rounded-xl border border-slate-700/50"></div>
                   <div className="flex-1 h-24 bg-slate-800/50 rounded-xl border border-slate-700/50"></div>
                   <div className="flex-1 h-24 bg-slate-800/50 rounded-xl border border-slate-700/50"></div>
                </div>
                <div className="flex-1 bg-slate-800/30 rounded-xl border border-slate-800 flex flex-col p-4 gap-3">
                   <div className="h-10 w-full bg-slate-800 rounded"></div>
                   <div className="h-10 w-full bg-slate-800 rounded"></div>
                   <div className="h-10 w-full bg-slate-800 rounded"></div>
                </div>
              </div>
            </div>
            
            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-slate-950 to-transparent z-20" />
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-20 mt-8 pt-8 border-t border-slate-800/50">
          <p className="text-sm font-medium text-slate-500">
            © {new Date().getFullYear()} SACME Platform. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Content Side (Clean White Form Area) */}
      <div className="flex flex-col p-6 sm:p-8 lg:p-12 relative bg-slate-50 dark:bg-black">
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8">
            <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center w-full mt-12 lg:mt-0">
          <div className="w-full max-w-full flex justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
