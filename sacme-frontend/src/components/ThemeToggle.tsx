'use client';
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse"></div>;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2.5 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors duration-200 border border-transparent dark:border-white/10 relative overflow-hidden group"
      aria-label="Toggle Theme"
    >
      {/* Sun icon for Dark Mode (click to go light) */}
      <Sun className="w-5 h-5 text-yellow-500 absolute inset-0 m-auto transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
      
      {/* Moon icon for Light Mode (click to go dark) */}
      <Moon className="w-5 h-5 text-slate-700 absolute inset-0 m-auto transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      
      {/* Spacer to maintain button size */}
      <div className="w-5 h-5 opacity-0"></div>
    </button>
  );
}
