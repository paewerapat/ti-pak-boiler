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

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const metricsParam = searchParams.get('metrics'); // รับ selectedMetrics จาก query
    
    const selectedMetrics = metricsParam ? metricsParam.split(',') : [];
    
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
    
    // Query ข้อมูล (ทั้งหมดหรือตาม filter)
    const sql = `
      SELECT * FROM sensors 
      ${whereClause}
      ORDER BY record_time DESC
    `;
    
    const results = await query(sql, params) as SensorRow[];
    
    // สร้าง headers และ columns ตาม selectedMetrics
    const allColumns = ['sv_steam_setpoint', 'pt_steam_pressure', 'tc1_stack_temperature', 'mt1_oil_supply_meter', 'mt2_boiler_feed_meter', 'mt3_soft_water_meter', 'mt4_condensate_meter', 'opt_oil_pressure'];
    const columnsToExport = selectedMetrics.length > 0 
      ? selectedMetrics.filter(m => allColumns.includes(m)) 
      : allColumns;
    
    if (format === 'csv') {
      const BOM = '\uFEFF';
      // Record Time อยู่คอลัมน์แรก แทนที่ ID
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
      // Record Time อยู่คอลัมน์แรก แทนที่ ID
      const excelRows = results.map(row => {
        return `
          <Row>
            <Cell><Data ss:Type="String">${new Date(row.record_time).toLocaleString('th-TH', { hour12: false })}</Data></Cell>
            ${columnsToExport.map(col => 
              `<Cell><Data ss:Type="Number">${row[col as keyof SensorRow]}</Data></Cell>`
            ).join('')}
          </Row>`;
      }).join('');
      
      const excelContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#4472C4" ss:Pattern="Solid"/>
   <Font ss:Color="#FFFFFF"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Sensors Report">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Record Time</Data></Cell>
    ${columnsToExport.map(col => 
      `<Cell><Data ss:Type="String">${col}</Data></Cell>`
    ).join('')}
   </Row>
   ${excelRows}
  </Table>
 </Worksheet>
</Workbook>`;

      const dateRangeStr = startDate || endDate ? `_filtered` : '';
      
      return new NextResponse(excelContent, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="sensors_report${dateRangeStr}_${new Date().toISOString().split('T')[0]}.xls"`,
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