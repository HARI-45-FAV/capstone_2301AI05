"use client";
import { getAuthToken } from '@/lib/auth';

import { useState } from "react";
import { Loader2, Plus, X, UploadCloud, Link as LinkIcon } from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// @ts-ignore
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function AssignmentForm({ 
    courseId, 
    onSuccess, 
    onCancel,
    initialData 
}: { 
    courseId: string, 
    onSuccess: () => void, 
    onCancel: () => void,
    initialData?: any 
}) {
    // Format date for datetime-local input if exists
    const formatDateForInput = (dateString: string) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [dueDate, setDueDate] = useState(formatDateForInput(initialData?.dueDate));
    const [maxMarks, setMaxMarks] = useState(initialData?.maxMarks?.toString() || "");
    const [assignmentType, setAssignmentType] = useState(initialData?.assignmentType || "Homework");
    const [weightage, setWeightage] = useState(initialData?.weightage?.toString() || "");
    
    // Toggles
    const [allowLateSubmission, setAllowLate] = useState(initialData?.allowLateSubmission || false);
    const [lateDeadline, setLateDeadline] = useState(formatDateForInput(initialData?.lateSubmissionDeadline));
    const [allowResubmission, setAllowResubmit] = useState(initialData?.allowResubmission || false);
    const [autoCloseAfterDeadline, setAutoClose] = useState(initialData?.autoCloseAfterDeadline !== undefined ? initialData.autoCloseAfterDeadline : true);
    const [submissionMode, setSubmissionMode] = useState(initialData?.submissionMode || "INDIVIDUAL");
    const [isPublished, setIsPublished] = useState(initialData?.isPublished || false); // Draft toggle
    
    const [files, setFiles] = useState<File[]>([]);
    const [links, setLinks] = useState<{name: string, url: string}[]>([]);
    const [linkInput, setLinkInput] = useState("");
    
    const [submitting, setSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            // Size check
            for(let f of newFiles) {
                if(f.size > 50 * 1024 * 1024) {
                    alert(`File ${f.name} exceeds 50MB limit.`);
                    return;
                }
            }
            if (files.length + newFiles.length > 5) {
                alert("Maximum 5 files allowed.");
                return;
            }
            setFiles([...files, ...newFiles]);
        }
    };

    const addLink = () => {
        if (linkInput && linkInput.includes("http")) {
            setLinks([...links, { name: new URL(linkInput).hostname, url: linkInput }]);
            setLinkInput("");
        } else {
            alert("Please enter a valid URL.");
        }
    };

    const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index));
    const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index));

    const handleSubmit = async (e: React.FormEvent, publishAction: boolean) => {
        e.preventDefault();
        if(!title || !dueDate) { alert("Title and Due Date required!"); return; }
        
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("courseId", courseId);
            formData.append("title", title);
            formData.append("description", description);
            formData.append("dueDate", dueDate);
            formData.append("assignmentType", assignmentType);
            formData.append("submissionMode", submissionMode);
            formData.append("isPublished", publishAction ? "true" : "false");
            formData.append("allowLateSubmission", allowLateSubmission.toString());
            formData.append("allowResubmission", allowResubmission.toString());
            formData.append("autoCloseAfterDeadline", autoCloseAfterDeadline.toString());
            
            if (maxMarks) formData.append("maxMarks", maxMarks);
            if (weightage) formData.append("weightage", weightage);
            if (allowLateSubmission && lateDeadline) formData.append("lateSubmissionDeadline", lateDeadline);
            if (links.length > 0) formData.append("links", JSON.stringify(links));

            files.forEach(f => formData.append("files", f));

            const token = getAuthToken();
            const url = initialData?.id 
                ? `http://localhost:5000/api/assignments/${initialData.id}` 
                : `http://localhost:5000/api/assignments/create`;
                
            const res = await fetch(url, {
                method: initialData?.id ? 'PUT' : 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                onSuccess();
            } else {
                const data = await res.json();
                alert(data.error || `Failed to ${initialData?.id ? 'update' : 'create'} assignment`);
            }
        } catch (error) {
            console.error(error);
            alert(`Error ${initialData?.id ? 'updating' : 'creating'} assignment`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="space-y-6 text-sm" onSubmit={(e) => e.preventDefault()}>
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-800 dark:text-white text-lg">{initialData ? 'Edit Assignment' : 'Create Assignment'}</h4>
                <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800"><X className="w-5 h-5 text-slate-500" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Assignment Title *</label>
                    <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500" placeholder="e.g. Final Project" />
                </div>
                <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Assignment Type</label>
                    <select value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500">
                        <option>Homework</option>
                        <option>Lab</option>
                        <option>Mini Project</option>
                        <option>Case Study</option>
                        <option>Quiz (File-based)</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Detailed Instructions *</label>
                <div className="bg-white dark:bg-slate-900 text-black dark:text-white pb-10">
                    {/* @ts-ignore */}
                    <ReactQuill theme="snow" value={description} onChange={setDescription} className="h-40 mb-4" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Due Date & Time *</label>
                    <input required type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Max Marks *</label>
                    <input type="number" required value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Weightage (%)</label>
                    <input type="number" value={weightage} onChange={(e) => setWeightage(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                    <h5 className="font-semibold text-slate-800 dark:text-white border-b pb-2 dark:border-slate-700">Submission Settings</h5>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={allowLateSubmission} onChange={(e) => setAllowLate(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-slate-700 dark:text-slate-300">Allow Late Submission</span>
                    </label>
                    {allowLateSubmission && (
                        <div className="mt-2 ml-6">
                            <label className="text-xs text-slate-500">Late Deadline</label>
                            <input type="datetime-local" value={lateDeadline} onChange={(e) => setLateDeadline(e.target.value)} className="mt-1 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1" />
                        </div>
                    )}
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={allowResubmission} onChange={(e) => setAllowResubmit(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-slate-700 dark:text-slate-300">Allow Resubmissions</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={autoCloseAfterDeadline} onChange={(e) => setAutoClose(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-slate-700 dark:text-slate-300">Auto-Close Submissions after Deadline</span>
                    </label>
                </div>

                <div className="flex-1 space-y-4">
                    <h5 className="font-semibold text-slate-800 dark:text-white border-b pb-2 dark:border-slate-700">Submission Mode</h5>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="subMode" checked={submissionMode === "INDIVIDUAL"} onChange={() => setSubmissionMode("INDIVIDUAL")} />
                            <span>Individual</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="subMode" checked={submissionMode === "GROUP"} onChange={() => setSubmissionMode("GROUP")} />
                            <span>Group Submission</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h5 className="font-semibold text-slate-800 dark:text-white border-b pb-2 dark:border-slate-700">Assignment Files (Max 50MB, PDF, CSV, ZIP, DOCX, PNG)</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col justify-center items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Click to upload files</span>
                        <input type="file" multiple name="files" className="hidden" onChange={handleFileChange} accept=".pdf,.csv,.zip,.docx,.png,.jpg" />
                    </label>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-center">
                        <label className="text-slate-600 dark:text-slate-300 font-medium mb-2 flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Add Drive Link</label>
                        <div className="flex gap-2">
                            <input type="url" value={linkInput} onChange={(e) => setLinkInput(e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 outline-none" placeholder="https://..." />
                            <button type="button" onClick={addLink} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1 rounded font-medium text-slate-800 dark:text-slate-200">Add</button>
                        </div>
                    </div>
                </div>
                {/* List Files */}
                <div className="space-y-2">
                    {files.map((f, i) => (
                        <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900 border dark:border-slate-800 p-2 rounded text-xs font-mono">
                            <span>📄 {f.name} ({(f.size/1024/1024).toFixed(2)} MB)</span>
                            <button type="button" onClick={() => removeFile(i)} className="text-rose-500 hover:underline">Remove</button>
                        </div>
                    ))}
                    {links.map((l, i) => (
                        <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900 border dark:border-slate-800 p-2 rounded text-xs">
                            <span>🔗 [{l.name}] {l.url}</span>
                            <button type="button" onClick={() => removeLink(i)} className="text-rose-500 hover:underline">Remove</button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                <button type="button" onClick={onCancel} className="px-5 py-2 rounded-lg font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300">
                    Cancel
                </button>
                <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={submitting} className="px-5 py-2 flex items-center gap-2 rounded-lg font-medium border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save as Draft'}
                </button>
                <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={submitting} className="px-5 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg shadow-blue-500/20">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Assignment'}
                </button>
            </div>
        </form>
    );
}
