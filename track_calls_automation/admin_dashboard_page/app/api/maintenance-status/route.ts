import { NextResponse } from "next/server";
import { checkMaintenanceMode } from "../../../lib/firebaseAdmin";

export async function GET() {
  const isActive = await checkMaintenanceMode();
  return NextResponse.json({ maintenance: isActive });
}
