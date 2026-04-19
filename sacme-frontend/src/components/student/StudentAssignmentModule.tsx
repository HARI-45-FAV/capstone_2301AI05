"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Calendar, UploadCloud, CheckCircle, Users, Link as LinkIcon, MessageCircle, X, Download, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

function RaiseQueryModal({ assignment, onClose }: { assignment: any, onClose: () => void }) {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`http://localhost:5000/api/assignments/${assignment.id}/query`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, message })
            });

            if (res.ok) {
                alert("Query sent to the professor.");
                onClose();
            } else alert("Failed to send query.");
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 border dark:border-slate-800 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X className="w-5 h-5" />
                </button>
                <h3 className="font-bold text-lg mb-1 dark:text-white">Raise Query</h3>
                <p className="text-xs text-slate-500 mb-4 tracking-wide uppercase font-semibold">{assignment.title}</p>
                
                <form onSubmit={handleSend} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Subject</label>
                        <input required type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none" placeholder="e.g. Request Deadline Extension" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Message</label>
                        <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Sir, laptop issue..." className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none" />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={sending} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Query'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function StudentAssignmentModule({ courseId }: { courseId: string }) {
    const router = useRouter();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI states
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [queryModalFor, setQueryModalFor] = useState<any | null>(null);

    // Group Submission States
    const [courseStudents, setCourseStudents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState<{ [key: string]: string }>({});
    const [selectedMembers, setSelectedMembers] = useState<{ [key: string]: any[] }>({});

    useEffect(() => {
        fetchAssignments();
        fetchCourseStudents();
    }, [courseId]);

    const fetchCourseStudents = async () => {
        try {
            const token = getAuthToken();
            const res = await fetch(`http://localhost:5000/api/courses/${courseId}/students?take=200`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCourseStudents(data.students || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

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

    const handleUpload = async (assignment: any) => {
        if (selectedFiles.length === 0) return;
        setUploadingId(assignment.id);
        
        try {
            const token = getAuthToken();
            const formData = new FormData();
            selectedFiles.forEach(f => formData.append('documents', f));

            if (assignment.submissionMode === 'GROUP') {
                const members = selectedMembers[assignment.id]?.map((m: any) => m.rollNo) || [];
                formData.append('teamMembers', JSON.stringify(members));
            }

            const res = await fetch(`http://localhost:5000/api/assignments/${assignment.id}/submit`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                setSelectedFiles([]);
                setSelectedMembers(prev => ({ ...prev, [assignment.id]: [] }));
                await fetchAssignments(); // Refresh status natively
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || "Submission failed");
            }
        } catch (error) {
            console.error("Upload Error:", error);
            alert("An error occurred during submission.");
        } finally {
            setUploadingId(null);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    const parsedAssignments = assignments.map(a => {
        const msDiff = new Date(a.dueDate).getTime() - Date.now();
        const daysLeft = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
        let countdown = '';
        if (daysLeft > 1) countdown = `${daysLeft} days left`;
        else if (daysLeft === 1) countdown = `Tomorrow`;
        else if (daysLeft === 0) countdown = `Due Today!`;
        else countdown = `Overdue by ${Math.abs(daysLeft)} days`;

        return { ...a, daysLeft, countdown, msDiff };
    });

    const sortedAssignments = [...parsedAssignments].sort((a, b) => {
        if (a.studentStatus === 'PENDING' && b.studentStatus !== 'PENDING') return -1;
        if (a.studentStatus !== 'PENDING' && b.studentStatus === 'PENDING') return 1;
        return a.msDiff - b.msDiff;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gradient-to-br from-[#5b7cff] to-[#7b5cff] px-[20px] py-[16px] rounded-[14px] shadow-[0_6px_20px_rgba(91,124,255,0.25)] border-none text-white">
                <div>
                    <h3 className="font-semibold text-white text-lg tracking-wide">Assignment Panel</h3>
                    <p className="text-sm text-white/80 mt-0.5">View instructions, download materials, and submit work.</p>
                </div>
            </div>

            <div className="flex flex-col gap-[20px]">
                {assignments.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <CheckCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="font-medium text-slate-600 dark:text-slate-400">No Assignments Due</p>
                    </div>
                ) : (
                    sortedAssignments.map((assignment) => (
                        <Card key={assignment.id} className="bg-white dark:bg-slate-950 rounded-[16px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] border-none transition-all duration-[250ms] ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
                            <CardContent className="p-0 flex flex-col lg:flex-row">
                                <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">{assignment.title}</h4>
                                        <div className="flex gap-2">
                                            <button onClick={() => setQueryModalFor(assignment)} title="Raise Query" className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md hover:text-blue-600">
                                                <MessageCircle className="w-4 h-4" />
                                            </button>
                                            {assignment.studentStatus === 'PENDING' && (
                                                <span className={`text-[11px] font-bold px-3 py-1 rounded-full shadow-sm ${assignment.daysLeft < 3 ? 'bg-rose-500 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                                                    {assignment.countdown}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 mb-6 text-slate-700 dark:text-slate-300">
                                        <span className="flex items-center gap-1 bg-[#f1f5f9] dark:bg-slate-800 px-[12px] py-[6px] rounded-full text-[13px] font-medium">
                                            <Calendar className="w-3.5 h-3.5 text-rose-500" />
                                            Due: {new Date(assignment.dueDate).toLocaleString()}
                                        </span>
                                        {assignment.maxMarks && (
                                            <span className="flex items-center gap-1 bg-[#f1f5f9] dark:bg-slate-800 px-[12px] py-[6px] rounded-full text-[13px] font-medium">
                                                Points / Weight: {assignment.maxMarks} ({assignment.weightage}%)
                                            </span>
                                        )}
                                        <span className={`flex items-center gap-1 bg-[#f1f5f9] dark:bg-slate-800 px-[12px] py-[6px] rounded-full text-[13px] font-medium border-l-2 ${assignment.submissionMode === 'GROUP' ? 'border-amber-500' : 'border-blue-500'}`}>
                                            {assignment.submissionMode === 'GROUP' ? <Users className="w-3.5 h-3.5 text-amber-500" /> : <FileText className="w-3.5 h-3.5 text-blue-500" />}
                                            {assignment.submissionMode} Mode
                                        </span>
                                    </div>

                                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: assignment.description }}></div>
                                    
                                    {assignment.files && assignment.files.length > 0 && (
                                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Supporting Materials</h5>
                                            <div className="flex gap-2 flex-wrap">
                                                {assignment.files.map((f: any) => (
                                                    <a key={f.id} href={f.fileUrl.startsWith('http') ? f.fileUrl : `http://localhost:5000${f.fileUrl}`} download={f.fileType !== 'LINK'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#eef2ff] hover:bg-[#dbeafe] text-[#5b7cff] dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 rounded-[10px] px-[14px] py-[8px] font-semibold transition-colors duration-200">
                                                        {f.fileType === 'LINK' ? <LinkIcon className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                                                        {f.fileName}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="w-full lg:w-1/3 p-[16px] bg-[#f9fafc] dark:bg-slate-900/80 rounded-[12px] border-l-[3px] border-l-[#5b7cff] m-2 md:m-4 flex flex-col justify-between">
                                    <div>
                                        <h5 className="font-bold text-slate-800 dark:text-white mb-2">Submission Status</h5>
                                        <div className="mb-4">
                                            <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md border ${
                                                assignment.studentStatus === 'SUBMITTED' ? 'bg-emerald-100/50 border-emerald-200 text-emerald-700 dark:text-emerald-400' :
                                                assignment.studentStatus === 'GRADED' ? 'bg-indigo-100/50 border-indigo-200 text-indigo-700 dark:text-indigo-400' :
                                                assignment.studentStatus === 'LATE' ? 'bg-rose-100/50 border-rose-200 text-rose-700 dark:text-rose-400' :
                                                'bg-amber-100/50 border-amber-200 text-amber-700 dark:text-amber-400'
                                            }`}>
                                                {assignment.studentStatus}
                                            </span>
                                            {assignment.submissionDate && (
                                                <p className="text-xs text-slate-500 mt-2 font-medium">Submitted on: {new Date(assignment.submissionDate).toLocaleString()}</p>
                                            )}
                                            {assignment.submittedFiles && assignment.submittedFiles.length > 0 && (
                                                <div className="mt-3 flex flex-col gap-2">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Your Submission:</p>
                                                    {assignment.submittedFiles.map((sf: any, idx: number) => (
                                                        <a key={idx} href={sf.fileUrl.startsWith('http') ? sf.fileUrl : `http://localhost:5000${sf.fileUrl}`} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                                            <FileText className="w-3 h-3" /> {sf.fileName}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {(assignment.studentStatus === 'GRADED' && assignment.marks !== null) && (
                                            <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Marks Awarded</p>
                                                <p className="text-2xl font-black text-slate-900 dark:text-white">{assignment.marks} <span className="text-sm font-medium text-slate-400">/ {assignment.maxMarks}</span></p>
                                                {assignment.feedback && (
                                                    <div className="mt-3 text-sm text-slate-700 dark:text-slate-300 italic">"{assignment.feedback}"</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {(assignment.studentStatus === 'PENDING' || assignment.allowResubmission) ? (
                                        <div className="space-y-4">
                                            {assignment.submissionMode === 'GROUP' && (
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Team Members</label>
                                                    <div className="relative mt-1">
                                                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                                        <input 
                                                            type="text" 
                                                            value={searchQuery[assignment.id] || ""} 
                                                            onChange={(e) => setSearchQuery(prev => ({ ...prev, [assignment.id]: e.target.value }))} 
                                                            placeholder="Search roll no or name..." 
                                                            className="block w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500" 
                                                        />
                                                        {searchQuery[assignment.id] && (
                                                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                                                {courseStudents
                                                                    .filter(s => 
                                                                        !selectedMembers[assignment.id]?.find(m => m.id === s.id) &&
                                                                        (s.name.toLowerCase().includes(searchQuery[assignment.id].toLowerCase()) || s.rollNo.toLowerCase().includes(searchQuery[assignment.id].toLowerCase()))
                                                                    )
                                                                    .slice(0, 5)
                                                                    .map(student => (
                                                                        <div 
                                                                            key={student.id} 
                                                                            className="px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center"
                                                                            onClick={() => {
                                                                                setSelectedMembers(prev => ({ ...prev, [assignment.id]: [...(prev[assignment.id] || []), student] }));
                                                                                setSearchQuery(prev => ({ ...prev, [assignment.id]: "" }));
                                                                            }}
                                                                        >
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{student.name}</span>
                                                                            <span className="text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">{student.rollNo}</span>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Selected Chips */}
                                                    {(selectedMembers[assignment.id] || []).length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 pointer-events-auto relative z-0">
                                                            {selectedMembers[assignment.id].map((student: any) => (
                                                                <div key={student.id} className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-700 dark:text-slate-300 shadow-sm relative z-0">
                                                                    {student.name} ({student.rollNo})
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setSelectedMembers(prev => ({ ...prev, [assignment.id]: prev[assignment.id].filter(m => m.id !== student.id) }))}
                                                                        className="ml-1.5 text-slate-400 hover:text-rose-500 p-0.5 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-full transition-colors relative z-0"
                                                                        title="Remove member"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <div>
                                                <input 
                                                    key={selectedFiles.length === 0 ? "empty" : "filled"}
                                                    type="file" 
                                                    multiple
                                                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-400"
                                                    onChange={(e) => {
                                                        if(e.target.files) setSelectedFiles(Array.from(e.target.files));
                                                    }}
                                                />
                                                {selectedFiles.length > 0 && <p className="text-[10px] text-slate-500 mt-2 font-medium bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded inline-block">{selectedFiles.length} file(s) ready for upload.</p>}
                                            </div>

                                            <button
                                                disabled={selectedFiles.length === 0 || uploadingId === assignment.id}
                                                onClick={() => handleUpload(assignment)}
                                                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-50 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md"
                                            >
                                                {uploadingId === assignment.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                                                {assignment.studentStatus !== 'PENDING' ? 'Resubmit Assignment' : 'Turn In'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-xs font-semibold text-slate-400 bg-white dark:bg-slate-800 rounded-lg border border-dashed dark:border-slate-700">
                                            Submissions are closed.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
            
            {queryModalFor && (
                <RaiseQueryModal assignment={queryModalFor} onClose={() => setQueryModalFor(null)} />
            )}
        </div>
    );
}
