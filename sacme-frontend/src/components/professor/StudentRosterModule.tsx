"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect } from "react";
import { Loader2, Mail, Users, AlertTriangle, CheckCircle, Eye } from "lucide-react";

export default function StudentRosterModule({ courseId }: { courseId: string }) {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});
    const [bulkSending, setBulkSending] = useState(false);

    // Preview Modal state
    const [previewingStudent, setPreviewingStudent] = useState<any | null>(null);

    useEffect(() => {
        fetchRoster();
    }, [courseId]);

    const fetchRoster = async () => {
        try {
            const token = getAuthToken();
            const res = await fetch(`http://localhost:5000/api/students/course/${courseId}/roster`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const determineAlertType = (student: any) => {
        if (student.attendancePercentage < 75 && student.pendingAssignments > 0) return 'both';
        if (student.attendancePercentage < 75) return 'attendance';
        if (student.pendingAssignments > 0) return 'pending';
        return null;
    };

    const handleSendAlert = async (student: any) => {
        if (sendingMap[student.id]) return; // prevent duplicate clicks natively
        const alertType = determineAlertType(student);
        if (!alertType) return;

        setSendingMap(prev => ({ ...prev, [student.id]: true }));
        try {
            const token = getAuthToken();
            const res = await fetch(`http://localhost:5000/api/students/send-alert`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    studentId: student.id,
                    courseId,
                    alertType
                })
            });

            if (res.ok) {
                alert(`Alert sent to ${student.name} successfully.`);
            } else {
                alert("Failed to fire alert.");
            }
        } catch (error) {
            console.error(error);
            alert("Error sending dispatch.");
        } finally {
            setSendingMap(prev => ({ ...prev, [student.id]: false }));
        }
    };

    const handleBulkSend = async () => {
        if (bulkSending) return;
        if (!confirm("Are you sure you want to broadcast alerts to all underperforming students? This process may take a few moments safely pausing between sends to prevent server blockades.")) return;
        
        setBulkSending(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`http://localhost:5000/api/students/send-bulk-alert`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ courseId })
            });
            
            if (res.ok) {
                const data = await res.json();
                alert(data.message || "Bulk alerts dispatched!");
            }
        } catch (e) {
            console.error(e);
            alert("Delivery pipe interrupted.");
        } finally {
            setBulkSending(false);
        }
    };

    const getRowColor = (attendance: number) => {
        if (attendance < 50) return "bg-red-50/50 dark:bg-red-900/10 border-l-4 border-l-red-500";
        if (attendance < 75) return "bg-amber-50/50 dark:bg-amber-900/10 border-l-4 border-l-amber-500";
        return "bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500";
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    const underperformingCount = students.filter(s => s.attendancePercentage < 75 || s.pendingAssignments > 0).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Enrolled Students Roster</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                            {students.length} Total Students 
                            {underperformingCount > 0 && <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-semibold"><AlertTriangle className="w-3 h-3"/> {underperformingCount} At Risk</span>}
                        </p>
                    </div>
                </div>

                {underperformingCount > 0 && (
                    <button 
                        onClick={handleBulkSend}
                        disabled={bulkSending}
                        className="w-full md:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                        {bulkSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                        Send Bulk Alerts ({underperformingCount})
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4">Roll No</th>
                                <th className="px-6 py-4">Student Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4 text-center">Attendance</th>
                                <th className="px-6 py-4 text-center">Pending Work</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        No students enrolled in this course yet.
                                    </td>
                                </tr>
                            ) : (
                                students.map((s) => (
                                    <tr key={s.id} className={`${getRowColor(s.attendancePercentage)} hover:opacity-90 transition-opacity`}>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white uppercase">{s.rollNo}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{s.name}</td>
                                        <td className="px-6 py-4 text-slate-500">{s.email || '-'}</td>
                                        
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full font-bold text-xs ${
                                                s.attendancePercentage < 75 ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                            }`}>
                                                {s.attendancePercentage}%
                                            </span>
                                        </td>
                                        
                                        <td className="px-6 py-4 text-center">
                                            {s.pendingAssignments > 0 ? (
                                                <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full font-bold text-xs ring-2 ring-white">
                                                    {s.pendingAssignments}
                                                </span>
                                            ) : (
                                                <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                                            )}
                                        </td>
                                        
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                {(s.attendancePercentage < 75 || s.pendingAssignments > 0) && (
                                                    <>
                                                        <button 
                                                            onClick={() => setPreviewingStudent(s)}
                                                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 rounded-lg transition-colors"
                                                            title="Preview Email"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        
                                                        <button 
                                                            onClick={() => handleSendAlert(s)}
                                                            disabled={sendingMap[s.id]}
                                                            className={`px-3 py-1.5 flex items-center gap-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                                                s.attendancePercentage < 50 
                                                                    ? 'bg-rose-600 hover:bg-rose-700 text-white disabled:bg-rose-400' 
                                                                    : 'bg-amber-500 hover:bg-amber-600 text-white disabled:bg-amber-300'
                                                            }`}
                                                        >
                                                            {sendingMap[s.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Mail className="w-3.5 h-3.5" />}
                                                            {sendingMap[s.id] ? 'Dispatching...' : 'Send Mail'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {previewingStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Eye className="w-4 h-4 text-blue-500"/> HTML Email Preview</h3>
                            <button onClick={() => setPreviewingStudent(null)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-sm border border-slate-100 dark:border-slate-800 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/20">
                                <p className="mb-2"><span className="text-slate-400 font-medium">To:</span> <strong className="text-slate-700 dark:text-slate-300">{previewingStudent.email}</strong></p>
                                <p><span className="text-slate-400 font-medium">Subject:</span> <strong className="text-slate-700 dark:text-slate-300">Academic Alert Notification</strong></p>
                            </div>
                            
                            <div className="prose prose-sm dark:prose-invert">
                                <p>Dear {previewingStudent.name},</p>
                                <p>This is an automated notification from the course management system.</p>
                                {previewingStudent.attendancePercentage < 75 && (
                                    <p className="text-rose-600 bg-rose-50 p-2 rounded-lg font-medium inline-block my-2">➤ Your attendance is severely low at {previewingStudent.attendancePercentage}%</p>
                                )}
                                {previewingStudent.pendingAssignments > 0 && (
                                    <p className="text-amber-600 bg-amber-50 p-2 rounded-lg font-medium inline-block my-2">➤ You currently have {previewingStudent.pendingAssignments} pending assignment(s)</p>
                                )}
                                <p>Please address these issues immediately to maintain your academic evaluation standing. Missing course bounds will result in academic penalties permanently mapped onto your profile trajectory.</p>
                                <p className="text-slate-400 mt-4">Regards,<br/>Instructor<br/>Course Management System</p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={() => setPreviewingStudent(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium">Close</button>
                                <button onClick={() => { handleSendAlert(previewingStudent); setPreviewingStudent(null); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                                    <Mail className="w-4 h-4"/> Confirm & Send Alert
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
