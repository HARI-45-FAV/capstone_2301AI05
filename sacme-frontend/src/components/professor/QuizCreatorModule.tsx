"use client";
import { getAuthToken } from '@/lib/auth';
import { useState, useEffect } from "react";
import { Loader2, Plus, GripVertical, CheckCircle2, Circle, GraduationCap, BarChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import QuizAnalyticsModule from "@/components/professor/QuizAnalyticsModule";
import { io } from "socket.io-client";

function LiveQuizMonitor({ quizId }: { quizId: string }) {
    const [students, setStudents] = useState<Record<string, { name: string, status: 'Active' | 'Violation Warning' | 'Submitted', violations: number }>>({});

    useEffect(() => {
        const sock = io('http://localhost:5000');
        sock.on('connect', () => {
             sock.emit('join_quiz_room', { quizId });
        });

        sock.on('student_joined', (data) => {
             setStudents(prev => ({ ...prev, [data.studentId]: { name: data.name, status: 'Active', violations: 0, progress: 0 } }));
        });

        sock.on('student_status', (data) => {
             setStudents(prev => {
                 const st = prev[data.studentId] || { name: 'Unknown Student', status: 'Active', violations: 0, progress: 0 };
                 if (st.status === 'Submitted') return prev;
                 return { ...prev, [data.studentId]: { ...st, status: data.violations > 0 ? 'Violation Warning' : data.status, violations: data.violations, progress: data.progress } };
             });
        });

        sock.on('violation_detected', (data) => {
             setStudents(prev => {
                 const st = prev[data.studentId] || { name: 'Unknown Student', status: 'Active', violations: 0, progress: 0 };
                 return { ...prev, [data.studentId]: { ...st, violations: data.violationCount || 1, status: 'Violation Warning' } };
             });
        });

        sock.on('student_submitted', (data) => {
             setStudents(prev => {
                 const st = prev[data.studentId] || { name: 'Unknown Student', status: 'Active', violations: 0, progress: 0 };
                 return { ...prev, [data.studentId]: { ...st, status: 'Submitted' } };
             });
        });

        return () => { sock.disconnect(); };
    }, [quizId]);

    const activeCount = Object.values(students).filter(s => s.status !== 'Submitted').length;
    const submittedCount = Object.values(students).filter(s => s.status === 'Submitted').length;
    const warningCount = Object.values(students).filter(s => s.status === 'Violation Warning').length;

    return (
        <div className="mt-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Live Monitor</span>
                <div className="flex gap-3 text-xs font-semibold">
                    <span className="text-emerald-600">🟢 {activeCount} Active</span>
                    <span className="text-amber-600">🟡 {warningCount} Warnings</span>
                    <span className="text-blue-600">🔵 {submittedCount} Submitted</span>
                </div>
            </div>
            {Object.keys(students).length === 0 ? (
                <p className="text-xs text-slate-400 italic">Waiting for students to join room...</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.values(students).map((s: any, i) => (
                        <div key={i} className={`p-2 rounded text-xs font-semibold border ${s.status === 'Submitted' ? 'bg-slate-100 text-slate-500 border-slate-200' : s.violations > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {s.name} <span className="text-slate-400 font-normal">({s.progress || 0}%)</span>
                            <span className="float-right">{s.status === 'Submitted' ? '✅' : s.violations > 0 ? `⚠️ (${s.violations})` : '🟢'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function QuizCreatorModule({ courseId }: { courseId: string }) {
    const [activeTab, setActiveTab] = useState<'bank' | 'creator'>('bank');
    const [viewingAnalyticsId, setViewingAnalyticsId] = useState<string | null>(null);
    const [bankQuestions, setBankQuestions] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Question Form
    const [qText, setQText] = useState("");
    const [qType, setQType] = useState('MCQ');
    const [qMarks, setQMarks] = useState("1");
    const [qNegativeMarks, setQNegativeMarks] = useState("0");
    const [qOptions, setQOptions] = useState([{ optionText: "", isCorrect: true }, { optionText: "", isCorrect: false }]);

    // Quiz Form
    const [quizTitle, setQuizTitle] = useState("");
    const [quizDuration, setQuizDuration] = useState("30");
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, [courseId]);

    const fetchInitialData = async () => {
        setLoading(true);
        const token = getAuthToken();
        try {
            const [qRes, qzRes] = await Promise.all([
                fetch(`http://localhost:5000/api/quiz/question-bank/${courseId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`http://localhost:5000/api/quiz/course/${courseId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            
            if (qRes.ok) {
                const qData = await qRes.json();
                setBankQuestions(qData.questions || []);
            }
            if (qzRes.ok) {
                const qzData = await qzRes.json();
                setQuizzes(qzData.quizzes || []);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleCreateQuestion = async () => {
        if (!qText) return alert("Question text required");
        if (qOptions.filter(o => o.optionText).length < 2) return alert("Need at least 2 options");
        
        const validOptions = qOptions.filter(o => o.optionText !== "");
        if (!validOptions.some(o => o.isCorrect)) return alert("Select at least one correct option");

        const token = getAuthToken();
        try {
            const res = await fetch(`http://localhost:5000/api/quiz/question-bank`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    courseId,
                    questionText: qText,
                    type: qType,
                    marks: Number(qMarks),
                    negativeMarks: Number(qNegativeMarks),
                    options: validOptions
                })
            });
            if (res.ok) {
                setQText("");
                setQOptions([{ optionText: "", isCorrect: true }, { optionText: "", isCorrect: false }]);
                fetchInitialData();
            }
        } catch(e) { console.error(e); }
    };

    const handleCreateQuiz = async () => {
        if (!quizTitle || selectedQuestionIds.length === 0) return alert("Title and Questions required");
        
        const token = getAuthToken();
        try {
            const res = await fetch(`http://localhost:5000/api/quiz/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    title: quizTitle,
                    courseId,
                    duration: quizDuration,
                    shuffleQuestions: true,
                    shuffleOptions: true,
                    maxAttempts: 1,
                    selectedQuestionIds
                })
            });
            if (res.ok) {
                setQuizTitle("");
                setSelectedQuestionIds([]);
                setActiveTab('bank');
                fetchInitialData();
                alert("Master Quiz Pipeline compiled successfully!");
            } else {
                const err = await res.json();
                alert(`Failed to create quiz: ${err.error || 'Server error'}`);
            }
        } catch(e) { console.error(e); }
    };

    const handleGenerateMock = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/quiz/mock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
                body: JSON.stringify({ courseId })
            });
            if (res.ok) {
                alert("Mock quiz and question bank populated successfully!");
                fetchInitialData();
            } else {
                const err = await res.json();
                alert(`Failed to generate mock quiz: ${err.error || 'Server error'}`);
                setLoading(false);
            }
        } catch(e) { console.error(e); setLoading(false); }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

    if (viewingAnalyticsId) {
        return <QuizAnalyticsModule quizId={viewingAnalyticsId} onBack={() => setViewingAnalyticsId(null)} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button onClick={() => setActiveTab('bank')} className={`pb-2 px-2 font-bold ${activeTab === 'bank' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>📚 Question Bank</button>
                <button onClick={() => setActiveTab('creator')} className={`pb-2 px-2 font-bold ${activeTab === 'creator' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>📝 Create Quiz</button>
            </div>

            {/* ✅ QUIZ CONTROL PANEL - always visible at top regardless of tab */}
            {quizzes.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">🎯 Quiz Control Panel ({quizzes.length})</h4>
                    {quizzes.map(qz => (
                        <div key={qz.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{qz.title}</p>
                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                        {qz.duration}m • {qz.totalMarks} Marks • <span className={`px-2 py-0.5 rounded font-bold ${qz.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' : qz.status === 'READY' ? 'bg-amber-100 text-amber-700' : qz.status === 'STARTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{qz.status}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-blue-600 mb-1">{qz._count?.questions || 0} Qs</p>
                                    <p className="text-xs text-slate-400">{qz._count?.submissions || 0} submissions</p>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                {qz.status === 'DRAFT' && (
                                    <Button size="sm" onClick={async () => {
                                        const res = await fetch(`http://localhost:5000/api/quiz/change-status/${qz.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'READY' }) });
                                        if (!res.ok) alert('Failed — check server logs');
                                        fetchInitialData();
                                    }} className="w-full bg-amber-500 hover:bg-amber-600 font-bold text-white">🟡 Declare READY</Button>
                                )}
                                {qz.status === 'READY' && (
                                    <Button size="sm" onClick={async () => {
                                        await fetch(`http://localhost:5000/api/quiz/change-status/${qz.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'STARTED' }) });
                                        fetchInitialData();
                                    }} className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold text-white">🔥 Force START</Button>
                                )}
                                {qz.status === 'STARTED' && (
                                    <Button size="sm" onClick={async () => {
                                        await fetch(`http://localhost:5000/api/quiz/change-status/${qz.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ENDED' }) });
                                        fetchInitialData();
                                    }} className="w-full bg-red-500 hover:bg-red-600 font-bold text-white">🛑 Terminate Exam</Button>
                                )}
                                {qz.status === 'ENDED' && (
                                    <Button size="sm" onClick={() => setViewingAnalyticsId(qz.id)} className="w-full bg-slate-800 hover:bg-slate-900 font-bold text-white"><BarChart className="w-4 h-4 mr-2"/>📊 View Analytics</Button>
                                )}
                            </div>
                            
                            {(qz.status === 'READY' || qz.status === 'STARTED') && (
                                 <LiveQuizMonitor quizId={qz.id} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'bank' ? (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="glass-panel">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span className="flex items-center gap-2"><Plus className="w-5 h-5"/> Add New Question</span>
                                <div className="flex gap-2 text-sm font-normal">
                                    <button onClick={() => { setQType('MCQ'); setQOptions([{ optionText: "", isCorrect: true }, { optionText: "", isCorrect: false }]); }} className={`px-2 py-1 rounded ${qType === 'MCQ' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>MCQ</button>
                                    <button onClick={() => { setQType('TRUE_FALSE'); setQOptions([{ optionText: "True", isCorrect: true }, { optionText: "False", isCorrect: false }]); }} className={`px-2 py-1 rounded ${qType === 'TRUE_FALSE' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>True/False</button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input placeholder="Enter your question... e.g. What is the OSI Layer 3?" value={qText} onChange={e => setQText(e.target.value)} />
                            <div className="flex gap-6 items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-emerald-600">+ Marks:</span>
                                    <Input type="number" className="w-20" value={qMarks} onChange={e => setQMarks(e.target.value)} min="0.5" step="0.5" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-red-500">- Negative:</span>
                                    <Input type="number" className="w-20 bg-red-50" value={qNegativeMarks} onChange={e => setQNegativeMarks(e.target.value)} min="0" step="0.5" />
                                </div>
                            </div>
                            <div className="space-y-2 mt-4 border border-slate-100 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800">
                                <label className="text-sm font-bold text-slate-500">Configure Options</label>
                                {qOptions.map((opt, i) => (
                                    <div key={i} className="flex gap-3 items-center">
                                        <button onClick={() => setQOptions(prev => prev.map((o, idx) => idx === i ? {...o, isCorrect: true} : {...o, isCorrect: false}))}>
                                            {opt.isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-slate-300" />}
                                        </button>
                                        <Input disabled={qType === 'TRUE_FALSE'} placeholder={`Option ${i+1}`} value={opt.optionText} onChange={(e) => {
                                            const v = [...qOptions];
                                            v[i].optionText = e.target.value;
                                            setQOptions(v);
                                        }} />
                                    </div>
                                ))}
                                {qType === 'MCQ' && (
                                    <Button variant="outline" className="w-full mt-2 border-dashed" onClick={() => setQOptions([...qOptions, {optionText: "", isCorrect: false}])}>
                                        + Add Option Slot
                                    </Button>
                                )}
                            </div>
                            <Button onClick={handleCreateQuestion} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold">Save to Resource Bank</Button>
                        </CardContent>
                    </Card>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300">Live Course Bank ({bankQuestions.length})</h4>
                            <Button size="sm" variant="outline" onClick={handleGenerateMock} className="text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                🧪 Generate Mock Dataset
                            </Button>
                        </div>
                        {bankQuestions.map(q => (
                            <div key={q.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">[{q.type === 'TRUE_FALSE' ? 'T/F' : 'MCQ'}] {q.questionText}</p>
                                <div className="flex gap-2">
                                    <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">+{q.marks} Marks</span>
                                    {q.negativeMarks > 0 && <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-full">-{q.negativeMarks}</span>}
                                </div>
                                <div className="mt-3 space-y-1">
                                    {q.options.map((o:any) => (
                                        <div key={o.id} className={`text-sm px-2 py-1 rounded flex items-center gap-2 ${o.isCorrect ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-500'}`}>
                                            {o.isCorrect && <CheckCircle2 className="w-3.5 h-3.5" />} {o.optionText}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="glass-panel border-emerald-100 dark:border-emerald-900/50">
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-emerald-600"><GraduationCap className="w-5 h-5"/> Assemble Final Paper</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Input placeholder="Quiz Title (e.g. Midterm Eval 1)" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} />
                            <div className="flex gap-4 items-center">
                                <span className="text-sm font-semibold">Duration (Mins):</span>
                                <Input type="number" className="w-24" value={quizDuration} onChange={e => setQuizDuration(e.target.value)} min="5" />
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-sm font-semibold text-slate-800 mb-3">Select Questions from Bank</p>
                                {bankQuestions.map(q => (
                                    <label key={q.id} className="flex items-start gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors">
                                        <input type="checkbox" className="mt-1" checked={selectedQuestionIds.includes(q.id)} onChange={(e) => {
                                            if (e.target.checked) setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                                            else setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== q.id));
                                        }} />
                                        <div>
                                            <p className="text-sm font-medium leading-tight">{q.questionText}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">+{q.marks} / -{q.negativeMarks || 0}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <Button onClick={handleCreateQuiz} disabled={selectedQuestionIds.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                Publish New Quiz
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
