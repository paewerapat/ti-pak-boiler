'use client';

import { BarChart, BarChart3, Database, Home, Menu, User, X, LogOut, BellRing } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  const isActive = (path: string) => pathname === path;
  const isAdmin = session?.user?.role === 'admin';

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/api/auth/signin' });
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-800 hidden sm:block">
              Tipak Boiler Monitor
            </span>
            <span className="text-xl font-bold text-gray-800 sm:hidden">
              Tipak
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`flex items-center gap-2 ${
                isActive("/")
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600 hover:text-blue-600"
              } transition-colors`}
            >
              <Home className="w-4 h-4" />
              <span>หน้าหลัก</span>
            </Link>
            
            <Link
              href="/report"
              className={`flex items-center gap-2 ${
                isActive("/report")
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600 hover:text-blue-600"
              } transition-colors`}
            >
              <BarChart className="w-4 h-4" />
              <span>รายงาน</span>
            </Link>
            
            <Link
              href="/alarms"
              className={`flex items-center gap-2 ${
                isActive("/alarms")
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600 hover:text-blue-600"
              } transition-colors`}
            >
              <BellRing className="w-4 h-4" />
              <span>การแจ้งเตือน</span>
            </Link>

            {/* แสดงเมนู Users เฉพาะ Admin */}
            {isAdmin && (
              <Link
                href="/users"
                className={`flex items-center gap-2 ${
                  isActive("/users")
                    ? "text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-blue-600"
                } transition-colors`}
              >
                <User className="w-4 h-4" />
                <span>ผู้ใช้</span>
              </Link>
            )}

            {/* User Info & Sign Out */}
            {status === 'authenticated' && session?.user && (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-300">
                <div className="text-sm">
                  <div className="font-medium text-gray-800">
                    {session.user.full_name || session.user.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isAdmin ? 'ผู้ดูแลระบบ' : 'สมาชิก'}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">ออกจากระบบ</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className={`flex items-center gap-2 px-2 py-2 rounded-lg ${
                  isActive("/")
                    ? "text-blue-600 font-semibold bg-blue-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                <span>หน้าหลัก</span>
              </Link>
              
              <Link
                href="/report"
                className={`flex items-center gap-2 px-2 py-2 rounded-lg ${
                  isActive("/report")
                    ? "text-blue-600 font-semibold bg-blue-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <BarChart className="w-4 h-4" />
                <span>รายงาน</span>
              </Link>
              
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-2 py-2 rounded-lg ${
                  isActive("/dashboard")
                    ? "text-blue-600 font-semibold bg-blue-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <BarChart3 className="w-4 h-4" />
                <span>แดชบอร์ด</span>
              </Link>

              {/* แสดงเมนู Users เฉพาะ Admin */}
              {isAdmin && (
                <Link
                  href="/users"
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg ${
                    isActive("/users")
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span>ผู้ใช้</span>
                </Link>
              )}

              {/* User Info & Sign Out (Mobile) */}
              {status === 'authenticated' && session?.user && (
                <div className="border-t border-gray-200 pt-3 mt-2">
                  <div className="px-2 py-2 mb-2">
                    <div className="font-medium text-gray-800 text-sm">
                      {session.user.full_name || session.user.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isAdmin ? 'ผู้ดูแลระบบ' : 'สมาชิก'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;