"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { Loader2, Plus, FileText, Calendar, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import SubmissionViewer from "./SubmissionViewer";
import AssignmentForm from "./AssignmentForm";
import AssignmentTimelineModal from "./AssignmentTimelineModal";

export default function AssignmentModule({ courseId }: { courseId: string }) {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Create form states
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [maxMarks, setMaxMarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
    
    // Viewer state
    const [viewingAssignment, setViewingAssignment] = useState<any | null>(null);
    const [editingTimelineFor, setEditingTimelineFor] = useState<any | null>(null);
    const [editingAssignment, setEditingAssignment] = useState<any | null>(null);

    useEffect(() => {
        fetchAssignments();
    }, [courseId]);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`http://localhost:5000/api/assignments/course/${courseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAssignments(data.assignments || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`http://localhost:5000/api/assignments/create`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    courseId,
                    title,
                    description,
                    dueDate,
                    maxMarks
                })
            });

            if (res.ok) {
                setTitle("");
                setDescription("");
                setDueDate("");
                setMaxMarks("");
                setIsCreating(false);
                fetchAssignments(); // Reload
            }
        } catch (error) {
            console.error("Create Assignment Error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gradient-to-r from-[#5b7cff] to-[#7b5cff] px-6 py-4 rounded-xl shadow-md border-none text-white">
                <div>
                    <h3 className="font-semibold text-white text-lg tracking-wide">Course Assignments</h3>
                    <p className="text-sm text-white/80 mt-0.5">Manage assignments and track student submissions.</p>
                </div>
                {viewingAssignment ? (
                    <button 
                        onClick={() => setViewingAssignment(null)}
                        className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                        Close Viewer
                    </button>
                ) : (
                    <button 
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                        {isCreating ? 'Cancel' : <><Plus className="w-4 h-4" /> Create New</>}
                    </button>
                )}
            </div>

            {viewingAssignment ? (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <SubmissionViewer assignment={viewingAssignment} courseId={courseId} />
                </div>
            ) : (
                <>
                    {(isCreating || editingAssignment) && (
                        <Card className="glass-panel border-blue-200 dark:border-blue-800 shadow-xl mb-6">
                            <CardContent className="pt-4">
                                <AssignmentForm 
                                    courseId={courseId} 
                                    initialData={editingAssignment}
                                    onSuccess={() => { setIsCreating(false); setEditingAssignment(null); fetchAssignments(); }} 
                                    onCancel={() => { setIsCreating(false); setEditingAssignment(null); }} 
                                />
                            </CardContent>
                        </Card>
                    )}

            <div className="flex flex-col gap-[20px]">
                {assignments.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="font-medium text-slate-600 dark:text-slate-400">No Assignments Yet</p>
                        <p className="text-xs mt-1">Publish an assignment to begin collecting submissions.</p>
                    </div>
                ) : (
                    assignments.map((assignment) => (
                        <Card key={assignment.id} className="bg-white dark:bg-slate-950 rounded-[16px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] border-none transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
                            <CardContent className="p-[20px] relative">
                                <div className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-[#5b7cff] rounded-full font-bold text-sm">
                                    {assignment.submissions?.length || 0}
                                </div>
                                <h4 className="font-bold text-slate-900 dark:text-white pr-14 line-clamp-1">{assignment.title}</h4>
                                <div 
                                    className="text-xs text-slate-500 mt-1 line-clamp-2"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(assignment.description) }} 
                                />
                                
                                <div className="flex items-center flex-wrap gap-3 mt-4 text-slate-700 dark:text-slate-300">
                                    <span className="flex items-center gap-1 bg-[#f1f5f9] dark:bg-slate-800 px-[12px] py-[6px] rounded-full text-[13px] font-medium text-rose-600 uppercase">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Due {new Date(assignment.dueDate).toLocaleDateString()}
                                    </span>
                                    {assignment.maxMarks && (
                                        <span className="flex items-center gap-1 bg-[#f1f5f9] dark:bg-slate-800 px-[12px] py-[6px] rounded-full text-[13px] font-medium text-emerald-600">
                                            {assignment.maxMarks} Points
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1 bg-[#f1f5f9] dark:bg-slate-800 px-[12px] py-[6px] rounded-full text-[13px] font-medium text-purple-600 uppercase">
                                        {assignment.submissionMode || 'INDIVIDUAL'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center w-full mt-4 border-t border-slate-100 dark:border-slate-800/50 pt-4">
                                    <button 
                                        onClick={() => setViewingAssignment(assignment)}
                                        className="py-2 px-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-[#5b7cff] dark:text-blue-300 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" /> View Submissions
                                    </button>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setEditingTimelineFor(assignment)}
                                            className="py-2 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 rounded-lg text-xs font-semibold transition-all flex items-center justify-center"
                                            title="Edit Timeline"
                                        >
                                            <Calendar className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setEditingAssignment(assignment);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-all flex items-center justify-center"
                                            title="Edit Assignment"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
                </>
            )}

            {editingTimelineFor && (
                <AssignmentTimelineModal 
                    assignment={editingTimelineFor}
                    onClose={() => setEditingTimelineFor(null)}
                    onSuccess={() => { setEditingTimelineFor(null); fetchAssignments(); }}
                />
            )}
        </div>
    );
}
