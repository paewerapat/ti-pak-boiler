'use client';

import { useAuth } from '@/hooks/useAuth';

export default function AdminPage() {
  const { session, isLoading, isAdmin } = useAuth('admin');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p>You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800">Total Users</h3>
              <p className="text-2xl font-bold text-blue-600">1,234</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800">Active Sessions</h3>
              <p className="text-2xl font-bold text-green-600">89</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800">System Status</h3>
              <p className="text-2xl font-bold text-purple-600">Online</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Admin Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                User Management
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                System Settings
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
                View Reports
              </button>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-2">Current Admin</h3>
            <p><strong>Name:</strong> {session?.user.full_name}</p>
            <p><strong>Email:</strong> {session?.user.email}</p>
            <p><strong>Role:</strong> 
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                ADMIN
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}