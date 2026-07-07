import { NextResponse } from "next/server";
import { Client } from "pg";
import { PassThrough } from "stream";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import path from "path";

const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  return url.replace(/\/$/, "");
};

function formatDateTime(dateVal: Date | string) {
  if (!dateVal) return "-";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, "0");
  return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
}

function formatDuration(seconds: number) {
  if (typeof seconds !== "number" || isNaN(seconds)) return "00:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const hrsStr = hrs > 0 ? String(hrs).padStart(2, "0") + ":" : "";
  const minsStr = String(mins).padStart(2, "0");
  const secsStr = String(secs).padStart(2, "0");
  return `${hrsStr}${minsStr}:${secsStr}`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ detail: "Authorization header missing" }, { status: 401 });
  }

  const urlObj = new URL(request.url);
  const format = urlObj.searchParams.get("format") || "excel";
  const range = urlObj.searchParams.get("range") || "";
  const search = urlObj.searchParams.get("search") || "";

  let client: Client | null = null;

  try {
    const apiBaseUrl = getApiBaseUrl();

    // 1. Authenticate user
    const meRes = await fetch(`${apiBaseUrl}/users/me`, {
      headers: { authorization: authHeader },
    });

    if (!meRes.ok) {
      return NextResponse.json({ detail: "Unauthorized in backend" }, { status: meRes.status });
    }

    const me = await meRes.json();
    const isPrivileged = me.role === "super_admin";

    if (!isPrivileged) {
      return NextResponse.json({ detail: "Forbidden: Privileged access required" }, { status: 403 });
    }

    // 2. Establish PostgreSQL client
    const rawUrl = process.env.DATABASE_URL || "";
    const dbUrl = rawUrl.replace("postgresql+psycopg2://", "postgresql://");

    client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // 3. Build dynamic query
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (me.organisation_id === null) {
      whereClauses.push("cl.org_id IS NULL");
    } else {
      params.push(me.organisation_id);
      whereClauses.push(`cl.org_id = $${params.length}`);
    }

    if (range === "today") {
      whereClauses.push("cl.created_at >= CURRENT_DATE");
    } else if (range === "7days") {
      whereClauses.push("cl.created_at >= NOW() - INTERVAL '7 days'");
    } else if (range === "month") {
      whereClauses.push("cl.created_at >= NOW() - INTERVAL '30 days'");
    } else if (range === "6months") {
      whereClauses.push("cl.created_at >= NOW() - INTERVAL '6 months'");
    } else if (range === "1year") {
      whereClauses.push("cl.created_at >= NOW() - INTERVAL '1 year'");
    }

    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(u.full_name ILIKE $${params.length} OR cl.phone_number ILIKE $${params.length})`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Excel export gets full data; PDF export is limited to 10,000 records
    const limitClause = format === "excel" ? "" : "LIMIT 10000";
    const dataQuery = `
      SELECT cl.id, cl.user_id, u.full_name AS agent_name, cl.phone_number, cl.call_type, cl.call_status, cl.duration_seconds, cl.created_at
      FROM call_logs cl
      LEFT JOIN users u ON cl.user_id = u.id
      ${whereStr}
      ORDER BY cl.created_at DESC
      ${limitClause}
    `;

    const dataResult = await client.query(dataQuery, params);
    const rows = dataResult.rows;

    if (format === "excel") {
      const passThrough = new PassThrough();
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: passThrough,
        useStyles: true,
        useSharedStrings: true,
      });

      const worksheet = workbook.addWorksheet("Call Logs");
      worksheet.columns = [
        { header: "Agent / Caller Name", key: "agent_name", width: 30 },
        { header: "Contact Number", key: "phone_number", width: 20 },
        { header: "Direction", key: "call_type", width: 15 },
        { header: "Status", key: "call_status", width: 15 },
        { header: "Start Time", key: "created_at", width: 25 },
        { header: "End Time", key: "end_time", width: 25 },
        { header: "Duration (Seconds)", key: "duration_seconds", width: 20 },
        { header: "Duration (Formatted)", key: "duration_formatted", width: 20 },
      ];

      // Format header row style
      worksheet.getRow(1).font = { name: "Segoe UI", family: 4, size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F8FFF" }, // primary theme color (#1F8FFF)
      };

      for (const row of rows) {
        const startDate = new Date(row.created_at);
        const endDate = new Date(startDate.getTime() + (row.duration_seconds || 0) * 1000);

        worksheet.addRow({
          agent_name: row.agent_name || "Unknown Agent",
          phone_number: row.phone_number || "",
          call_type: row.call_type || "",
          call_status: row.call_status || "",
          created_at: formatDateTime(row.created_at),
          end_time: formatDateTime(endDate),
          duration_seconds: row.duration_seconds ?? 0,
          duration_formatted: formatDuration(row.duration_seconds ?? 0),
        }).commit();
      }

      worksheet.commit();
      workbook.commit();

      const webStream = new ReadableStream({
        start(controller) {
          passThrough.on("data", (chunk) => controller.enqueue(chunk));
          passThrough.on("end", () => controller.close());
          passThrough.on("error", (err) => controller.error(err));
        },
      });

      return new Response(webStream, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="call-logs-export.xlsx"',
          "Cache-Control": "no-cache",
        },
      });
    } else if (format === "pdf") {
      const doc = new PDFDocument({ size: "A4", margin: 30 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));

      // Register custom fonts to bypass standard Helvetica AFM file path error in Next.js bundle
      try {
        const regularFontPath = path.join(process.cwd(), "lib", "Roboto-Regular.ttf");
        const boldFontPath = path.join(process.cwd(), "lib", "Roboto-Bold.ttf");
        doc.registerFont("Helvetica", regularFontPath);
        doc.registerFont("Helvetica-Bold", boldFontPath);
      } catch (fontErr) {
        console.error("Failed to register custom Roboto fonts:", fontErr);
      }

      // PDF export is unlimited according to selected date range and filters
      const limitClause = "";
      const dataQuery = `
        SELECT cl.id, cl.user_id, u.full_name AS agent_name, cl.phone_number, cl.call_type, cl.call_status, cl.duration_seconds, cl.created_at
        FROM call_logs cl
        LEFT JOIN users u ON cl.user_id = u.id
        ${whereStr}
        ORDER BY cl.created_at DESC
        ${limitClause}
      `;

      const dataResult = await client.query(dataQuery, params);
      const pdfRows = dataResult.rows;

      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (err) => reject(err));

        // PDF Styling & Metadata (using standard hex codes)
        doc.fillColor("#1F8FFF").fontSize(22).font("Helvetica-Bold").text("LeadLens Dashboard Analytics", 30, 40);
        doc.fillColor("#0F172A").fontSize(12).font("Helvetica-Bold").text("All Organization Logs Export Report", 30, 65);
        
        // Horizontal Line using a light solid border color
        doc.strokeColor("#E2E8F0").lineWidth(1).moveTo(30, 85).lineTo(565, 85).stroke();

        doc.fillColor("#475569").fontSize(8).font("Helvetica");
        doc.text(`Export Timestamp: ${new Date().toUTCString()}`, 30, 95);
        doc.text(`Applied Date Range: ${range.toUpperCase() || "ALL TIME"}`, 30, 107);
        doc.text(`Search Criteria: ${search ? `"${search}"` : "NONE"}`, 30, 119);
        doc.text(`Total Records Exported: ${pdfRows.length.toLocaleString()}`, 30, 131);

        let y = 155;
        
        // Draw Table Header in dark slate background
        doc.rect(30, y, 535, 20).fill("#0F172A");
        
        doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");
        doc.text("#", 35, y + 6);
        doc.text("Agent Name", 60, y + 6);
        doc.text("Contact Number", 160, y + 6);
        doc.text("Direction", 255, y + 6);
        doc.text("Status", 325, y + 6);
        doc.text("Start Time", 395, y + 6);
        doc.text("Duration", 515, y + 6);
        
        y += 20;

        // Draw rows
        doc.font("Helvetica");
        let odd = false;
        let index = 1;

        for (const row of pdfRows) {
          if (y > 750) {
            doc.addPage();
            y = 40;
            
            // Re-draw table header on new page
            doc.rect(30, y, 535, 20).fill("#0F172A");
            doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");
            doc.text("#", 35, y + 6);
            doc.text("Agent Name", 60, y + 6);
            doc.text("Contact Number", 160, y + 6);
            doc.text("Direction", 255, y + 6);
            doc.text("Status", 325, y + 6);
            doc.text("Start Time", 395, y + 6);
            doc.text("Duration", 515, y + 6);
            y += 20;
          }

          // Draw alternating background row color (using very light solid grey)
          if (odd) {
            doc.rect(30, y, 535, 16).fill("#F8FAFC");
          }
          
          // Reset text color to dark slate
          doc.fillColor("#0F172A").fontSize(7.5);
          doc.text(String(index), 35, y + 4);
          doc.text(row.agent_name || "Unknown Agent", 60, y + 4, { width: 95, height: 12, ellipsis: true });
          doc.fillColor("#475569").text(row.phone_number || "", 160, y + 4);
          
          // Direction and Status text values
          doc.fillColor("#0F172A").text(row.call_type || "", 255, y + 4);
          doc.text(row.call_status || "", 325, y + 4);
          doc.text(formatDateTime(row.created_at), 395, y + 4);
          doc.text(formatDuration(row.duration_seconds ?? 0), 515, y + 4);

          y += 16;
          odd = !odd;
          index++;
        }

        doc.end();
      });

      return new Response(pdfBuffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="call-logs-export.pdf"',
          "Cache-Control": "no-cache",
        },
      });
    }

    return NextResponse.json({ detail: "Unsupported export format" }, { status: 400 });

  } catch (err) {
    console.error("Error in Call Logs Export API:", err);
    try {
      const fs = require("fs");
      fs.writeFileSync("d:\\Shoption\\LeadLens\\AdminLeadsLens\\error_log.txt", err instanceof Error ? err.stack || err.message : String(err));
    } catch (logErr) {
      console.error("Failed to write error log file:", logErr);
    }
    return NextResponse.json({ detail: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  } finally {
    if (client) {
      await client.end();
    }
  }
}
