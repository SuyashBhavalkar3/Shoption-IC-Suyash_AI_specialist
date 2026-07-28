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

  const urlObj = new URL(request.url);
  const selectedDate = urlObj.searchParams.get("date") || new Date().toISOString().split("T")[0];

  let client: Client | null = null;

  try {
    const apiBaseUrl = getApiBaseUrl();

    // 1. Authenticate user from the backend
    const meRes = await fetch(`${apiBaseUrl}/users/me`, {
      headers: { authorization: authHeader },
    });

    if (!meRes.ok) {
      return NextResponse.json({ detail: "Unauthorized in backend" }, { status: meRes.status });
    }

    const me = await meRes.json();

    // 2. Establish PostgreSQL client
    const rawUrl = process.env.DATABASE_URL || "";
    const dbUrl = rawUrl.replace("postgresql+psycopg2://", "postgresql://");

    client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // 3. Query callers and aggregate call statistics for the selected date
    let query: string;
    let params: any[];

    if (me.organisation_id === null) {
      query = `
        SELECT 
          cl.user_id,
          u.full_name,
          u.email,
          u.role,
          u.department,
          COUNT(cl.id)::int AS total_calls,
          SUM(cl.duration_seconds)::int AS total_seconds,
          SUM(CASE 
            WHEN cl.duration_seconds > 0 
              AND cl.call_status != 'failed'
              AND NOT (cl.call_type ILIKE 'incoming' AND (cl.call_status ILIKE '%missed%' OR cl.call_status = 'failed' OR cl.duration_seconds = 0))
            THEN cl.duration_seconds 
            ELSE 0 
          END)::int AS total_calling_seconds
        FROM call_logs cl
        JOIN users u ON cl.user_id = u.id
        WHERE (CASE 
          WHEN cl.timestamp LIKE '%-%-%' AND cl.timestamp NOT LIKE '%T%' AND cl.timestamp NOT LIKE '%Z%' 
            THEN to_date(cl.timestamp, 'DD-Mon-YYYY')
          ELSE 
            CAST(cl.timestamp AS date)
        END) = $1::date
          AND u.organisation_id IS NULL
        GROUP BY cl.user_id, u.id, u.full_name, u.email, u.role, u.department
        ORDER BY total_calling_seconds DESC, u.full_name ASC
      `;
      params = [selectedDate];
    } else {
      query = `
        SELECT 
          cl.user_id,
          u.full_name,
          u.email,
          u.role,
          u.department,
          COUNT(cl.id)::int AS total_calls,
          SUM(cl.duration_seconds)::int AS total_seconds,
          SUM(CASE 
            WHEN cl.duration_seconds > 0 
              AND cl.call_status != 'failed'
              AND NOT (cl.call_type ILIKE 'incoming' AND (cl.call_status ILIKE '%missed%' OR cl.call_status = 'failed' OR cl.duration_seconds = 0))
            THEN cl.duration_seconds 
            ELSE 0 
          END)::int AS total_calling_seconds
        FROM call_logs cl
        JOIN users u ON cl.user_id = u.id
        WHERE (CASE 
          WHEN cl.timestamp LIKE '%-%-%' AND cl.timestamp NOT LIKE '%T%' AND cl.timestamp NOT LIKE '%Z%' 
            THEN to_date(cl.timestamp, 'DD-Mon-YYYY')
          ELSE 
            CAST(cl.timestamp AS date)
        END) = $1::date
          AND u.organisation_id = $2
        GROUP BY cl.user_id, u.id, u.full_name, u.email, u.role, u.department
        ORDER BY total_calling_seconds DESC, u.full_name ASC
      `;
      params = [selectedDate, me.organisation_id];
    }

    const result = await client.query(query, params);

    return NextResponse.json(result.rows);

  } catch (err) {
    console.error("Error in Calling Team API:", err);
    return NextResponse.json({ detail: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  } finally {
    if (client) {
      await client.end();
    }
  }
}
