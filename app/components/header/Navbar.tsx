import { BarChart, BarChart3, Database, Home, Menu, Settings, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();
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
              className={`flex items-center gap-2 text-${pathname === "/" ? "blue" : "gray"}-600 font-medium hover:text-blue-700 transition-colors`}
            >
              <Home className="w-4 h-4" />
              <span>หน้าหลัก</span>
            </Link>
            <Link
              href="/report"
              className={`flex items-center gap-2 text-${pathname === "/report" ? "blue" : "gray"}-600 font-medium hover:text-blue-700 transition-colors`}
            >
              <BarChart className="w-4 h-4" />
              <span>รายงาน</span>
            </Link>
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 text-${pathname === "/dashboard" ? "blue" : "gray"}-600 font-medium hover:text-blue-700 transition-colors`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>แดชบอร์ด</span>
            </Link>
            <Link
              href="/users"
              className={`flex items-center gap-2 text-${pathname === "/users" ? "blue" : "gray"}-600 font-medium hover:text-blue-700 transition-colors`}
            >
              <User className="w-4 h-4" />
              <span>ผู้ใช้</span>
            </Link>
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
              <a
                href="#"
                className="flex items-center gap-2 text-blue-600 font-medium px-2 py-2 rounded-lg hover:bg-gray-50"
              >
                <Home className="w-4 h-4" />
                <span>หน้าหลัก</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-gray-600 px-2 py-2 rounded-lg hover:bg-gray-50"
              >
                <BarChart3 className="w-4 h-4" />
                <span>รายงาน</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-gray-600 px-2 py-2 rounded-lg hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" />
                <span>ตั้งค่า</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
