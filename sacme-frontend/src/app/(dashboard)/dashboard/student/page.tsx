export default function StudentDashboard() {
  return (
    <div className="w-full h-full glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">Student Academic Portal</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mb-8 text-lg">
            View your upcoming lectures, course content, and attendance records synchronized directly from your department&apos;s active semester structure.
        </p>
        <div className="px-6 py-3 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-100 dark:border-emerald-500/20">
            Feature Area Under Construction
        </div>
    </div>
  );
}
