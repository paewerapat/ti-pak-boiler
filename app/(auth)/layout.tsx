import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // ถ้าไม่มี session redirect ไป login
  if (!session) {
    redirect('/login');
  }

  return (
    <>
      {children}
    </>
  );
}