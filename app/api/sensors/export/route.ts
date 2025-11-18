import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import * as XLSX from 'xlsx';

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

// ✅ เพิ่มฟังก์ชันแปลงเวลาสำหรับแสดงผล
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const startDateRaw = searchParams.get('startDate');
    const endDateRaw = searchParams.get('endDate');
    const metricsParam = searchParams.get('metrics');
    
    const selectedMetrics = metricsParam ? metricsParam.split(',') : [];
    
    // ✅ แปลงเวลาจาก display time เป็น DB time
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
    
    const sql = `
      SELECT * FROM sensors 
      ${whereClause}
      ORDER BY record_time DESC
    `;
    
    const results = await query(sql, params) as SensorRow[];
    
    const allColumns = ['sv_steam_setpoint', 'pt_steam_pressure', 'tc1_stack_temperature', 'mt1_oil_supply_meter', 'mt2_boiler_feed_meter', 'mt3_soft_water_meter', 'mt4_condensate_meter', 'opt_oil_pressure'];
    const columnsToExport = selectedMetrics.length > 0 
      ? selectedMetrics.filter(m => allColumns.includes(m)) 
      : allColumns;
    
    if (format === 'csv') {
      const BOM = '\uFEFF';
      const headers = ['Record Time', ...columnsToExport];
      const csvRows = [headers.join(',')];
      
      results.forEach(row => {
        const values = [
          `"${formatDateTime(row.record_time)}"`,
          ...columnsToExport.map(col => row[col as keyof SensorRow])
        ];
        csvRows.push(values.join(','));
      });
      
      const csvContent = BOM + csvRows.join('\n');
      const dateRangeStr = startDate || endDate ? `_filtered` : '';
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="sensors_report${dateRangeStr}_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } 
    
    if (format === 'excel') {
      // ✅ สร้าง array of arrays แทน json
      const excelData: any[][] = [];
      
      // ✅ Row 1: Title
      excelData.push(['SPB040HH Boiler 4 T/H 16 Bar']);
      
      // ✅ Row 2: Empty row (optional - เพื่อให้มีระยะห่าง)
      excelData.push([]);
      
      // ✅ Row 3: Headers
      const headers = ['Record Time', ...columnsToExport];
      excelData.push(headers);
      
      // ✅ Row 4+: Data
      results.forEach(row => {
        const rowData = [
          formatDateTime(row.record_time),
          ...columnsToExport.map(col => row[col as keyof SensorRow])
        ];
        excelData.push(rowData);
      });
      
      // ✅ สร้าง worksheet จาก array of arrays
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      
      // ✅ (Optional) ปรับความกว้าง columns
      const colWidths = [
        { wch: 25 }, // Record Time column
        ...columnsToExport.map(() => ({ wch: 15 })) // Data columns
      ];
      worksheet['!cols'] = colWidths;
      
      // ✅ (Optional) Merge cells สำหรับ title
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: columnsToExport.length } } // Merge row 0 across all columns
      ];
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sensors Report');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      const dateRangeStr = startDate || endDate ? `_filtered` : '';
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="sensors_report${dateRangeStr}_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    }
    
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}