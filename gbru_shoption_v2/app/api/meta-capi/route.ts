import { NextResponse } from "next/server";
import { sendMetaCapiEvent } from "@/utils/metaCapi.server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventName, eventId, customData, userData } = body;

    if (!eventName) {
      return NextResponse.json(
        { success: false, error: "eventName is required" },
        { status: 400 }
      );
    }

    const clientIpAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      undefined;

    const clientUserAgent = req.headers.get("user-agent") || undefined;
    const eventSourceUrl = req.headers.get("referer") || undefined;

    await sendMetaCapiEvent({
      eventName,
      eventId,
      eventSourceUrl,
      userData: {
        clientIpAddress,
        clientUserAgent,
        phone: userData?.phone,
        email: userData?.email,
      },
      customData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Meta CAPI Route Handler Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
