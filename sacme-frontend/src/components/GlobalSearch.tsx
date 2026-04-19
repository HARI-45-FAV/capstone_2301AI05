"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useRef, useEffect } from "react";
import { Search, X, User, FileText, BookOpen, Loader2 } from "lucide-react";

const API = "http://localhost:5000";

interface SearchResult {
    type: "STUDENT" | "MATERIAL" | "ASSIGNMENT";
    id: string;
    title: string;
    subtitle: string;
}

export default function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<{ students: SearchResult[]; materials: SearchResult[]; assignments: SearchResult[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (query.length < 2) { setResults(null); setOpen(false); return; }
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(async () => {
            setLoading(true);
            try {
                const token = getAuthToken();
                const res = await fetch(`${API}/api/search?q=${encodeURIComponent(query)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.results);
                    setOpen(true);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }, 400);
    }, [query]);

    const totalCount = results ? results.students.length + results.materials.length + results.assignments.length : 0;

    const iconFor = (type: SearchResult["type"]) => {
        if (type === "STUDENT") return <User className="w-3.5 h-3.5 text-blue-500" />;
        if (type === "MATERIAL") return <BookOpen className="w-3.5 h-3.5 text-emerald-500" />;
        return <FileText className="w-3.5 h-3.5 text-rose-500" />;
    };

    const badgeFor = (type: SearchResult["type"]) => {
        if (type === "STUDENT") return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
        if (type === "MATERIAL") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
        return "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
    };

    const allResults: SearchResult[] = results ? [...results.students, ...results.assignments, ...results.materials] : [];

    return (
        <div className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search students, materials, assignments..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && results && setOpen(true)}
                    className="w-full h-10 pl-9 pr-9 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                />
                {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-400" />}
                {!loading && query && (
                    <button onClick={() => { setQuery(""); setResults(null); setOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {open && allResults.length > 0 && (
                <div className="absolute top-12 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-500">{totalCount} result{totalCount !== 1 ? "s" : ""} for "<span className="text-indigo-600">{query}</span>"</p>
                    </div>
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {allResults.map(result => (
                            <li key={`${result.type}-${result.id}`} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        {iconFor(result.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{result.title}</p>
                                        <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeFor(result.type)}`}>{result.type}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {totalCount === 0 && (
                        <div className="p-6 text-center text-sm text-slate-500">No results found for "{query}"</div>
                    )}
                </div>
            )}
            {open && allResults.length === 0 && !loading && query.length >= 2 && (
                <div className="absolute top-12 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-500">
                    No results found for "<span className="font-medium">{query}</span>"
                </div>
            )}
        </div>
    );
}
