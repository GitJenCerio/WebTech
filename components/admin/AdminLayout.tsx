'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import Script from 'next/script';
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
  const pathname = usePathname();
  const { data: session } = useSession();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/admin' });
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'show' : ''}`}>
        <div className="d-flex flex-column h-100">
          {/* Logo */}
          <div className="p-4 pb-3">
            <div className="d-flex justify-content-center">
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
          <nav className="flex-grow-1 p-2">
            <ul className="nav flex-column">
              {navItems.map((item) => {
                const isActive = pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/admin/overview');
                return (
                  <li key={item.path} className="nav-item">
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
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <button
                className="btn btn-link d-md-none p-0"
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
                style={{ color: '#495057' }}
              >
                <i className="bi bi-list" style={{ fontSize: '1.5rem' }}></i>
              </button>
            </div>

            <div className="d-flex align-items-center gap-2 gap-md-3 flex-wrap">
              <div className="d-none d-md-block text-end">
                <small className="text-muted">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </small>
              </div>
              {/* Search */}
              <div className="d-none d-md-block">
                <div className="input-group" style={{ maxWidth: '300px', width: '100%' }}>
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search For Query"
                  />
                </div>
              </div>

              {/* Icons */}
              <button className="btn btn-link position-relative p-2" style={{ color: '#495057' }}>
                <i className="bi bi-envelope" style={{ fontSize: '1.125rem' }}></i>
              </button>
              <button className="btn btn-link position-relative p-2" style={{ color: '#495057' }}>
                <i className="bi bi-bell" style={{ fontSize: '1.125rem' }}></i>
              </button>
              <button className="btn btn-link position-relative p-2" style={{ color: '#495057' }}>
                <i className="bi bi-file-text" style={{ fontSize: '1.125rem' }}></i>
              </button>

              {/* User Menu */}
              <div className="dropdown">
                <button
                  className="btn btn-link d-flex align-items-center gap-2 text-decoration-none p-0"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ color: '#212529' }}
                >
                  <div className="text-end d-none d-md-block me-2">
                    <div className="fw-semibold" style={{ fontSize: '0.9375rem', lineHeight: '1.2' }}>
                      {session?.user?.name || 'Juliana Adams'}
                    </div>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>Super Admin</small>
                  </div>
                  <div
                    className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '40px', height: '40px', backgroundColor: '#e0e0e0' }}
                  >
                    <i className="bi bi-person-fill" style={{ color: '#495057', fontSize: '1.25rem' }}></i>
                  </div>
                  <i className="bi bi-chevron-down ms-1" style={{ fontSize: '0.75rem', color: '#6c757d' }}></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" href="/admin/profile">
                      <i className="bi bi-person me-2"></i>Profile
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/admin/settings">
                      <i className="bi bi-gear me-2"></i>Settings
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </button>
                  </li>
                </ul>
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
          className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 999 }}
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Bootstrap JS */}
      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
