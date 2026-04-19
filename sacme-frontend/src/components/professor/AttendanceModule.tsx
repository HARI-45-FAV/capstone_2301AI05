"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect, useRef } from "react";
import { Loader2, Save, CheckCircle, XCircle, BarChart3, Users, UploadCloud } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API = "http://localhost:5000";

export default function AttendanceModule({ courseId }: { courseId: string }) {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

    // Analytics States
    const [viewMode, setViewMode] = useState<"roster" | "analytics">("roster");
    const [range, setRange] = useState<number>(30);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [trendMetrics, setTrendMetrics] = useState({ present: 0, absent: 0 });

    // CSV Import States
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvPreview, setCsvPreview] = useState<{name: string, rollNo: string, status: string}[]>([]);
    const [csvErrors, setCsvErrors] = useState<string[]>([]);
    const [showCsvPanel, setShowCsvPanel] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (viewMode === 'roster') loadData();
        else loadAnalytics();
    }, [courseId, date, viewMode, range]);

    const getToken = () => getAuthToken() || '';

    const loadData = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const token = getToken();
            if (!token) return;

            const [stdRes, attRes] = await Promise.all([
                fetch(`${API}/api/courses/${courseId}/students?take=200`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API}/api/courses/${courseId}/attendance?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const stdData = await stdRes.json();
            const attData = await attRes.json();
            const loadedStudents = stdData.students || [];

            const stateMap: Record<string, string> = {};
            if (attData.records && attData.records.length > 0) {
                attData.records.forEach((r: any) => { stateMap[r.studentId] = r.status; });
            } else {
                loadedStudents.forEach((s: any) => { stateMap[s.id] = "Present"; });
            }

            setStudents(loadedStudents);
            setRecords(stateMap);
        } catch (err) {
            console.error("loadData error:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API}/api/courses/${courseId}/attendance-trends?range=${range}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setTrendData(data.trends || []);
                setTrendMetrics({ present: data.totalPresent, absent: data.totalAbsent });
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const toggleStatus = (studentId: string) => {
        setRecords(prev => ({ ...prev, [studentId]: prev[studentId] === "Present" ? "Absent" : "Present" }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const token = getToken();
            const payload = Object.keys(records).map(id => ({ studentId: id, status: records[id] }));

            const res = await fetch(`${API}/api/courses/${courseId}/attendance`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, records: payload })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Attendance saved successfully!' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                const err = await res.json();
                setMessage({ type: 'error', text: err.error || 'Failed to save attendance.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally { setSaving(false); }
    };

    const handleExport = async (exportRange: string) => {
        setExporting(true);
        try {
            const token = getToken();
            const res = await fetch(`${API}/api/courses/${courseId}/attendance/export?range=${exportRange}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Attendance_${exportRange}_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                setMessage({ type: 'error', text: 'Failed to download report' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Error exporting CSV' });
        } finally {
            setTimeout(() => setMessage(null), 3000);
            setExporting(false);
        }
    };

    // ── CSV Import Logic ──────────────────────────────────────────────────────
    const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvFile(file);
        setCsvPreview([]);
        setCsvErrors([]);

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) { setCsvErrors(["File is empty or missing headers."]); return; }

            const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
            const nameIdx = headers.findIndex(h => h.includes('name'));
            const rollIdx = headers.findIndex(h => h.includes('roll'));
            const presentIdx = headers.findIndex(h => h.includes('present') || h === '1' || h === '0');

            if (nameIdx === -1 || rollIdx === -1 || presentIdx === -1) {
                setCsvErrors(["Invalid headers. Required: 'name', 'roll no', 'present' (1=present, 0=absent)"]);
                return;
            }

            const preview: typeof csvPreview = [];
            const errors: string[] = [];

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim());
                if (cols.length < 3) { errors.push(`Row ${i}: insufficient columns`); continue; }
                const name = cols[nameIdx];
                const rollNo = cols[rollIdx]?.toUpperCase();
                const presentVal = cols[presentIdx];
                if (!name || !rollNo) { errors.push(`Row ${i}: missing name or roll number`); continue; }
                const status = presentVal === '1' ? 'Present' : presentVal === '0' ? 'Absent' : null;
                if (status === null) { errors.push(`Row ${i}: present value must be 1 or 0, got '${presentVal}'`); continue; }
                preview.push({ name, rollNo, status });
            }

            setCsvPreview(preview);
            setCsvErrors(errors);
        };
        reader.readAsText(file);
    };

    const applyCsvToRoster = () => {
        // Match CSV rows to loaded students by rollNo, update records state
        const newRecords = { ...records };
        const errRows: string[] = [];

        for (const row of csvPreview) {
            const student = students.find(s => s.rollNo.toUpperCase() === row.rollNo.toUpperCase());
            if (student) {
                newRecords[student.id] = row.status;
            } else {
                errRows.push(`Roll No ${row.rollNo} (${row.name}) not found in this course's roster.`);
            }
        }

        setRecords(newRecords);
        if (errRows.length > 0) {
            setCsvErrors(errRows);
        } else {
            setCsvErrors([]);
            setShowCsvPanel(false);
            setCsvFile(null);
            setCsvPreview([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setMessage({ type: 'success', text: `CSV applied! ${csvPreview.length} records loaded. Click "Save Standard" to persist.` });
            setTimeout(() => setMessage(null), 5000);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>;

    const presentCount = Object.values(records).filter(v => v === "Present").length;
    const absentCount = Object.values(records).filter(v => v === "Absent").length;
    const trendAttendancePct = trendMetrics.present + trendMetrics.absent > 0
        ? Math.round((trendMetrics.present / (trendMetrics.present + trendMetrics.absent)) * 100) : 100;

    return (
        <div className="space-y-4">
            {/* View Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg w-max mb-6">
                <button
                   className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'roster' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   onClick={() => setViewMode('roster')}
                >
                    <Users className="w-4 h-4" /> Daily Roster
                </button>
                <button
                   className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'analytics' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   onClick={() => setViewMode('analytics')}
                >
                    <BarChart3 className="w-4 h-4" /> Weekly Analytics
                </button>
            </div>

            {viewMode === 'analytics' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center">
                            <div><p className="text-sm font-semibold text-slate-500 uppercase">Total Present</p><h3 className="text-3xl font-bold text-emerald-600 mt-1">{trendMetrics.present}</h3></div>
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-600"><CheckCircle className="w-6 h-6"/></div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center">
                            <div><p className="text-sm font-semibold text-slate-500 uppercase">Total Absent</p><h3 className="text-3xl font-bold text-rose-600 mt-1">{trendMetrics.absent}</h3></div>
                            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/40 rounded-full flex items-center justify-center text-rose-600"><XCircle className="w-6 h-6"/></div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center">
                            <div><p className="text-sm font-semibold text-slate-500 uppercase">Aggregate %</p><h3 className="text-3xl font-bold text-blue-600 mt-1">{trendAttendancePct}%</h3></div>
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600"><BarChart3 className="w-6 h-6"/></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Attendance Trajectory</h3>
                            <select value={range} onChange={(e) => setRange(Number(e.target.value))} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none">
                                <option value={7}>Last 7 Days</option>
                                <option value={30}>Last 30 Days</option>
                                <option value={365}>Full Semester View</option>
                            </select>
                            <button disabled={exporting} onClick={() => handleExport(range === 365 ? 'all' : range.toString())} className="ml-4 flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50">
                                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Export CSV"}
                            </button>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line type="monotone" name="Present" dataKey="present" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" name="Absent" dataKey="absent" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                        <div className="flex items-center gap-4">
                            <div>
                                <label className="text-xs font-semibold text-emerald-600 block mb-1">Attendance Date</label>
                                <input
                                    type="date"
                                    className="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-emerald-600 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 rounded-full text-sm font-medium">{presentCount} Present</span>
                            <span className="text-rose-600 px-3 py-1 bg-rose-100 dark:bg-rose-900/40 rounded-full text-sm font-medium">{absentCount} Absent</span>
                            <button
                                onClick={() => setShowCsvPanel(v => !v)}
                                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                            >
                                <UploadCloud className="w-4 h-4" /> Import CSV
                            </button>
                            <button
                                disabled={saving}
                                onClick={handleSave}
                                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Standard
                            </button>
                        </div>
                    </div>

                    {/* CSV Import Panel */}
                    {showCsvPanel && (
                        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">Import Attendance via CSV</h4>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">Required columns: <code className="bg-indigo-100 dark:bg-indigo-900/40 px-1 rounded">name</code>, <code className="bg-indigo-100 dark:bg-indigo-900/40 px-1 rounded">roll no</code>, <code className="bg-indigo-100 dark:bg-indigo-900/40 px-1 rounded">present</code> (1 = Present, 0 = Absent)</p>
                                </div>
                                <button onClick={() => setShowCsvPanel(false)} className="text-indigo-400 hover:text-indigo-700 text-lg font-bold">×</button>
                            </div>

                            <div className="border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg p-5 text-center">
                                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvChange} className="hidden" id="att-csv-upload" />
                                <label htmlFor="att-csv-upload" className="cursor-pointer">
                                    <UploadCloud className="w-8 h-8 mx-auto text-indigo-400 mb-2" />
                                    <p className="font-semibold text-indigo-700 dark:text-indigo-300 text-sm">{csvFile ? csvFile.name : "Click to select CSV file"}</p>
                                    <p className="text-xs text-indigo-400 mt-1">Example row: John Doe, 21CS101, 1</p>
                                </label>
                            </div>

                            {csvErrors.length > 0 && (
                                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-3">
                                    <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">⚠ Errors ({csvErrors.length})</p>
                                    <ul className="list-disc pl-4 space-y-0.5 max-h-24 overflow-y-auto">
                                        {csvErrors.map((e, i) => <li key={i} className="text-xs text-rose-600">{e}</li>)}
                                    </ul>
                                </div>
                            )}

                            {csvPreview.length > 0 && (
                                <div className="space-y-3">
                                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/50 overflow-hidden max-h-48 overflow-y-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 font-bold uppercase">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Name</th>
                                                    <th className="px-3 py-2 text-left">Roll No</th>
                                                    <th className="px-3 py-2 text-left">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {csvPreview.map((row, i) => (
                                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                        <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">{row.name}</td>
                                                        <td className="px-3 py-2 font-mono text-slate-500">{row.rollNo}</td>
                                                        <td className="px-3 py-2">
                                                            <span className={`px-2 py-0.5 rounded-full font-bold ${row.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                {row.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button
                                        onClick={applyCsvToRoster}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-all"
                                    >
                                        Apply {csvPreview.length} Records to Roster →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {message && (
                        <div className={`p-3 rounded-lg text-sm font-medium text-center ${message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Attendance Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 border-b border-slate-200 dark:border-slate-700">Roll No</th>
                                    <th className="p-4 border-b border-slate-200 dark:border-slate-700">Student Name</th>
                                    <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-right">Status Toggle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center p-8 text-slate-500 font-medium text-sm">
                                            No students found. Make sure students are imported into this course's semester via the Faculty Advisor portal.
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student) => {
                                        const isPresent = records[student.id] === "Present";
                                        return (
                                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="p-4 font-mono text-sm font-semibold text-slate-600 dark:text-slate-400">{student.rollNo}</td>
                                                <td className="p-4 font-medium text-slate-900 dark:text-slate-200">{student.name}</td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => toggleStatus(student.id)}
                                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                                            isPresent
                                                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                                            : 'bg-rose-100 text-rose-700 border border-rose-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                                                        }`}
                                                    >
                                                        {isPresent ? <><CheckCircle className="w-3 h-3" /> Present</> : <><XCircle className="w-3 h-3" /> Absent</>}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
