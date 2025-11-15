import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

interface SensorRow extends RowDataPacket {
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

interface CountRow extends RowDataPacket {
  total: number;
}

// ✅ แปลงเวลาไทยเป็น UTC สำหรับ query database
function convertThaiToUTC(dateStr: string): string {
  if (!dateStr) return '';
  
  // สร้าง Date object จาก local time (เวลาไทย)
  const localDate = new Date(dateStr.replace('T', ' '));
  
  // แปลงเป็น UTC string สำหรับ MySQL
  const year = localDate.getUTCFullYear();
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localDate.getUTCDate()).padStart(2, '0');
  const hours = String(localDate.getUTCHours()).padStart(2, '0');
  const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(localDate.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '100');
    const startDateRaw = searchParams.get('startDate');
    const endDateRaw = searchParams.get('endDate');
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const noLimit = searchParams.get('noLimit') === 'true'; // ✅ เพิ่มพารามิเตอร์นี้
    
    const offset = (page - 1) * pageSize;
    
    const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    const startDate = startDateRaw ? convertThaiToUTC(startDateRaw) : null;
    const endDate = endDateRaw ? convertThaiToUTC(endDateRaw) : null;
    
    let whereClause = '';
    const params: any[] = [];
    
    if (startDate || endDate) {
      const conditions: string[] = [];
      
      if (startDate) {
        conditions.push('record_time >= ?');
        params.push(startDate);
      }
      
      if (endDate) {
        conditions.push('record_time <= ?');
        params.push(endDate);
      }
      
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }
    
    // Count query
    const countSql = `SELECT COUNT(*) as total FROM sensors ${whereClause}`;
    const countResult = await query(countSql, params) as CountRow[];
    const totalItems = countResult[0].total;
    
    // ✅ Data query - เพิ่มเงื่อนไข noLimit
    let dataSql;
    let queryParams;
    
    if (noLimit) {
      // ดึงทั้งหมดโดยไม่ limit (สำหรับ dashboard chart)
      dataSql = `
        SELECT * FROM sensors 
        ${whereClause}
        ORDER BY record_time ${validSortOrder}
      `;
      queryParams = params;
    } else {
      // ดึงแบบมี pagination (สำหรับตาราง)
      dataSql = `
        SELECT * FROM sensors 
        ${whereClause}
        ORDER BY record_time ${validSortOrder}
        LIMIT ? OFFSET ?
      `;
      queryParams = [...params, pageSize, offset];
    }
    
    const results = await query(dataSql, queryParams) as SensorRow[];
    
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      data: results,
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalItems: totalItems,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sensors data' },
      { status: 500 }
    );
  }
}