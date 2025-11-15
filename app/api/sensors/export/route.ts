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

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const metricsParam = searchParams.get('metrics');
    
    const selectedMetrics = metricsParam ? metricsParam.split(',') : [];
    
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
          `"${new Date(row.record_time).toLocaleString('th-TH', { hour12: false })}"`,
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
      // สร้างข้อมูลสำหรับ Excel
      const excelData = results.map(row => {
        const rowData: any = {
          'Record Time': new Date(row.record_time).toLocaleString('th-TH', { hour12: false })
        };
        
        columnsToExport.forEach(col => {
          rowData[col] = row[col as keyof SensorRow];
        });
        
        return rowData;
      });
      
      // สร้าง workbook และ worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sensors Report');
      
      // แปลงเป็น buffer
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