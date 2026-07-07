import { NextResponse } from "next/server";
import { Client } from "pg";

const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  return url.replace(/\/$/, "");
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ detail: "Authorization header missing" }, { status: 401 });
  }

  // Parse query parameters
  const urlObj = new URL(request.url);
  const page = urlObj.searchParams.get("page") || "1";
  const limit = urlObj.searchParams.get("limit") || "50";
  const range = urlObj.searchParams.get("range") || "";
  const search = urlObj.searchParams.get("search") || "";
  const sortBy = urlObj.searchParams.get("sortBy") || "created_at";
  const sortOrder = urlObj.searchParams.get("sortOrder") || "desc";

  let client: Client | null = null;

  try {
    const apiBaseUrl = getApiBaseUrl();

    // 1. Authenticate user and fetch details to check role and organization
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

    // 3. Build dynamic queries
    const whereClauses: string[] = [];
    const params: any[] = [];

    // Filter by organization to isolate tenants
    if (me.organisation_id === null) {
      whereClauses.push("cl.org_id IS NULL");
    } else {
      params.push(me.organisation_id);
      whereClauses.push(`cl.org_id = $${params.length}`);
    }

    // Date range filter
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

    // Search query matching (parameterized search against agent name or phone number)
    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(u.full_name ILIKE $${params.length} OR cl.phone_number ILIKE $${params.length})`);
    }

    // Whitelist columns for sorting to prevent SQL injection
    const allowedSortCols: Record<string, string> = {
      agent_name: "u.full_name",
      phone_number: "cl.phone_number",
      call_type: "cl.call_type",
      call_status: "cl.call_status",
      created_at: "cl.created_at",
      duration_seconds: "cl.duration_seconds",
    };
    const orderCol = allowedSortCols[sortBy] || "cl.created_at";
    const orderDir = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // 4. Calculate pagination offsets
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Data query parameters
    const dataParams = [...params];
    dataParams.push(limitNum);
    const limitPlaceholder = `$${dataParams.length}`;
    dataParams.push(offset);
    const offsetPlaceholder = `$${dataParams.length}`;

    const dataQuery = `
      SELECT cl.id, cl.user_id, u.full_name AS agent_name, cl.phone_number, cl.call_type, cl.call_status, cl.duration_seconds, cl.created_at
      FROM call_logs cl
      LEFT JOIN users u ON cl.user_id = u.id
      ${whereStr}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
    `;

    // Count query parameters (exact same WHERE filters, but no limit/offset)
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM call_logs cl
      LEFT JOIN users u ON cl.user_id = u.id
      ${whereStr}
    `;

    // 5. Query execution in parallel
    const [dataResult, countResult] = await Promise.all([
      client.query(dataQuery, dataParams),
      client.query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0]?.total || "0", 10);
    const totalPages = Math.ceil(total / limitNum);

    const response = NextResponse.json({
      data: dataResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      }
    });

    // 6. Set client cache header for performance (30s)
    response.headers.set("Cache-Control", "private, max-age=30");
    return response;

  } catch (err) {
    console.error("Error in Call Logs API:", err);
    return NextResponse.json({ detail: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  } finally {
    if (client) {
      await client.end();
    }
  }
}
