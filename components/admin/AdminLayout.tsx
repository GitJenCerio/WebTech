'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/admin/overview', label: 'Overview', icon: 'bi-grid-3x3-gap' },
  { path: '/admin/bookings', label: 'Bookings & Slots', icon: 'bi-calendar-check' },
  { path: '/admin/finance', label: 'Finance', icon: 'bi-cash-stack' },
  { path: '/admin/quotation', label: 'Quotation', icon: 'bi-calculator' },
  { path: '/admin/clients', label: 'Clients', icon: 'bi-people' },
  { path: '/admin/nail-techs', label: 'Nail Techs', icon: 'bi-scissors' },
  { path: '/admin/staff', label: 'Staff / Users', icon: 'bi-person-gear' },
  { path: '/admin/settings', label: 'Settings', icon: 'bi-gear' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await signOut({ callbackUrl: '/admin' });
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'show' : ''}`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="px-4 pb-3 pt-4">
            <div className="flex justify-center">
              <Image
                src="/logo.png"
                alt="Logo"
                width={150}
                height={50}
                className="img-fluid"
                priority
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2">
            <ul className="m-0 list-none p-0">
              {navItems.map((item) => {
                const isActive = pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/admin/overview');
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                    >
                      <i className={item.icon}></i>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`admin-main ${sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {/* Top Navbar */}
        <nav className="admin-navbar">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="p-0 text-[#495057] md:hidden"
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                <i className="bi bi-list" style={{ fontSize: '1.5rem' }}></i>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="hidden text-right md:block">
                <small className="text-sm text-[#6c757d]">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </small>
              </div>
              {/* Search */}
              <div className="hidden md:block">
                <div className="flex w-full items-center rounded-lg border border-[#ced4da] bg-white" style={{ maxWidth: '300px' }}>
                  <span className="px-2 text-[#6c757d]">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="w-full rounded-r-lg border-0 bg-white py-2 pr-3 text-sm outline-none"
                    placeholder="Search For Query"
                  />
                </div>
              </div>

              {/* Icons */}
              <button className="relative p-2 text-[#495057]" type="button">
                <i className="bi bi-envelope" style={{ fontSize: '1.125rem' }}></i>
              </button>
              <button className="relative p-2 text-[#495057]" type="button">
                <i className="bi bi-bell" style={{ fontSize: '1.125rem' }}></i>
              </button>
              <button className="relative p-2 text-[#495057]" type="button">
                <i className="bi bi-file-text" style={{ fontSize: '1.125rem' }}></i>
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  className="flex items-center gap-2 p-0 text-[#212529]"
                  type="button"
                  aria-expanded={userMenuOpen}
                  onClick={() => setUserMenuOpen((open) => !open)}
                >
                  <div className="mr-2 hidden text-right md:block">
                    <div className="font-semibold" style={{ fontSize: '0.9375rem', lineHeight: '1.2' }}>
                      {session?.user?.name || 'Juliana Adams'}
                    </div>
                    <small className="text-[#6c757d]" style={{ fontSize: '0.75rem' }}>Super Admin</small>
                  </div>
                  <div
                    className="flex items-center justify-center rounded-full bg-[#e0e0e0]"
                    style={{ width: '40px', height: '40px', backgroundColor: '#e0e0e0' }}
                  >
                    <i className="bi bi-person-fill" style={{ color: '#495057', fontSize: '1.25rem' }}></i>
                  </div>
                  <i className="bi bi-chevron-down ml-1" style={{ fontSize: '0.75rem', color: '#6c757d' }}></i>
                </button>
                {userMenuOpen && (
                  <ul className="absolute right-0 z-[1200] mt-2 min-w-[180px] rounded-lg border border-[#e0e0e0] bg-white p-2 shadow-lg">
                  <li>
                    <Link className="block rounded-md px-3 py-2 text-sm hover:bg-[#f8f9fa]" href="/admin/profile">
                      <i className="bi bi-person mr-2"></i>Profile
                    </Link>
                  </li>
                  <li>
                    <Link className="block rounded-md px-3 py-2 text-sm hover:bg-[#f8f9fa]" href="/admin/settings">
                      <i className="bi bi-gear mr-2"></i>Settings
                    </Link>
                  </li>
                  <li>
                    <hr className="my-1 border-[#e0e0e0]" />
                  </li>
                  <li>
                    <button
                      className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#dc3545] hover:bg-[#f8f9fa]"
                      type="button"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right mr-2"></i>Logout
                    </button>
                  </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="admin-content">{children}</div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed left-0 top-0 z-[999] h-full w-full bg-black/50 md:hidden"
          style={{ zIndex: 999 }}
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
