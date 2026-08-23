import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Use env variable for the website base URL (production-safe)
    const websiteBaseUrl =
      process.env.NEXT_PUBLIC_WEBSITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.WEBSITE_BASE_URL;

    // Read POST body — gateways can send either form data or JSON
    let fields: Record<string, string> = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        fields[key] = String(value);
      });
    } else if (contentType.includes('application/json')) {
      try {
        fields = await request.json();
      } catch (_) { }
    } else {
      // Try form data as fallback
      try {
        const formData = await request.formData();
        formData.forEach((value, key) => {
          fields[key] = String(value);
        });
      } catch (_) { }
    }

    // --- Extract STATUS (try all known field name variations) ---
    const status =
      fields['status'] ||
      fields['Status'] ||
      fields['payment_status'] ||
      fields['transaction_status'] ||
      fields['txnStatus'] ||
      fields['txn_status'] ||
      fields['paymentStatus'] ||
      fields['result'] ||
      '';

    // --- Extract ORDER ID (try all known field name variations) ---
    const orderId =
      fields['Order_id'] ||
      fields['order_id'] ||
      fields['orderId'] ||
      fields['order_ID'] ||
      fields['ORDER_ID'] ||
      fields['txnid'] ||
      fields['txn_id'] ||
      fields['merchantTransactionId'] ||
      '';


    // Build redirect URL to the /place-order page with status + orderId as params
    // OrderConfirmed.tsx already reads: status, Status, orderId, Order_id
    const redirectUrl = new URL(`${websiteBaseUrl}/place-order`);
    if (status) redirectUrl.searchParams.set('status', status);
    if (orderId) redirectUrl.searchParams.set('orderId', orderId);

    // 303 See Other forces the browser to GET the redirect (required after a POST)
    return NextResponse.redirect(redirectUrl.toString(), 303);
  } catch (error) {
    // On any error, redirect to a generic failed state so user sees something
    const fallbackBase =
      process.env.NEXT_PUBLIC_WEBSITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.WEBSITE_BASE_URL;
    return NextResponse.redirect(`${fallbackBase}/place-order?status=failed`, 303);
  }
}

// Fallback GET — if gateway hits this with a GET, redirect to orders page
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const websiteBaseUrl =
    process.env.NEXT_PUBLIC_WEBSITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.WEBSITE_BASE_URL;

  // Forward any GET params directly to /place-order
  const status = searchParams.get('status') || searchParams.get('Status') || '';
  const orderId = searchParams.get('orderId') || searchParams.get('Order_id') || '';

  const redirectUrl = new URL(`${websiteBaseUrl}/place-order`);
  if (status) redirectUrl.searchParams.set('status', status);
  if (orderId) redirectUrl.searchParams.set('orderId', orderId);

  return NextResponse.redirect(redirectUrl.toString(), 302);
}
