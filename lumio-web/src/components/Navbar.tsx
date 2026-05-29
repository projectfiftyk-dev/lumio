import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import clsx from 'clsx';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const isAuth = location.pathname === '/auth';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#F5F3FF]/80 backdrop-blur-md border-b border-[#E2DFFF] shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-violet-600 via-violet-700 to-purple-900">
            LUMIO
          </span>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {!isAuth && (
            <button
              onClick={() => navigate('/auth')}
              className="lumio-btn-ghost text-sm py-2 px-4"
            >
              Sign In
            </button>
          )}
          {!isAuth && (
            <button
              onClick={() => navigate('/auth')}
              className="lumio-btn-primary text-sm py-2 px-4"
            >
              Get started
            </button>
          )}
          {isAuth && (
            <button
              onClick={() => navigate('/')}
              className="lumio-btn-ghost text-sm py-2 px-4"
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
