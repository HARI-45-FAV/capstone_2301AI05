'use client';

import Link from 'next/link';

export default function RoleSelection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 h-full pb-10">
      
      {/* Left Banner Widget (Mimicking premium hero element) */}
      <div className="lg:col-span-3 xl:col-span-4 glass-panel rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-white/90 to-indigo-50/90 relative overflow-hidden h-[300px]">
          
            {/* Decorative abstract shape */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-gradient-to-br from-indigo-200/40 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute right-40 -bottom-20 w-60 h-60 bg-gradient-to-br from-pink-200/40 to-yellow-200/20 rounded-full blur-3xl"></div>

          <div className="max-w-xl relative z-10 w-full">
              <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs mb-4 uppercase tracking-wider">Access Control</span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">Identity Verification Gateway</h2>
              <p className="text-gray-500 text-lg">No open registration is permitted. Select your assigned institutional role to proceed with pre-registered verification.</p>
          </div>
          
          <div className="hidden md:flex flex-col bg-white/60 p-6 rounded-2xl shadow-sm border border-gray-100 relative z-10 w-80 h-full justify-center">
              <h4 className="font-bold text-gray-800 mb-2">Network Status</h4>
              <div className="flex items-center gap-3 mb-4">
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                  </span>
                  <span className="text-gray-600 font-medium font-mono text-sm">Secure Connection</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <span className="text-xs text-gray-400 text-right w-full block">Database Sync Active</span>
          </div>
      </div>

      {/* Role Selection Cards styled as Heavy Widgets */}
      <Link href="/signup/faculty" className="glass-panel rounded-3xl p-6 group cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10 transition-all border border-transparent hover:border-indigo-100 flex flex-col h-[350px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start mb-auto">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              </div>
              <span className="text-gray-300 group-hover:text-indigo-600 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path></svg></span>
          </div>
          <div className="mt-8">
              <div className="flex justify-between items-end mb-2">
                  <h3 className="text-3xl font-bold text-gray-900 leading-none">Faculty Advisor</h3>
              </div>
              <p className="text-gray-500 mt-3 font-medium text-sm leading-relaxed">Departmental Head & Institute Level Admins. Responsible for term setup.</p>
          </div>
          {/* Mock Chart Element inside card */}
          <div className="w-full mt-6 h-16 flex items-end gap-1 opacity-60">
              <div className="w-1/6 bg-indigo-200 rounded-t-sm h-1/4 group-hover:bg-indigo-400 transition-colors duration-200"></div>
              <div className="w-1/6 bg-indigo-200 rounded-t-sm h-2/4 group-hover:bg-indigo-400 transition-colors duration-300"></div>
              <div className="w-1/6 bg-indigo-200 rounded-t-sm h-3/4 group-hover:bg-indigo-500 transition-colors duration-500"></div>
              <div className="w-1/6 bg-indigo-200 rounded-t-sm h-full group-hover:bg-indigo-600 transition-colors duration-700"></div>
              <div className="w-1/6 bg-indigo-200 rounded-t-sm h-2/4 group-hover:bg-indigo-500 transition-colors duration-500"></div>
              <div className="w-1/6 bg-indigo-200 rounded-t-sm h-1/4 group-hover:bg-indigo-400 transition-colors duration-200"></div>
          </div>
      </Link>

      <Link href="/signup/professor" className="glass-panel rounded-3xl p-6 group cursor-pointer hover:shadow-xl hover:shadow-purple-500/10 transition-all border border-transparent hover:border-purple-100 flex flex-col h-[350px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start mb-auto">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <span className="text-gray-300 group-hover:text-purple-600 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path></svg></span>
          </div>
          <div className="mt-8">
              <div className="flex justify-between items-end mb-2">
                  <h3 className="text-3xl font-bold text-gray-900 leading-none">Professor</h3>
              </div>
              <p className="text-gray-500 mt-3 font-medium text-sm leading-relaxed">Course Instructors & Lecturers. Manage assignments and student marks.</p>
          </div>
            {/* Mock Scatter/Dots Chart Element */}
            <div className="w-full mt-6 h-16 relative opacity-60">
              <div className="absolute w-3 h-3 rounded-full bg-purple-300 group-hover:bg-purple-500 transition-colors duration-300 top-[20%] left-[10%]"></div>
              <div className="absolute w-4 h-4 rounded-full bg-purple-200 group-hover:bg-purple-600 transition-colors duration-500 top-[60%] left-[30%]"></div>
              <div className="absolute w-2 h-2 rounded-full bg-purple-400 group-hover:bg-purple-400 transition-colors duration-200 top-[30%] left-[50%]"></div>
              <div className="absolute w-5 h-5 rounded-full bg-purple-300 group-hover:bg-purple-700 transition-colors duration-700 top-[10%] left-[70%]"></div>
              <div className="absolute w-3 h-3 rounded-full bg-purple-200 group-hover:bg-purple-500 transition-colors duration-400 top-[70%] left-[85%]"></div>
            </div>
      </Link>

      <Link href="/login/student" className="glass-panel rounded-3xl p-6 group cursor-pointer hover:shadow-xl hover:shadow-pink-500/10 transition-all border border-transparent hover:border-pink-100 flex flex-col h-[350px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start mb-auto">
              <div className="w-16 h-16 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shadow-inner">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>
              </div>
              <span className="text-gray-300 group-hover:text-pink-600 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path></svg></span>
          </div>
          <div className="mt-8">
              <div className="flex justify-between items-end mb-2">
                  <h3 className="text-3xl font-bold text-gray-900 leading-none">Student</h3>
              </div>
              <p className="text-gray-500 mt-3 font-medium text-sm leading-relaxed">Academic End-Users. Access courses, view grades, and daily schedules.</p>
          </div>
          {/* Mock Donut Chart Element */}
          <div className="w-full mt-6 h-16 flex justify-end items-end opacity-60">
              <div className="w-16 h-16 rounded-full border-4 border-pink-100 border-t-pink-200 border-r-pink-300 group-hover:border-t-pink-400 group-hover:border-r-pink-500 group-hover:rotate-180 transition-all duration-1000 flex items-center justify-center">
                  <span className="w-10 h-10 bg-white rounded-full"></span>
              </div>
          </div>
      </Link>

      {/* Notice / Information Widget */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between h-[350px] relative overflow-hidden bg-gray-50/50">
          <div>
              <div className="flex items-center gap-2 text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full w-max text-sm font-semibold mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  Important Notice
              </div>
              <h3 className="font-bold text-gray-800 text-xl mb-3">Zero Open Registration</h3>
              <p className="text-gray-600 text-[13px] leading-relaxed mb-4">
                  SACME employs rigorous Role-Based Access Control (RBAC). No public invitations are allowed. 
                  Users must be explicitly pre-registered by authorized administrators into the `FacultyAdvisors`, `Professors`, or `Students` databases.
              </p>
          </div>
          
          <button className="mt-auto w-full bg-gray-900 hover:bg-black text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold transition-colors min-h-[50px] shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Root Admin Override
          </button>
      </div>
    </div>
  );
}
