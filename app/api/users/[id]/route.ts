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

// GET - ดึงข้อมูลผู้ใช้ตาม ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params
  try {
    const sql = `
      SELECT id, username, email, full_name, role, status, created_at, updated_at 
      FROM users 
      WHERE id = ?
    `;
    
    const results = await query(sql, [id]) as UserRow[];
    
    if (results.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(results[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดทข้อมูลผู้ใช้
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const { username, email, full_name, password, role, status } = body;
    
    // Validate required fields
    if (!username || !email || !full_name) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }
    
    // Check if username or email already exists (excluding current user)
    const checkSql = 'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?';
    const existing = await query(checkSql, [username, email, id]) as UserRow[];
    
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว' },
        { status: 400 }
      );
    }
    
    // Prepare update query
    let updateSql = `
      UPDATE users 
      SET username = ?, email = ?, full_name = ?, role = ?, status = ?
    `;
    const updateParams: any[] = [username, email, full_name, role, status];
    
    // Add password to update if provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateSql += ', password = ?';
      updateParams.push(hashedPassword);
    }
    
    updateSql += ' WHERE id = ?';
    updateParams.push(id);
    
    await query(updateSql, updateParams);
    
    return NextResponse.json({ message: 'อัพเดทผู้ใช้เรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - ลบผู้ใช้
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  try {
    // Check if user exists
    const checkSql = 'SELECT id FROM users WHERE id = ?';
    const existing = await query(checkSql, [id]) as UserRow[];
    
    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      );
    }
    
    // Delete user
    const deleteSql = 'DELETE FROM users WHERE id = ?';
    await query(deleteSql, [id]);
    
    return NextResponse.json({ message: 'ลบผู้ใช้เรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}