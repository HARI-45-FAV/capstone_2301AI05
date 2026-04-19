'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FacultySignup() {
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[600px] pb-10">
      
      {/* Left Info Section matched to Faculty identity */}
      <div className="lg:col-span-5 glass-panel rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg">
          <div className="absolute w-[400px] h-[400px] bg-white rounded-full opacity-10 blur-3xl -top-20 -left-20 pointer-events-none"></div>
          
          <div className="relative z-10">
              <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Identity Activation</h2>
              <p className="text-indigo-100 text-lg leading-relaxed mb-8">
                  Welcome to SACME. Your account mapping must be pre-authorized by higher administration. Please verify your exact database credentials to activate your dashboard.
              </p>
              
              <div className="bg-black/20 rounded-2xl p-6 backdrop-blur-md border border-white/10">
                  <h4 className="font-bold text-indigo-100 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      System Protocol
                  </h4>
                  <ul className="space-y-3 text-sm text-indigo-50 leading-relaxed">
                      <li className="flex items-start gap-2">
                          <span className="bg-indigo-500/50 p-1 rounded-full mt-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></span>
                          <span>Verify if <strong>faculty_id</strong> AND <strong>email</strong> exist in DB.</span>
                      </li>
                      <li className="flex items-start gap-2">
                          <span className="bg-indigo-500/50 p-1 rounded-full mt-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></span>
                          <span>Check if status is strictly <strong>NOT_REGISTERED</strong>.</span>
                      </li>
                  </ul>
              </div>
          </div>
      </div>

      {/* Right Form Section */}
      <div className="lg:col-span-7 glass-panel rounded-3xl p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-10 text-center lg:text-left">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Faculty Account Initialization</h3>
              <p className="text-gray-500 dark:text-gray-400">Provide your assigned credentials to unlock your dashboard port.</p>
          </div>

          <form className="space-y-6 max-w-xl mx-auto lg:mx-0 w-full"
                onSubmit={async (e) => { 
                      e.preventDefault(); 
                      setError(false);
                      setSuccess(false);
                      const formData = new FormData(e.currentTarget);
                      const res = await fetch('http://localhost:5000/api/auth/signup/faculty-advisor', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(Object.fromEntries(formData))
                      });
                      if (res.ok) {
                          setSuccess(true);
                          setTimeout(() => router.push('/dashboard/faculty'), 1500);
                      }
                      else setError(true);
                  }}
          >
              <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Assigned Faculty ID</label>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
                      </div>
                      <input required name="facultyId" type="text" placeholder="e.g. FAC001" className="w-full min-h-[55px] pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-800 dark:text-white font-medium" />
                  </div>
              </div>
              
              <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Official College Email</label>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      </div>
                      <input required name="email" type="email" placeholder="faculty@college.edu" className="w-full min-h-[55px] pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-800 dark:text-white font-medium" />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Set Password</label>
                      <input required name="password" type="password" placeholder="••••••••" className="w-full min-h-[55px] px-4 py-3 rounded-2xl bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-800 dark:text-white font-medium" />
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                      <input required type="password" placeholder="••••••••" className="w-full min-h-[55px] px-4 py-3 rounded-2xl bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-800 dark:text-white font-medium" />
                  </div>
              </div>
              
              <button type="submit" className="w-full min-h-[55px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg mt-6 transition-all hover:shadow-xl flex items-center justify-center gap-2">
                  Verify Identity & Activate
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
              
              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm font-medium flex gap-2 animate-pulse">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Unauthorized registration. Please contact the system administrator if this is an error.
                </div>
              )}
              {success && (
                <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 text-sm font-medium flex gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Account Verified and Activated! Redirecting to Dashboard...
                </div>
              )}
          </form>
      </div>
    </div>
  );
}
