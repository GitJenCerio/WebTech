import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  DollarSign, 
  UserCog, 
  Settings,
  CalendarDays
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
  { id: 'bookings', icon: Calendar, label: 'Bookings' },
  { id: 'customers', icon: Users, label: 'Customers' },
  { id: 'finance', icon: DollarSign, label: 'Finance' },
  { id: 'users', icon: UserCog, label: 'Users' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside 
      className="fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-50 shadow-sm"
      style={{ width: isExpanded ? '240px' : '72px' }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex h-14 items-center justify-center border-b border-border px-4 md:h-16">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold">S</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full h-12 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all relative mx-2
                  ${isActive 
                    ? 'bg-accent text-accent-foreground' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span 
                  className={`ml-4 whitespace-nowrap transition-opacity duration-300 ${
                    isExpanded ? 'opacity-100' : 'opacity-0 w-0'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary flex-shrink-0" />
            <div 
              className={`ml-3 transition-opacity duration-300 ${
                isExpanded ? 'opacity-100' : 'opacity-0 w-0'
              }`}
            >
              <p className="text-foreground text-sm font-medium">Admin User</p>
              <p className="text-muted-foreground text-xs">admin@company.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
