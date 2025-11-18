import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

interface AlarmRow extends RowDataPacket {
  id: number;
  name: string;
  alarm_content: string;
  status: number;
  created_at: string;
  ended_at: string | null;
}

// ✅ เพิ่มฟังก์ชันแปลงเวลาไทยเป็น UTC (เหมือน sensors API)
function convertDisplayToDBTime(dateStr: string): string {
  if (!dateStr) return "";

  // user เลือก 09:45 (เวลาที่แสดง)
  const displayDate = new Date(dateStr.replace("T", " "));

  // บวก 7 ชั่วโมงเพื่อให้ตรงกับเวลาใน DB (16:45)
  const dbDate = new Date(displayDate.getTime() + 7 * 60 * 60 * 1000);

  const year = dbDate.getFullYear();
  const month = String(dbDate.getMonth() + 1).padStart(2, "0");
  const day = String(dbDate.getDate()).padStart(2, "0");
  const hours = String(dbDate.getHours()).padStart(2, "0");
  const minutes = String(dbDate.getMinutes()).padStart(2, "0");
  const seconds = String(dbDate.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "DESC";
    const search = searchParams.get("search") || "";
    const startDateRaw = searchParams.get("startDate") || "";
    const endDateRaw = searchParams.get("endDate") || "";
    const status = searchParams.get("status") || "";

    const offset = (page - 1) * limit;

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

    // ✅ แปลงเวลาที่ user เลือกให้ +7 ก่อน query
    if (startDateRaw) {
      const startDate = convertDisplayToDBTime(startDateRaw);
      console.log("🔍 Start filter:", {
        userInput: startDateRaw,
        dbQuery: startDate,
      });
      whereConditions.push("created_at >= ?");
      queryParams.push(startDate);
    }

    if (endDateRaw) {
      const endDate = convertDisplayToDBTime(endDateRaw);
      console.log("🔍 End filter:", {
        userInput: endDateRaw,
        dbQuery: endDate,
      });
      whereConditions.push("created_at <= ?");
      queryParams.push(endDate);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const allowedSortFields = [
      "id",
      "name",
      "status",
      "created_at",
      "ended_at",
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "created_at";
    const validSortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // ✅ ดึงข้อมูลตรงๆ ไม่ต้อง convert
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
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM alarms
      ${whereClause}
    `;

    const [alarms] = await pool.execute<AlarmRow[]>(dataQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    const [countResult] = await pool.execute<RowDataPacket[]>(
      countQuery,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: alarms,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching alarms:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch alarms" },
      { status: 500 }
    );
  }
}
