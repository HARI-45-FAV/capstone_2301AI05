export default function ProfessorDashboard() {
  return (
    <div className="w-full h-full glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center mb-6 border border-fuchsia-500/20">
            <svg className="w-10 h-10 text-fuchsia-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">Instructor Terminal</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mb-8 text-lg">
            Access your assigned courses, manage syllabus materials, and track student attendance within your department scope.
        </p>
        <div className="px-6 py-3 rounded-full bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 font-bold border border-fuchsia-100 dark:border-fuchsia-500/20">
            Feature Area Under Construction
        </div>
    </div>
  );
}
