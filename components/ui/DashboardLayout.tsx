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
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <div className="hidden lg:block w-full border-b bg-card md:w-56 md:border-b-0 md:border-r">
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

      {/* Main content - ml accounts for fixed sidebar rail */}
      <div className="flex-1 overflow-auto lg:ml-[72px]">
        <div className="flex flex-col min-h-screen">
          <Topbar
            title={pageTitle}
            onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
          <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
