"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { UserPlus, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SemesterDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const semesterId = params.id as string;
    
    const [semester, setSemester] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [showAdvisorForm, setShowAdvisorForm] = useState(false);
    const [advisorForm, setAdvisorForm] = useState({
        name: "", email: "", department: "", facultyId: ""
    });
    const [assigning, setAssigning] = useState(false);

    const fetchSemester = async () => {
        const token = getAuthToken();
        try {
            const res = await fetch(`http://localhost:5000/api/semester/${semesterId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSemester(data.semester);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSemester();
    }, [semesterId]);

    const handleAdvisorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAssigning(true);
        const token = getAuthToken();
        try {
            const res = await fetch(`http://localhost:5000/api/semester/${semesterId}/assign-faculty`, {
                method: 'POST',
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(advisorForm)
            });
            
            const data = await res.json();
            if (res.ok) {
                setShowAdvisorForm(false);
                setAdvisorForm({ name: "", email: "", department: "", facultyId: "" });
                fetchSemester();
                alert(data.message);
            } else {
                alert(data.error || "Failed to assign Faculty Advisor.");
            }
        } catch (error) {
            alert("Network error. Please try again.");
        } finally {
            setAssigning(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>;
    if (!semester) return <div className="p-10">Semester not found.</div>;

    const assignedAdvisorMappings = semester.facultyMappings || [];
    const hasAdvisor = assignedAdvisorMappings.length > 0;

    return (
        <div className="space-y-8 pb-10">
            <Button variant="ghost" onClick={() => router.push('/admin/dashboard')} className="mb-[-20px] text-slate-500 hover:text-slate-800">
                <ArrowLeft className="w-4 h-4 mr-2"/> Back to Dashboard
            </Button>

            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-[2rem] bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-emerald-500/20"
            >
                <div>
                    <h2 className="text-3xl font-black mb-1 flex items-center gap-3">
                        Semester {semester.semesterNumber} ({semester.season})
                    </h2>
                    <p className="text-emerald-100 font-medium">
                        {semester.branch?.name} • {semester.academicYear?.name}
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-center">
                        <div className="text-2xl font-bold">{semester.status}</div>
                        <div className="text-xs text-emerald-100 uppercase tracking-widest">Status</div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
                {/* Module: Faculty Advisor Assignment */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                    <Card className="border-slate-200 dark:border-[#333] shadow-lg rounded-[2rem] bg-white dark:bg-[#111]">
                        <CardHeader className="border-b border-slate-100 dark:border-[#222]">
                            <CardTitle className="text-xl flex items-center gap-2"><UserPlus className="text-blue-500"/> Faculty Advisor Mapping</CardTitle>
                            <CardDescription>Assign the orchestrator for this academic semester.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            {hasAdvisor ? (
                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex justify-center items-center text-xl font-black">
                                        {assignedAdvisorMappings[0].facultyAdvisor.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{assignedAdvisorMappings[0].facultyAdvisor.name}</h3>
                                        <p className="text-slate-500 text-sm">{assignedAdvisorMappings[0].facultyAdvisor.department} • {assignedAdvisorMappings[0].facultyAdvisor.facultyId}</p>
                                        <div className="flex items-center gap-1 mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 w-max px-2 py-1 rounded-md">
                                            <CheckCircle2 className="w-4 h-4" /> Assigned & Mapped
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {!showAdvisorForm ? (
                                        <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <p className="text-slate-500 mb-4">No Faculty Advisor is currently assigned to this semester.</p>
                                            <Button onClick={() => setShowAdvisorForm(true)} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700">
                                                + Assign Faculty Advisor
                                            </Button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleAdvisorSubmit} className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#333]">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2 space-y-1">
                                                    <Label>Advisor Name</Label>
                                                    <Input required value={advisorForm.name} onChange={e=>setAdvisorForm({...advisorForm, name: e.target.value})} className="rounded-xl" placeholder="Dr. Ramesh"/>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>Faculty ID (Login ID)</Label>
                                                    <Input required value={advisorForm.facultyId} onChange={e=>setAdvisorForm({...advisorForm, facultyId: e.target.value})} className="rounded-xl uppercase font-mono" placeholder="FAC001"/>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>Department</Label>
                                                    <Input required value={advisorForm.department} onChange={e=>setAdvisorForm({...advisorForm, department: e.target.value})} className="rounded-xl" placeholder="Computer Science"/>
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <Label>Email Address (For Activation)</Label>
                                                    <Input required type="email" value={advisorForm.email} onChange={e=>setAdvisorForm({...advisorForm, email: e.target.value})} className="rounded-xl" placeholder="ramesh@college.edu"/>
                                                </div>
                                                <div className="col-span-2 mt-2 flex gap-3">
                                                    <Button type="button" variant="outline" onClick={() => setShowAdvisorForm(false)} className="w-1/3 rounded-xl">Cancel</Button>
                                                    <Button type="submit" disabled={assigning} className="w-2/3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700">
                                                        {assigning ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Assignment"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                             <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-500 rounded-xl text-sm leading-relaxed border border-yellow-200 dark:border-yellow-900/30">
                                <strong>Note:</strong> Once a Faculty Advisor is assigned, they must log in to their portal to manage student rosters, course assignments, and professor mappings. The Main Admin is strictly responsible for infrastructure mapping.
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
