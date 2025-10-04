'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from './components/header/Navbar';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) router.push('/login'); // Not logged in
  }, [session, status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <>

      {/* Navbar */}
      <Navbar />

      <div className="mt-6 max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Hello</h1>
        <div className="mb-4">
          <p><strong>Name:</strong> {session.user.full_name}</p>
          <p><strong>Username:</strong> {session.user.username}</p>
          <p><strong>Email:</strong> {session.user.email}</p>
          <p><strong>Role:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
              session.user.role === 'admin' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {session.user.role.toUpperCase()}
            </span>
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md"
        >
          Sign Out
        </button>
      </div>
    </>
  );
}