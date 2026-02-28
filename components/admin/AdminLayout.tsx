'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useUserRole } from '@/lib/hooks/useUserRole';
import Image from 'next/image';
import {
  LayoutDashboard,
  CalendarCheck,
  ListChecks,
  DollarSign,
  Calculator,
  Users,
  Scissors,
  UserCog,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const SIDEBAR_RAIL_BREAKPOINT = 768;

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/calendar', label: 'Calendar', icon: CalendarCheck },
  { path: '/admin/bookings', label: 'Bookings', icon: ListChecks },
  { path: '/admin/finance', label: 'Finance', icon: DollarSign },
  { path: '/admin/quotation', label: 'Quotation', icon: Calculator },
  { path: '/admin/clients', label: 'Clients', icon: Users },
  { path: '/admin/nail-techs', label: 'Nail Techs', icon: Scissors },
  { path: '/admin/staff', label: 'Staff / Users', icon: UserCog },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
  { path: '/admin/audit', label: 'Audit Log', icon: ClipboardList },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRailMode, setIsRailMode] = useState(false);
  const [railExpanded, setRailExpanded] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = useUserRole();
  const sidebarRef = useRef<HTMLElement | null>(null);
  const sidebarToggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Tablet and up = rail (icons-only, expand via toggle); below = overlay + hamburger
  useEffect(() => {
    const check = () => {
      const rail = typeof window !== 'undefined' && window.innerWidth >= SIDEBAR_RAIL_BREAKPOINT;
      setIsRailMode(rail);
      if (!rail) {
        setSidebarOpen(false);
        setRailExpanded(false);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Click outside: in rail mode collapse sidebar if expanded
  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node;
      if (isRailMode && railExpanded && sidebarRef.current && sidebarToggleRef.current) {
        if (!sidebarRef.current.contains(target) && !sidebarToggleRef.current.contains(target)) {
          setRailExpanded(false);
        }
      }
    }

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [isRailMode, railExpanded]);

  const handleLogout = () => signOut({ callbackUrl: '/admin' });

  const iconsOnly = isRailMode && !railExpanded;
  const sidebarExpanded = isRailMode && railExpanded;

  const handleRailToggle = () => {
    if (isRailMode) setRailExpanded((e) => !e);
  };

  const handleMobileMenuClick = () => {
    if (isRailMode) {
      setRailExpanded((e) => !e);
    } else {
      setSidebarOpen((o) => !o);
    }
  };

  const currentPageTitle = navItems.find((n) => pathname === n.path || (pathname.startsWith(n.path) && n.path !== '/admin/overview'))?.label ?? 'Dashboard';

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background admin-layout">
      {/* Sidebar: overlay on mobile; rail (icons-only, expand via toggle) on tablet and up */}
      <aside
        ref={sidebarRef}
        className={`admin-sidebar bg-white border-r border-[#e5e5e5] ${sidebarOpen ? 'show' : ''} ${iconsOnly ? 'icons-only' : ''} ${sidebarExpanded ? 'sidebar-expanded' : ''}`}
      >
        <div className="flex h-full flex-col">
          {/* Logo + expand/collapse toggle (tablet/laptop) */}
          <div className="admin-sidebar-header flex h-16 items-center justify-between border-b border-[#e5e5e5] px-4">
            <div className="admin-sidebar-logo">
              {iconsOnly ? (
                <div className="admin-sidebar-logo-icon" title="Logo">
                  <Image src="/logo.png" alt="" width={40} height={40} className="admin-sidebar-logo-img" />
                </div>
              ) : (
                <Image src="/logo.png" alt="Logo" width={150} height={50} className="img-fluid" priority />
              )}
            </div>
            {isRailMode && (
              <button
                type="button"
                className="admin-sidebar-toggle"
                onClick={handleRailToggle}
                aria-label={iconsOnly ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {iconsOnly ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2">
            <ul className="m-0 list-none p-0">
              {navItems
                .filter((item) => {
                  if (item.path === '/admin/staff') return userRole.canManageUsers;
                  if (item.path === '/admin/audit') return userRole.canViewAudit;
                  if (item.path === '/admin/settings') return userRole.canManageSettings;
                  return true;
                })
                .map((item) => {
                const isActive = pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/admin/overview');
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                      title={iconsOnly ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="nav-link-text">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`admin-main ${sidebarOpen ? 'sidebar-collapsed' : ''} ${iconsOnly ? 'sidebar-icons-only' : ''} ${sidebarExpanded ? 'sidebar-expanded' : ''}`}>
        {/* Top Header */}
        <nav className="admin-navbar flex h-16 items-center justify-between border-b border-[#e5e5e5] bg-white px-4 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Hamburger only on small screens (sidebar is collapsible rail on desktop) */}
            {!isRailMode && (
              <button
                ref={sidebarToggleRef}
                className="admin-navbar-sidebar-toggle p-2 text-gray-500 hover:text-[#1a1a1a] rounded-lg hover:bg-[#f5f5f5]"
                type="button"
                onClick={handleMobileMenuClick}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <span className="text-sm text-gray-500">{currentPageTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#fafafa] text-gray-600"
              title={session?.user?.name || session?.user?.email || 'Profile'}
              aria-label={session?.user?.name || 'Profile'}
            >
              <User className="h-4 w-4" />
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-[#1a1a1a]">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </nav>

        {/* Page Content */}
        <div className="admin-content flex-1 overflow-auto bg-[#f5f5f5] p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-6 max-w-screen-xl mx-auto">{children}</div>
      </div>

      {/* Mobile only: sidebar overlay - tap to close */}
      {sidebarOpen && (
        <div
          className="fixed left-0 top-0 z-[999] h-full w-full bg-black/50 md:hidden"
          style={{ zIndex: 999 }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}
    </div>
  );
}
