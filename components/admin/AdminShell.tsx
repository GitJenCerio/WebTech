'use client';

import { ReactNode, useState } from 'react';
import SidebarRail from './SidebarRail';
import Topbar from './Topbar';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid,
  CalendarCheck,
  DollarSign,
  Calculator,
  Users,
  Scissors,
  UserCog,
  Settings,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const navItems: NavItem[] = [
  { path: '/admin/overview', label: 'Dashboard', icon: LayoutGrid },
  { path: '/admin/bookings', label: 'Bookings & Slots', icon: CalendarCheck },
  { path: '/admin/finance', label: 'Finance', icon: DollarSign },
  { path: '/admin/quotation', label: 'Quotation', icon: Calculator },
  { path: '/admin/clients', label: 'Clients', icon: Users },
  { path: '/admin/nail-techs', label: 'Nail Techs', icon: Scissors },
  { path: '/admin/staff', label: 'Staff / Users', icon: UserCog },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

function MobileSidebar({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-[240px] flex flex-col border-r border-background/10 bg-foreground shadow-lg lg:hidden">
      <div className="flex h-full w-full flex-col overflow-y-auto">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-background/10 px-6">
          <div className="w-10 h-10 rounded-xl bg-background/20 flex items-center justify-center">
            <span className="text-background text-lg font-semibold">S</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6">
          {navItems.map((item) => {
            const active = pathname === item.path ||
              (pathname?.startsWith(item.path) && item.path !== '/admin/overview');
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={onClose}
                className={cn(
                  'w-full h-12 flex items-center px-6 transition-all justify-start',
                  active
                    ? 'bg-background/10 text-background border-r-2 border-background'
                    : 'text-background/60 hover:text-background hover:bg-background/5'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="ml-4 whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile */}
        <div className="p-4 border-t border-background/10">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-background/20 flex-shrink-0" />
            <div className="ml-3 min-w-0">
              <p className="text-background text-sm font-medium truncate">Admin User</p>
              <p className="text-background/60 text-xs truncate">admin@company.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface AdminShellProps {
  children: ReactNode;
}

function AdminShellContent({ children }: AdminShellProps) {
  const { collapsed, hovered } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SidebarRail />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <MobileSidebar onClose={() => setIsMobileMenuOpen(false)} />
        </>
      )}

      {/* Main content */}
      <div 
        className="lg:min-h-screen transition-all duration-300 lg:ml-[72px]"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 
            ? (collapsed && !hovered ? '72px' : '240px') 
            : '0',
        }}
      >
        {/* Main canvas container */}
        <div className="w-full p-0 sm:p-2 md:p-4 lg:p-8">
          <div className="max-w-[1600px] mx-auto bg-white rounded-none sm:rounded-2xl shadow-sm overflow-hidden w-full">
            <Topbar 
              onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
            <div className="p-0 sm:p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AdminShell - Main layout container with canvas structure
 * Matches reference: off-white background, centered canvas, sidebar rail, topbar
 */
export default function AdminShell({ children }: AdminShellProps) {
  return (
    <SidebarProvider>
      <AdminShellContent>{children}</AdminShellContent>
    </SidebarProvider>
  );
}
