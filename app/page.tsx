"use client";

import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { Calendar, Filter, X, Loader2 } from "lucide-react"; // ✅ เพิ่ม Loader2
import Navbar from "./components/header/Navbar";
import DateTimePicker from "./components/DateTimePicker";

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

interface ChartDataPoint {
  time: string;
  fullTime: string;
  dateTime: string;
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
  const [chartLoading, setChartLoading] = useState<boolean>(false); // ✅ เพิ่ม loading สำหรับ chart
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "tc1_stack_temperature",
    "sv_steam_setpoint",
    "pt_steam_pressure",
  ]);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [pageSize, setPageSize] = useState<number>(1000);
  const [timeRange, setTimeRange] = useState<string>("1hour");
  const brushDebounceTimer = useRef<NodeJS.Timeout | null>(null);

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

  const handleFilter = () => {
    if (!startDate || !endDate) {
      alert("กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด");
      return;
    }

    console.log(
      "Custom filtering from:",
      startDate,
      "to:",
      endDate,
      "pageSize:",
      pageSize
    );
    setChartData([]);
    setChartLoading(true); // ✅ เริ่ม loading
    fetchSensors(startDate, endDate, pageSize);
  };

  useEffect(() => {
    updateTimeRange("1hour");

    return () => {
      if (brushDebounceTimer.current) {
        clearTimeout(brushDebounceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (sensors.length > 0) {
      // ✅ แสดง loading ระหว่าง prepare chart data
      setChartLoading(true);
      prepareChartData();
    } else {
      setChartData([]);
      setChartLoading(false);
    }
  }, [sensors]);

  const fetchSensors = async (start?: string, end?: string, limit?: number) => {
    try {
      setLoading(true);

      const itemsPerPage = limit || pageSize;
      let url = `/api/sensors?noLimit=true`;

      if (start) {
        url += `&startDate=${encodeURIComponent(start)}`;
      }
      if (end) {
        url += `&endDate=${encodeURIComponent(end)}`;
      }

      console.log("Fetching:", url);

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      console.log("Received data:", result.data?.length, "rows");
      setSensors(result.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setChartLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    // ✅ ฟังก์ชันแปลงเวลาที่ถูกต้อง - แสดงเวลาตรงๆ ไม่บวก timezone
    const formatLocalDateTime = (
      dateString: string,
      format: "full" | "time" | "short"
    ): string => {
      // ตัด .000Z ออก และ parse เป็น local time
      const cleanDateStr = dateString.replace(/\.000Z$/, "").replace("T", " ");
      const [datePart, timePart] = cleanDateStr.split(" ");
      const [year, month, day] = datePart.split("-");
      const [hours, minutes, seconds] = timePart.split(":");

      if (format === "time") {
        return `${hours}:${minutes}`; // "00:11"
      } else if (format === "short") {
        return `${day}/${month} ${hours}:${minutes}`; // "16/11 00:11"
      } else {
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`; // "16/11/2025 00:11:31"
      }
    };

    // ✅ ใช้ setTimeout เพื่อให้ UI update loading state ก่อน
    setTimeout(() => {
      const data: ChartDataPoint[] = sensors
        .map((sensor) => {
          return {
            time: formatLocalDateTime(sensor.record_time, "time"), // "00:11"
            fullTime: formatLocalDateTime(sensor.record_time, "full"), // "16/11/2025 00:11:31"
            dateTime: formatLocalDateTime(sensor.record_time, "short"), // "16/11 00:11"
            sv_steam_setpoint: parseFloat(sensor.sv_steam_setpoint),
            pt_steam_pressure: parseFloat(sensor.pt_steam_pressure),
            tc1_stack_temperature: sensor.tc1_stack_temperature,
            mt1_oil_supply_meter: parseFloat(sensor.mt1_oil_supply_meter),
            mt2_boiler_feed_meter: parseFloat(sensor.mt2_boiler_feed_meter),
            mt3_soft_water_meter: parseFloat(sensor.mt3_soft_water_meter),
            mt4_condensate_meter: parseFloat(sensor.mt4_condensate_meter),
            opt_oil_pressure: parseFloat(sensor.opt_oil_pressure),
          };
        })
        .reverse();

      console.log("Chart data prepared:", data.length, "points");
      setChartData(data);

      // ✅ ให้เวลา Recharts render ก่อนปิด loading
      setTimeout(() => {
        setChartLoading(false);
      }, 300);
    }, 100);
  };

  const formatDatetimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const updateTimeRange = (range: string) => {
    const now = new Date();
    let start = new Date(now);
    let size = 1000;

    switch (range) {
      case "1hour":
        start = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        size = 360;
        break;
      case "24hours":
        start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        size = 1440;
        break;
      case "1week":
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        size = 2016;
        break;
      case "1month":
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        size = 3000;
        break;
      case "custom":
        return;
      default:
        start = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        size = 360;
    }

    setTimeRange(range);
    setStartDate(formatDatetimeLocal(start));
    setEndDate(formatDatetimeLocal(now));
    setPageSize(size);

    console.log("Time range updated:", {
      range,
      start: formatDatetimeLocal(start),
      end: formatDatetimeLocal(now),
      size,
    });

    setChartLoading(true); // ✅ เริ่ม loading
    fetchSensors(formatDatetimeLocal(start), formatDatetimeLocal(now), size);
  };

  const handleTimeRangeChange = (range: string) => {
    if (range === "custom") {
      setTimeRange("custom");
    } else {
      updateTimeRange(range);
    }
  };

  const toggleMetric = (metricKey: string) => {
    if (selectedMetrics.includes(metricKey)) {
      setSelectedMetrics(selectedMetrics.filter((m) => m !== metricKey));
    } else {
      setSelectedMetrics([...selectedMetrics, metricKey]);
    }
  };

  const handleBrushChange = (domain: any) => {
    if (brushDebounceTimer.current) {
      clearTimeout(brushDebounceTimer.current);
    }

    brushDebounceTimer.current = setTimeout(() => {
      if (
        domain &&
        domain.startIndex !== undefined &&
        domain.endIndex !== undefined
      ) {
        console.log("Brush zoom:", domain.startIndex, "to", domain.endIndex);
      }
    }, 500);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">
            {payload[0].payload.fullTime}
          </p>
          {payload.map((entry: any, index: number) => {
            const metric = metrics.find((m) => m.key === entry.dataKey);
            return (
              <div
                key={index}
                className="flex items-center justify-between gap-4 text-sm"
              >
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
    localStorage.setItem("selectedMetrics", JSON.stringify(selectedMetrics));
  }, [selectedMetrics]);

  const latestData = sensors[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard - History Trend Chart
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            แสดงกราฟแนวโน้มข้อมูลเซ็นเซอร์แบบ Real-time
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {metrics.slice(0, 5).map((metric) => {
            const value = latestData
              ? parseFloat(latestData[metric.key as keyof SensorData] as string)
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
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            History Trend Chart
          </h2>

          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ช่วงเวลา
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => handleTimeRangeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={chartLoading} // ✅ ปิดการใช้งานระหว่าง loading
                >
                  <option value="1hour">1 ชั่วโมง</option>
                  <option value="24hours">24 ชั่วโมง</option>
                  <option value="1week">1 สัปดาห์</option>
                  <option value="1month">1 เดือน</option>
                  <option value="custom">กำหนดเอง</option>
                </select>
              </div>

              {timeRange === "custom" && (
                <>
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
                </>
              )}
            </div>

            {timeRange === "custom" && (
              <button
                onClick={handleFilter}
                disabled={chartLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mb-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Filter className="w-4 h-4" />
                กรองข้อมูล
              </button>
            )}

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
          </div>

          {/* ✅ Chart Container with Loading Overlay */}
          <div
            className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative"
            style={{ height: "650px" }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <div className="text-gray-600">กำลังโหลดข้อมูล...</div>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-500 mb-2">ไม่พบข้อมูล</div>
                  <div className="text-sm text-gray-400">
                    ลองเปลี่ยนช่วงเวลาหรือเพิ่มจำนวนข้อมูล
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* ✅ Loading Overlay */}
                {chartLoading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
                      <div className="text-gray-700 font-medium">
                        กำลังสร้างกราฟ...
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        กำลังประมวลผล {sensors.length.toLocaleString()} รายการ
                      </div>
                    </div>
                  </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    onClick={handleChartClick}
                    margin={{ top: 20, right: 30, left: 20, bottom: 110 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                    {/* ✅ แก้ไข: ใช้ dateTime แทน time เพื่อให้มี unique key */}
                    <XAxis
                      dataKey="dateTime" // ✅ เปลี่ยนจาก "time" เป็น "dateTime"
                      stroke="#6b7280"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: "#6b7280", fontSize: 11 }} // ✅ ลดขนาดตัวอักษรเล็กลง
                    />

                    <YAxis stroke="#6b7280" tick={{ fill: "#6b7280" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      iconType="line"
                    />

                    {selectedMetrics.map((metricKey) => {
                      const metric = metrics.find((m) => m.key === metricKey);
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
                            },
                          }}
                        />
                      ) : null;
                    })}

                    <Brush
                      dataKey="dateTime"
                      height={70}
                      stroke="#3b82f6"
                      fill="#eff6ff"
                      onChange={handleBrushChange}
                      travellerWidth={12}
                      tickFormatter={(value) => value}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>
              <strong>คำแนะนำ:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                เลือกช่วงเวลาด่วนด้านบน หรือกำหนดเองสำหรับช่วงเวลาที่ต้องการ
              </li>
              <li>ใช้แถบเลื่อนด้านล่างกราฟเพื่อซูมเข้า-ออกช่วงเวลา</li>
              <li>คลิกที่ปุ่มชื่อ metric เพื่อเปิด/ปิดการแสดงผล</li>
              <li>Hover บนกราฟเพื่อดูรายละเอียด หรือคลิกจุดเพื่อเปิด popup</li>
            </ul>
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
              <strong>กำลังแสดง:</strong> {sensors.length.toLocaleString()}{" "}
              รายการ | <strong> ช่วงเวลา:</strong>{" "}
              {timeRange === "1hour"
                ? "1 ชั่วโมง"
                : timeRange === "24hours"
                ? "24 ชั่วโมง"
                : timeRange === "1week"
                ? "1 สัปดาห์"
                : timeRange === "1month"
                ? "1 เดือน"
                : "กำหนดเอง"}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">ค่าล่าสุด</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Metric
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {latestData &&
                  metrics.map((metric) => {
                    const value = parseFloat(
                      latestData[metric.key as keyof SensorData] as string
                    );
                    return (
                      <tr key={metric.key} className="hover:bg-gray-50">
                        <td
                          className="px-4 py-3 text-sm font-medium"
                          style={{ color: metric.color }}
                        >
                          {metric.label}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                          {value.toFixed(2)} {metric.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {(() => {
                            const cleanDateStr = latestData.record_time
                              .replace(/\.000Z$/, "")
                              .replace("T", " ");
                            const [datePart, timePart] =
                              cleanDateStr.split(" ");
                            const [year, month, day] = datePart.split("-");
                            const [hours, minutes, seconds] =
                              timePart.split(":");
                            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                          })()}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showTooltip && tooltipData && (
        <>
          <div
            className="fixed z-50 bg-white rounded-lg shadow-2xl p-4 border-2 border-blue-500"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              minWidth: "320px",
              maxWidth: "90vw",
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="font-bold text-lg text-gray-800">
                {tooltipData.fullTime}
              </div>
              <button
                onClick={() => setShowTooltip(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {metrics.map((metric) => (
                <div
                  key={metric.key}
                  className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0"
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: metric.color }}
                  >
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
