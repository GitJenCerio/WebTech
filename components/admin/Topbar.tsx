'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { Search, Bell, Mail, User, ChevronDown, Settings, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavItems } from './SidebarRail';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Input } from '@/components/ui/Input';
import { signOut } from 'next-auth/react';

interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

/**
 * Topbar - Inside canvas, with search and user actions
 * Matches reference: search on left, icons/avatar on right
 */
export default function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const { data: session } = useSession();
  const userName = useMemo(() => session?.user?.name || 'Admin User', [session]);
  const pathname = usePathname();
  const navItems = useNavItems();

  // Get page title based on current route
  const getPageTitle = () => {
    const pageTitles: Record<string, string> = {
      '/admin/overview': 'Dashboard',
      '/admin/bookings': 'Calendar & Slots',
      '/admin/finance': 'Finance',
      '/admin/quotation': 'Quotation',
      '/admin/clients': 'Clients',
      '/admin/nail-techs': 'Nail Techs',
      '/admin/staff': 'Staff / Users',
      '/admin/settings': 'Settings',
    };

    // Find matching route
    for (const [route, title] of Object.entries(pageTitles)) {
      if (pathname === route || (pathname?.startsWith(route) && route !== '/admin/overview')) {
        return title;
      }
    }
    return 'Dashboard'; // Default
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 md:px-8">
      {/* Mobile menu button */}
      {onMobileMenuToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg lg:hidden hover:bg-gray-100"
          aria-label="Open menu"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </Button>
      )}

      {/* Page title - hidden on mobile, shown on larger screens */}
      <h1 className="text-xl text-gray-900 hidden sm:block">{getPageTitle()}</h1>

      {/* Search and actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl w-64">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-gray-700 w-full"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-gray-100 relative">
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>
        
        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 rounded-xl px-3 hover:bg-gray-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-foreground">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden text-sm font-medium sm:block">{userName}</span>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuLabel>{userName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/admin' })} className="text-red-600">
              <LogOut className="h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
