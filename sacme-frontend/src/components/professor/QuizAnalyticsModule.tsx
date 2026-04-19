"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, Trophy, ArrowLeft, Target, AlertTriangle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function QuizAnalyticsModule({ quizId, onBack }: { quizId: string, onBack: () => void }) {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [quizId]);

    const fetchAnalytics = async () => {
        const token = getAuthToken();
        try {
            const res = await fetch(`http://localhost:5000/api/quiz/analytics/${quizId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setAnalytics(await res.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

    if (!analytics) return <div className="p-8 text-center text-slate-500">Failed to load analytics map. <Button onClick={onBack} variant="link">Go Back</Button></div>;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex gap-4 items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <Button variant="outline" size="icon" onClick={onBack} className="rounded-xl h-10 w-10">
                    <ArrowLeft className="w-4 h-4"/>
                </Button>
                <div>
                     <h2 className="text-xl font-black text-slate-800 dark:text-white">Exam Advanced Analytics</h2>
                     <p className="text-sm font-medium text-slate-500">Aggregated performance and integrity tracking</p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <Card className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Total Submissions</p>
                        <p className="text-2xl font-black text-blue-700">{analytics.submissionCount}</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Class Average</p>
                        <p className="text-2xl font-black text-amber-700">{analytics.average}</p>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Highest</p>
                        <p className="text-2xl font-black text-emerald-700">{analytics.highest === -9007199254740991 ? 0 : analytics.highest}</p>
                    </CardContent>
                </Card>
                <Card className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Lowest</p>
                        <p className="text-2xl font-black text-rose-700">{analytics.lowest === 9007199254740991 ? 0 : analytics.lowest}</p>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Pass Rate</p>
                        <p className="text-2xl font-black text-purple-700">{analytics.passRate}%</p>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 dark:bg-red-900/10 border border-red-100 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Fail Rate</p>
                        <p className="text-2xl font-black text-red-700">{analytics.failRate}%</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500"/> Ranked Leaderboard
                    </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {analytics.leaderboard.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No submissions captured yet.</div>
                    ) : analytics.leaderboard.map((lb: any, idx: number) => (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${lb.rank === 1 ? 'bg-amber-100 text-amber-700' : lb.rank === 2 ? 'bg-slate-200 text-slate-700' : lb.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                    #{lb.rank || idx + 1}
                                </span>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{lb.studentName}</p>
                                    <p className="text-xs font-semibold text-slate-500">{lb.rollNo}</p>
                                    {lb.timeTaken > 0 && <p className="text-[10px] text-slate-400 mt-1">Duration: {lb.timeTaken}s</p>}
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-6">
                                {lb.violations > 0 && (
                                    <div className="flex items-center gap-1 text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-xs font-bold">
                                         <AlertTriangle className="w-3.5 h-3.5"/> {lb.violations} Violations
                                    </div>
                                )}
                                <div>
                                    <p className="font-black text-blue-600 text-lg">{lb.score} Pts</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {analytics.questions && analytics.questions.length > 0 && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-6">
                <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-500"/> Question Difficulty Analysis
                    </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
                    {analytics.questions.map((q: any, i: number) => {
                        const isHard = q.difficultyIndex < 35 && q.totalAttempts > 0;
                        const isEasy = q.difficultyIndex > 80;
                        return (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <div className="max-w-[70%]">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{q.questionText}</p>
                                <p className="text-xs text-slate-500 mt-1">{q.correctAttempts} / {q.totalAttempts} Correct Attempts</p>
                            </div>
                            <div className="text-right">
                                <div className={`px-2 py-1 inline-block rounded text-xs font-bold ${isHard ? 'bg-red-100 text-red-700' : isEasy ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {q.difficultyIndex.toFixed(0)}% Success Rate
                                </div>
                                {isHard && <p className="text-[10px] uppercase font-bold text-red-500 mt-1">Class Weakness</p>}
                            </div>
                        </div>
                    )})}
                </div>
            </Card>
            )}
        </div>
    );
}
