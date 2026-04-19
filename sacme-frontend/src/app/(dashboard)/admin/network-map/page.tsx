"use client";

import NetworkMap from "@/components/NetworkMap";

export default function NetworkMapPage() {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-6 pb-20 fade-in zoom-in duration-500">
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Academic Network Map</h1>
                    <p className="text-sm font-bold text-slate-500 mt-1">Hierarchical visualization of branches, faculty, courses, and students</p>
                </div>
            </div>
            
            <div className="flex-1 w-full bg-white dark:bg-[#0a0a0a] rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                <NetworkMap />
            </div>
        </div>
    );
}
