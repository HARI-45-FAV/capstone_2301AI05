'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentLogin() {
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[600px] pb-10">
      
      {/* Left Info Section styled for the Student Portal */}
      <div className="lg:col-span-4 glass-panel rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-pink-500 to-rose-700 text-white shadow-lg">
          <div className="absolute w-[300px] h-[300px] bg-white rounded-full opacity-10 blur-3xl -top-20 -right-20 pointer-events-none"></div>
          
          <div className="relative z-10 w-full h-full flex flex-col">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-white/30">
                  <svg className="w-8 h-8 text-pink-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>
              </div>

              <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Academic Portal</h2>
              <p className="text-pink-100 text-[15px] leading-relaxed mb-8">
                  Student accounts cannot be created manually. Your identity is verified against the official Excel data uploaded by your Faculty Advisor.
              </p>
          </div>
      </div>

      {/* Right Form Section */}
      <div className="lg:col-span-8 glass-panel rounded-3xl p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-10 text-center lg:text-left">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Student Authentication</h3>
              <p className="text-gray-500 dark:text-gray-400">Provide your specific academic details to access your timetable and records.</p>
          </div>

          <form className="space-y-6 max-w-xl mx-auto lg:mx-0 w-full"
                onSubmit={async (e) => { 
                    e.preventDefault(); 
                    setError(false);
                    setSuccess(false);
                    const formData = new FormData(e.currentTarget);
                    const res = await fetch('http://localhost:5000/api/auth/login/student', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(Object.fromEntries(formData))
                    });
                    if (res.ok) {
                        setSuccess(true);
                        setTimeout(() => router.push('/dashboard/student'), 1500);
                    } else setError(true);
                }}
          >
              <div>
                  <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">University Roll Number</label>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                          <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
                      </div>
                      <input required name="rollNo" type="text" placeholder="e.g. 21CS101" className="w-full min-h-[55px] pl-14 pr-5 py-3 rounded-2xl bg-white/60 dark:bg-black/50 border border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-pink-500 transition-all outline-none text-gray-800 dark:text-white font-bold tracking-wider shadow-sm uppercase" />
                  </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Academic Year</label>
                      <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          </div>
                          <select required name="academicYear" defaultValue="" className="w-full min-h-[55px] pl-14 pr-10 py-3 rounded-2xl bg-white/60 dark:bg-black/50 border border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-pink-500 transition-all outline-none text-gray-800 dark:text-white font-medium shadow-sm appearance-none cursor-pointer text-sm">
                              <option value="" disabled>Select Year</option>
                              <option value="1">1st Year (Freshman)</option>
                              <option value="2">2nd Year (Sophomore)</option>
                              <option value="3">3rd Year (Junior)</option>
                              <option value="4">4th Year (Senior)</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                      </div>
                  </div>

                  <div>
                      <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Current Semester</label>
                      <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                          </div>
                          <select required name="semester" defaultValue="" className="w-full min-h-[55px] pl-14 pr-10 py-3 rounded-2xl bg-white/60 dark:bg-black/50 border border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-pink-500 transition-all outline-none text-gray-800 dark:text-white font-medium shadow-sm appearance-none cursor-pointer text-sm">
                              <option value="" disabled>Select Sem</option>
                              <option value="1">Semester 1</option>
                              <option value="2">Semester 2</option>
                              <option value="3">Semester 3</option>
                              <option value="4">Semester 4</option>
                              <option value="5">Semester 5</option>
                              <option value="6">Semester 6</option>
                              <option value="7">Semester 7</option>
                              <option value="8">Semester 8</option>
                          </select>
                           <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                      </div>
                  </div>
              </div>
              
              <button type="submit" className="w-full min-h-[55px] bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-bold text-lg mt-8 transition-all hover:shadow-lg hover:shadow-pink-500/30 flex items-center justify-center gap-2">
                  Access Portal
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
              </button>
              
              {error && (
                <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm font-medium flex gap-3 shadow-inner">
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <span>
                        <strong>Invalid student credentials.</strong><br/>
                        Ensure your Roll Number, Academic Year, and Semester match the officially uploaded records.
                    </span>
                </div>
              )}
              {success && (
                <div className="mt-6 p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 text-sm font-medium flex gap-3 shadow-inner">
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>Portal Session Established! Redirecting...</span>
                </div>
              )}
          </form>
      </div>
    </div>
  );
}
