"use client";
import { getAuthToken, logoutUser } from '@/lib/auth';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { User, Building2, ShieldCheck, LifeBuoy, LogOut, Loader2, Save, Send, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminProfilePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("personal");
    const [user, setUser] = useState<any>(null);
    const [institute, setInstitute] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    
    // Ticket Form
    const [ticketForm, setTicketForm] = useState({ title: "", issueType: "Bug", priority: "Medium", description: "" });
    const [ticketSubmitting, setTicketSubmitting] = useState(false);
    const [ticketSuccess, setTicketSuccess] = useState("");

    const fetchData = async () => {
        const token = getAuthToken();
        if (!token) {
            router.push("/auth/main-admin/login");
            return;
        }

        try {
            const [userRes, instRes, ticketRes] = await Promise.all([
                fetch("http://localhost:5000/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("http://localhost:5000/api/institute", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("http://localhost:5000/api/ticket", { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (userRes.ok) {
                const ud = await userRes.json();
                setUser(ud.user);
            }
            if (instRes.ok) {
                const idat = await instRes.json();
                setInstitute(idat.institute);
            }
            if (ticketRes.ok) {
                const td = await ticketRes.json();
                setTickets(td.tickets);
            }
        } catch (error) {
            console.error("Fetch Data Error:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const submitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setTicketSubmitting(true);
        setTicketSuccess("");
        const token = getAuthToken();
        try {
            const res = await fetch("http://localhost:5000/api/ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(ticketForm)
            });
            if (res.ok) {
                const data = await res.json();
                setTicketSuccess(`Ticket Submitted Successfully. Ticket ID: ${data.ticket.ticketId}`);
                setTicketForm({ title: "", issueType: "Bug", priority: "Medium", description: "" });
                fetchData();
            }
        } catch (error) {}
        setTicketSubmitting(false);
    };

    const handleLogout = () => {
        logoutUser();
        router.push("/auth/main-admin/login");
    };

    if (!user) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>;

    const tabs = [
        { id: "personal", title: "Personal Profile", icon: User },
        { id: "institute", title: "Institute Details", icon: Building2 },
        { id: "security", title: "Account Settings", icon: ShieldCheck },
        { id: "support", title: "Raise Ticket", icon: LifeBuoy }
    ];

    return (
        <div className="space-y-8 pb-10 max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-[2rem] bg-gradient-to-r from-slate-900 to-slate-800 dark:from-black dark:to-[#111] text-white p-8 shadow-2xl flex flex-col md:flex-row items-center gap-6"
            >
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-4xl font-bold shadow-lg shadow-blue-500/20">
                    {user.email.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-3xl font-black mb-1">Main Admin Profile</h2>
                    <p className="text-slate-400 font-medium">{user.email} • Role: {user.role.replace('_', ' ')}</p>
                </div>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <Card className="w-full md:w-64 shrink-0 h-fit rounded-[2rem] border-slate-200 dark:border-[#333] shadow-lg bg-white dark:bg-[#111]">
                    <CardContent className="p-4 space-y-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'hover:bg-slate-100 dark:hover:bg-[#222] text-slate-600 dark:text-slate-400'}`}
                            >
                                <tab.icon className="w-5 h-5"/> {tab.title}
                            </button>
                        ))}
                    </CardContent>
                </Card>

                {/* Main Content Area */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        {activeTab === "personal" && (
                            <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <Card className="border-slate-200 dark:border-[#333] rounded-[2rem] shadow-lg bg-white dark:bg-[#111]">
                                    <CardHeader className="border-b border-slate-100 dark:border-[#222]">
                                        <CardTitle className="text-xl">Personal Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label>Admin Email</Label>
                                                <Input readOnly value={user.email} className="bg-slate-50 dark:bg-black border-slate-200 dark:border-[#333] rounded-xl text-slate-500"/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Role</Label>
                                                <Input readOnly value={"Main Admin"} className="bg-slate-50 dark:bg-black border-slate-200 dark:border-[#333] rounded-xl text-slate-500"/>
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label>Last Login Time</Label>
                                                <Input readOnly value={new Date().toLocaleString()} className="bg-slate-50 dark:bg-black border-slate-200 dark:border-[#333] rounded-xl text-slate-500"/>
                                            </div>
                                        </div>
                                        <div className="pt-4 flex gap-4">
                                            <Button disabled className="rounded-xl font-bold bg-blue-600 text-white"><Save className="w-4 h-4 mr-2"/> Save Changes</Button>
                                            <Button variant="outline" className="rounded-xl font-bold">Edit Profile</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {activeTab === "institute" && institute && (
                            <motion.div key="institute" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <Card className="border-slate-200 dark:border-[#333] rounded-[2rem] shadow-lg bg-white dark:bg-[#111]">
                                    <CardHeader className="border-b border-slate-100 dark:border-[#222]">
                                        <CardTitle className="text-xl">Institute Profile</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label>College Name</Label>
                                                <Input readOnly value={institute.collegeName} className="bg-slate-50 dark:bg-black border-slate-200 dark:border-[#333] rounded-xl"/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Short Name</Label>
                                                <Input readOnly value={institute.shortName} className="bg-slate-50 dark:bg-black border-slate-200 dark:border-[#333] rounded-xl"/>
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label>Address</Label>
                                                <Input readOnly value={`${institute.address}, ${institute.city}, ${institute.state} ${institute.postalCode}`} className="bg-slate-50 dark:bg-black border-slate-200 dark:border-[#333] rounded-xl"/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Official Email</Label>
                                                <Input readOnly value={institute.officialEmail} className="bg-slate-50 dark:bg-black border-slate-200 dark:border-[#333] rounded-xl"/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Contact Number</Label>
                                                <Input readOnly value={institute.phone} className="bg-slate-50 dark:bg-black border-slate-200 dark:border-[#333] rounded-xl"/>
                                            </div>
                                        </div>
                                        <div className="pt-4 flex gap-4">
                                            <Button disabled className="rounded-xl font-bold bg-blue-600 text-white">Edit Institute Details</Button>
                                            <Button variant="outline" className="rounded-xl font-bold">Upload New Logo</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {activeTab === "security" && (
                            <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <Card className="border-slate-200 dark:border-[#333] rounded-[2rem] shadow-lg bg-white dark:bg-[#111]">
                                    <CardHeader className="border-b border-slate-100 dark:border-[#222]">
                                        <CardTitle className="text-xl">Security & Account</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label>New Password</Label>
                                                <Input type="password" placeholder="••••••••" className="rounded-xl border-slate-200 dark:border-[#333]"/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Confirm Password</Label>
                                                <Input type="password" placeholder="••••••••" className="rounded-xl border-slate-200 dark:border-[#333]"/>
                                            </div>
                                        </div>
                                        <div className="pt-2 pb-6 border-b border-slate-100 dark:border-[#222]">
                                            <Button className="rounded-xl font-bold bg-blue-600">Update Password</Button>
                                        </div>
                                        <div>
                                            <Button onClick={handleLogout} variant="danger" className="rounded-xl font-bold w-full sm:w-auto">
                                                <LogOut className="w-4 h-4 mr-2"/> Logout from System
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {activeTab === "support" && (
                            <motion.div key="support" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <Card className="border-slate-200 dark:border-[#333] rounded-[2rem] shadow-lg bg-white dark:bg-[#111]">
                                    <CardHeader className="border-b border-slate-100 dark:border-[#222]">
                                        <CardTitle className="text-xl">Raise Developer Ticket</CardTitle>
                                        <CardDescription>Experiencing issues? Report bugs or request features directly to the development team.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <form onSubmit={submitTicket} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Ticket Title</Label>
                                                <Input required value={ticketForm.title} onChange={e=>setTicketForm({...ticketForm, title: e.target.value})} placeholder="e.g. Unable to upload student list" className="rounded-xl border-slate-200 dark:border-[#333]"/>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Issue Type</Label>
                                                    <select required className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-black text-sm" value={ticketForm.issueType} onChange={e=>setTicketForm({...ticketForm, issueType: e.target.value})}>
                                                        <option>Bug</option>
                                                        <option>Login Issue</option>
                                                        <option>Data Issue</option>
                                                        <option>Feature Request</option>
                                                        <option>Other</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Priority</Label>
                                                    <select required className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-black text-sm" value={ticketForm.priority} onChange={e=>setTicketForm({...ticketForm, priority: e.target.value})}>
                                                        <option>Low</option>
                                                        <option>Medium</option>
                                                        <option>High</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Description</Label>
                                                <textarea required value={ticketForm.description} onChange={e=>setTicketForm({...ticketForm, description: e.target.value})} className="w-full h-32 p-3 rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-black text-sm resize-none" placeholder="Please describe the issue in detail..."/>
                                            </div>
                                            
                                            {ticketSuccess && (
                                                <div className="p-4 rounded-xl bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 font-medium flex items-center gap-2">
                                                    <CheckCircle2 className="w-5 h-5"/> {ticketSuccess}
                                                </div>
                                            )}

                                            <div className="pt-2 flex gap-4">
                                                <Button type="submit" disabled={ticketSubmitting} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white">
                                                    {ticketSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2"/> } Submit Ticket
                                                </Button>
                                                <Button type="button" variant="outline" onClick={()=>setTicketForm({title: "", issueType: "Bug", priority: "Medium", description: ""})} className="rounded-xl font-bold">Clear Form</Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-200 dark:border-[#333] rounded-[2rem] shadow-lg bg-white dark:bg-[#111]">
                                    <CardHeader className="border-b border-slate-100 dark:border-[#222]">
                                        <CardTitle className="text-xl">Ticket History</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {tickets.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500 font-medium font-sm">No tickets submitted yet.</div>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-[#222]">
                                                {tickets.map(t => (
                                                    <div key={t.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-colors">
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                                {t.ticketId} <span className="text-xs uppercase bg-slate-100 dark:bg-[#333] px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{t.issueType}</span>
                                                            </h4>
                                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">{t.title}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-xs font-bold px-3 py-1 pb-1.5 rounded-full inline-block ${
                                                                t.status === 'OPEN' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                            }`}>{t.status}</div>
                                                            <div className="text-[10px] text-slate-400 mt-1">{new Date(t.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
