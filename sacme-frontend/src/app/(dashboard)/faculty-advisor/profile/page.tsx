"use client";
import { getAuthToken } from '@/lib/auth';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Lock, Upload, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState({ name: '', email: '', phone: '', department: '', interests: '', avatarUrl: '' });
    const [previewUrl, setPreviewUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordStrength, setPasswordStrength] = useState('Weak');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const token = getAuthToken();
        if (!token) return router.push('/auth/login');
        
        fetch('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json()).then(data => {
            if (data.user) {
                setProfile(prev => ({ ...prev, email: data.user.email }));
            }
        });
    }, [router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleAvatarUpload = async () => {
        if (!selectedFile) return;
        const formData = new FormData();
        formData.append('avatar', selectedFile);

        const res = await fetch('http://localhost:5000/api/profile/upload-avatar', {
            method: 'POST',
            headers: { Authorization: `Bearer ${getAuthToken()}` },
            body: formData
        });

        if (res.ok) {
            const data = await res.json();
            setProfile(p => ({ ...p, avatarUrl: data.avatarUrl }));
            alert('Avatar updated!');
        } else {
            alert('Failed to upload avatar');
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('http://localhost:5000/api/profile/update', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getAuthToken()}` 
            },
            body: JSON.stringify({ 
                name: profile.name, 
                phone: profile.phone, 
                department: profile.department, 
                interests: profile.interests 
            })
        });

        if (res.ok) alert('Profile updated');
        else alert('Failed to update profile');
    };

    const assessPasswordStrength = (pass: string) => {
        if (pass.length < 6) return 'Weak';
        if (pass.length >= 8 && /[!@#$%^&*]/.test(pass) && /[0-9]/.test(pass)) return 'Strong';
        return 'Medium';
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pass = e.target.value;
        setPasswords(prev => ({ ...prev, newPassword: pass }));
        setPasswordStrength(assessPasswordStrength(pass));
    };

    const submitPasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return alert("Passwords don't match");
        }

        const res = await fetch('http://localhost:5000/api/auth/change-password', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getAuthToken()}` 
            },
            body: JSON.stringify({ 
                currentPassword: passwords.currentPassword, 
                newPassword: passwords.newPassword 
            })
        });

        if (res.ok) {
            alert('Password changed successfully');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to change password');
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-4">
                <button onClick={() => router.push('/faculty-advisor/dashboard')} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:scale-105 transition-transform text-slate-600 dark:text-slate-300">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Profile & Settings</h1>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Avatar Section */}
                <div className="glass-panel p-6 flex flex-col items-center space-y-4">
                    <div className="relative group shrink-0">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                            {previewUrl || profile.avatarUrl ? (
                                <img src={previewUrl || `http://localhost:5000${profile.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-bold text-slate-300 dark:text-slate-600">A</span>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-6 h-6 mb-1" />
                                <span className="text-xs font-medium">Upload Image</span>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
                    </div>

                    {selectedFile && (
                        <button onClick={handleAvatarUpload} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 w-full transition-colors">
                            Save Avatar
                        </button>
                    )}
                </div>

                {/* Profile Details */}
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleProfileUpdate} className="glass-panel p-6 space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 dark:text-white">
                            <Settings className="text-indigo-500" /> Personal Details
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                                <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Dr. John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email Address</label>
                                <input value={profile.email} readOnly className="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Phone Number</label>
                                <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Department</label>
                                <input value={profile.department} onChange={e => setProfile({...profile, department: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Interests</label>
                                <textarea value={profile.interests} onChange={e => setProfile({...profile, interests: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]" placeholder="AI, Machine Learning..." />
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" className="px-6 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors">
                                Update Details
                            </button>
                        </div>
                    </form>

                    {/* Change Password */}
                    <form onSubmit={submitPasswordChange} className="glass-panel p-6 space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 dark:text-white">
                            <Lock className="text-indigo-500" /> Security
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Current Password</label>
                                <input type="password" required value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300 flex justify-between">
                                        New Password 
                                        {passwords.newPassword && (
                                            <span className={`text-xs font-bold ${passwordStrength === 'Strong' ? 'text-green-500' : passwordStrength === 'Medium' ? 'text-amber-500' : 'text-red-500'}`}>
                                                {passwordStrength}
                                            </span>
                                        )}
                                    </label>
                                    <input type="password" required value={passwords.newPassword} onChange={handlePasswordChange} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Confirm Password</label>
                                    <input type="password" required value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" className="px-6 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors">
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
