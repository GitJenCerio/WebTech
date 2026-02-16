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
      className="fixed left-0 top-0 h-screen bg-gradient-to-b from-[#212529] to-[#1a1d23] transition-all duration-300 z-50 shadow-lg"
      style={{ width: isExpanded ? '240px' : '72px' }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#495057] to-[#212529] flex items-center justify-center shadow-md">
            <span className="text-white font-semibold">S</span>
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
                  w-full h-12 flex items-center px-6 transition-all relative
                  ${isActive 
                    ? 'bg-gradient-to-r from-[#495057]/20 to-transparent text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#495057] to-[#212529] rounded-r-full" />
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
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#495057] to-[#212529] flex-shrink-0 shadow-md" />
            <div 
              className={`ml-3 transition-opacity duration-300 ${
                isExpanded ? 'opacity-100' : 'opacity-0 w-0'
              }`}
            >
              <p className="text-white text-sm font-medium">Admin User</p>
              <p className="text-gray-400 text-xs">admin@company.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
