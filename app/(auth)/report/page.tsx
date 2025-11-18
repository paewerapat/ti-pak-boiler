"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileSpreadsheet,
  FileText,
  X,
  Calendar,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import Navbar from "@/app/components/header/Navbar";
import DateTimePicker from "@/app/components/DateTimePicker";

interface SensorData {
  id: number;
  sv_steam_setpoint: string;
  pt_steam_pressure: string;
  tc1_stack_temperature: number;
  mt1_oil_supply_meter: string;
  mt2_boiler_feed_meter: string;
  mt3_soft_water_meter: string;
  mt4_condensate_meter: string;
  opt_oil_pressure: string;
  record_time: string;
}

interface PaginationResponse {
  data: SensorData[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const metrics = [
  {
    key: "sv_steam_setpoint",
    label: "Steam Setpoint",
    color: "#3b82f6",
    unit: "",
  },
  {
    key: "pt_steam_pressure",
    label: "Steam Pressure",
    color: "#10b981",
    unit: "",
  },
  {
    key: "tc1_stack_temperature",
    label: "Stack Temperature",
    color: "#f59e0b",
    unit: "°C",
  },
  {
    key: "mt1_oil_supply_meter",
    label: "MT1 OIL SUPPLY",
    color: "#8b5cf6",
    unit: "",
  },
  {
    key: "mt2_boiler_feed_meter",
    label: "MT2 BOILER FEED",
    color: "#ec4899",
    unit: "",
  },
  {
    key: "mt3_soft_water_meter",
    label: "MT3 SOFT WATER",
    color: "#06b6d4",
    unit: "",
  },
  {
    key: "mt4_condensate_meter",
    label: "MT4 CONDENSATE",
    color: "#f43f5e",
    unit: "",
  },
  {
    key: "opt_oil_pressure",
    label: "Oil Pressure",
    color: "#84cc16",
    unit: "",
  },
];

export default function ReportPage() {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isFiltered, setIsFiltered] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  const fetchSensors = async (
    page: number = currentPage,
    size: number = pageSize,
    start?: string,
    end?: string,
    sort: "desc" | "asc" = sortOrder
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/sensors?page=${page}&pageSize=${size}&sortOrder=${sort}`;
      if (start) url += `&startDate=${start}`;
      if (end) url += `&endDate=${end}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch data");

      const result: PaginationResponse = await response.json();
      setSensors(result.data);
      setCurrentPage(result.pagination.currentPage);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
      setLastUpdate(new Date().toLocaleString("th-TH", { hour12: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchSensors(
        page,
        pageSize,
        isFiltered ? startDate : undefined,
        isFiltered ? endDate : undefined,
        sortOrder
      );
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleFilter = () => {
    if (!startDate && !endDate) {
      setError("กรุณาเลือกวันที่เริ่มต้นหรือสิ้นสุด");
      return;
    }
    setIsFiltered(true);
    setCurrentPage(1);
    fetchSensors(1, pageSize, startDate, endDate, sortOrder);
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate(""); // ✅ เปลี่ยนเป็น empty string
    setIsFiltered(false);
    setCurrentPage(1);
    fetchSensors(1, pageSize, undefined, undefined, sortOrder);
  };

  const handleSortChange = (newSort: "desc" | "asc") => {
    setSortOrder(newSort);
    setCurrentPage(1);
    fetchSensors(
      1,
      pageSize,
      isFiltered ? startDate : undefined,
      isFiltered ? endDate : undefined,
      newSort
    );
  };

  const exportToCSV = async () => {
    try {
      setExportLoading(true);

      const selectedMetricsStr = localStorage.getItem("selectedMetrics");
      const selectedMetrics: string[] = selectedMetricsStr
        ? JSON.parse(selectedMetricsStr)
        : [];

      let url = `/api/sensors/export?format=csv`;
      if (isFiltered && (startDate || endDate)) {
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
      }
      if (selectedMetrics.length > 0) {
        url += `&metrics=${selectedMetrics.join(",")}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to export data");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `sensors_report_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setExportLoading(true);

      const selectedMetricsStr = localStorage.getItem("selectedMetrics");
      const selectedMetrics: string[] = selectedMetricsStr
        ? JSON.parse(selectedMetricsStr)
        : [];

      let url = `/api/sensors/export?format=excel`;
      if (isFiltered && (startDate || endDate)) {
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
      }
      if (selectedMetrics.length > 0) {
        url += `&metrics=${selectedMetrics.join(",")}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to export data");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `sensors_report_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const formatDateTime = (dateString: string): string => {
    if (!dateString) return "-";

    // แปลง Date object โดยใช้ UTC methods
    const date = new Date(dateString);

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const getStatusColor = (value: string, min: number, max: number): string => {
    const numValue = parseFloat(value);
    if (numValue < min) return "text-blue-600";
    if (numValue > max) return "text-red-600";
    return "text-green-600";
  };

  const formatNumber = (value: string): string => {
    return parseFloat(value).toFixed(2);
  };

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const toggleMetric = (metricKey: string) => {
    const newSelectedMetrics = selectedMetrics.includes(metricKey)
      ? selectedMetrics.filter((m) => m !== metricKey)
      : [...selectedMetrics, metricKey];

    setSelectedMetrics(newSelectedMetrics);
    // บันทึกไปที่ localStorage ทันทีเพื่อ sync กับหน้า Dashboard
    localStorage.setItem("selectedMetrics", JSON.stringify(newSelectedMetrics));

    // ✅ Trigger custom event เพื่อ sync ภายในหน้าเดียวกัน
    window.dispatchEvent(new Event("metricsChanged"));
  };

  useEffect(() => {
    fetchSensors(1, pageSize);

    // Load จาก localStorage ตอนเริ่มต้น
    const loadSelectedMetrics = () => {
      const selectedMetricsStr = localStorage.getItem("selectedMetrics");
      if (selectedMetricsStr) {
        try {
          const metrics = JSON.parse(selectedMetricsStr);
          setSelectedMetrics(metrics);
        } catch (e) {
          console.error("Failed to parse selectedMetrics:", e);
        }
      }
    };

    loadSelectedMetrics();

    // ✅ Listen storage event จากหน้าอื่น
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "selectedMetrics" && e.newValue) {
        try {
          const metrics = JSON.parse(e.newValue);
          setSelectedMetrics(metrics);
        } catch (error) {
          console.error("Failed to parse storage event:", error);
        }
      }
    };

    // ✅ Listen custom event สำหรับ sync ภายในหน้าเดียวกัน
    const handleMetricsChanged = () => {
      loadSelectedMetrics();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("metricsChanged", handleMetricsChanged);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("metricsChanged", handleMetricsChanged);
    };
  }, [pageSize]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-800">
                SPB040HH Boiler 4 T/H 16 Bar
              </h1>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Sensors Report
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                อัพเดทล่าสุด: {lastUpdate || "-"}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <select
                aria-label="test"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={25}>25 รายการ/หน้า</option>
                <option value={50}>50 รายการ/หน้า</option>
                <option value={100}>100 รายการ/หน้า</option>
                <option value={200}>200 รายการ/หน้า</option>
              </select>
              <button
                onClick={() =>
                  fetchSensors(
                    currentPage,
                    pageSize,
                    isFiltered ? startDate : undefined,
                    isFiltered ? endDate : undefined,
                    sortOrder
                  )
                }
                disabled={loading}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-500">ทั้งหมด</div>
            <div className="text-lg sm:text-2xl font-bold text-purple-600">
              {totalItems.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="text-xs sm:text-sm text-gray-500">สถานะ</div>
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              ● ออนไลน์
            </div>
          </div>
          {sensors.length > 0 && (
            <>
              {metrics.map((metric) => {
                const value = sensors[0]
                  ? parseFloat(
                      sensors[0][metric.key as keyof SensorData] as string
                    )
                  : 0;
                return (
                  <div
                    key={metric.key}
                    className="bg-white rounded-lg shadow p-3 sm:p-4"
                  >
                    <div className="text-xs sm:text-sm text-gray-500 mb-1">
                      {metric.label}
                    </div>
                    <div
                      className="text-lg sm:text-2xl font-bold"
                      style={{ color: metric.color }}
                    >
                      {value.toFixed(2)} {metric.unit}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* ✅ ลบปุ่ม toggle และแสดง Filter ตลอดเวลา */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5" />
            กรองและส่งออกข้อมูล
          </h2>

          <div className="space-y-4">
            <div className="space-y-4">
              {/* ✅ ใช้ grid responsive - desktop 4 คอลัมน์, tablet 2 คอลัมน์, mobile 1 คอลัมน์ */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Sort Buttons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ArrowUpDown className="w-4 h-4 inline mr-1" />
                    เรียงลำดับตามเวลา
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSortChange("desc")}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border transition-colors text-sm ${
                        sortOrder === "desc"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      ใหม่ก่อน
                    </button>
                    <button
                      onClick={() => handleSortChange("asc")}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border transition-colors text-sm ${
                        sortOrder === "asc"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      เก่าก่อน
                    </button>
                  </div>
                </div>

                {/* Start Date */}
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

                {/* End Date */}
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

                {/* Action Buttons */}
                <div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleFilter}
                      disabled={loading}
                      className="max-w-full lg:max-w-[50%] flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Filter className="w-4 h-4" />
                      <span className="hidden sm:inline">กรอง</span>
                    </button>
                    {isFiltered && (
                      <button
                        onClick={handleClearFilter}
                        className="max-w-full lg:max-w-[50%] flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">ล้าง</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                เลือก Metrics ที่ต้องการแสดง (สำหรับ Export)
              </h3>
              <div className="flex flex-wrap gap-2">
                {metrics.map((metric) => (
                  <button
                    key={metric.key}
                    onClick={() => toggleMetric(metric.key)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedMetrics.includes(metric.key)
                        ? "bg-gray-800 text-white shadow-lg"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                    style={
                      selectedMetrics.includes(metric.key)
                        ? { borderLeft: `4px solid ${metric.color}` }
                        : {}
                    }
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 การเลือก Metrics จะ sync กับหน้า Dashboard และใช้สำหรับการ
                Export ข้อมูล
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Download className="w-4 h-4" />
                ส่งออกข้อมูล{" "}
                {isFiltered ? "(ตามที่กรอง)" : "(ชุดข้อมูลทั้งหมด)"}
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportToCSV}
                  disabled={exportLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {exportLoading ? "กำลังส่งออก..." : "ส่งออกเป็น CSV"}
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={exportLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {exportLoading ? "กำลังส่งออก..." : "ส่งออกเป็น Excel"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <div>
              <strong>เกิดข้อผิดพลาด:</strong> {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4">
          <div className="text-xs sm:text-sm text-gray-600">
            แสดง {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, totalItems)} จาก{" "}
            {totalItems.toLocaleString()} รายการ (หน้า {currentPage} /{" "}
            {totalPages})
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading && sensors.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">กำลังโหลดข้อมูล...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      เวลาบันทึก
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Steam Setpoint
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Steam Pressure
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Stack Temperature
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      MT1 OIL SUPPLY
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      MT2 BOILER FEED
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      MT3 SOFT WATER
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      MT4 CONDENSATE
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Oil Pressure
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sensors.map((sensor, index) => (
                    <tr
                      key={sensor.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-500">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatDateTime(sensor.record_time)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right font-medium">
                        {formatNumber(sensor.sv_steam_setpoint)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right font-medium">
                        {formatNumber(sensor.pt_steam_pressure)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right font-medium">
                        <span
                          className={getStatusColor(
                            String(sensor.tc1_stack_temperature),
                            35,
                            43
                          )}
                        >
                          {sensor.tc1_stack_temperature}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right text-gray-600">
                        {formatNumber(sensor.mt1_oil_supply_meter)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right text-gray-600">
                        {formatNumber(sensor.mt2_boiler_feed_meter)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right text-gray-600">
                        {formatNumber(sensor.mt3_soft_water_meter)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right text-gray-600">
                        {formatNumber(sensor.mt4_condensate_meter)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right text-gray-600">
                        {formatNumber(sensor.opt_oil_pressure)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {sensors.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">
                  ไม่พบข้อมูล
                </div>
              )}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mt-4">
            <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="hidden sm:flex gap-2">
                {getPageNumbers().map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      typeof page === "number" ? handlePageChange(page) : null
                    }
                    disabled={page === "..." || page === currentPage || loading}
                    className={`px-4 py-2 rounded-lg border transition-colors min-w-[40px] ${
                      page === currentPage
                        ? "bg-blue-600 text-white border-blue-600"
                        : page === "..."
                        ? "border-transparent cursor-default"
                        : "border-gray-300 hover:bg-gray-50"
                    } disabled:cursor-not-allowed`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <div className="sm:hidden px-3 py-2 text-sm text-gray-600">
                {currentPage} / {totalPages}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="ถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="หน้าสุดท้าย"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
