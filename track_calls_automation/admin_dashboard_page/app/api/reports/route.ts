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

  try {
    const apiBaseUrl = getApiBaseUrl();

    // 1. Fetch current user info from python backend to verify role and get organisation_id
    const meRes = await fetch(`${apiBaseUrl}/users/me`, {
      headers: { authorization: authHeader },
    });

    if (!meRes.ok) {
      return NextResponse.json({ detail: "Unauthorized in backend" }, { status: meRes.status });
    }

    const me = await meRes.json();
    const isPrivileged = me.role === "admin" || me.role === "super_admin";

    // 2. Fetch the original reports from the python backend
    const reportRes = await fetch(`${apiBaseUrl}/calls/reports`, {
      headers: { authorization: authHeader },
    });

    if (!reportRes.ok) {
      return NextResponse.json({ detail: "Failed to fetch original reports" }, { status: reportRes.status });
    }

    const report = await reportRes.json();

    // If the logged-in user is not admin or super admin, return the original report directly (no merging needed)
    if (!isPrivileged) {
      return NextResponse.json(report);
    }

    // 3. Connect to PostgreSQL database and fetch admin/super admin data
    const rawUrl = process.env.DATABASE_URL || "";
    const dbUrl = rawUrl.replace("postgresql+psycopg2://", "postgresql://");

    const client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }, // required for Azure SQL database connection
    });

    await client.connect();

    try {
      // Query users under the same organisation
      let usersQuery = "SELECT id, email, full_name, role, manager_id FROM users WHERE organisation_id = $1";
      let usersParams = [me.organisation_id];
      if (me.organisation_id === null) {
        usersQuery = "SELECT id, email, full_name, role, manager_id FROM users WHERE organisation_id IS NULL";
        usersParams = [];
      }

      const usersResult = await client.query(usersQuery, usersParams);
      const allUsers = usersResult.rows;

      // We need call logs for admins/super admins in the organisation (excluding the logged-in user themselves,
      // as they are already included by calls/reports as current_user)
      const missingUsers = allUsers.filter((u: any) => 
        (u.role === "admin" || u.role === "super_admin") && u.id !== me.id
      );

      if (missingUsers.length > 0) {
        const missingUserIds = missingUsers.map((u: any) => u.id);

        // Query call logs for these users
        const callsQuery = `
          SELECT user_id, phone_number, call_type, call_status, duration_seconds, timestamp
          FROM call_logs
          WHERE user_id = ANY($1::uuid[])
        `;
        const callsResult = await client.query(callsQuery, [missingUserIds]);
        const allCalls = callsResult.rows;

        // Group call logs by user ID
        const callsByUser: Record<string, any[]> = {};
        allCalls.forEach((c: any) => {
          if (!callsByUser[c.user_id]) {
            callsByUser[c.user_id] = [];
          }
          callsByUser[c.user_id].push({
            phone_number: c.phone_number,
            call_type: c.call_type,
            call_status: c.call_status,
            duration_seconds: c.duration_seconds,
            timestamp: c.timestamp,
          });
        });

        // Resolve manager names
        const managerIds = missingUsers.map((u: any) => u.manager_id).filter(Boolean);
        const managerNames: Record<string, string> = {};
        if (managerIds.length > 0) {
          const managersResult = await client.query(
            "SELECT id, full_name FROM users WHERE id = ANY($1::uuid[])",
            [managerIds]
          );
          managersResult.rows.forEach((m: any) => {
            managerNames[m.id] = m.full_name;
          });
        }

        // Build report objects matching the backend ReportResponse structure
        const additionalWarriors = missingUsers.map((user: any) => {
          const userCalls = callsByUser[user.id] ?? [];
          const totalCalls = userCalls.length;
          
          const incomingCount = userCalls.filter((c: any) => 
            ["incoming", "missed", "rejected", "blocked"].includes((c.call_type || "").toLowerCase())
          ).length;
          const outgoingCount = userCalls.filter((c: any) => 
            (c.call_type || "").toLowerCase() === "outgoing"
          ).length;
          
          const totalSeconds = userCalls.reduce((sum: number, c: any) => sum + (c.duration_seconds || 0), 0);
          const avgSeconds = totalCalls > 0 ? totalSeconds / totalCalls : 0.0;
          const totalHours = totalSeconds / 3600.0;

          return {
            warrior_id: user.id,
            full_name: user.full_name,
            is_tracking_enabled: false, // will resolve to false by default, but call data will be available
            total_calls: totalCalls,
            incoming_calls_count: incomingCount,
            outgoing_calls_count: outgoingCount,
            total_calling_seconds: totalSeconds,
            total_calling_hours: Math.round(totalHours * 100) / 100,
            average_call_seconds: Math.round(avgSeconds * 100) / 100,
            calls: userCalls,
            manager_id: user.manager_id,
            manager_name: user.manager_id ? (managerNames[user.manager_id] ?? null) : null,
          };
        });

        // Merge into original reports warriors array
        report.warriors = [...report.warriors, ...additionalWarriors];
      }
    } finally {
      await client.end();
    }

    return NextResponse.json(report);
  } catch (err) {
    console.error("Error in NextJS reports API route:", err);
    return NextResponse.json({ detail: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
