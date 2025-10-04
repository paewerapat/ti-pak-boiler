import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// GET - ดึงรายการผู้ใช้ทั้งหมด
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const sql = `
      SELECT id, username, email, full_name, role, status, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `;
    
    const results = await query(sql, []) as UserRow[];
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - สร้างผู้ใช้ใหม่
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { username, email, full_name, password, role, status } = body;
    
    // Validate required fields
    if (!username || !email || !full_name || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }
    
    // Check if username or email already exists
    const checkSql = 'SELECT id FROM users WHERE username = ? OR email = ?';
    const existing = await query(checkSql, [username, email]) as UserRow[];
    
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const insertSql = `
      INSERT INTO users (username, email, full_name, password, role, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await query(insertSql, [
      username,
      email,
      full_name,
      hashedPassword,
      role || 'member',
      status || 'active'
    ]);
    
    return NextResponse.json(
      { message: 'สร้างผู้ใช้เรียบร้อยแล้ว' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}