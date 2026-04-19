"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect } from "react";
import { Loader2, Megaphone, CheckCircle2, Pin, Mail, AlertTriangle, BookOpen, Clock } from "lucide-react";

const ANNOUNCEMENT_TYPES = [
    { value: 'GENERAL', label: '📢 General', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { value: 'IMPORTANT', label: '🚨 Important', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { value: 'EXAM', label: '⚠ Exam', color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { value: 'ASSIGNMENT', label: '📝 Assignment', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { value: 'MATERIAL', label: '📘 Material', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
];

export default function StudentAnnouncementModule({ courseId }: { courseId: string }) {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, [courseId]);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`http://localhost:5000/api/announcements/course/${courseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data || []);
                
                // Track internally that this view marked them read for badge clearing logic later
                localStorage.setItem(`last_announcement_seen_${courseId}`, new Date().getTime().toString());
            }
        } catch (err) {
            console.error("Failed to load announcements", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRead = async (id: string, currentlyRead: boolean) => {
        if (currentlyRead) return;
        
        try {
            const token = getAuthToken();
            await fetch(`http://localhost:5000/api/announcements/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
        } catch (e) { console.log(e); }
    };

    const getTypeDesign = (t: string) => {
        return ANNOUNCEMENT_TYPES.find(x => x.value === t) || ANNOUNCEMENT_TYPES[0];
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                        <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-black text-slate-800 dark:text-white">Class Announcements</h2>
                        <p className="text-xs text-slate-500">Official notices from your professor.</p>
                    </div>
                </div>
            </div>

            {announcements.length === 0 ? (
                <div className="py-16 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 fade-in zoom-in-95 animate-in">
                    <Megaphone className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Quiet Here</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Your professor hasn't posted any announcements for this course yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((a) => {
                        const style = getTypeDesign(a.type);
                        const unseen = !a.isRead;

                        return (
                            <div 
                                key={a.id} 
                                onMouseEnter={() => handleRead(a.id, a.isRead)}
                                className={`relative p-5 bg-white dark:bg-slate-900 border ${a.isPinned ? 'border-amber-400 dark:border-amber-500/50 shadow-md' : unseen ? 'border-blue-400 shadow-sm' : 'border-slate-200 dark:border-slate-800'} rounded-xl transition-all cursor-hover`}
                            >
                                {a.isPinned && (
                                    <div className="absolute -top-3 -left-3 w-8 h-8 flex items-center justify-center bg-amber-400 text-white rounded-full shadow-lg z-10 transition-transform hover:scale-110">
                                        <Pin className="w-4 h-4 fill-white" />
                                    </div>
                                )}
                                <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full outline outline-1 outline-opacity-50 ${style.bg} ${style.color}`}>
                                                {style.label}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" /> Posted {new Date(a.createdAt).toLocaleString()}
                                            </span>
                                            {unseen && (
                                                <span className="flex h-2 w-2 relative ml-1">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{a.title}</h3>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">{a.message}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
