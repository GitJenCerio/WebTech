import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage: string;
  pageTitle: string;
  onNavigate: (page: string) => void;
}

export function DashboardLayout({ 
  children, 
  currentPage, 
  pageTitle,
  onNavigate 
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="lg:hidden">
            <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="lg:ml-[72px] min-h-screen">
        {/* Main canvas container */}
        <div className="p-4 md:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
            <Topbar 
              title={pageTitle} 
              onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
            <div className="p-6 md:p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
