import { useState } from 'react';
import clsx from 'clsx';
import Sidebar from './Sidebar';
import PathsView from './PathsView';
import { useApp } from '../context/AppContext';

type NavItem = 'paths';

export default function PlatformLayout() {
  const [active, setActive] = useState<NavItem>('paths');
  const { theme } = useApp();

  return (
    <div className={clsx('flex h-screen overflow-hidden bg-[#F5F3FF] dark:bg-[#0f0e1a]', theme === 'dark' && 'dark')}>
      <Sidebar active={active} onNavigate={setActive} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {active === 'paths' && <PathsView />}
      </main>
    </div>
  );
}
