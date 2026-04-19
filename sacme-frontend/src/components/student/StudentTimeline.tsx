"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect } from "react";
import { Loader2, FileText, CheckCircle, XCircle, Calendar } from "lucide-react";

const API = "http://localhost:5000";

export default function StudentTimeline() {
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"ALL" | "ATTENDANCE" | "SUBMISSION">("ALL");

    useEffect(() => {
        const fetch_timeline = async () => {
            setLoading(true);
            try {
                const token = getAuthToken();
                if (!token) return;
                const res = await fetch(`${API}/api/courses/my-timeline`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTimeline(data.timeline || []);
                }
            } catch (e) {
                console.error("Timeline fetch error:", e);
            } finally {
                setLoading(false);
            }
        };
        fetch_timeline();
    }, []);

    const filtered = filter === "ALL" ? timeline : timeline.filter(e => e.type === filter);

    const getEventStyle = (event: any) => {
        if (event.type === "SUBMISSION") {
            if (event.status === "LATE") return { icon: FileText, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/40", badge: "bg-orange-100 text-orange-700" };
            return { icon: FileText, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/40", badge: "bg-blue-100 text-blue-700" };
        }
        if (event.status === "Present")
            return { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/40", badge: "bg-emerald-100 text-emerald-700" };
        return { icon: XCircle, color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/40", badge: "bg-rose-100 text-rose-700" };
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {(["ALL", "ATTENDANCE", "SUBMISSION"] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            filter === f
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                            : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400"
                        }`}
                    >
                        {f === "ALL" ? "All Activity" : f === "ATTENDANCE" ? "Attendance" : "Submissions"}
                        <span className="ml-2 opacity-60">
                            ({f === "ALL" ? timeline.length : timeline.filter(e => e.type === f).length})
                        </span>
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="text-center p-12 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No activity recorded yet</p>
                </div>
            ) : (
                <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6 pb-4">
                    {filtered.map((event) => {
                        const style = getEventStyle(event);
                        const Icon = style.icon;
                        return (
                            <div key={event.id} className="relative pl-8">
                                <div className={`absolute -left-[17px] top-1 p-2 rounded-full ${style.bg} border-4 border-white dark:border-slate-900`}>
                                    <Icon className={`w-4 h-4 ${style.color}`} />
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}>
                                                {event.type}
                                            </span>
                                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 mt-1.5">{event.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{event.course}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-medium text-slate-500">{new Date(event.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{event.meta}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
