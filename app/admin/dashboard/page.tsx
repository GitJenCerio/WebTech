'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to overview page
    router.replace('/admin/overview');
  }, [router]);

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Redirecting...</p>
      </div>
    </div>
  );
}
