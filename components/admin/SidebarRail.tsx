'use client';

import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
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

export function useNavItems() {
  const pathname = usePathname();
  
  return navItems.map((item) => {
    const active = pathname === item.path ||
      (pathname?.startsWith(item.path) && item.path !== '/admin/overview');
    return { ...item, active };
  });
}

export default function SidebarRail() {
  const pathname = usePathname();
  const { collapsed, hovered, setHovered, toggle } = useSidebar();
  
  // Show labels when expanded (either by click or hover)
  const showLabels = !collapsed || hovered;

  return (
    <>
      {/* Desktop Sidebar Rail */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen flex-col border-r border-background/10 bg-foreground transition-all duration-300',
          collapsed && !hovered ? 'w-[72px]' : 'w-[240px]',
          'hidden lg:flex'
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          marginLeft: '0',
        }}
      >
        <div className="flex h-full w-full flex-col overflow-y-auto">
          {/* Logo */}
          <div className={cn(
            'h-16 flex items-center border-b border-background/10',
            collapsed && !hovered ? 'justify-center' : 'justify-start px-6'
          )}>
            {collapsed && !hovered ? (
              <div className="w-10 h-10 rounded-xl bg-background/20 flex items-center justify-center">
                <span className="text-background text-lg font-semibold">S</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <div className="w-10 h-10 rounded-xl bg-background/20 flex items-center justify-center">
                  <span className="text-background text-lg font-semibold">S</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggle}
                  className="h-8 w-8 shrink-0 rounded-lg hover:bg-background/10 text-background/70 hover:text-background ml-auto"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Collapse button when collapsed and not hovered */}
          {collapsed && !hovered && (
            <div className="px-2 py-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                className="h-8 w-full rounded-lg hover:bg-background/10 text-background/70 hover:text-background"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

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
                  className={cn(
                    'w-full h-12 flex items-center px-6 transition-all',
                    showLabels ? 'justify-start' : 'justify-center',
                    active
                      ? 'bg-background/10 text-background border-r-2 border-background'
                      : 'text-background/60 hover:text-background hover:bg-background/5'
                  )}
                  title={item.label}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {showLabels && (
                    <span className={cn(
                      'ml-4 whitespace-nowrap transition-opacity duration-300',
                      showLabels ? 'opacity-100' : 'opacity-0 w-0'
                    )}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* User Profile */}
          <div className="p-4 border-t border-background/10">
            <div className={cn(
              'flex items-center',
              collapsed && !hovered ? 'justify-center' : ''
            )}>
              <div className="w-10 h-10 rounded-full bg-background/20 flex-shrink-0" />
              {showLabels && (
                <div className="ml-3 min-w-0">
                  <p className="text-background text-sm font-medium truncate">Admin User</p>
                  <p className="text-background/60 text-xs truncate">admin@company.com</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
