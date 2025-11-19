import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";
import * as XLSX from "xlsx";

interface AlarmRow extends RowDataPacket {
  id: number;
  name: string;
  alarm_content: string;
  status: number;
  created_at: string;
  ended_at: string | null;
}

// ✅ เพิ่มฟังก์ชันแปลงเวลา
function convertDisplayToDBTime(dateStr: string): string {
  if (!dateStr) return '';
  
  const displayDate = new Date(dateStr.replace('T', ' '));
  const dbDate = new Date(displayDate.getTime() + (7 * 60 * 60 * 1000));
  
  const year = dbDate.getFullYear();
  const month = String(dbDate.getMonth() + 1).padStart(2, '0');
  const day = String(dbDate.getDate()).padStart(2, '0');
  const hours = String(dbDate.getHours()).padStart(2, '0');
  const minutes = String(dbDate.getMinutes()).padStart(2, '0');
  const seconds = String(dbDate.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// ✅ ฟังก์ชันแปลงวันที่เพื่อแสดงผล (ใช้ UTC methods)
function formatDateTime(dateString: string): string {
  if (!dateString) return "-";

  const date = new Date(dateString);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const format = searchParams.get("format") || "csv";
    const search = searchParams.get("search") || "";
    const startDateRaw = searchParams.get("startDate") || ""; // ✅ ใช้ค่าตรงๆ
    const endDateRaw = searchParams.get("endDate") || ""; // ✅ ใช้ค่าตรงๆ
    const status = searchParams.get("status") || "";

    // ✅ แปลงเวลาจาก display time เป็น DB time
    const startDate = startDateRaw ? convertDisplayToDBTime(startDateRaw) : null;
    const endDate = endDateRaw ? convertDisplayToDBTime(endDateRaw) : null;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];

    if (status !== "") {
      whereConditions.push("status = ?");
      queryParams.push(parseInt(status));
    }

    if (search) {
      whereConditions.push("(name LIKE ? OR alarm_content LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (startDate) {
      whereConditions.push("created_at >= ?");
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push("created_at <= ?");
      queryParams.push(endDate);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const dataQuery = `
      SELECT 
        id, 
        name, 
        alarm_content, 
        status, 
        created_at,
        ended_at
      FROM alarms
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const [alarms] = await pool.execute<AlarmRow[]>(dataQuery, queryParams);

    if (format === "csv") {
      // CSV Export
      const headers = [
        "ID",
        "Name",
        "Alarm Content",
        "Status",
        "Created At",
        "Ended At",
      ];

      const rows = alarms.map((alarm) => [
        alarm.id,
        alarm.name,
        alarm.alarm_content,
        alarm.status === 1 ? "ACTIVE" : "RESOLVED",
        formatDateTime(alarm.created_at),
        alarm.ended_at ? formatDateTime(alarm.ended_at) : "-",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      // Add BOM for UTF-8
      const bom = "\uFEFF";
      const csvWithBom = bom + csvContent;

      return new NextResponse(csvWithBom, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="alarms_export_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    } else if (format === "excel") {
       // ✅ Excel Export ด้วย xlsx - เพิ่มหัวข้อที่ row แรก
      const worksheetData = [
        ["SPB040HH Boiler 4 T/H 16 Bar"], // Row 1: หัวข้อ
        [], // Row 2: ว่าง
        ["ID", "Name", "Alarm Content", "Status", "Created At", "Ended At"], // Row 3: Headers
        ...alarms.map((alarm) => [
          alarm.id,
          alarm.name,
          alarm.alarm_content,
          alarm.status === 1 ? "ACTIVE" : "RESOLVED",
          formatDateTime(alarm.created_at),
          alarm.ended_at ? formatDateTime(alarm.ended_at) : "-",
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // ✅ Merge cells สำหรับหัวข้อ (A1:F1)
      worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

      // ✅ จัดสไตล์หัวข้อ (ตัวหนา, ขนาดใหญ่)
      if (worksheet["A1"]) {
        worksheet["A1"].s = {
          font: { bold: true, sz: 16 },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      // ✅ จัดสไตล์ headers (row 3)
      const headerRow = 2; // index 2 = row 3 (0-based)
      ["A", "B", "C", "D", "E", "F"].forEach((col) => {
        const cellRef = `${col}${headerRow + 1}`;
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center", vertical: "center" },
          };
        }
      });

      // ✅ ตั้งค่าความกว้างของคอลัมน์
      worksheet["!cols"] = [
        { wch: 10 },  // ID
        { wch: 30 },  // Name
        { wch: 50 },  // Alarm Content
        { wch: 15 },  // Status
        { wch: 25 },  // Created At
        { wch: 25 },  // Ended At
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Alarms");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "buffer",
        cellStyles: true, // ✅ เปิดใช้งาน cell styles
      });

      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="alarms_export_${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid format" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error exporting alarms:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export alarms" },
      { status: 500 }
    );
  }
}