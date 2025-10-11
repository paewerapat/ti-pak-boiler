import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // ปรับ path ตามโครงสร้างของคุณ
import UserManagementClient from './UserManagementClient';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  // เช็คที่ server-side - ไม่มี UI กระพริบเลย
  if (!session) {
    redirect('/api/auth/signin');
  }

  if (session.user?.role !== 'admin') {
    redirect('/'); // redirect ไปหน้าหลัก
  }

  // ถ้าผ่านการเช็ค แสดงหน้า User Management
  return <UserManagementClient session={session} />;
}