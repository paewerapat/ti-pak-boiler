import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

interface AlarmRow extends RowDataPacket {
  id: number;
  name: string;
  alarm_content: string;
  status: number;
  created_at: string;
  ended_at: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const status = searchParams.get('status') || '';
    
    const offset = (page - 1) * limit;
    
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    
    if (status !== '') {
      whereConditions.push('status = ?');
      queryParams.push(parseInt(status));
    }
    
    if (search) {
      whereConditions.push('(name LIKE ? OR alarm_content LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (startDate) {
      const formattedStart = startDate.replace('T', ' ');
      whereConditions.push('created_at >= ?');
      queryParams.push(formattedStart);
    }
    
    if (endDate) {
      const formattedEnd = endDate.replace('T', ' ');
      whereConditions.push('created_at <= ?');
      queryParams.push(formattedEnd);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    const allowedSortFields = ['id', 'name', 'status', 'created_at', 'ended_at'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // ✅ แก้ไข: ใช้ CONVERT_TZ เพื่อแปลง UTC เป็นเวลาไทย (+07:00)
    const dataQuery = `
      SELECT 
        id, 
        name, 
        alarm_content, 
        status, 
        CONVERT_TZ(created_at, '+00:00', '+07:00') as created_at,
        CONVERT_TZ(ended_at, '+00:00', '+07:00') as ended_at
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
    
    const [alarms] = await pool.execute<AlarmRow[]>(
      dataQuery, 
      [...queryParams, limit, offset]
    );
    
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
    console.error('Error fetching alarms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alarms' },
      { status: 500 }
    );
  }
}