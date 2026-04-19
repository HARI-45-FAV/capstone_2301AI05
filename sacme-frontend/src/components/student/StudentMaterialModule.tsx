"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect, useMemo } from "react";
import { Loader2, FileText, Search, Link as LinkIcon, Download, Calendar } from "lucide-react";

export default function StudentMaterialModule({ courseId }: { courseId: string }) {
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const token = getAuthToken();
                const res = await fetch(`http://localhost:5000/api/materials/course/${courseId}?take=200`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMaterials(data.materials || []);
                }
            } catch (err) {
                console.error("Failed to load materials", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMaterials();
    }, [courseId]);

    // Filter and Group Materials
    const groupedMaterials = useMemo(() => {
        const filtered = materials.filter(m => {
            const term = searchQuery.toLowerCase();
            return (
                m.title.toLowerCase().includes(term) ||
                (m.description && m.description.toLowerCase().includes(term)) ||
                m.weekNumber.toLowerCase().includes(term)
            );
        });

        const groups: Record<string, any[]> = {};
        for (const m of filtered) {
            if (!groups[m.weekNumber]) groups[m.weekNumber] = [];
            groups[m.weekNumber].push(m);
        }

        const sortedKeys = Object.keys(groups).sort((a,b) => a.localeCompare(b));
        return sortedKeys.map(k => ({ week: k, items: groups[k] }));
    }, [materials, searchQuery]);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text"
                    placeholder="Search materials by title, description or week..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
            </div>

            {groupedMaterials.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">No Materials Found</p>
                    <p className="text-xs mt-1">Check back later for lecture updates.</p>
                </div>
            ) : (
                groupedMaterials.map((group) => (
                    <div key={group.week} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <div className="bg-slate-100 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">{group.week}</h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {group.items.map((m) => (
                                <div key={m.id} className="p-4 flex flex-col md:flex-row items-start justify-between gap-4 bg-white dark:bg-slate-950 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`p-3 rounded-xl ${m.materialType === 'FILE' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                            {m.materialType === 'FILE' ? <FileText className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{m.title}</h4>
                                            {m.description && <p className="text-sm text-slate-500 mt-1">{m.description}</p>}
                                            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> Uploaded: {new Date(m.createdAt).toLocaleDateString()}</span>
                                                <span className="font-medium text-slate-700 dark:text-slate-300">By: {m.uploaderName}</span>
                                                {m.materialType === 'FILE' && m.fileName && (
                                                    <span className="text-blue-600 truncate max-w-[200px]">{m.fileName}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex shrink-0">
                                        {m.materialType === 'FILE' ? (
                                            <a 
                                                href={`http://localhost:5000${m.fileUrl}`} 
                                                download={m.fileName}
                                                target="_blank" rel="noopener noreferrer"
                                                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                            >
                                                <Download className="w-4 h-4" /> Download
                                            </a>
                                        ) : (
                                            <a 
                                                href={m.linkUrl} 
                                                target="_blank" rel="noopener noreferrer"
                                                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                            >
                                                <LinkIcon className="w-4 h-4" /> Open Link
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
