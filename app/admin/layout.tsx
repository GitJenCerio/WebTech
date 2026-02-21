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
    return <div className="admin-dashboard min-h-screen bg-[#f5f5f5]">{children}</div>;
  }

  if (status === 'loading') {
    return (
      <div className="admin-dashboard flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <div className="text-center">
          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
            role="status"
            aria-label="Loading"
          >
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-3 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <AdminLayout>{children}</AdminLayout>
    </div>
  );
}
