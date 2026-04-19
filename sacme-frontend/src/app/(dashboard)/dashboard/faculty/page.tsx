export default function FacultyDashboard() {
  return (
    <div className="w-full h-full glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
            <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">Faculty Advisor Portal</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mb-8 text-lg">
            Welcome to the centralized management hub. From here you can orchestrate professor assignments, manage course offerings, and upload student data cohorts.
        </p>
        <div className="px-6 py-3 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-500/20">
            Feature Area Under Construction
        </div>
    </div>
  );
}
