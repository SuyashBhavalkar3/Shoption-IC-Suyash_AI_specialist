import { getDB } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDB();
    if (!db) {
      return new Response(JSON.stringify({ error: "Database not initialized" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    // Setup Firestore real-time listener
    const docRef = db.collection('maintenance').doc('mode');
    const unsubscribe = docRef.onSnapshot(
      (docSnap) => {
        let maintenanceActive = false;
        if (docSnap.exists) {
          const data = docSnap.data();
          // Check the prod_gbru_shoption field
          maintenanceActive = !!(data?.['prod_gbru_shoption']);
        }

        const dataStr = `data: ${JSON.stringify({ maintenance: maintenanceActive })}\n\n`;
        writer.write(encoder.encode(dataStr)).catch(() => { });
      },
      (error) => {
        const dataStr = `data: ${JSON.stringify({ maintenance: false, error: error.message })}\n\n`;
        writer.write(encoder.encode(dataStr)).catch(() => { });
      }
    );

    // Send a heartbeat ping every 15 seconds to prevent client-side timeouts
    const pingInterval = setInterval(() => {
      writer.write(encoder.encode(": ping\n\n")).catch(() => { });
    }, 15000);

    // Clean up on connection close
    const abortController = new AbortController();
    const signal = abortController.signal;

    (async () => {
      try {
        while (!signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (_) {
      } finally {
        clearInterval(pingInterval);
        unsubscribe();
        writer.close().catch(() => { });
      }
    })();

    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}