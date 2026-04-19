'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [error, setError] = useState(false);
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[600px] pb-10">
      
      {/* Left Info Section matched to Main Admin identity */}
      <div className="lg:col-span-5 glass-panel rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-gray-800 to-black text-white shadow-lg border border-gray-800">
          <div className="absolute w-[400px] h-[400px] bg-white rounded-full opacity-5 blur-3xl -top-20 -left-20 pointer-events-none"></div>
          
          <div className="relative z-10">
              <h2 className="text-4xl font-extrabold mb-4 tracking-tight">System Overseer</h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                  Restricted Access. This node is strictly reserved for tier-1 database administrators to orchestrate lower-level faculty hierarchies.
              </p>
          </div>
      </div>

      {/* Right Form Section */}
      <div className="lg:col-span-7 glass-panel rounded-3xl p-8 md:p-12 flex flex-col justify-center bg-white/5 border border-white/5">
          <div className="mb-10 text-center lg:text-left">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Root Override</h3>
              <p className="text-gray-500 dark:text-gray-400">Initialize root session protocol.</p>
          </div>

          <form className="space-y-6 max-w-xl mx-auto lg:mx-0 w-full"
                onSubmit={(e) => { 
                    e.preventDefault(); 
                    // Directly simulate admin login for now (prototyping phase)
                    router.push('/dashboard/admin');
                }}
          >
              <div>
                  <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Root Email Sequence</label>
                  <input required type="email" placeholder="root@sacme.edu" className="w-full min-h-[55px] px-5 py-3 rounded-2xl bg-white/60 dark:bg-black/50 border border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-300 focus:border-gray-800 transition-all outline-none text-gray-800 dark:text-white font-medium shadow-sm" />
              </div>
              
              <div>
                  <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Root Password</label>
                  <input required type="password" placeholder="••••••••" className="w-full min-h-[55px] px-5 py-3 rounded-2xl bg-white/60 dark:bg-black/50 border border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-300 focus:border-gray-800 transition-all outline-none text-gray-800 dark:text-white font-medium shadow-sm" />
              </div>
              
              <button type="submit" className="w-full min-h-[55px] bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-black rounded-2xl font-bold text-lg mt-8 transition-all hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-white/20 flex items-center justify-center gap-2">
                  Engage Root Session
              </button>
          </form>
      </div>
    </div>
  );
}
