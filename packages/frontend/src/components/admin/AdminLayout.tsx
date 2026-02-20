'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { useEffect, useState } from 'react';
// Material UI icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CategoryIcon from '@mui/icons-material/Category';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { admin, isLoading, adminLogout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push('/admin/login');
    }
  }, [admin, isLoading, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      setMobileOpen(false);
      await adminLogout();
      router.replace('/admin/login');
    } catch (err) {
      router.replace('/admin/login');
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return pathname === '/admin/dashboard';
    }
    if (path === '/admin/bets') {
      return pathname === '/admin/bets' || pathname?.startsWith('/admin/bets?');
    }
    return pathname?.startsWith(path);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-200 border-t-purple-600"></div>
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  const navItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon fontSize="small" />,
    },
    {
      href: '/admin/ai-bets',
      label: 'Review AI Bets',
      icon: <PsychologyIcon fontSize="small" />,
    },
    {
      href: '/admin/bets',
      label: 'View All Bets',
      activeCheck: () => isActive('/admin/bets') && !pathname?.includes('/create'),
      icon: <ListAltIcon fontSize="small" />,
    },
    {
      href: '/admin/bets/create',
      label: 'Create Bet',
      activeCheck: () => pathname === '/admin/bets/create',
      icon: <AddCircleOutlineIcon fontSize="small" />,
    },
    {
      href: '/admin/categories',
      label: 'Categories',
      icon: <CategoryIcon fontSize="small" />,
    },
    {
      href: '/admin/users',
      label: 'Users',
      icon: <PeopleIcon fontSize="small" />,
    },
  ];

  const logoutIcon = <LogoutIcon fontSize="small" />;

  const navMainItems = navItems.slice(0, 5); // Dashboard through Categories
  const navOtherItems = navItems.slice(5);    // Users

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo + Brand */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-xl font-bold text-gray-900">WeBet</span>
          <span className="ml-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-600 text-white rounded-md">Admin</span>
        </div>
        {/* divider between logo and menu */}
        <div className="mt-4 border-b border-gray-100" />
      </div>

      {/* Main Menu Section */}
      <div className="px-5 mt-2 mb-3">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Main Menu</p>
      </div>
      <nav className="px-3 space-y-0.5">
        {navMainItems.map((item) => {
          const active = item.activeCheck ? item.activeCheck() : isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Others Section */}
      <div className="px-5 mt-6 mb-3">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Others</p>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {navOtherItems.map((item) => {
          const active = item.activeCheck ? item.activeCheck() : isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout at Bottom */}
      <div className="px-3 pb-5 mt-auto border-t border-gray-100 pt-4">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          {logoutIcon}
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:block w-64 shrink-0 h-screen overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* ─── Mobile Sidebar Overlay ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 shadow-2xl flex flex-col animate-slide-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-4 z-10 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SidebarContent isMobile />
          </div>
        </div>
      )}

      {/* ─── Main Area ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile-only header (hamburger + logo) */}
        <header className="shrink-0 bg-white border-b border-gray-200 z-30 md:hidden">
          <div className="flex items-center gap-3 px-4 h-14">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              <Logo />
              <h1 className="text-lg font-bold text-gray-900">WeBet</h1>
            </div>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex shrink-0 items-center justify-between bg-white border-b border-gray-200 px-8 h-16 z-30">
          <p className="text-base font-medium text-gray-800">Welcome Admin! 👋</p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Admin</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
              A
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>

      {/* ─── Logout Confirmation Modal ─── */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !loggingOut && setShowLogoutModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Are you sure you want to logout?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              You will be redirected to the login page.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loggingOut ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Logging out…
                  </>
                ) : (
                  'Confirm Logout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
