import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // ใช้ connection pool ที่มีอยู่แล้ว
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
    
    // รับ query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const status = searchParams.get('status') || ''; // '' = all, '0' = resolved, '1' = active
    
    const offset = (page - 1) * limit;
    
    // สร้าง WHERE conditions
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    
    // Filter by status
    if (status !== '') {
      whereConditions.push('status = ?');
      queryParams.push(parseInt(status));
    }
    
    // Filter by search (name or alarm_content)
    if (search) {
      whereConditions.push('(name LIKE ? OR alarm_content LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // Filter by date range
    if (startDate) {
      whereConditions.push('created_at >= ?');
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('created_at <= ?');
      queryParams.push(endDate);
    }
    
    // สร้าง WHERE clause
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['id', 'name', 'status', 'created_at', 'ended_at'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Query ข้อมูล
    const dataQuery = `
      SELECT id, name, alarm_content, status, created_at, ended_at
      FROM alarms
      ${whereClause}
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `;
    
    // Query จำนวนทั้งหมด
    const countQuery = `
      SELECT COUNT(*) as total
      FROM alarms
      ${whereClause}
    `;
    
    // Execute queries
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