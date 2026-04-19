"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect, useMemo, useRef } from "react";
import { Loader2, Plus, FileText, Search, Link as LinkIcon, Trash2, Edit2, Upload, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export default function MaterialModule({ courseId }: { courseId: string }) {
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal States
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form Data
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [weekNumber, setWeekNumber] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchMaterials();
    }, [courseId]);

    const fetchMaterials = async () => {
        setLoading(true);
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

    const handleOpenEdit = (m: any) => {
        setEditingMaterial(m);
        setTitle(m.title);
        setDescription(m.description || "");
        setWeekNumber(m.weekNumber);
        if (m.materialType === 'LINK') {
            setLinkUrl(m.linkUrl || "");
            setIsLinkModalOpen(true);
        } else {
            setFile(null); // Wait for new file if they want to replace it
            setIsUploadModalOpen(true);
        }
    };

    const handleCloseModals = () => {
        setIsUploadModalOpen(false);
        setIsLinkModalOpen(false);
        setEditingMaterial(null);
        setTitle("");
        setDescription("");
        setWeekNumber("");
        setLinkUrl("");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent, type: 'FILE' | 'LINK') => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = getAuthToken();
            const formData = new FormData();
            formData.append('courseId', courseId);
            formData.append('title', title);
            formData.append('description', description);
            formData.append('weekNumber', weekNumber);
            formData.append('materialType', type);

            if (type === 'LINK') {
                formData.append('linkUrl', linkUrl);
            } else if (file) {
                formData.append('file', file);
            }

            const url = editingMaterial 
                ? `http://localhost:5000/api/materials/${editingMaterial.id}` 
                : `http://localhost:5000/api/materials/upload`;
            
            const method = editingMaterial ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                handleCloseModals();
                fetchMaterials();
            } else {
                const data = await res.json();
                alert(data.error || "Upload failed");
            }
        } catch (err) {
            console.error("Submit Error:", err);
            alert("Error saving material.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this material?")) return;
        try {
            const token = getAuthToken();
            const res = await fetch(`http://localhost:5000/api/materials/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchMaterials();
            } else {
                alert("Failed to delete.");
            }
        } catch (error) {
            console.error(error);
        }
    };

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

        // Sort keys (basic alphabet sort)
        const sortedKeys = Object.keys(groups).sort((a,b) => a.localeCompare(b));
        return sortedKeys.map(k => ({ week: k, items: groups[k] }));
    }, [materials, searchQuery]);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative flex-1 w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search materials by title, description or week..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button 
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                        <Plus className="w-4 h-4" /> Upload Material
                    </button>
                    <button 
                        onClick={() => setIsLinkModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                        <LinkIcon className="w-4 h-4" /> Add Link
                    </button>
                </div>
            </div>

            {groupedMaterials.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">No Materials Found</p>
                    <p className="text-xs mt-1">Upload files or append URLs to begin.</p>
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
                                                {m.materialType === 'LINK' && m.linkUrl && (
                                                    <a href={m.linkUrl} target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:underline max-w-[200px] truncate">{m.linkUrl}</a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleOpenEdit(m)}
                                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                                            title="Edit Material"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(m.id)}
                                            className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                                            title="Delete Material"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}

            {/* Modals */}
            {(isUploadModalOpen || isLinkModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-none">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                {editingMaterial ? 'Edit Material' : (isUploadModalOpen ? 'Upload Material' : 'Add External Link')}
                            </h2>
                            <form onSubmit={(e) => handleSubmit(e, isUploadModalOpen ? 'FILE' : 'LINK')} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Week / Topic *</label>
                                    <input 
                                        type="text" required
                                        value={weekNumber} onChange={e => setWeekNumber(e.target.value)}
                                        placeholder="Week 1 or Transport Layer"
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                                    <input 
                                        type="text" required
                                        value={title} onChange={e => setTitle(e.target.value)}
                                        placeholder="Assignment Guidelines"
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                    <textarea 
                                        value={description} onChange={e => setDescription(e.target.value)}
                                        placeholder="Optional context for this material..."
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm resize-none h-20"
                                    ></textarea>
                                </div>
                                
                                {isLinkModalOpen ? (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Target URL *</label>
                                        <input 
                                            type="url" required
                                            value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                                            placeholder="https://youtube.com/..."
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Attached File {!editingMaterial && '*'}</label>
                                        <div className="flex items-center gap-3 w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-dashed rounded-lg">
                                            <input 
                                                type="file" ref={fileInputRef}
                                                required={!editingMaterial}
                                                onChange={e => setFile(e.target.files?.[0] || null)}
                                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button 
                                        type="button" 
                                        onClick={handleCloseModals}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" disabled={submitting}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm flex items-center gap-2"
                                    >
                                        {submitting && <Loader2 className="w-4 h-4 animate-spin"/>}
                                        {editingMaterial ? 'Save Changes' : 'Publish Material'}
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
