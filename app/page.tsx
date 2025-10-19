'use client';

import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import Navbar from './components/header/Navbar';
import { Calendar, Filter, X } from 'lucide-react';

interface SensorData {
  id: number;
  sv_steam_setpoint: string;
  pt_steam_pressure: string;
  tc1_stack_temperature: string;
  mt1_oil_supply_meter: string;
  mt2_boiler_feed_meter: string;
  mt3_soft_water_meter: string;
  mt4_condensate_meter: string;
  opt_oil_pressure: string;
  record_time: string;
}

interface ChartDataPoint {
  time: string;
  fullTime: string;
  sv_steam_setpoint: number;
  pt_steam_pressure: number;
  tc1_stack_temperature: number;
  mt1_oil_supply_meter: number;
  mt2_boiler_feed_meter: number;
  mt3_soft_water_meter: number;
  mt4_condensate_meter: number;
  opt_oil_pressure: number;
}

export default function Dashboard() {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['tc1_stack_temperature', 'sv_steam_setpoint', 'pt_steam_pressure']);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [pageSize, setPageSize] = useState<number>(1000);
  const [timeRange, setTimeRange] = useState<string>('1hour'); // Default 1 ชั่วโมง
  const brushDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const metrics = [
    { key: 'sv_steam_setpoint', label: 'Steam Setpoint', color: '#3b82f6', unit: '' },
    { key: 'pt_steam_pressure', label: 'Steam Pressure', color: '#10b981', unit: '' },
    { key: 'tc1_stack_temperature', label: 'Stack Temperature', color: '#f59e0b', unit: '°C' },
    { key: 'mt1_oil_supply_meter', label: 'Meter 1', color: '#8b5cf6', unit: '' },
    { key: 'mt2_boiler_feed_meter', label: 'Meter 2', color: '#ec4899', unit: '' },
    { key: 'mt3_soft_water_meter', label: 'Meter 3', color: '#06b6d4', unit: '' },
    { key: 'mt4_condensate_meter', label: 'Meter 4', color: '#f43f5e', unit: '' },
    { key: 'opt_oil_pressure', label: 'Oil Pressure', color: '#84cc16', unit: '' },
  ];

  const handleFilter = () => {
    if (!startDate || !endDate) {
      alert('กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด');
      return;
    }
    
    console.log('Custom filtering from:', startDate, 'to:', endDate, 'pageSize:', pageSize);
    setChartData([]);
    fetchSensors(startDate, endDate, pageSize);
  };

  useEffect(() => {
    // Set default to 1 hour ago
    updateTimeRange('1hour');
    
    // Cleanup debounce timer เมื่อ component unmount
    return () => {
      if (brushDebounceTimer.current) {
        clearTimeout(brushDebounceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (sensors.length > 0) {
      prepareChartData();
    } else {
      setChartData([]); // ถ้าไม่มีข้อมูลให้ clear กราฟ
    }
  }, [sensors]); // เมื่อ sensors เปลี่ยนให้ update กราฟใหม่

  const fetchSensors = async (start?: string, end?: string, limit?: number) => {
    try {
      setLoading(true);
      
      // ใช้ pageSize ที่เลือกจาก UI
      const itemsPerPage = limit || pageSize;
      let url = `/api/sensors?pageSize=${itemsPerPage}`;
      
      if (start) {
        // แปลง datetime-local format เป็น ISO string
        const startISO = new Date(start).toISOString();
        url += `&startDate=${encodeURIComponent(startISO)}`;
      }
      if (end) {
        const endISO = new Date(end).toISOString();
        url += `&endDate=${encodeURIComponent(endISO)}`;
      }
      
      console.log('Fetching:', url); // Debug
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const result = await response.json();
      console.log('Received data:', result.data?.length, 'rows'); // Debug
      setSensors(result.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    const data: ChartDataPoint[] = sensors.map(sensor => ({
      time: new Date(sensor.record_time).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // ใช้ระบบ 24 ชั่วโมง
      }),
      fullTime: new Date(sensor.record_time).toLocaleString('th-TH', {
        hour12: false // ใช้ระบบ 24 ชั่วโมง
      }),
      sv_steam_setpoint: parseFloat(sensor.sv_steam_setpoint),
      pt_steam_pressure: parseFloat(sensor.pt_steam_pressure),
      tc1_stack_temperature: parseFloat(sensor.tc1_stack_temperature),
      mt1_oil_supply_meter: parseFloat(sensor.mt1_oil_supply_meter),
      mt2_boiler_feed_meter: parseFloat(sensor.mt2_boiler_feed_meter),
      mt3_soft_water_meter: parseFloat(sensor.mt3_soft_water_meter),
      mt4_condensate_meter: parseFloat(sensor.mt4_condensate_meter),
      opt_oil_pressure: parseFloat(sensor.opt_oil_pressure),
    })).reverse(); // เรียงจากเก่าไปใหม่
    
    console.log('Chart data prepared:', data.length, 'points'); // Debug
    setChartData(data);
  };

  const formatDatetimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const updateTimeRange = (range: string) => {
    const end = new Date();
    let start = new Date();
    let size = 1000;

    switch (range) {
      case '1hour':
        start = new Date(end.getTime() - 1 * 60 * 60 * 1000);
        size = 360; // ~10 วินาทีต่อจุด
        break;
      case '24hours':
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        size = 1440; // 1 นาทีต่อจุด
        break;
      case '1week':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        size = 2016; // ~5 นาทีต่อจุด
        break;
      case '1month':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        size = 3000; // ~15 นาทีต่อจุด
        break;
      case 'custom':
        // ใช้ค่าที่ user เลือกเอง
        return;
      default:
        start = new Date(end.getTime() - 1 * 60 * 60 * 1000);
        size = 360;
    }

    setTimeRange(range);
    setStartDate(formatDatetimeLocal(start));
    setEndDate(formatDatetimeLocal(end));
    setPageSize(size);
    
    // โหลดข้อมูลทันที
    fetchSensors(formatDatetimeLocal(start), formatDatetimeLocal(end), size);
  };

  const handleTimeRangeChange = (range: string) => {
    if (range === 'custom') {
      setTimeRange('custom');
    } else {
      updateTimeRange(range);
    }
  };

  const toggleMetric = (metricKey: string) => {
    if (selectedMetrics.includes(metricKey)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metricKey));
    } else {
      setSelectedMetrics([...selectedMetrics, metricKey]);
    }
  };

  const handleBrushChange = (domain: any) => {
    // ใช้ debounce เพื่อให้รอ 500ms หลังจากลากเสร็จค่อย update
    if (brushDebounceTimer.current) {
      clearTimeout(brushDebounceTimer.current);
    }

    brushDebounceTimer.current = setTimeout(() => {
      if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
        console.log('Brush zoom:', domain.startIndex, 'to', domain.endIndex);
      }
    }, 500); // รอ 500ms หลังจากหยุดลาก
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{payload[0].payload.fullTime}</p>
          {payload.map((entry: any, index: number) => {
            const metric = metrics.find(m => m.key === entry.dataKey);
            return (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <span style={{ color: entry.color }} className="font-medium">
                  {metric?.label}:
                </span>
                <span className="font-semibold text-gray-900">
                  {entry.value.toFixed(2)} {metric?.unit}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const handleChartClick = (data: any) => {
    if (data && data.activePayload) {
      setTooltipData(data.activePayload[0].payload);
      setShowTooltip(true);
    }
  };

  useEffect(() => {
    localStorage.setItem('selectedMetrics', JSON.stringify(selectedMetrics));
  }, [selectedMetrics])

  const latestData = sensors[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard - History Trend Chart</h1>
          <p className="text-sm text-gray-500 mt-1">
            แสดงกราฟแนวโน้มข้อมูลเซ็นเซอร์แบบ Real-time
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {metrics.slice(0, 5).map(metric => {
            const value = latestData ? parseFloat(latestData[metric.key as keyof SensorData] as string) : 0;
            return (
              <div key={metric.key} className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-500 mb-1">{metric.label}</div>
                <div className="text-lg sm:text-2xl font-bold" style={{ color: metric.color }}>
                  {value.toFixed(2)} {metric.unit}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">History Trend Chart</h2>

          {/* Filter Controls */}
          <div className="mb-6">
            {/* Time Range Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ช่วงเวลา
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => handleTimeRangeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1hour">1 ชั่วโมง</option>
                  <option value="24hours">24 ชั่วโมง</option>
                  <option value="1week">1 สัปดาห์</option>
                  <option value="1month">1 เดือน</option>
                  <option value="custom">กำหนดเอง</option>
                </select>
              </div>

              {/* Custom Date Range (แสดงเมื่อเลือก custom) */}
              {timeRange === 'custom' && (
                <>
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
                </>
              )}
            </div>

            {/* Custom Filter Button */}
            {timeRange === 'custom' && (
              <button
                onClick={handleFilter}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mb-4"
              >
                <Filter className="w-4 h-4" />
                กรองข้อมูล
              </button>
            )}

            {/* Metric Toggles */}
            <div className="flex flex-wrap gap-2">
              {metrics.map(metric => (
                <button
                  key={metric.key}
                  onClick={() => toggleMetric(metric.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedMetrics.includes(metric.key)
                      ? 'bg-gray-800 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  style={selectedMetrics.includes(metric.key) ? { borderLeft: `4px solid ${metric.color}` } : {}}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200" style={{ height: '600px' }}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-600">กำลังโหลดข้อมูล...</div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-500 mb-2">ไม่พบข้อมูล</div>
                  <div className="text-sm text-gray-400">ลองเปลี่ยนช่วงเวลาหรือเพิ่มจำนวนข้อมูล</div>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  onClick={handleChartClick}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#6b7280"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  {selectedMetrics.map(metricKey => {
                    const metric = metrics.find(m => m.key === metricKey);
                    return metric ? (
                      <Line
                        key={metricKey}
                        type="monotone"
                        dataKey={metricKey}
                        name={metric.label}
                        stroke={metric.color}
                        strokeWidth={2}
                        dot={{ fill: metric.color, r: 3 }}
                        activeDot={{ 
                          r: 6, 
                          onClick: (e: any, payload: any) => {
                            setTooltipData(payload.payload);
                            setShowTooltip(true);
                          }
                        }}
                      />
                    ) : null;
                  })}
                  <Brush 
                    dataKey="time" 
                    height={40} 
                    stroke="#3b82f6"
                    fill="#eff6ff"
                    onChange={handleBrushChange}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p><strong>คำแนะนำ:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>เลือกช่วงเวลาด่วนด้านบน หรือกำหนดเองสำหรับช่วงเวลาที่ต้องการ</li>
              <li>ใช้แถบเลื่อนด้านล่างกราฟเพื่อซูมเข้า-ออกช่วงเวลา</li>
              <li>คลิกที่ปุ่มชื่อ metric เพื่อเปิด/ปิดการแสดงผล</li>
              <li>Hover บนกราฟเพื่อดูรายละเอียด หรือคลิกจุดเพื่อเปิด popup</li>
            </ul>
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
              <strong>กำลังแสดง:</strong> {sensors.length} รายการ | 
              <strong> ช่วงเวลา:</strong> {timeRange === '1hour' ? '1 ชั่วโมง' : 
                                           timeRange === '24hours' ? '24 ชั่วโมง' : 
                                           timeRange === '1week' ? '1 สัปดาห์' : 
                                           timeRange === '1month' ? '1 เดือน' : 'กำหนดเอง'}
            </div>
          </div>
        </div>

        {/* Latest Values Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">ค่าล่าสุด</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Metric</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {latestData && metrics.map(metric => {
                  const value = parseFloat(latestData[metric.key as keyof SensorData] as string);
                  return (
                    <tr key={metric.key} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: metric.color }}>
                        {metric.label}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {value.toFixed(2)} {metric.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(latestData.record_time).toLocaleString('th-TH')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Custom Tooltip Popup */}
      {showTooltip && tooltipData && (
        <>
          <div 
            className="fixed z-50 bg-white rounded-lg shadow-2xl p-4 border-2 border-blue-500"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              minWidth: '320px',
              maxWidth: '90vw'
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="font-bold text-lg text-gray-800">{tooltipData.fullTime}</div>
              <button
                onClick={() => setShowTooltip(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {metrics.map(metric => (
                <div key={metric.key} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-medium" style={{ color: metric.color }}>
                    {metric.label}:
                  </span>
                  <span className="font-bold text-gray-900">
                    {tooltipData[metric.key]?.toFixed(2)} {metric.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div 
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowTooltip(false)}
          />
        </>
      )}
    </div>
  );
}