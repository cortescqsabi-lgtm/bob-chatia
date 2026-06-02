'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import TrialBlock from '@/components/TrialBlock';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState('U');
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      router.replace('/auth/login');
      return;
    }
    const r = localStorage.getItem('userRole') || 'admin';
    setRole(r);
    try {
      const u = JSON.parse(storedUser);
      if (u?.name) setUserName(u.name.charAt(0).toUpperCase());
      else if (u?.email) setUserName(u.email.charAt(0).toUpperCase());
    } catch {}
    if (r === 'vendedor' && pathname !== '/dashboard') {
      router.replace('/dashboard');
    }
  }, [pathname, router]);

  // Fecha menu do usuário ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    router.push('/auth/login');
  };

  const allMenuItems = [
    { label: 'Conversas', href: '/dashboard' },
    { label: 'Produtos', href: '/dashboard/products' },
    { label: 'Analytics', href: '/dashboard/analytics' },
    { label: 'Config AI', href: '/dashboard/ai-config' },
    { label: 'Configurações', href: '/dashboard/settings' },
    { label: 'Ajuda', href: '/dashboard/help' },
  ];

  const menuItems = role === 'vendedor'
    ? [allMenuItems[0], allMenuItems[4]] // Conversas + Ajuda
    : allMenuItems;

  const currentItem = allMenuItems.find((item) => item.href === pathname) || allMenuItems[0];
  const isChatPage = pathname === '/dashboard';

  if (role === 'vendedor' && pathname !== '/dashboard' && pathname !== '/dashboard/help') {
    return null;
  }

  if (isChatPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrialBlock />
      <header className="relative z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0084c7] text-sm font-bold text-white">V</span>
            <span className="hidden text-base font-bold text-gray-900 sm:inline">VendaZap 360</span>
          </Link>

          {/* Nav menu dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <span>{currentItem.label}</span>
              <svg className={`h-4 w-4 transition ${menuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute left-0 top-12 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-2 shadow-xl">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-4 py-2.5 text-sm font-medium ${
                      pathname === item.href ? 'bg-blue-50 text-[#0084c7]' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side: plano + avatar + logout */}
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-gray-600 sm:inline">Plano: Professional</span>

          {/* User avatar + dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0084c7] text-sm font-semibold text-white hover:bg-[#0070b0] transition"
              title="Menu do usuário"
            >
              {userName}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-12 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-2 shadow-xl">
                <Link
                  href="/dashboard/help"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span>❓</span> Ajuda
                </Link>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                  </svg>
                  Sair da conta
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}
