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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1a1a1a] border-t-transparent mx-auto" role="status" aria-label="Loading" />
        <p className="mt-3 text-sm text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
}
