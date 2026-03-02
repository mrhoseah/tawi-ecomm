/**
 * PayPal REST API - Refund captured payment
 * Requires: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
 * For checkout integration, use @paypal/react-paypal-js on client.
 */

const SANDBOX_URL = "https://api-m.sandbox.paypal.com";
const PROD_URL = "https://api-m.paypal.com";

function getBaseUrl(): string {
  return process.env.PAYPAL_ENV === "production" ? PROD_URL : SANDBOX_URL;
}

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl = getBaseUrl();

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal OAuth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

/** Create a PayPal order for checkout */
export async function createPayPalOrder(amount: number, orderNumber: string, currency = "USD") {
  const baseUrl = getBaseUrl();
  const accessToken = await getAccessToken();
  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderNumber,
          amount: { currency_code: currency, value: amount.toFixed(2) },
          description: `Order ${orderNumber}`,
        },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "PayPal create order failed");
  return data;
}

/** Capture a PayPal order and return capture ID */
export async function capturePayPalOrder(paypalOrderId: string): Promise<string | null> {
  const baseUrl = getBaseUrl();
  const accessToken = await getAccessToken();
  const res = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "PayPal capture failed");
  const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id;
  return captureId || null;
}

export interface PayPalRefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

/**
 * Refund a captured PayPal payment.
 * @param captureId - PayPal capture ID from the original payment
 * @param amount - Optional partial refund amount; omit for full refund
 */
export async function refundPayPalCapture(
  captureId: string,
  amount?: { value: string; currency_code: string }
): Promise<PayPalRefundResult> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      success: false,
      error: "PayPal not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET. Refund via PayPal dashboard.",
    };
  }

  const baseUrl = getBaseUrl();

  try {
    const accessToken = await getAccessToken();
    const body = amount ? { amount } : {};

    const res = await fetch(`${baseUrl}/v2/payments/captures/${captureId}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok && (data.id || data.status === "COMPLETED")) {
      return { success: true, refundId: data.id };
    }

    return {
      success: false,
      error: data.message || data.details?.[0]?.description || `Refund failed: ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "PayPal refund failed",
    };
  }
}
