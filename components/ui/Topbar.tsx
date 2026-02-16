import { Search, Bell, Menu } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

interface TopbarProps {
  title: string;
  onMobileMenuToggle?: () => void;
}

export function Topbar({ title, onMobileMenuToggle }: TopbarProps) {
  return (
    <header className="h-16 bg-white flex items-center justify-between px-6 md:px-8 border-b border-gray-100">
      {/* Mobile menu button */}
      <button 
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 hover:bg-gray-100 rounded-2xl transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Page title */}
      <h1 className="text-xl font-semibold text-[#212529] hidden sm:block">{title}</h1>

      {/* Search and actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 relative w-64">
          <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* Profile */}
        <Button variant="ghost" size="icon" className="rounded-full">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#495057] to-[#212529] flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-medium">A</span>
          </div>
        </Button>
      </div>
    </header>
  );
}
