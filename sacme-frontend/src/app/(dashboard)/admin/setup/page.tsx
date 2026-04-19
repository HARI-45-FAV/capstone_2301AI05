"use client";
import { getAuthToken } from '@/lib/auth';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, UploadCloud, MapPin, User, Mail, Phone, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function InstituteSetupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        collegeName: "",
        shortName: "",
        logoUrl: "",
        address: "",
        state: "",
        city: "",
        postalCode: "",
        adminName: "",
        officialEmail: "",
        phone: "",
        alternatePhone: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        // Basic validation for Step 1
        if (!formData.collegeName || !formData.shortName || !formData.address || !formData.state || !formData.city || !formData.postalCode) {
            setError("Please fill in all mandatory institute details before proceeding.");
            return;
        }
        setError("");
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.adminName || !formData.officialEmail || !formData.phone) {
            setError("Please fill in all mandatory contact details.");
            return;
        }
        
        setIsLoading(true);
        setError("");

        try {
            const token = getAuthToken();
            const response = await fetch("http://localhost:5000/api/institute/setup", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to complete setup.");
                setIsLoading(false);
                return;
            }

            // Success, go to dashboard
            router.push("/admin/dashboard");
        } catch (err) {
            setError("Network error. Please make sure the backend is running.");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 py-8">
            <div className="text-center space-y-4 mb-10">
                <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} 
                    className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-blue-500/20"
                >
                    <Building2 className="w-10 h-10 text-white" />
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                    Institute Setup
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-slate-500 font-medium">
                    Please provide your institution's core details to initialize the system.
                </motion.p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-center mb-12">
                <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${step >= 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-200 text-slate-500'}`}>1</div>
                    <div className={`h-1 w-24 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${step >= 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>2</div>
                </div>
            </div>

            <motion.div 
                layout
                className="bg-white dark:bg-[#111] p-8 sm:p-12 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-[#333] relative overflow-hidden"
            >
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                <form onSubmit={handleSubmit} className="relative z-10">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-8"
                            >
                                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                                    <h2 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-blue-500"/> Institute Details</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>College Name *</Label>
                                        <Input name="collegeName" value={formData.collegeName} onChange={handleChange} placeholder="e.g. National Institute of Technology" className="h-12 bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 rounded-xl" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Short Name / Acronym *</Label>
                                        <Input name="shortName" value={formData.shortName} onChange={handleChange} placeholder="e.g. NIT" className="h-12 bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 rounded-xl" required />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Logo URL</Label>
                                        <div className="flex gap-2">
                                            <Input name="logoUrl" value={formData.logoUrl} onChange={handleChange} placeholder="https://..." className="h-12 bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 rounded-xl" />
                                            <Button type="button" variant="outline" className="h-12 px-6 rounded-xl border-slate-200 dark:border-slate-800"><UploadCloud className="w-4 h-4 mr-2"/> Browse</Button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 md:col-span-2 mt-4">
                                        <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400"/> Address *</Label>
                                        <Input name="address" value={formData.address} onChange={handleChange} placeholder="123 Campus Road" className="h-12 bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 rounded-xl" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City *</Label>
                                        <Input name="city" value={formData.city} onChange={handleChange} placeholder="City" className="h-12 bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 rounded-xl" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>State *</Label>
                                        <Input name="state" value={formData.state} onChange={handleChange} placeholder="State" className="h-12 bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 rounded-xl" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Postal Code *</Label>
                                        <Input name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="000000" className="h-12 bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 rounded-xl" required />
                                    </div>
                                </div>

                                {error && <p className="text-red-500 text-sm font-medium mt-4">{error}</p>}

                                <div className="flex justify-end pt-6">
                                    <Button type="button" onClick={nextStep} className="h-12 px-8 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                                        Continue to Contact Details <ArrowRight className="ml-2 w-4 h-4"/>
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                                    <h2 className="text-2xl font-bold flex items-center gap-2"><User className="w-6 h-6 text-purple-500"/> Main Admin Contact</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Full Name *</Label>
                                        <Input name="adminName" value={formData.adminName} onChange={handleChange} placeholder="Dr. John Doe" className="h-12 bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 rounded-xl" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400"/> Official Email ID *</Label>
                                        <Input name="officialEmail" type="email" value={formData.officialEmail} onChange={handleChange} placeholder="admin@college.edu" className="h-12 bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 rounded-xl" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400"/> Phone Number *</Label>
                                        <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 234 567 890" className="h-12 bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 rounded-xl" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Alternate Contact (Optional)</Label>
                                        <Input name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} placeholder="+1 098 765 432" className="h-12 bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 rounded-xl" />
                                    </div>
                                </div>

                                {error && <p className="text-red-500 text-sm font-medium mt-4">{error}</p>}

                                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
                                    <Button type="button" variant="ghost" onClick={() => setStep(1)} className="h-12 px-6 rounded-xl text-slate-500">
                                        Back 
                                    </Button>
                                    <Button type="submit" disabled={isLoading} className="h-12 px-8 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20">
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                                        {isLoading ? "Saving..." : "Complete Setup"}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </motion.div>
        </div>
    );
}
