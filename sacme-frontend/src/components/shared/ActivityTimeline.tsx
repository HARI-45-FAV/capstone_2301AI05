"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect } from "react";
import { Loader2, Calendar, FileText, Folder, Megaphone } from "lucide-react";

const API = "http://localhost:5000";

export default function ActivityTimeline({ courseId }: { courseId: string }) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTimeline = async () => {
            setLoading(true);
            try {
                const token = getAuthToken();
                if (!token) return;
                const headers = { 'Authorization': `Bearer ${token}` };

                const [assignRes, matRes, annRes] = await Promise.all([
                    fetch(`${API}/api/assignments/course/${courseId}`, { headers }),
                    fetch(`${API}/api/course-actions/${courseId}/materials`, { headers }),
                    fetch(`${API}/api/course-actions/${courseId}/announcements`, { headers })
                ]);

                let timelineEvents: any[] = [];

                if (assignRes.ok) {
                    const data = await assignRes.json();
                    const assigns = (data.assignments || []).map((a: any) => ({
                        id: `assign-${a.id}`, type: 'ASSIGNMENT', title: a.title,
                        date: new Date(a.dueDate), icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/50'
                    }));
                    timelineEvents = [...timelineEvents, ...assigns];
                }
                if (matRes.ok) {
                    const data = await matRes.json();
                    const materials = (data.materials || []).map((m: any) => ({
                        id: `mat-${m.id}`, type: 'MATERIAL', title: m.title,
                        date: new Date(m.createdAt || Date.now()), icon: Folder, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/50'
                    }));
                    timelineEvents = [...timelineEvents, ...materials];
                }
                if (annRes.ok) {
                    const data = await annRes.json();
                    const announcements = (data.announcements || []).map((a: any) => ({
                        id: `ann-${a.id}`, type: 'ANNOUNCEMENT', title: a.message,
                        date: new Date(a.createdAt), icon: Megaphone, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/50'
                    }));
                    timelineEvents = [...timelineEvents, ...announcements];
                }

                timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
                setActivities(timelineEvents);
            } catch (err) {
                console.error("Timeline Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTimeline();
    }, [courseId]);

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;

    if (activities.length === 0) {
        return (
            <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No Course Activity Yet</p>
                <p className="text-xs text-slate-400 mt-1">Assignments, materials, and announcements will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Recent Activity</h3>
            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-8 pb-4">
                {activities.map((act) => (
                    <div key={act.id} className="relative pl-8">
                        <div className={`absolute -left-[17px] top-1 p-2 rounded-full ${act.bg} border-4 border-white dark:border-slate-900`}>
                            <act.icon className={`w-4 h-4 ${act.color}`} />
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                {act.type.replace('_', ' ')} • {act.date.toLocaleDateString()}
                            </span>
                            <p className="font-medium text-sm text-slate-800 dark:text-slate-200 mt-1 line-clamp-2">{act.title}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
