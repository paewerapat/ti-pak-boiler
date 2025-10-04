'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

export type Role = 'admin' | 'user';

export function useAuth(requiredRole?: Role) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    if (requiredRole && session.user && (session.user as any).role !== requiredRole) {
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router, requiredRole]);



  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    isAdmin: session?.user && (session.user as any).role === 'admin',
    isUser: session?.user && (session.user as any).role === 'user',
  };
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole?: Role
) {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    const { isLoading, isAuthenticated } = useAuth(requiredRole);

    if (isLoading) {
      return (<div>Loading...</div>);
    }

    if (!isAuthenticated) {
      // หรือ redirect ไปหน้า login ก็ได้
      return (<div>Access Denied</div>);
    }

    return (<WrappedComponent {...props} />);
  };

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthenticatedComponent;
}
