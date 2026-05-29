import { Sun, Moon, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function AccountSettings() {
  const { theme, setTheme } = useApp();
  const navigate = useNavigate();

  return (
    <div className="mx-2 mb-1 p-3 rounded-xl bg-[#F5F3FF] dark:bg-[#0f0e1a] border border-[#E2DFFF] dark:border-[#2d2b47] space-y-3">
      <div>
        <p className="text-xs font-semibold text-violet-400 dark:text-violet-500 uppercase tracking-wider mb-2">Theme</p>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('light')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer',
              theme === 'light'
                ? 'bg-white dark:bg-[#1a1833] text-violet-700 dark:text-violet-300 shadow-sm border border-[#E2DFFF] dark:border-[#2d2b47]'
                : 'text-violet-400 dark:text-violet-500 hover:text-violet-600 dark:hover:text-violet-300'
            )}
          >
            <Sun className="w-3.5 h-3.5" />
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer',
              theme === 'dark'
                ? 'bg-[#1A1839] text-white shadow-sm'
                : 'text-violet-400 dark:text-violet-500 hover:text-violet-600 dark:hover:text-violet-300'
            )}
          >
            <Moon className="w-3.5 h-3.5" />
            Dark
          </button>
        </div>
      </div>

      <div className="border-t border-[#E2DFFF] dark:border-[#2d2b47] pt-2">
        <button
          onClick={() => navigate('/auth')}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-violet-400 dark:text-violet-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}
