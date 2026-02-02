'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import './admin.css';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Don't apply layout to login page
  const isLoginPage = pathname === '/admin';

  useEffect(() => {
    // Only redirect if not on login page and not authenticated
    if (!isLoginPage && status === 'unauthenticated') {
      router.push('/admin');
    }
  }, [status, router, isLoginPage]);

  // If on login page, render without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
