"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Lock, Key, Camera, Loader2, Save, Send, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export default function StudentProfile() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Profile Image
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [savingAvatar, setSavingAvatar] = useState(false);

    // Passwords
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);

    // Query
    const [querySubject, setQuerySubject] = useState("");
    const [queryMessage, setQueryMessage] = useState("");
    const [sendingQuery, setSendingQuery] = useState(false);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const token = getAuthToken();
            const res = await fetch(`http://localhost:5000/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                if (data.user.student?.avatarUrl) {
                    setAvatarPreview(`http://localhost:5000${data.user.student.avatarUrl}`);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            alert('Only PNG or JPG files are allowed');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be less than 2MB');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        setSavingAvatar(true);
        try {
            const token = getAuthToken();
            const res = await fetch('http://localhost:5000/api/profile/upload-image', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setAvatarPreview(`http://localhost:5000${data.avatarUrl}`);
            } else {
                alert('Upload failed.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSavingAvatar(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        setSavingPassword(true);
        try {
            const token = getAuthToken();
            const res = await fetch('http://localhost:5000/api/auth/change-password', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (res.ok) {
                alert('Password updated successfully');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update password');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSavingPassword(false);
        }
    };

    const handleRaiseQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendingQuery(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`http://localhost:5000/api/tickets/query`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: querySubject, message: queryMessage })
            });

            if (res.ok) {
                alert("Query sent specifically to administration.");
                setQuerySubject("");
                setQueryMessage("");
            } else alert("Failed to send query. Endpoint might not be fully configured on backend.");
        } catch (error) {
            console.error(error);
        } finally {
            setSendingQuery(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    if (!user || user.role !== 'STUDENT') return <div className="p-8">Access Denied</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Profile & Settings</h1>
                    <p className="text-slate-500 mt-1">Manage your account details, security, and preferences.</p>
                </div>
            </div>

            {/* Profile Overview Card */}
            <Card className="glass-panel overflow-hidden border-none shadow-2xl relative">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 w-full absolute top-0 left-0" />
                <CardContent className="p-8 pt-16 relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-xl flex items-center justify-center">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Profile Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-16 h-16 text-slate-400" />
                            )}
                        </div>
                        <label className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110">
                            {savingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            <input type="file" className="hidden" accept=".jpg,.jpeg,.png" onChange={handleAvatarUpload} disabled={savingAvatar} />
                        </label>
                    </div>

                    <div className="flex-1 pb-2">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.student?.name}</h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                            <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-semibold px-3 py-1 rounded-full text-xs tracking-wider">
                                ROLL N0: {user.student?.rollNo}
                            </span>
                            <span className="text-sm font-medium text-slate-500">{user.email}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Security Settings */}
                <Card className="glass-panel shadow-lg hover:shadow-xl transition-shadow border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="p-2 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-lg">
                                <Lock className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Security Settings</h3>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Current Password</label>
                                <input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">New Password</label>
                                <input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Confirm New Password</label>
                                <input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors" />
                            </div>
                            
                            <div className="pt-4 flex items-center justify-between">
                                <a href="/login" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Forgot password? Log out to reset.</a>
                                <button type="submit" disabled={savingPassword} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md">
                                    {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Help & Support (Raise Query) */}
                <Card className="glass-panel shadow-lg hover:shadow-xl transition-shadow border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-lg">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Help & Support</h3>
                        </div>

                        <p className="text-xs text-slate-500 mb-6">Need assistance with your portal or have an administrative query? Use the form below to raise a ticket.</p>

                        <form onSubmit={handleRaiseQuery} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Subject</label>
                                <input required type="text" value={querySubject} onChange={(e) => setQuerySubject(e.target.value)} placeholder="e.g. Account Error, Missing Grades" className="w-full mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Message</label>
                                <textarea required value={queryMessage} onChange={(e) => setQueryMessage(e.target.value)} rows={4} placeholder="Describe your issue..." className="w-full mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors" />
                            </div>
                            
                            <div className="pt-4 flex justify-end">
                                <button type="submit" disabled={sendingQuery} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-500/20">
                                    {sendingQuery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Submit Ticket
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
