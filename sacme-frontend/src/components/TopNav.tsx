"use client";
import { getAuthToken, logoutUser } from '@/lib/auth';
import Link from 'next/link';
import { useState, useEffect } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { ThemeToggle } from "./ThemeToggle";
import { LogOut, Bell } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

export default function TopNav() {
    const pathname = usePathname();
    const router = useRouter();
    
    // Capitalize path segments for breadcrumbs
    const segments = pathname.split('/').filter(Boolean);
    let pageTitle = 'Dashboard';
    if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        // If the last segment is likely an ID (e.g. UUID), use the parent segment
        if (lastSegment.length > 20) {
            pageTitle = segments.length > 1 ? segments[segments.length - 2].replace('-', ' ') : 'Dashboard';
        } else {
            pageTitle = lastSegment.replace('-', ' ');
        }
    }
        
    const finalTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);
    const basePath = segments.length > 0 ? `/${segments[0]}` : '/admin';

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:5000/api/auth/logout', { method: 'POST' });
        } catch (e) {} 
        logoutUser();
        router.push('/auth/login');
    };

    const [notifications, setNotifications] = useState<any[]>([]);
    const [showBell, setShowBell] = useState(false);
    const [navUser, setNavUser] = useState<any>(null);

    useEffect(() => {
        const fetchNavUser = async (token: string) => {
            try {
                const res = await fetch(`http://localhost:5000/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
                if(res.ok) {
                    const data = await res.json();
                    setNavUser(data.user);
                }
            } catch(e) {}
        };

        const fetchNotifs = async () => {
            try {
                const token = getAuthToken();
                if(!token) return;
                if(!navUser) fetchNavUser(token);
                const res = await fetch(`http://localhost:5000/api/notifications/mine`, { headers: { 'Authorization': `Bearer ${token}` } });
                if(res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications || []);
                }
            } catch (e) {}
        };
        fetchNotifs();
        const pollNotifs = setInterval(() => {
            if (document.visibilityState === "visible") fetchNotifs();
        }, 15000);
        return () => clearInterval(pollNotifs);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const token = getAuthToken();
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n));
        } catch(e){}
    };

    const handleNotificationClick = async (n: any) => {
        if (!n.isRead) await markAsRead(n.id);
        setShowBell(false);
        if (n.linkUrl) {
            router.push(n.linkUrl);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <header className="w-full h-16 glass-panel border-x-0 border-t-0 rounded-none flex items-center justify-between px-6 sticky top-0 z-40 bg-white/40 dark:bg-[#020617]/40">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white capitalize truncate hidden sm:block">
                    {finalTitle}
                </h1>
            </div>

            {/* Global Search — shown for admin/professor */}
            {(basePath === '/admin' || basePath === '/main-admin' || basePath === '/professor') && (
                <div className="flex-1 max-w-md mx-4 hidden md:block">
                    <GlobalSearch />
                </div>
            )}
            
            <div className="flex items-center gap-4 flex-1 justify-end">
                <div className="flex items-center gap-3">
                    <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold transition-colors">
                        <LogOut className="w-4 h-4" /> <span className="hidden sm:block">Log Out</span>
                    </button>

                    <div className="relative">
                        <button onClick={() => setShowBell(!showBell)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 transition-colors relative">
                            <Bell className="w-5 h-5"/>
                            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900"></span>}
                        </button>
                        {showBell && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden z-50">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold flex justify-between">
                                    Notifications <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 && <div className="p-4 text-center text-sm text-slate-500">No notifications.</div>}
                                    {notifications.map(n => (
                                        <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'opacity-75'}`}>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</p>
                                            <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md items-center shadow-sm">
                        <ThemeToggle />
                    </div>
                    
                    <Link href={`${basePath}/profile`}>
                        {navUser && navUser.student?.avatarUrl ? (
                            <img src={`http://localhost:5000${navUser.student.avatarUrl}`} alt="Avatar" className="ml-2 w-9 h-9 rounded-full object-cover shadow-md hover:scale-105 transition-transform" />
                        ) : navUser && navUser.professor?.avatarUrl ? (
                            <img src={`http://localhost:5000${navUser.professor.avatarUrl}`} alt="Avatar" className="ml-2 w-9 h-9 rounded-full object-cover shadow-md hover:scale-105 transition-transform" />
                        ) : (
                            <div className="ml-2 h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm cursor-pointer shadow-md shadow-indigo-500/20 hover:scale-105 transition-transform">
                                {navUser?.student?.name?.charAt(0) || navUser?.professor?.name?.charAt(0) || 'U'}
                            </div>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    );
}
