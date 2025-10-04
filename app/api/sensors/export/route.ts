import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

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

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // สร้าง WHERE clause สำหรับ date filter
    let whereClause = "";
    const params: any[] = [];

    if (startDate || endDate) {
      const conditions: string[] = [];

      if (startDate) {
        conditions.push("record_time >= ?");
        params.push(startDate);
      }

      if (endDate) {
        conditions.push("record_time <= ?");
        params.push(endDate);
      }

      whereClause = "WHERE " + conditions.join(" AND ");
    }

    // Query ข้อมูล (ทั้งหมดหรือตาม filter)
    const sql = `
      SELECT * FROM Sensors 
      ${whereClause}
      ORDER BY record_time DESC
    `;

    const results = (await query(sql, params)) as SensorRow[];

    // สร้างชื่อไฟล์ตาม date range
    const generateFileName = (extension: string): string => {
      const today = new Date().toISOString().split("T")[0];

      if (!startDate && !endDate) {
        return `sensors_data_${today}.${extension}`;
      }

      const formatDateForFilename = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date
          .toISOString()
          .slice(0, 16)
          .replace("T", "_")
          .replace(/:/g, "-");
      };

      if (startDate && endDate) {
        const start = formatDateForFilename(startDate);
        const end = formatDateForFilename(endDate);
        return `sensors_data_${start}_to_${end}.${extension}`;
      } else if (startDate) {
        const start = formatDateForFilename(startDate);
        return `sensors_data_from_${start}.${extension}`;
      } else {
        const end = formatDateForFilename(endDate as string);
        return `sensors_data_until_${end}.${extension}`;
      }
    };

    if (format === "csv") {
      const BOM = "\uFEFF";
      const headers = [
        "ID",
        "SV1",
        "PT1",
        "Temp1",
        "Meter1",
        "Meter2",
        "Meter3",
        "Meter4",
        "Meter5",
        "Record Time",
      ];
      const csvRows = [headers.join(",")];

      results.forEach((row) => {
        const values = [
          row.id,
          row.SV1,
          row.PT1,
          row.Temp1,
          row.Meter1,
          row.Meter2,
          row.Meter3,
          row.Meter4,
          row.Meter5,
          `"${new Date(row.record_time).toLocaleString("th-TH")}"`,
        ];
        csvRows.push(values.join(","));
      });

      const csvContent = BOM + csvRows.join("\n");
      const filename = generateFileName("csv");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === "excel") {
      const excelRows = results
        .map((row) => {
          return `
          <Row>
            <Cell><Data ss:Type="Number">${row.id}</Data></Cell>
            <Cell><Data ss:Type="Number">${row.SV1}</Data></Cell>
            <Cell><Data ss:Type="Number">${row.PT1}</Data></Cell>
            <Cell><Data ss:Type="Number">${row.Temp1}</Data></Cell>
            <Cell><Data ss:Type="Number">${row.Meter1}</Data></Cell>
            <Cell><Data ss:Type="Number">${row.Meter2}</Data></Cell>
            <Cell><Data ss:Type="Number">${row.Meter3}</Data></Cell>
            <Cell><Data ss:Type="Number">${row.Meter4}</Data></Cell>
            <Cell><Data ss:Type="Number">${row.Meter5}</Data></Cell>
            <Cell><Data ss:Type="String">${new Date(
              row.record_time
            ).toLocaleString("th-TH")}</Data></Cell>
          </Row>`;
        })
        .join("");

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
 <Worksheet ss:Name="Sensors Data">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">ID</Data></Cell>
    <Cell><Data ss:Type="String">SV1</Data></Cell>
    <Cell><Data ss:Type="String">PT1</Data></Cell>
    <Cell><Data ss:Type="String">Temp1</Data></Cell>
    <Cell><Data ss:Type="String">Meter1</Data></Cell>
    <Cell><Data ss:Type="String">Meter2</Data></Cell>
    <Cell><Data ss:Type="String">Meter3</Data></Cell>
    <Cell><Data ss:Type="String">Meter4</Data></Cell>
    <Cell><Data ss:Type="String">Meter5</Data></Cell>
    <Cell><Data ss:Type="String">Record Time</Data></Cell>
   </Row>
   ${excelRows}
  </Table>
 </Worksheet>
</Workbook>`;

      const filename = generateFileName("xls");

      return new NextResponse(excelContent, {
        headers: {
          "Content-Type": "application/vnd.ms-excel",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
