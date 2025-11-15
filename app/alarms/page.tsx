"use client";

import { useState, useEffect } from "react";
import Navbar from "@/app/components/header/Navbar";
import {
  Search,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Filter,
} from "lucide-react";
import DateTimePicker from "../components/DateTimePicker";

interface Alarm {
  id: number;
  name: string;
  alarm_content: string;
  status: number;
  created_at: string;
  ended_at: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AlertsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Filter states
  const [search, setSearch] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>(""); // '' = all, '0' = resolved, '1' = active
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // Sorting states
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  // Pagination info
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [lastUpdate, setLastUpdate] = useState<string>("");

  // Fetch alarms
  const fetchAlarms = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
        sortBy,
        sortOrder,
        ...(search && { search }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(statusFilter !== "" && { status: statusFilter }),
      });

      const response = await fetch(`/api/alarms?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch alarms");
      }

      const result = await response.json();

      if (result.success) {
        console.log('Sample alarm data:', result.data[0]);
        setAlarms(result.data);
        setPagination(result.pagination);
        setLastUpdate(new Date().toLocaleString("th-TH"));
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      console.error("Error fetching alarms:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh every 30 seconds
  useEffect(() => {
    fetchAlarms();
    const interval = setInterval(fetchAlarms, 30000);
    return () => clearInterval(interval);
  }, [
    page,
    rowsPerPage,
    sortBy,
    sortOrder,
    search,
    startDate,
    endDate,
    statusFilter,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [search, startDate, endDate, statusFilter, rowsPerPage]);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setSortOrder("DESC");
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";

    // ✅ รองรับทั้ง format ที่มี T และไม่มี T
    let cleanDateStr = dateString
      .replace(/\.000Z$/, "") // ตัด .000Z ออก
      .replace("T", " ") // แปลง T เป็น space
      .trim();

    const parts = cleanDateStr.split(" ");
    if (parts.length !== 2) {
      console.error("Invalid date format:", dateString);
      return dateString; // fallback: แสดงค่าเดิม
    }

    const [datePart, timePart] = parts;

    const dateParts = datePart.split("-");
    const timeParts = timePart.split(":");

    if (dateParts.length !== 3 || timeParts.length < 2) {
      console.error("Invalid date/time parts:", dateString);
      return dateString;
    }

    const [year, month, day] = dateParts;
    const [hours, minutes, seconds = "00"] = timeParts;

    // Format เป็นรูปแบบไทย: วัน/เดือน/ปี ชั่วโมง:นาที:วินาที
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Get status badge
  const getStatusBadge = (status: number, endedAt: string | null) => {
    if (status === 1 && !endedAt) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
          <AlertCircle className="w-3 h-3" />
          ACTIVE
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
          <CheckCircle2 className="w-3 h-3" />
          RESOLVED
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Alarm Logs</h1>
          <p className="mt-2 text-sm text-gray-600">
            การแจ้งเตือนและประวัติการแจ้งเตือนของระบบ
          </p>
          {lastUpdate && (
            <p className="mt-1 text-xs text-gray-500">
              อัพเดทล่าสุด: {lastUpdate}
            </p>
          )}
        </div>

        {/* Stats */}
        {alarms.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Alarms</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pagination.total}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Alarms</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {alarms.filter((a) => a.status === 1 && !a.ended_at).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {alarms.filter((a) => a.status === 0 || a.ended_at).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">ตัวกรอง</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค้นหา
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ชื่อหรือเนื้อหา..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะ
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทั้งหมด</option>
                <option value="1">Active</option>
                <option value="0">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่เริ่มต้น
              </label>
              <DateTimePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="เลือกวันที่เริ่มต้น"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่สิ้นสุด
              </label>
              <DateTimePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="เลือกวันที่สิ้นสุด"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={fetchAlarms}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "กำลังโหลด..." : "รีเฟรช"}
            </button>

            <button
              onClick={() => {
                setSearch("");
                setStartDate("");
                setEndDate("");
                setStatusFilter("");
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loading && alarms.length === 0 ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-12 h-12 mx-auto text-gray-400 animate-spin mb-4" />
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : alarms.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">ไม่พบข้อมูล Alarm</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th
                        onClick={() => handleSort("id")}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        ID{" "}
                        {sortBy === "id" && (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("name")}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Name{" "}
                        {sortBy === "name" && (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alarm Content
                      </th>
                      <th
                        onClick={() => handleSort("status")}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Status{" "}
                        {sortBy === "status" &&
                          (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("created_at")}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Created At{" "}
                        {sortBy === "created_at" &&
                          (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("ended_at")}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Ended At{" "}
                        {sortBy === "ended_at" &&
                          (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {alarms.map((alarm) => (
                      <tr
                        key={alarm.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {alarm.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {alarm.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {alarm.alarm_content}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(alarm.status, alarm.ended_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDateTime(alarm.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {alarm.ended_at ? (
                            formatDateTime(alarm.ended_at)
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-700">แสดงผล:</label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700">
                    รายการ (ทั้งหมด {pagination.total} รายการ)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <span className="px-4 py-2 text-sm text-gray-700">
                    หน้า {pagination.page} / {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
