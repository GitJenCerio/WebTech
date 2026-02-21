import { Search, Bell, Menu } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

interface TopbarProps {
  title: string;
  onMobileMenuToggle?: () => void;
}

export function Topbar({ title, onMobileMenuToggle }: TopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:h-16 md:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 hover:bg-accent rounded-md transition-colors"
      >
        <Menu className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Page title */}
      <h1 className="text-xl font-semibold text-foreground hidden sm:block">{title}</h1>

      {/* Search and actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 relative w-64">
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-10"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* Profile */}
        <Button variant="ghost" size="icon" className="rounded-full">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-medium">A</span>
          </div>
        </Button>
      </div>
    </header>
  );
}
