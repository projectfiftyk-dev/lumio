import { useState } from 'react';
import { Sparkles, BookOpen, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../context/AppContext';
import AccountSettings from './AccountSettings';

type NavItem = 'paths';

interface Props {
  active: NavItem;
  onNavigate: (item: NavItem) => void;
}

export default function Sidebar({ active, onNavigate }: Props) {
  const { isEditMode } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <aside className="w-64 flex-shrink-0 h-screen flex flex-col border-r border-[#E2DFFF] bg-white dark:bg-[#12112a] dark:border-[#2d2b47]">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[#E2DFFF] dark:border-[#2d2b47]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200 dark:shadow-violet-900/40">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-2xl text-[#1A1839] dark:text-white tracking-tight">LUMIO</span>
        </div>
        {isEditMode && (
          <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 rounded-full px-2.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
            Edit mode
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-xs font-semibold text-violet-300 dark:text-violet-600 uppercase tracking-wider px-2 mb-2">Paths</p>
        <button
          onClick={() => onNavigate('paths')}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
            active === 'paths'
              ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800'
              : 'text-violet-500 dark:text-violet-400 hover:bg-[#F5F3FF] dark:hover:bg-[#1a1833] hover:text-violet-700 dark:hover:text-violet-300'
          )}
        >
          <BookOpen className="w-4 h-4 flex-shrink-0" />
          Paths
        </button>
      </nav>

      {/* Account Settings */}
      <div className="border-t border-[#E2DFFF] dark:border-[#2d2b47] pt-2 pb-3">
        {settingsOpen && <AccountSettings />}
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          className={clsx(
            'w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-200 cursor-pointer',
            settingsOpen
              ? 'text-violet-700 dark:text-violet-300'
              : 'text-violet-400 dark:text-violet-500 hover:text-violet-600 dark:hover:text-violet-300'
          )}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          Account settings
        </button>
      </div>
    </aside>
  );
}
