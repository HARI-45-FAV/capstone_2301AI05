"use client";
import { getAuthToken } from '@/lib/auth';

import { useState } from "react";
import { Loader2, X } from "lucide-react";

export default function AssignmentTimelineModal({ assignment, onClose, onSuccess }: { assignment: any, onClose: () => void, onSuccess: () => void }) {
    const [newDueDate, setNewDueDate] = useState("");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`http://localhost:5000/api/assignments/${assignment.id}/timeline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ newDueDate, reason })
            });

            if (res.ok) {
                onSuccess();
            } else {
                alert("Failed to update timeline.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 p-6 border dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg dark:text-white">Edit Timeline</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><X className="w-5 h-5" /></button>
                </div>
                <p className="text-sm text-slate-500 mb-6">Modifying the deadline for <strong>{assignment.title}</strong></p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Current Due Date</label>
                        <p className="text-sm font-medium dark:text-slate-300">{new Date(assignment.dueDate).toLocaleString()}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">New Due Date *</label>
                        <input required type="datetime-local" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Reason for Extension *</label>
                        <textarea required value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g., Extended due to lab maintenance" className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none" />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                        <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Change'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
