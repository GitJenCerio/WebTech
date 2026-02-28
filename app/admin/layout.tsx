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

  // Don't apply layout or auth redirect to login, forgot-password, reset-password
  const isPublicAdminPage =
    pathname === '/admin' ||
    pathname === '/admin/forgot-password' ||
    pathname === '/admin/reset-password';

  useEffect(() => {
    if (!isPublicAdminPage && status === 'unauthenticated') {
      router.push('/admin');
    }
  }, [status, router, isPublicAdminPage]);

  if (isPublicAdminPage) {
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
