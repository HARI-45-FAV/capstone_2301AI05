"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect } from "react";
import { Loader2, Activity, FileText, CheckSquare, Folder, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const API = "http://localhost:5000";

export default function AdminHeatmapPage() {
    const [heatmap, setHeatmap] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [highlight, setHighlight] = useState<"all" | "submissions" | "attendances" | "materials" | "assignments">("all");

    useEffect(() => {
        const fetchHeatmap = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;
                const res = await fetch(`${API}/api/academic/heatmap`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setHeatmap(data.heatmap || []);
                }
            } catch (e) {
                console.error("Heatmap error:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchHeatmap();
    }, []);

    const maxTotal = Math.max(...heatmap.map(d => d.total), 1);

    const getCellColor = (total: number) => {
        if (total === 0) return "bg-slate-100 dark:bg-slate-800";
        const pct = total / maxTotal;
        if (pct < 0.2) return "bg-indigo-100 dark:bg-indigo-900/40";
        if (pct < 0.4) return "bg-indigo-200 dark:bg-indigo-800/60";
        if (pct < 0.6) return "bg-indigo-400 dark:bg-indigo-700";
        if (pct < 0.8) return "bg-indigo-600 dark:bg-indigo-500";
        return "bg-indigo-800 dark:bg-indigo-400";
    };

    const summaryStats = heatmap.reduce((acc, d) => ({
        submissions: acc.submissions + d.submissions,
        attendances: acc.attendances + d.attendances,
        materials: acc.materials + d.materials,
        assignments: acc.assignments + d.assignments,
    }), { submissions: 0, attendances: 0, materials: 0, assignments: 0 });

    const cards = [
        { key: "submissions", label: "Total Submissions", icon: FileText, color: "blue", value: summaryStats.submissions },
        { key: "attendances", label: "Attendance Records", icon: CheckSquare, color: "emerald", value: summaryStats.attendances },
        { key: "materials", label: "Materials Uploaded", icon: Folder, color: "amber", value: summaryStats.materials },
        { key: "assignments", label: "Assignments Created", icon: Activity, color: "rose", value: summaryStats.assignments },
    ];

    if (loading) return <div className="flex justify-center p-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

    return (
        <div className="space-y-8 p-6">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">System Activity Heatmap</h1>
                <p className="text-slate-500 mt-1">30-day breakdown of all system activity — submissions, attendance, materials, and assignments.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cards.map(card => (
                    <button key={card.key} onClick={() => setHighlight(highlight === card.key as any ? "all" : card.key as any)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-lg ${
                            highlight === card.key
                            ? `border-${card.color}-500 bg-${card.color}-50 dark:bg-${card.color}-950/30`
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                        }`}>
                        <div className={`w-10 h-10 rounded-xl bg-${card.color}-100 dark:bg-${card.color}-900/40 flex items-center justify-center mb-3`}>
                            <card.icon className={`w-5 h-5 text-${card.color}-600`} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">{card.label}</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{card.value}</h3>
                    </button>
                ))}
            </div>

            {/* Calendar-style Heatmap Grid */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Daily Activity Density (Last 30 Days)</h3>
                {heatmap.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>No activity data available yet. Activity will appear once students submit assignments and professors record attendance.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-2">
                            {heatmap.map((day) => {
                                const val = highlight === "all" ? day.total : day[highlight] || 0;
                                const pct = val / maxTotal;
                                const bgClass = getCellColor(highlight === "all" ? day.total : val * (maxTotal / Math.max(val, 1)));
                                return (
                                    <div key={day.date} className={`group relative w-8 h-8 rounded-md cursor-help ${bgClass} transition-all hover:scale-110`}>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-44 bg-slate-900 text-white text-xs rounded-lg p-2 shadow-xl pointer-events-none">
                                            <p className="font-bold mb-1">{new Date(day.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                                            <p>📤 Submissions: {day.submissions}</p>
                                            <p>✅ Attendance: {day.attendances}</p>
                                            <p>📁 Materials: {day.materials}</p>
                                            <p>📝 Assignments: {day.assignments}</p>
                                            <p className="font-bold mt-1 border-t border-slate-700 pt-1">Total: {day.total}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
                            <span>Less</span>
                            {["bg-slate-100","bg-indigo-100","bg-indigo-200","bg-indigo-400","bg-indigo-600","bg-indigo-800"].map(c => (
                                <div key={c} className={`w-4 h-4 rounded-sm ${c}`} />
                            ))}
                            <span>More</span>
                        </div>
                    </>
                )}
            </div>

            {/* Stacked Bar Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-6">Daily Breakdown Chart</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={heatmap} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                            <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }} />
                            <Bar dataKey="submissions" name="Submissions" stackId="a" fill="#3b82f6" radius={[0,0,0,0]} />
                            <Bar dataKey="attendances" name="Attendance" stackId="a" fill="#10b981" />
                            <Bar dataKey="materials" name="Materials" stackId="a" fill="#f59e0b" />
                            <Bar dataKey="assignments" name="Assignments" stackId="a" fill="#f43f5e" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
