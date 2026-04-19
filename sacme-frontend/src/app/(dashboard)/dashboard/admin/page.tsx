export default function AdminDashboard() {
  return (
    <div className="w-full h-full glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20">
            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">Main Administrative Oversight</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mb-8 text-lg">
            System level root access. Monitor global institutional metrics, register Faculty Advisors, and manage the underlying database structure.
        </p>
        <div className="px-6 py-3 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-100 dark:border-amber-500/20">
            Feature Area Under Construction
        </div>
    </div>
  );
}
