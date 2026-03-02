/**
 * M-Pesa Reversal API - Safaricom Daraja
 * Used to refund M-Pesa payments when processing returns.
 * Requires: MPESA_INITIATOR_NAME, MPESA_SECURITY_CREDENTIAL, MPESA_SHORTCODE
 */

const SANDBOX_URL = "https://sandbox.safaricom.co.ke";
const PROD_URL = "https://api.safaricom.co.ke";

async function getAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const env = process.env.MPESA_ENV || "sandbox";
  const baseUrl = env === "production" ? PROD_URL : SANDBOX_URL;

  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa credentials not configured");
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`M-Pesa OAuth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

export interface MpesaReversalResult {
  success: boolean;
  conversationId?: string;
  originatorConversationId?: string;
  responseCode?: string;
  responseDescription?: string;
  error?: string;
}

/**
 * Attempt M-Pesa reversal (refund) for a completed STK push payment.
 * @param transactionId - MpesaReceiptNumber from the original payment
 * @param amount - Amount to reverse (order total)
 * @param remarks - Optional remarks
 */
export async function reverseMpesaTransaction(
  transactionId: string,
  amount: number,
  remarks = "Refund for returned order"
): Promise<MpesaReversalResult> {
  const initiator = process.env.MPESA_INITIATOR_NAME;
  const securityCredential = process.env.MPESA_SECURITY_CREDENTIAL;
  const shortcode = process.env.MPESA_SHORTCODE;
  const callbackBase = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL || "example.com"}`
    : "https://example.com";

  if (!initiator || !securityCredential || !shortcode) {
    return {
      success: false,
      error: "M-Pesa reversal not configured. Set MPESA_INITIATOR_NAME, MPESA_SECURITY_CREDENTIAL, MPESA_SHORTCODE. Refund requires manual M-Pesa reversal.",
    };
  }

  const env = process.env.MPESA_ENV || "sandbox";
  const baseUrl = env === "production" ? PROD_URL : SANDBOX_URL;

  try {
    const accessToken = await getAccessToken();

    const payload = {
      Initiator: initiator,
      SecurityCredential: securityCredential,
      CommandID: "TransactionReversal",
      TransactionID: transactionId,
      Amount: Math.round(amount),
      ReceiverParty: shortcode,
      RecieverIdentifierType: "4",
      ResultURL: `${callbackBase}/api/mpesa/reversal-callback`,
      QueueTimeOutURL: `${callbackBase}/api/mpesa/reversal-callback`,
      Remarks: remarks.slice(0, 20),
      Occasion: "Refund",
    };

    const res = await fetch(`${baseUrl}/mpesa/reversal/v1/request`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.errorMessage || data.error || `Reversal request failed: ${res.status}`,
      };
    }

    if (data.Result?.ResultCode === 0 || data.Result?.ResponseCode === "0") {
      return {
        success: true,
        conversationId: data.ConversationID,
        originatorConversationId: data.OriginatorConversationID,
        responseCode: data.Result?.ResultCode?.toString(),
        responseDescription: data.Result?.ResultDesc,
      };
    }

    return {
      success: false,
      responseCode: data.Result?.ResultCode?.toString(),
      responseDescription: data.Result?.ResultDesc,
      error: data.Result?.ResultDesc || "Reversal failed",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Reversal request failed",
    };
  }
}
