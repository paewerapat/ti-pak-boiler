'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Database, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, FileSpreadsheet, FileText, Menu, X, Home, BarChart3, Settings, Calendar, Filter } from 'lucide-react';
import Navbar from '../../components/header/Navbar';

interface SensorData {
  id: number;
  SV1: string;
  PT1: string;
  Temp1: string;
  Meter1: string;
  Meter2: string;
  Meter3: string;
  Meter4: string;
  Meter5: string;
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

interface SensorsDashboardProps {}

export default function SensorsDashboard({}: SensorsDashboardProps) {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [showFilterExport, setShowFilterExport] = useState<boolean>(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFiltered, setIsFiltered] = useState<boolean>(false);

  const fetchSensors = async (page: number = currentPage, size: number = pageSize, start?: string, end?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/api/sensors?page=${page}&pageSize=${size}`;
      if (start) url += `&startDate=${start}`;
      if (end) url += `&endDate=${end}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const result: PaginationResponse = await response.json();
      setSensors(result.data);
      setCurrentPage(result.pagination.currentPage);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
      setLastUpdate(new Date().toLocaleString('th-TH'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors(1, pageSize);
  }, [pageSize]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchSensors(page, pageSize, isFiltered ? startDate : undefined, isFiltered ? endDate : undefined);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleFilter = () => {
    if (!startDate && !endDate) {
      setError('กรุณาเลือกวันที่เริ่มต้นหรือสิ้นสุด');
      return;
    }
    setIsFiltered(true);
    setCurrentPage(1);
    fetchSensors(1, pageSize, startDate, endDate);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setIsFiltered(false);
    setCurrentPage(1);
    fetchSensors(1, pageSize);
  };

  const exportToCSV = async () => {
    try {
      setExportLoading(true);
      
      let url = `/api/sensors/export?format=csv`;
      if (isFiltered && (startDate || endDate)) {
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `sensors_data_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      
      let url = `/api/sensors/export?format=excel`;
      if (isFiltered && (startDate || endDate)) {
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `sensors_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (value: string, min: number, max: number): string => {
    const numValue = parseFloat(value);
    if (numValue < min) return 'text-blue-600';
    if (numValue > max) return 'text-red-600';
    return 'text-green-600';
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
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                Sensors Data
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                อัพเดทล่าสุด: {lastUpdate || '-'}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <button
                onClick={() => fetchSensors(currentPage, pageSize, isFiltered ? startDate : undefined, isFiltered ? endDate : undefined)}
                disabled={loading}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter and Export Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              กรองและส่งออกข้อมูล
            </h2>
            <button
              onClick={() => setShowFilterExport(!showFilterExport)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showFilterExport ? 'ซ่อน' : 'แสดง'}
            </button>
          </div>

          {showFilterExport && (
            <div className="space-y-4">
              {/* Date Range Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    วันที่เริ่มต้น
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleFilter}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  กรองข้อมูล
                </button>
                {isFiltered && (
                  <button
                    onClick={handleClearFilter}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    ล้างตัวกรอง
                  </button>
                )}
              </div>

              {/* Export Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  ส่งออกข้อมูล {isFiltered ? '(ตามที่กรอง)' : '(ทั้งหมด)'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={exportToCSV}
                    disabled={exportLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    {exportLoading ? 'กำลังส่งออก...' : 'ส่งออกเป็น CSV'}
                  </button>
                  <button
                    onClick={exportToExcel}
                    disabled={exportLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {exportLoading ? 'กำลังส่งออก...' : 'ส่งออกเป็น Excel'}
                  </button>
                </div>
                {isFiltered && (
                  <p className="text-xs text-gray-500 mt-2">
                    💡 จะส่งออกเฉพาะข้อมูลที่กรองตามวันที่ที่เลือก
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Filter Status */}
          {isFiltered && !showFilterExport && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              <Filter className="w-4 h-4" />
              <span>กำลังกรองข้อมูล: {startDate ? new Date(startDate).toLocaleString('th-TH') : 'ไม่ระบุ'} ถึง {endDate ? new Date(endDate).toLocaleString('th-TH') : 'ไม่ระบุ'}</span>
              <button
                onClick={handleClearFilter}
                className="ml-auto text-blue-700 hover:text-blue-800 font-medium"
              >
                ล้าง
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <div>
              <strong>เกิดข้อผิดพลาด:</strong> {error}
            </div>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {sensors.length > 0 && (
            <>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-500">SV1</div>
                <div className="text-lg sm:text-2xl font-bold text-blue-600">
                  {formatNumber(sensors[0].SV1)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-500">PT1</div>
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  {formatNumber(sensors[0].PT1)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-500">Temp1</div>
                <div className="text-lg sm:text-2xl font-bold text-orange-600">
                  {formatNumber(sensors[0].Temp1)}°C
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-500">ทั้งหมด</div>
                <div className="text-lg sm:text-2xl font-bold text-purple-600">
                  {totalItems.toLocaleString()}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4 col-span-2 sm:col-span-3 lg:col-span-1">
                <div className="text-xs sm:text-sm text-gray-500">สถานะ</div>
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  ●  ออนไลน์
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pagination Info */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4">
          <div className="text-xs sm:text-sm text-gray-600">
            แสดง {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} จาก {totalItems.toLocaleString()} รายการ (หน้า {currentPage} / {totalPages})
          </div>
        </div>

        {/* Table */}
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
                      ID
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      เวลาบันทึก
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      SV1
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      PT1
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Temp1
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Meter1
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Meter2
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Meter3
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Meter4
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Meter5
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
                        {((currentPage - 1) * pageSize) + index + 1}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-700 font-medium">
                        {sensor.id}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatDateTime(sensor.record_time)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right font-medium">
                        {formatNumber(sensor.SV1)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right font-medium">
                        {formatNumber(sensor.PT1)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right font-medium">
                        <span className={getStatusColor(sensor.Temp1, 35, 43)}>
                          {formatNumber(sensor.Temp1)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right text-gray-600">
                        {formatNumber(sensor.Meter1)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right text-gray-600">
                        {formatNumber(sensor.Meter2)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right text-gray-600">
                        {formatNumber(sensor.Meter3)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right text-gray-600">
                        {formatNumber(sensor.Meter4)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-right text-gray-600">
                        {formatNumber(sensor.Meter5)}
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mt-4">
            <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="หน้าแรก"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="ก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="hidden sm:flex gap-2">
                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                    disabled={page === '...' || page === currentPage || loading}
                    className={`px-4 py-2 rounded-lg border transition-colors min-w-[40px] ${
                      page === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : page === '...'
                        ? 'border-transparent cursor-default'
                        : 'border-gray-300 hover:bg-gray-50'
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