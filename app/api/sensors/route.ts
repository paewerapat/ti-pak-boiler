import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

interface SensorRow extends RowDataPacket {
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
    
    const offset = (page - 1) * pageSize;
    
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
    const countSql = `SELECT COUNT(*) as total FROM Sensors ${whereClause}`;
    const countResult = await query(countSql, params) as CountRow[];
    const totalItems = countResult[0].total;
    
    // Data query
    const dataSql = `
      SELECT * FROM Sensors 
      ${whereClause}
      ORDER BY record_time DESC 
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