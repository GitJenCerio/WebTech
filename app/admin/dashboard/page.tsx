'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin');
    }
  }, [status, router]);

  async function handleLogout() {
    await signOut({ callbackUrl: '/admin' });
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/logo.png"
                alt="Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {session?.user?.email}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Admin Dashboard</h2>
          <p className="text-gray-600 mb-6">
            You are successfully logged in! This is a simplified admin dashboard.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-2">User Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Email:</strong> {session?.user?.email}</p>
                <p><strong>Name:</strong> {session?.user?.name || 'Not set'}</p>
                <p><strong>User ID:</strong> {session?.user?.id || 'N/A'}</p>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Admin features have been removed. This is an authentication-only setup.
                </p>
                <p className="text-sm text-gray-600">
                  You can add admin features here as needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
