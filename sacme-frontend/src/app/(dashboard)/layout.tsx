import React from 'react';
import TopNav from '@/components/TopNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#020617] relative transition-colors duration-300">
      {/* Background Gradients & Mesh */}
      <div className="absolute inset-0 animated-gradient-bg opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 dark:bg-indigo-500/10 blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 dark:bg-sky-500/10 blur-[150px] pointer-events-none mix-blend-screen" />
      
      <div className="flex-1 flex flex-col relative overflow-hidden z-10 w-full max-w-7xl mx-auto xl:max-w-[1400px]">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
}
