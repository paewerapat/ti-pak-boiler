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

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '100');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // เพิ่มบรรทัดนี้
    
    const offset = (page - 1) * pageSize;
    
    // Validate sortOrder
    const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC'; // เพิ่มบรรทัดนี้
    
    // สร้าง WHERE clause สำหรับ date filter
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
    
    // Data query - แก้บรรทัดนี้เพื่อใช้ sortOrder
    const dataSql = `
      SELECT * FROM sensors 
      ${whereClause}
      ORDER BY record_time ${validSortOrder}
      LIMIT ? OFFSET ?
    `;
    
    const results = await query(dataSql, [...params, pageSize, offset]) as SensorRow[];
    
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