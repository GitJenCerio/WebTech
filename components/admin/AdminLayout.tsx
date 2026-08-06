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
  MessageSquareQuote,
  Images,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import PushNotificationButton from '@/components/admin/PushNotificationButton';

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
  { path: '/admin/media', label: 'Website Media', icon: Images },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
  { path: '/admin/audit', label: 'Audit Log', icon: ClipboardList },
  { path: '/admin/feedback', label: 'Feedback', icon: MessageSquareQuote },
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
    const timeoutId = window.setTimeout(() => setSidebarOpen(false), 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

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

  const currentPageTitle =
    navItems.find(
      (n) => pathname === n.path || (pathname.startsWith(n.path) && n.path !== '/admin/overview')
    )?.label ?? 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row bg-background admin-layout">
      <aside
        ref={sidebarRef}
        className={`admin-sidebar bg-pearl border-r border-border ${sidebarOpen ? 'show' : ''} ${iconsOnly ? 'icons-only' : ''} ${sidebarExpanded ? 'sidebar-expanded' : ''}`}
      >
        <div className="flex h-full flex-col">
          <div className="admin-sidebar-header flex h-16 items-center justify-between border-b border-border px-4">
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

          <nav className="flex-1 p-2">
            <ul className="m-0 list-none p-0">
              {navItems
                .filter((item) => {
                  if (item.path === '/admin/staff') return userRole.canManageUsers;
                  if (item.path === '/admin/audit') return userRole.canViewAudit;
                  if (item.path === '/admin/settings') return userRole.canManageSettings;
                  if (item.path === '/admin/media') return userRole.canManageAllTechs;
                  return true;
                })
                .map((item) => {
                  const isActive =
                    pathname === item.path ||
                    (pathname.startsWith(item.path) && item.path !== '/admin/overview');
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

      <div
        className={`admin-main flex min-h-0 flex-1 flex-col overflow-hidden ${sidebarOpen ? 'sidebar-collapsed' : ''} ${iconsOnly ? 'sidebar-icons-only' : ''} ${sidebarExpanded ? 'sidebar-expanded' : ''}`}
      >
        <nav className="admin-navbar flex h-16 shrink-0 items-center justify-between border-b border-border bg-pearl/95 backdrop-blur-xl px-4 shadow-[0_4px_24px_rgba(28,25,23,0.04)]">
          <div className="flex items-center gap-3">
            {!isRailMode && (
              <button
                ref={sidebarToggleRef}
                className="admin-navbar-sidebar-toggle p-2 text-muted-foreground hover:text-ink rounded-lg hover:bg-ash"
                type="button"
                onClick={handleMobileMenuClick}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="font-heading text-xl sm:text-2xl text-ink leading-tight">{currentPageTitle}</span>
              <span className="brand-rule w-10" aria-hidden />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PushNotificationButton />
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-pearl text-muted-foreground"
              title={session?.user?.name || session?.user?.email || 'Profile'}
              aria-label={session?.user?.name || 'Profile'}
            >
              <User className="h-4 w-4" />
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-ink hover:bg-ash"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </nav>

        <div className="admin-content min-h-0 flex-1 overflow-auto bg-ash-soft w-full min-w-0 p-4 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {children}
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed left-0 top-0 z-[999] h-full w-full bg-ink/40 md:hidden"
          style={{ zIndex: 999 }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
