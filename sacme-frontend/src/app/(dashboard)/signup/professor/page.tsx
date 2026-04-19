'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfessorSignup() {
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[600px] pb-10">
      
      {/* Left Info Section matched to Professor identity */}
      <div className="lg:col-span-4 glass-panel rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-800 text-white shadow-lg">
          <div className="absolute w-[300px] h-[300px] bg-white rounded-full opacity-10 blur-3xl -bottom-20 -right-20 pointer-events-none"></div>
          
          <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-white/30">
                 <svg className="w-8 h-8 text-purple-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>

              <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Instructor Activation</h2>
              <p className="text-purple-100 text-[15px] leading-relaxed mb-6">
                  Instructor accounts are firmly managed by your internal Faculty Advisor during semester orchestration. 
              </p>
          </div>
      </div>

      {/* Right Form Section */}
      <div className="lg:col-span-8 glass-panel rounded-3xl p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-10 text-center lg:text-left">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Professor Gateway</h3>
              <p className="text-gray-500 dark:text-gray-400">Initialize your environment to manage your assigned courses.</p>
          </div>

          <form className="space-y-6 max-w-xl mx-auto lg:mx-0 w-full"
                onSubmit={async (e) => { 
                    e.preventDefault(); 
                    setError(false);
                    setSuccess(false);
                    const formData = new FormData(e.currentTarget);
                    const res = await fetch('http://localhost:5000/api/auth/signup/professor', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(Object.fromEntries(formData))
                    });
                    if (res.ok) {
                        setSuccess(true);
                        setTimeout(() => router.push('/dashboard/professor'), 1500);
                    } else setError(true);
                }}
          >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Instructor ID</label>
                      <input required name="instructorId" type="text" placeholder="e.g. FAC203" className="w-full min-h-[55px] px-5 py-3 rounded-2xl bg-white/60 dark:bg-black/50 border border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-purple-500 transition-all outline-none text-gray-800 dark:text-white font-medium shadow-sm" />
                  </div>
                  <div>
                      <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">College Email</label>
                      <input required name="email" type="email" placeholder="instructor@college.edu" className="w-full min-h-[55px] px-5 py-3 rounded-2xl bg-white/60 dark:bg-black/50 border border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-purple-500 transition-all outline-none text-gray-800 dark:text-white font-medium shadow-sm" />
                  </div>
              </div>

              <div>
                  <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Secure Password</label>
                  <input required name="password" type="password" placeholder="••••••••" className="w-full min-h-[55px] px-5 py-3 rounded-2xl bg-white/60 dark:bg-black/50 border border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-purple-500 transition-all outline-none text-gray-800 dark:text-white font-medium shadow-sm" />
              </div>
              
              <button type="submit" className="w-full min-h-[55px] bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-lg mt-8 transition-all hover:shadow-xl hover:shadow-purple-500/30 flex items-center justify-center gap-2">
                  Verify Record Details
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
              
              {error && (
                <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm font-medium flex gap-3 shadow-inner">
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>
                        <strong>Instructor details not found.</strong><br/>
                        Please contact your respective Faculty Advisor immediately to rectify your DB record.
                    </span>
                </div>
              )}
              {success && (
                <div className="mt-6 p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 text-sm font-medium flex gap-3 shadow-inner">
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>Account Activated! Routing to Terminal...</span>
                </div>
              )}
          </form>
      </div>
    </div>
  );
}
