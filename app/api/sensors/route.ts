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

// ✅ แก้ฟังก์ชัน: บวก 7 ชั่วโมงแทนที่จะลบ (เหมือน alarms API)
function convertDisplayToDBTime(dateStr: string): string {
  if (!dateStr) return '';
  
  // user เลือกเวลาที่แสดง (09:45)
  const displayDate = new Date(dateStr.replace('T', ' '));
  
  // บวก 7 ชั่วโมงเพื่อให้ตรงกับเวลาใน DB (16:45)
  const dbDate = new Date(displayDate.getTime() + (7 * 60 * 60 * 1000));
  
  const year = dbDate.getFullYear();
  const month = String(dbDate.getMonth() + 1).padStart(2, '0');
  const day = String(dbDate.getDate()).padStart(2, '0');
  const hours = String(dbDate.getHours()).padStart(2, '0');
  const minutes = String(dbDate.getMinutes()).padStart(2, '0');
  const seconds = String(dbDate.getSeconds()).padStart(2, '0');
  
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
    const noLimit = searchParams.get('noLimit') === 'true';
    
    const offset = (page - 1) * pageSize;
    
    const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    // ✅ ใช้ฟังก์ชันใหม่ที่บวก 7 ชั่วโมง
    const startDate = startDateRaw ? convertDisplayToDBTime(startDateRaw) : null;
    const endDate = endDateRaw ? convertDisplayToDBTime(endDateRaw) : null;
    
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
    
    // Data query
    let dataSql;
    let queryParams;
    
    if (noLimit) {
      dataSql = `
        SELECT * FROM sensors 
        ${whereClause}
        ORDER BY record_time ${validSortOrder}
      `;
      queryParams = params;
    } else {
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