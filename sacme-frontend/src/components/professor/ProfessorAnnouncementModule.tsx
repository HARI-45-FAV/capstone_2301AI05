"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Megaphone, CheckCircle2, Pin, Mail, AlertTriangle, BookOpen, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const ANNOUNCEMENT_TYPES = [
    { value: 'GENERAL', label: '📢 General', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { value: 'IMPORTANT', label: '🚨 Important', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { value: 'EXAM', label: '⚠ Exam', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { value: 'ASSIGNMENT', label: '📝 Assignment', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { value: 'MATERIAL', label: '📘 Material', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
];

export default function ProfessorAnnouncementModule({ courseId }: { courseId: string }) {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form Data
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState("GENERAL");
    const [sendEmail, setSendEmail] = useState(false);
    const [isPinned, setIsPinned] = useState(false);

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
            }
        } catch (err) {
            console.error("Failed to load announcements", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTitle("");
        setMessage("");
        setType("GENERAL");
        setSendEmail(false);
        setIsPinned(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return alert("Title and Message are required!");
        setSubmitting(true);
        
        try {
            const token = getAuthToken();
            const res = await fetch(`http://localhost:5000/api/announcements/create`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    courseId,
                    title,
                    message,
                    type,
                    sendEmail,
                    isPinned
                })
            });

            if (res.ok) {
                handleCloseModal();
                fetchAnnouncements();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to post announcement.");
            }
        } catch (err) {
            console.error("Submit Error:", err);
            alert("Error posting announcement.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this announcement?")) return;
        try {
            const token = getAuthToken();
            const res = await fetch(`http://localhost:5000/api/announcements/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchAnnouncements();
            } else {
                alert("Failed to delete.");
            }
        } catch (error) {
            console.error(error);
        }
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
                        <p className="text-xs text-slate-500">Communicate directly with your enrolled students.</p>
                    </div>
                </div>
                <Button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold shadow-md shadow-blue-500/20"
                >
                    <Plus className="w-4 h-4" /> Post Notice
                </Button>
            </div>

            {announcements.length === 0 ? (
                <div className="py-16 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 fade-in zoom-in-95 animate-in">
                    <Megaphone className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Announcements Yet</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Click "Post Notice" to broadcast messages, exam alerts, or assignment updates to your class.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((a) => {
                        const style = getTypeDesign(a.type);
                        return (
                            <div key={a.id} className={`relative p-5 bg-white dark:bg-slate-900 border ${a.isPinned ? 'border-amber-400 dark:border-amber-500/50 shadow-md' : 'border-slate-200 dark:border-slate-800'} rounded-xl transition-all`}>
                                {a.isPinned && (
                                    <div className="absolute -top-3 -left-3 w-8 h-8 flex items-center justify-center bg-amber-400 text-white rounded-full shadow-lg z-10">
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
                                                <Clock className="w-3.5 h-3.5" /> {new Date(a.createdAt).toLocaleString()}
                                            </span>
                                            {a.sendEmail && (
                                                <span className="text-[10px] uppercase font-bold text-slate-500 border border-slate-200 bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> Emailed
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{a.title}</h3>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">{a.message}</p>
                                    </div>
                                    <div className="flex mt-2 md:mt-0">
                                        <button onClick={() => handleDelete(a.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <Card className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-blue-500" /> New Announcement
                            </h2>
                        </div>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Title <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" required
                                        value={title} onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g., Midterm Exam Schedule Update"
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Announcement Type</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {ANNOUNCEMENT_TYPES.map(t => (
                                            <button 
                                                key={t.value} type="button"
                                                onClick={() => setType(t.value)}
                                                className={`py-1.5 px-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${type === t.value ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
                                            >
                                                {type === t.value && <CheckCircle2 className="w-3.5 h-3.5" />} {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Message <span className="text-red-500">*</span></label>
                                    <textarea 
                                        required
                                        value={message} onChange={e => setMessage(e.target.value)}
                                        placeholder="Write your detailed announcement here..."
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <label className="flex items-center gap-3 p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl cursor-hover">
                                        <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Pin className="w-4 h-4 text-amber-500" /> Pin to Dashboard</p>
                                            <p className="text-xs text-slate-500">Keep this announcement at the very top of the student feed.</p>
                                        </div>
                                    </label>
                                    
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-hover">
                                        <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500" /> Send Email Notification</p>
                                            <p className="text-xs text-slate-500">Dispatch an email copy to all currently enrolled students.</p>
                                        </div>
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button 
                                        type="button" 
                                        onClick={handleCloseModal}
                                        className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <Button 
                                        type="submit" disabled={submitting}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-blue-500/30"
                                    >
                                        {submitting && <Loader2 className="w-4 h-4 animate-spin"/>}
                                        Publish Announcement
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
