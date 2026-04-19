"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Calendar, BookOpen, Layers, Plus, ExternalLink, GraduationCap, LayoutDashboard, ArrowRight, Settings, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
  programType: string;
  totalSemesters: number;
  semesters: Semester[];
}

interface Semester {
  id: string;
  semesterNumber: number;
  season: string;
  semesterType: string;
}

export default function AdminDashboardPage() {
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    
    // Form States
    const [showYearForm, setShowYearForm] = useState(false);
    const [yearFormData, setYearFormData] = useState({ name: "", startDate: "", endDate: "", status: "ACTIVE" });
    
    const [showBranchForm, setShowBranchForm] = useState(false);
    const [branchFormData, setBranchFormData] = useState({ name: "", code: "", programType: "BTECH", totalSemesters: "8", academicYearId: "" });
    
    const [globalStats, setGlobalStats] = useState({ totalStudents: 0, totalAssigns: 0, totalMaterials: 0, totalSubmissions: 0 });

    // Assuming we fetch data on mount
    const fetchData = async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const [yearRes, branchRes, statsRes] = await Promise.all([
                fetch("http://localhost:5000/api/academic/year", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("http://localhost:5000/api/academic/branch", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("http://localhost:5000/api/academic/global-stats", { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            if (yearRes.ok) {
                const yd = await yearRes.json();
                setYears(yd.years);
                if (yd.years.length > 0 && !branchFormData.academicYearId) {
                    setBranchFormData(prev => ({ ...prev, academicYearId: yd.years[0].id }));
                }
            }
            if (branchRes.ok) {
                const bd = await branchRes.json();
                setBranches(bd.branches);
            }
            if (statsRes.ok) {
                const sd = await statsRes.json();
                setGlobalStats(sd.stats || { totalStudents: 0, totalAssigns: 0, totalMaterials: 0, totalSubmissions: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch academic data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateYear = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getAuthToken();
        try {
            const res = await fetch("http://localhost:5000/api/academic/year", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(yearFormData)
            });
            if (res.ok) {
                setShowYearForm(false);
                setYearFormData({ name: "", startDate: "", endDate: "", status: "ACTIVE" });
                fetchData();
            }
        } catch (error) {}
    };

    const handleSetActiveYear = async (id: string) => {
        const token = getAuthToken();
        try {
            const res = await fetch(`http://localhost:5000/api/academic/year/${id}/active`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
            } else {
                const err = await res.json();
                alert(`Error: ${res.status} - ${err.error || 'API route not found. Did you restart the backend?'}`);
            }
        } catch (error) {
            alert("Network Error: Could not reach the server. Please ensure the backend is running.");
        }
    };

    const handleCreateBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getAuthToken();
        try {
            const res = await fetch("http://localhost:5000/api/academic/branch", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(branchFormData)
            });
            if (res.ok) {
                setShowBranchForm(false);
                setBranchFormData({ name: "", code: "", programType: "BTECH", totalSemesters: "8", academicYearId: years[0]?.id || "" });
                fetchData();
            }
        } catch (error) {}
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Banner & Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 md:p-10 flex flex-col items-start justify-between gap-6 relative overflow-hidden shadow-2xl shadow-blue-500/20 group"
            >
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 animate-pulse pointer-events-none group-hover:bg-white/20 transition-colors"></div>
                
                <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black mb-2 flex items-center gap-3">
                            <GraduationCap className="w-10 h-10 group-hover:rotate-12 transition-transform duration-300"/> 
                            Academic Control Center
                        </h2>
                        <p className="text-blue-100 font-medium max-w-xl text-sm md:text-base">
                            Design the structural foundation of your institution. Create academic years and organize faculties into specialized branches and semesters.
                        </p>
                    </div>
                    <Link href="/admin/setup">
                        <Button variant="secondary" className="gap-2 font-bold rounded-xl shadow-lg bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md">
                            <Building2 className="w-4 h-4"/> Edit Institute Details
                        </Button>
                    </Link>
                </div>

                <div className="relative z-10 w-full grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-6 border-t border-white/10">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center border border-white/5">
                        <div className="text-3xl font-black text-white">{globalStats.totalStudents}</div>
                        <div className="text-[10px] text-blue-200 uppercase tracking-widest font-bold mt-1">Total Active Students</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center border border-white/5">
                        <div className="text-3xl font-black text-emerald-300">{globalStats.totalAssigns}</div>
                        <div className="text-[10px] text-emerald-100 uppercase tracking-widest font-bold mt-1">Assignments Created</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center border border-white/5">
                        <div className="text-3xl font-black text-amber-300">{globalStats.totalSubmissions}</div>
                        <div className="text-[10px] text-amber-100 uppercase tracking-widest font-bold mt-1">Student Submissions</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center border border-white/5">
                        <div className="text-3xl font-black text-purple-300">{globalStats.totalMaterials}</div>
                        <div className="text-[10px] text-purple-100 uppercase tracking-widest font-bold mt-1">Class Materials Uploaded</div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Academic Years Section */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="border-slate-200 dark:border-[#333] shadow-lg shadow-slate-200/50 dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-[#111]">
                        <CardHeader className="border-b border-slate-100 dark:border-[#222] bg-slate-50/50 dark:bg-black/50 p-6 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2"><Calendar className="text-blue-500"/> Academic Years</CardTitle>
                                <CardDescription className="mt-1 text-sm font-medium">Manage operational terms</CardDescription>
                            </div>
                            <Button onClick={() => setShowYearForm(!showYearForm)} size="sm" className="rounded-xl font-bold">
                                {showYearForm ? "Cancel" : <><Plus className="w-4 h-4 mr-1"/> Add Year</>}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <AnimatePresence>
                                {showYearForm && (
                                    <motion.form 
                                        initial={{ opacity: 0, height: 0 }} 
                                        animate={{ opacity: 1, height: "auto" }} 
                                        exit={{ opacity: 0, height: 0 }} 
                                        onSubmit={handleCreateYear} 
                                        className="mb-6 space-y-4"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 space-y-2">
                                                <Label>Academic Year Name</Label>
                                                <Input required value={yearFormData.name} onChange={e => setYearFormData({...yearFormData, name: e.target.value})} placeholder="e.g. 2026-27" className="rounded-xl border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black"/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Start Date</Label>
                                                <Input required type="date" value={yearFormData.startDate} onChange={e => setYearFormData({...yearFormData, startDate: e.target.value})} className="rounded-xl border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black"/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>End Date</Label>
                                                <Input required type="date" value={yearFormData.endDate} onChange={e => setYearFormData({...yearFormData, endDate: e.target.value})} className="rounded-xl border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black"/>
                                            </div>
                                            <div className="col-span-2">
                                                <Button type="submit" className="w-full rounded-xl mt-2 font-bold bg-blue-600 hover:bg-blue-700 text-white">Save Academic Year</Button>
                                            </div>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            {years.length === 0 && !showYearForm && (
                                <div className="text-center py-10 text-slate-500 font-medium">
                                    No academic years created yet.
                                </div>
                            )}

                            <div className="space-y-3 mt-4">
                                {years.map(year => (
                                    <div key={year.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-[#333] transition-all hover:-translate-y-1 hover:shadow-lg hover:border-blue-500/50">
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">{year.name}</h4>
                                            <p className="text-xs text-slate-500 font-medium mt-1">
                                                {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {(year.status !== 'ACTIVE' || years.filter(y => y.status === 'ACTIVE').length > 1) && (
                                                <Button 
                                                    size="sm" 
                                                    variant={year.status === 'ACTIVE' ? "default" : "outline"}
                                                    onClick={() => handleSetActiveYear(year.id)} 
                                                    className={`rounded-xl text-xs font-bold ${year.status === 'ACTIVE' ? 'bg-amber-500 hover:bg-amber-600 text-white border-none' : 'border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 dark:border-[#444] dark:text-blue-400 dark:hover:bg-blue-900/20'}`}
                                                >
                                                    {year.status === 'ACTIVE' ? "Resolve Conflict" : "Set Active"}
                                                </Button>
                                            )}
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${year.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shadow-sm shadow-green-500/20' : 'bg-slate-200 text-slate-700 dark:bg-[#333] dark:text-slate-300'}`}>
                                                {year.status === 'ACTIVE' ? "ACTIVE" : "ARCHIVED"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Branches Section */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="border-slate-200 dark:border-[#333] shadow-lg shadow-slate-200/50 dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-[#111]">
                        <CardHeader className="border-b border-slate-100 dark:border-[#222] bg-slate-50/50 dark:bg-black/50 p-6 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2"><Layers className="text-purple-500"/> Branches</CardTitle>
                                <CardDescription className="mt-1 text-sm font-medium">Configure degree programs</CardDescription>
                            </div>
                            <Button onClick={() => setShowBranchForm(!showBranchForm)} disabled={years.length === 0} size="sm" className="rounded-xl font-bold bg-purple-600 hover:bg-purple-700">
                                {showBranchForm ? "Cancel" : <><Plus className="w-4 h-4 mr-1"/> Add Branch</>}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <AnimatePresence>
                                {showBranchForm && (
                                    <motion.form 
                                        initial={{ opacity: 0, height: 0 }} 
                                        animate={{ opacity: 1, height: "auto" }} 
                                        exit={{ opacity: 0, height: 0 }} 
                                        onSubmit={handleCreateBranch} 
                                        className="mb-6 space-y-4"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Academic Year</Label>
                                                <select required className="w-full h-10 px-3 py-2 rounded-xl text-sm border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black focus:outline-none focus:ring-2 focus:ring-purple-500/20" value={branchFormData.academicYearId} onChange={e => setBranchFormData({...branchFormData, academicYearId: e.target.value})}>
                                                    {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Program Type</Label>
                                                <select className="w-full h-10 px-3 py-2 rounded-xl text-sm border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black focus:outline-none focus:ring-2 focus:ring-purple-500/20" value={branchFormData.programType} onChange={e => {
                                                    const pt = e.target.value;
                                                    let ts = "8";
                                                    if (pt === "MTECH") ts = "4";
                                                    if (pt === "DUAL") ts = "10";
                                                    setBranchFormData({...branchFormData, programType: pt, totalSemesters: ts});
                                                }}>
                                                    <option value="BTECH">B.Tech</option>
                                                    <option value="MTECH">M.Tech</option>
                                                    <option value="DUAL">Dual Degree</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Branch Name</Label>
                                                <Input required value={branchFormData.name} onChange={e => setBranchFormData({...branchFormData, name: e.target.value})} placeholder="e.g. Computer Science" className="rounded-xl border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black"/>
                                            </div>
                                            <div className="space-y-2 grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label>Code</Label>
                                                    <Input required value={branchFormData.code} onChange={e => setBranchFormData({...branchFormData, code: e.target.value.toUpperCase()})} placeholder="CSE" className="rounded-xl font-mono uppercase border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-black"/>
                                                </div>
                                                <div>
                                                    <Label>Semesters</Label>
                                                    <Input type="number" readOnly value={branchFormData.totalSemesters} className="rounded-xl bg-slate-100 dark:bg-[#111] border-transparent font-bold cursor-not-allowed"/>
                                                </div>
                                            </div>
                                            <div className="col-span-2 pt-2">
                                                <Button type="submit" className="w-full rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white">Save & Generate Semesters</Button>
                                            </div>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            {branches.length === 0 && !showBranchForm && (
                                <div className="text-center py-10 text-slate-500 font-medium">
                                    No branches created yet. Create a year first.
                                </div>
                            )}

                            <div className="space-y-3 mt-4">
                                {branches.map(branch => (
                                    <div key={branch.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-[#333] transition-all hover:-translate-y-1 hover:shadow-xl hover:border-purple-500/50">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    {branch.name} <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-[10px] uppercase">{branch.programType}</span>
                                                </h4>
                                                <p className="text-xs text-slate-500 font-medium mt-1">Code: <span className="font-mono bg-slate-200 dark:bg-[#222] px-1 py-0.5 rounded text-slate-800 dark:text-slate-300">{branch.code}</span> • {branch.totalSemesters} Semesters</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-black border border-slate-200 dark:border-[#333] flex items-center justify-center font-bold text-purple-600">
                                                {branch.totalSemesters}
                                            </div>
                                        </div>
                                        {/* Semester Pills (Auto Generated) */}
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {branch.semesters?.map(sem => (
                                                <Link href={`/admin/semester/${sem.id}`} key={sem.id} className="flex items-center gap-1 group">
                                                    <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 group-hover:shadow-md ${sem.semesterType === 'ODD' ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/30 dark:border-orange-900 dark:text-orange-400 group-hover:bg-orange-100' : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400 group-hover:bg-emerald-100'}`}>
                                                        Sem {sem.semesterNumber} <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"/>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
