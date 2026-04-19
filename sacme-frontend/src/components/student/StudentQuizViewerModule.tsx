"use client";
import { getAuthToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, GraduationCap, Clock, AlertTriangle, FileText, CheckCircle2, Lock, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import io, { Socket } from "socket.io-client";

const API = "http://localhost:5000";

export default function StudentQuizViewerModule({ courseId }: { courseId: string }) {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [resultData, setResultData] = useState<any | null>(null);
    const [timeLeftStr, setTimeLeftStr] = useState<string>("");
    const [violations, setViolations] = useState(0);
    const [pollMsg, setPollMsg] = useState(""); // Debug feedback
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showViolationResult, setShowViolationResult] = useState(false);
    const router = useRouter();

    const socketRef = useRef<Socket | null>(null);
    const violationsRef = useRef(0); // Ref to avoid stale closure in event listeners
    const activeQuizRef = useRef<any>(null);  // Track latest quiz in event listeners
    const lastViolationTime = useRef(0);
    const lastSavedResponses = useRef<Record<string, string>>({});
    const saveRetryCount = useRef(0);
    const isSubmitted = useRef(false);

    // Keep refs in sync
    useEffect(() => { violationsRef.current = violations; }, [violations]);
    useEffect(() => { activeQuizRef.current = activeQuiz; }, [activeQuiz]);

    // ── Shuffle helper ───────────────────────────────────────────────
    const shuffleArray = (arr: any[]) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    // ── Fetch available quizzes ──────────────────────────────────────
    const fetchAvailable = useCallback(async () => {
        const token = getAuthToken();
        try {
            const res = await fetch(`${API}/api/quiz/course/${courseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQuizzes(data.quizzes || []);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [courseId]);

    useEffect(() => { fetchAvailable(); }, [fetchAvailable]);

    // ── Poll quiz status while in READY locked state ─────────────────
    useEffect(() => {
        if (!activeQuiz || activeQuiz.status !== 'READY') return;

        console.log("[Poll] Starting status polling for quiz:", activeQuiz.id);
        setPollMsg("Polling for START signal...");

        const token = getAuthToken();
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API}/api/quiz/status/${activeQuiz.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) return;
                const data = await res.json();
                console.log("[Poll] Current quiz status:", data.status);

                if (data.status === 'STARTED') {
                    console.log("[Poll] START detected! Unlocking...");
                    setPollMsg("");
                    setActiveQuiz((prev: any) => ({
                        ...prev,
                        status: 'STARTED',
                        startTime: data.startTime
                    }));
                } else if (data.status === 'ENDED') {
                    setActiveQuiz((prev: any) => ({ ...prev, status: 'ENDED' }));
                }
            } catch (e) { console.error("[Poll] Error:", e); }
        }, 4000); // Poll every 4 seconds

        return () => {
            clearInterval(interval);
            setPollMsg("");
        };
    }, [activeQuiz?.status, activeQuiz?.id]);

    // ── Enter quiz ───────────────────────────────────────────────────
    const mountQuizEngine = async (quizId: string) => {
        setLoading(true);
        const token = getAuthToken();
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
            }

            const res = await fetch(`${API}/api/quiz/details/${quizId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                alert("Failed to load quiz details.");
                setLoading(false);
                return;
            }
            const data = await res.json();

            // Conditional randomization based on quiz flags
            let qs = data.quiz.questions;
            if (data.quiz.shuffleQuestions) {
                qs = shuffleArray(qs);
            }
            qs = qs.map((qw: any) => {
                if (data.quiz.shuffleOptions && qw.question.type !== 'TRUE_FALSE') {
                    qw.question.options = shuffleArray(qw.question.options);
                }
                return qw;
            });
            data.quiz.questions = qs;
            setActiveQuiz(data.quiz);
            setResponses({});
            setViolations(0);
            violationsRef.current = 0;

            // Connect socket and join room
            const sock = io(API, { transports: ['websocket', 'polling'] });
            socketRef.current = sock;

            sock.on('connect', () => {
                console.log("[Socket] Connected:", sock.id);
                // Extracting name from local profile if available
                let sName = 'Local Student';
                try {
                    const prof = localStorage.getItem('sacme_user_profile');
                    if (prof) sName = JSON.parse(prof).name || sName;
                } catch(e) {}
                
                sock.emit('join_quiz_room', { 
                    quizId, 
                    studentId: sock.id, // Using socket ID as temporary session reference
                    studentName: sName
                });
                console.log("[Socket] Joined room:", `quiz_${quizId}`);
            });

            // Restore previous session state
            try {
                const restoreRes = await fetch(`${API}/api/quiz/autosave/${quizId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (restoreRes.ok) {
                     const prevData = await restoreRes.json();
                     if (prevData.responses) {
                         setResponses(prevData.responses);
                         lastSavedResponses.current = { ...prevData.responses };
                     }
                     if (prevData.violations) {
                         setViolations(prevData.violations);
                         violationsRef.current = prevData.violations;
                     }
                }
            } catch (err) { console.error("Restore failed:", err); }

            async function enterFullscreen() {
                try {
                    if (document.documentElement.requestFullscreen) {
                        await document.documentElement.requestFullscreen();
                    }
                } catch (err) {
                    console.log("Fullscreen blocked:", err);
                }
            }

            sock.on('quiz_status_change', (payload: any) => {
                console.log("[Socket] Status change event:", payload);
                if (payload.quizId === quizId) {
                    setActiveQuiz((prev: any) => ({
                        ...prev,
                        status: payload.newStatus,
                        startTime: payload.startTime || prev?.startTime
                    }));
                    if (payload.newStatus === 'STARTED') {
                        console.log("[Socket] STARTED — entering fullscreen");
                        enterFullscreen();
                    }
                }
            });

            // Handle quiz already STARTED when student joins
            if (data.quiz.status === 'STARTED') {
                enterFullscreen();
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    // ── Countdown timer (only runs while STARTED) ────────────────────
    useEffect(() => {
        if (!activeQuiz || activeQuiz.status !== 'STARTED' || !activeQuiz.startTime) return;
        const interval = setInterval(() => {
            const start = new Date(activeQuiz.startTime).getTime();
            const end = start + activeQuiz.duration * 60000;
            const diff = end - Date.now();
            if (diff <= 0) {
                clearInterval(interval);
                triggerEvaluation(true, 'TIMEOUT');
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeftStr(`${m}:${s.toString().padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [activeQuiz?.status, activeQuiz?.startTime]);

    // ── Anti-cheat listeners (only when STARTED) ────────────────────
    useEffect(() => {
        if (!activeQuiz || activeQuiz.status !== 'STARTED') return;

        const onVisibility = () => { if (document.hidden) doViolation('tab_switch'); };
        const onFullscreen = () => { if (!document.fullscreenElement) doViolation('fullscreen_exit'); };
        const block = (e: Event) => e.preventDefault();

        const onKeydown = (e: KeyboardEvent) => {
            if (e.ctrlKey && (e.key === "c" || e.key === "C" || e.key === "v" || e.key === "V" || e.key === "x" || e.key === "X")) e.preventDefault();
            if (e.key === "F12") e.preventDefault();
            if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) e.preventDefault();
            if (e.altKey && e.key === "Tab") e.preventDefault();
            if (e.key === "Escape") { doViolation('fullscreen_exit'); e.preventDefault(); }
        };

        document.addEventListener('visibilitychange', onVisibility);
        document.addEventListener('fullscreenchange', onFullscreen);
        document.addEventListener('copy', block);
        document.addEventListener('paste', block);
        document.addEventListener('cut', block);
        document.addEventListener('contextmenu', block);
        document.addEventListener('keydown', onKeydown);

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            document.removeEventListener('fullscreenchange', onFullscreen);
            document.removeEventListener('copy', block);
            document.removeEventListener('paste', block);
            document.removeEventListener('cut', block);
            document.removeEventListener('contextmenu', block);
            document.removeEventListener('keydown', onKeydown);
        };
    }, [activeQuiz?.status]);

    const autoSubmitQuiz = async () => {
        if (isSubmitted.current) return;
        isSubmitted.current = true;
        await triggerEvaluation(true, 'VIOLATION_LIMIT');
        setShowViolationResult(true);
    };

    const doViolation = (type = 'DOM_OVERRIDE') => {
        const now = Date.now();
        if (now - lastViolationTime.current < 2000) return; // 2 seconds debounce
        lastViolationTime.current = now;

        setViolations(prev => {
            const newCount = prev + 1;
            violationsRef.current = newCount;
            console.log("Violation detected:", newCount);
            
            // Log Violation Securely
            fetch(`${API}/api/quiz/violation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
                body: JSON.stringify({ quizId: activeQuizRef.current?.id, type })
            }).catch(e => console.error(e));

            if (newCount >= 3) {
                autoSubmitQuiz();
            }
            return newCount;
        });
    };

    // ── Autosave every 5s while STARTED ─────────────────────────────
    useEffect(() => {
        if (!activeQuiz || activeQuiz.status !== 'STARTED' || Object.keys(responses).length === 0) return;
        const timer = setInterval(() => {
            const payloadStr = JSON.stringify(responses);
            if (payloadStr === JSON.stringify(lastSavedResponses.current) && saveRetryCount.current === 0) return;

            const payload = Object.keys(responses).map(qid => ({ questionId: qid, selectedOptionId: responses[qid] }));
            const attemptSave = () => {
                fetch(`${API}/api/quiz/autosave`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
                    body: JSON.stringify({ quizId: activeQuiz.id, responses: payload })
                }).then(res => {
                     if(res.ok) { 
                         console.log("Autosave triggered"); 
                         lastSavedResponses.current = { ...responses }; 
                         saveRetryCount.current = 0; 
                         
                         // Emit Student Status
                         if (socketRef.current) {
                              socketRef.current.emit("student_status", {
                                   quizId: activeQuiz.id,
                                   studentId: socketRef.current.id,
                                   status: "ACTIVE",
                                   violations: violationsRef.current,
                                   progress: Math.round((Object.keys(responses).length / activeQuiz.questions.length) * 100)
                              });
                         }
                     } else throw new Error("Save Failed");
                }).catch(err => {
                     if (saveRetryCount.current > 5) {
                         console.log("Autosave failed permanently");
                         return;
                     }
                     saveRetryCount.current++;
                     setTimeout(attemptSave, 3000);
                });
            };
            attemptSave();
        }, 5000);
        return () => clearInterval(timer);
    }, [responses, activeQuiz?.status]);

    // ── Submit ───────────────────────────────────────────────────────
    const triggerEvaluation = async (isAutoSubmit = false, reason = 'MANUAL_SUBMIT') => {
        if (isSubmitted.current) return;
        isSubmitted.current = true;
        setSubmitting(true);
        console.log("Quiz submitted");

        if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
        document.exitFullscreen().catch(() => {});

        const token = getAuthToken();
        const payload = Object.keys(responses).map(qid => ({ questionId: qid, selectedOptionId: responses[qid] }));

        try {
            const res = await fetch(`${API}/api/quiz/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ quizId: activeQuiz.id, responses: payload, isAutoSubmit, terminationReason: reason })
            });
            if (res.ok) {
                const data = await res.json();
                setResultData({ ...data, terminationReason: reason });
            } else {
                const err = await res.json();
                alert(`Submission failed: ${err.error || 'Unknown error'}`);
            }
        } catch (e) { console.error(e); }
        setSubmitting(false);
    };

    // ────────────────────────────────────────────────────────────────
    // RENDER
    // ────────────────────────────────────────────────────────────────

    if (loading) return (
        <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
    );

    if (resultData) {
        const isTimeout = resultData.terminationReason === 'TIMEOUT';
        const isViolation = resultData.terminationReason === 'VIOLATION_LIMIT';

        return (
        <Card className={`glass-panel border-2 p-8 text-center animate-in zoom-in-95 duration-500 ${isViolation ? 'border-red-500' : isTimeout ? 'border-amber-500' : 'border-emerald-100'}`}>
            {isViolation ? (
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            ) : isTimeout ? (
                <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            ) : (
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            )}
            <h2 className={`text-3xl font-black mb-2 ${isViolation ? 'text-red-600' : isTimeout ? 'text-amber-600' : 'text-slate-800 dark:text-white'}`}>
                {isViolation ? '⚠️ Security Violation Detected' : isTimeout ? '⏱ Time Expired' : 'Exam Submitted!'}
            </h2>
            {isViolation && <p className="text-slate-600 dark:text-slate-300 font-medium mb-6">You exceeded the maximum allowed violations (3). Your quiz has been automatically submitted.</p>}
            {isTimeout && <p className="text-slate-600 dark:text-slate-300 font-medium mb-6">Your quiz was automatically submitted because the allotted time ended. You may now review your results.</p>}
            <div className="mt-8 bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Your Score</p>
                <p className="text-5xl font-black text-blue-600 mb-2">{resultData.score} <span className="text-2xl text-slate-400">Pts</span></p>
                <div className="flex justify-center flex-wrap items-center gap-4 mt-4">
                    <span className="text-lg font-bold text-slate-600">{resultData.percentage?.toFixed(2) || 0}%</span>
                    <span className="text-xl font-black bg-emerald-100 text-emerald-800 py-1 px-4 rounded-xl">Grade: {resultData.grade || "-"}</span>
                    {resultData.rank && (
                        <span className="text-xl font-black bg-purple-100 text-purple-800 py-1 px-4 rounded-xl shadow-sm">👑 Class Rank: #{resultData.rank}</span>
                    )}
                </div>
            </div>
            <Button onClick={() => { setActiveQuiz(null); setResultData(null); setResponses({}); fetchAvailable(); }}
                className="w-full max-w-xs mt-8 bg-slate-800 hover:bg-slate-900 text-white rounded-xl h-12 font-bold text-lg">
                Return to Dashboard
            </Button>
        </Card>
        );
    }

    if (activeQuiz) {

        // ── ENDED ────────────────────────────────────────────────────
        if (activeQuiz.status === 'ENDED') return (
            <div className="bg-white dark:bg-[#111] border rounded-2xl p-12 text-center shadow-xl">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Examination Ended</h2>
                <p className="text-slate-500 mt-2">The professor has closed this quiz session.</p>
                <Button onClick={() => { setActiveQuiz(null); fetchAvailable(); }} className="mt-6">Back to List</Button>
            </div>
        );

        // ── READY — waiting room with polling ───────────────────────
        if (activeQuiz.status === 'READY') return (
            <div className="bg-white dark:bg-[#111] border border-amber-200 dark:border-amber-900/50 rounded-2xl p-12 text-center shadow-xl animate-in fade-in">
                <Lock className="w-16 h-16 text-amber-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Quiz Locked</h2>
                <p className="text-slate-500 font-medium">Waiting for your professor to start the exam...</p>
                <div className="mt-6 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {pollMsg || "Auto-checking every 4 seconds..."}
                    </div>
                    <p className="text-xs text-slate-400">You will unlock automatically when the exam starts. Do not close this page.</p>
                </div>
            </div>
        );

        // ── STARTED — exam runner ────────────────────────────────────
        return (
            <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                {/* Header Bar */}
                <div className="bg-slate-900 p-4 sticky top-0 z-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-black text-white">{activeQuiz.title}</h2>
                        <div className="flex gap-3 items-center mt-0.5">
                            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">{activeQuiz.questions.length} Questions</p>
                            {violations === 1 && <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded">⚠️ Violation 1 of 3</span>}
                            {violations === 2 && <span className="text-xs font-bold text-red-600 bg-red-100 border border-red-300 px-2 py-0.5 rounded shadow-sm animate-pulse">🚨 Final Warning! ⚠️ Next violation will auto-submit the quiz.</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <span className="text-xl font-black text-white tracking-widest">{timeLeftStr || '--:--'}</span>
                    </div>
                </div>

                {/* Questions */}
                <div className="p-6 md:p-10 space-y-10 bg-slate-50/30 dark:bg-[#0a0a0a] min-h-[60vh]">
                    {activeQuiz.questions.map((qWrapper: any, index: number) => {
                        const q = qWrapper.question;
                        return (
                            <div key={q.id} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                                <span className="absolute -top-3 -left-3 w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-black rounded-lg text-sm shadow-lg">
                                    {index + 1}
                                </span>
                                <div className="ml-4">
                                    <div className="flex justify-between items-start gap-4 mb-5">
                                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{q.questionText}</h3>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">+{q.marks} pts</span>
                                            {q.negativeMarks > 0 && <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded">-{q.negativeMarks} pts</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {q.options.map((opt: any) => (
                                            <label key={opt.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${responses[q.id] === opt.id
                                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                                                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}>
                                                <input type="radio" name={`q-${q.id}`} value={opt.id}
                                                    checked={responses[q.id] === opt.id}
                                                    onChange={() => setResponses(prev => ({ ...prev, [q.id]: opt.id }))}
                                                    className="w-4 h-4 accent-blue-600" />
                                                <span className={`font-medium ${responses[q.id] === opt.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {opt.optionText}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Submit */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                    <Button onClick={() => setShowSubmitModal(true)} disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-blue-500/25">
                        {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Finalize & Submit
                    </Button>
                </div>

                {showSubmitModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-[400px] shadow-xl text-left">
                      <h2 className="text-lg font-semibold mb-3 text-slate-800">Submit Quiz?</h2>
                      <p className="text-slate-600 mb-5">Are you sure you want to finalize your submission?</p>
                      <div className="flex justify-end gap-3">
                        <button className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded" onClick={() => setShowSubmitModal(false)}>Cancel</button>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-sm" onClick={() => { setShowSubmitModal(false); triggerEvaluation(false); }}>Final Submit</button>
                      </div>
                    </div>
                  </div>
                )}

                {showViolationResult && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[100]">
                    <div className="bg-white p-8 rounded-xl text-center w-[450px] shadow-2xl animate-in zoom-in-95">
                      <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
                      <h2 className="text-2xl font-black text-red-600 mb-3">Violation Limit Exceeded</h2>
                      <p className="text-slate-600 font-medium mb-6">Your quiz has been automatically submitted due to multiple rule violations. A score penalty may apply.</p>
                      <button onClick={() => window.location.href = "/student/dashboard"} className="w-full px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-black tracking-wide rounded-xl shadow-lg shadow-red-500/25">
                        Return to Dashboard
                      </button>
                    </div>
                  </div>
                )}
            </div>
        );
    }

    // ── Quiz list ────────────────────────────────────────────────────
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-500" /> Available Examinations
                </h3>
                <Button variant="outline" size="sm" onClick={fetchAvailable} className="text-xs gap-1">
                    <RefreshCw className="w-3 h-3" /> Refresh
                </Button>
            </div>

            {quizzes.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-500">No active examinations right now.</p>
                    <p className="text-xs text-slate-400 mt-1">Check back when your professor activates a quiz.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {quizzes.map(qz => (
                        <div key={qz.id}
                            className="p-6 bg-white dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <FileText className="w-20 h-20 text-blue-500" />
                            </div>
                            <div className="flex items-start justify-between mb-1">
                                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200">{qz.title}</h4>
                                <span className={`text-xs font-black px-2 py-1 rounded-md ${qz.status === 'READY' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {qz.status}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mb-5">
                                <Clock className="inline w-3.5 h-3.5 mr-1" />{qz.duration} min • {qz._count?.questions || 0} questions
                            </p>
                            <Button onClick={() => mountQuizEngine(qz.id)}
                                className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 transition-colors font-bold rounded-xl h-11">
                                {qz.status === 'READY' ? '🔒 Enter Waiting Room' : '🚀 Start Exam'}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
