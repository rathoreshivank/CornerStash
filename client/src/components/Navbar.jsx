import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, LayoutDashboard, LogOut, Search, Store, ShieldCheck } from 'lucide-react';
import API_URL from '../config';
import SafetyTipsModal from './SafetyTipsModal';

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [navSearch, setNavSearch] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Poll / check pending requests count for current user
  useEffect(() => {
    if (!token || !user) {
      setPendingCount(0);
      return;
    }

    let isMounted = true;
    async function checkPending() {
      try {
        const res = await fetch(`${API_URL}/api/requests/pending-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setPendingCount(data.count || 0);
        }
      } catch {
        // Silently ignore
      }
    }

    checkPending();
    return () => {
      isMounted = false;
    };
  }, [token, user]);

  function handleNavSearchSubmit(e) {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/?q=${encodeURIComponent(navSearch.trim())}`);
    } else {
      navigate('/');
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">

            {/* Logo & Brand Wordmark: CornerStash */}
            <Link
              to="/"
              className="flex items-center gap-2.5 text-stone-900 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] rounded-lg"
            >
              <div className="w-9 h-9 rounded-lg bg-[#1B5E3C] text-white flex items-center justify-center font-extrabold text-base shadow-sm group-hover:bg-[#164E31] transition-colors">
                <Store className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight text-stone-900 leading-none group-hover:text-[#1B5E3C] transition-colors">
                  CornerStash
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 leading-tight mt-0.5">
                  Neighborhood Free
                </span>
              </div>
            </Link>

            {/* Desktop Search bar */}
            <form
              onSubmit={handleNavSearchSubmit}
              className="hidden md:flex flex-1 max-w-md mx-4 relative"
            >
              <div className="relative w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search items near you (books, furniture, tech)…"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  className="w-full min-h-[40px] pl-10 pr-4 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] transition-all"
                />
              </div>
            </form>

            {/* Navigation Actions */}
            <nav className="flex items-center gap-2 sm:gap-3 text-sm">
              <button
                type="button"
                onClick={() => setShowSafetyModal(true)}
                className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                title="Neighborhood Safety Tips"
              >
                <ShieldCheck className="w-4 h-4 text-[#1B5E3C]" />
                <span>Safety Guide</span>
              </button>

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`min-h-[40px] px-3 py-2 flex items-center gap-1.5 rounded-lg text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] relative ${
                      location.pathname === '/dashboard' ? 'bg-stone-100 text-stone-900 font-bold' : 'font-medium'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-stone-500" />
                    <span className="hidden sm:inline">Dashboard</span>
                    {pendingCount > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold text-white bg-emerald-700 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/add"
                    className="min-h-[40px] px-3.5 py-2 flex items-center gap-1.5 rounded-lg bg-[#1B5E3C] hover:bg-[#164E31] text-white font-semibold text-sm transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] focus-visible:ring-offset-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>List item</span>
                  </Link>

                  <Link
                    to="/profile"
                    className={`min-h-[40px] px-2.5 py-1.5 flex items-center gap-2 rounded-lg text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] ${
                      location.pathname === '/profile' ? 'bg-stone-100 border-stone-200 text-stone-900 font-bold' : 'font-medium'
                    }`}
                    title="My Profile & Credibility"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover border border-[#1B5E3C]"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#1B5E3C] flex items-center justify-center font-bold text-xs">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline text-xs font-semibold text-stone-800 truncate max-w-[110px]">
                      {user.name}
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign out"
                    className="min-h-[40px] p-2 sm:px-2.5 sm:py-2 flex items-center gap-1 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs font-semibold">Sign out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="min-h-[40px] px-3.5 py-2 text-stone-700 hover:text-stone-900 font-semibold rounded-lg hover:bg-stone-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C]"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="min-h-[40px] px-4 py-2 bg-[#1B5E3C] hover:bg-[#164E31] text-white font-semibold rounded-lg transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] focus-visible:ring-offset-2"
                  >
                    Join
                  </Link>
                </>
              )}
            </nav>

          </div>
        </div>
      </header>

      {/* Safety Tips Modal */}
      {showSafetyModal && (
        <SafetyTipsModal onClose={() => setShowSafetyModal(false)} />
      )}
    </>
  );
}
