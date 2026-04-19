"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { getAuthToken } from "@/lib/auth";
import { Loader2, AlertTriangle, Book, Calendar, CheckCircle2, XCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface Record {
  id: string;
  date: string;
  status: string;
}

interface AttendanceData {
  percentage: number;
  attended: number;
  totalClasses: number;
  records: Record[];
}

export default function StudentAttendanceModule({ courseId }: { courseId: string }) {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`http://localhost:5000/api/attendance/student/me?courseId=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        setData(body);
      }
    } catch (err) {
      console.error("Attendance fetch interval failed: ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAttendance();

    const interval = setInterval(() => {
      fetchAttendance();
    }, 5000);

    return () => clearInterval(interval);
  }, [courseId]);

  if (loading && !data) {
    return (
      <Card className="glass-panel text-center p-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
        <p className="text-slate-500 text-sm">Synchronizing Attendance...</p>
      </Card>
    );
  }

  if (!data || !data.records || data.records.length === 0) {
    return (
      <Card className="glass-panel text-center p-12 bg-slate-50 dark:bg-slate-900 border-dashed">
        <Book className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <CardTitle className="text-slate-600 dark:text-slate-400">No Attendance Records Yet</CardTitle>
        <CardDescription className="mt-2">Attendance hasn't been logged for this course.</CardDescription>
      </Card>
    );
  }

  // Derived variables
  const missed = data.totalClasses - data.attended;
  const isWarning = data.percentage < 75;

  // Chart Data preparation
  const chartData = [...data.records]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((r) => ({
      date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      status: r.status === "Present" ? 100 : 0
    }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Warning Panel */}
      {isWarning && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h4 className="font-semibold text-red-800 dark:text-red-300 text-sm">Attendance Below Required Limit</h4>
            <p className="text-sm text-red-600 dark:text-red-400">Your current attendance is {data.percentage}%. Minimum threshold required is 75%.</p>
          </div>
        </div>
      )}

      {/* Overview & Circular Indicator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* KPI: Info Cards */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="glass-panel border-blue-100 dark:border-blue-900 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Book className="w-16 h-16 text-blue-600" /></div>
             <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Classes</p>
                <h3 className="text-4xl font-bold text-slate-800 dark:text-slate-200">{data.totalClasses}</h3>
             </CardContent>
          </Card>
          <Card className="glass-panel border-emerald-100 dark:border-emerald-900 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><CheckCircle2 className="w-16 h-16 text-emerald-600" /></div>
             <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500 mb-1">Attended Classes</p>
                <h3 className="text-4xl font-bold text-emerald-600">{data.attended}</h3>
             </CardContent>
          </Card>
          <Card className="glass-panel border-rose-100 dark:border-rose-900 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><XCircle className="w-16 h-16 text-rose-600" /></div>
             <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500 mb-1">Missed Classes</p>
                <h3 className="text-4xl font-bold text-rose-600">{missed}</h3>
             </CardContent>
          </Card>
        </div>

        {/* Circular Indicator */}
        <Card className="glass-panel flex flex-col items-center justify-center p-6 shadow-sm">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG implementation for minimal overhead vs standard library */}
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                className="text-slate-200 dark:text-slate-800"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={isWarning ? "text-red-500" : (data.percentage >= 85 ? "text-emerald-500" : "text-amber-500")}
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${data.percentage}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${isWarning ? "text-red-600" : "text-slate-700 dark:text-slate-300"}`}>
                {data.percentage}%
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-3 uppercase tracking-wider">Attendance</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card className="glass-panel shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Attendance Trend</CardTitle>
            <CardDescription>Daily record values</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   formatter={(value: any) => [value === 100 ? "Present" : "Absent", "Status"]}
                />
                <Line 
                   type="monotone" 
                   dataKey="status" 
                   stroke={isWarning ? "#ef4444" : "#10b981"} 
                   strokeWidth={3}
                   dot={{ r: 4, strokeWidth: 2 }}
                   activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Timeline Log */}
        <Card className="glass-panel shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500"/> Activity Log</CardTitle>
            <CardDescription>Recent class history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] overflow-y-auto pr-2 space-y-3 scrollbar-thin">
              {data.records.map((r, i) => (
                <div key={r.id || i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                   <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${r.status === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                         {new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                      </span>
                   </div>
                   <span className={`text-xs font-bold px-3 py-1 rounded-full ${r.status === 'Present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30'}`}>
                      {r.status}
                   </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
