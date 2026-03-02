import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SANDBOX_URL = "https://sandbox.safaricom.co.ke";
const PROD_URL = "https://api.safaricom.co.ke";

async function getAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const env = process.env.MPESA_ENV || "sandbox";
  const baseUrl = env === "production" ? PROD_URL : SANDBOX_URL;

  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa credentials not configured. Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in .env.local");
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

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { phone, amount, orderNumber } = body;

    if (!phone || !amount || !orderNumber) {
      return NextResponse.json(
        { error: "phone, amount, and orderNumber are required" },
        { status: 400 }
      );
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const passkey = process.env.MPESA_PASSKEY;
    const shortcode = process.env.MPESA_SHORTCODE;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;
    const env = process.env.MPESA_ENV || "sandbox";
    const baseUrl = env === "production" ? PROD_URL : SANDBOX_URL;

    if (!consumerKey || !consumerSecret || !passkey || !shortcode) {
      return NextResponse.json(
        {
          error:
            "M-Pesa not configured. Add MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, MPESA_SHORTCODE to .env.local",
        },
        { status: 503 }
      );
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0]
      .replace("T", "");
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    let phoneFormatted = phone.replace(/\D/g, "");
    if (phoneFormatted.startsWith("0")) {
      phoneFormatted = "254" + phoneFormatted.slice(1);
    } else if (!phoneFormatted.startsWith("254")) {
      phoneFormatted = "254" + phoneFormatted;
    }

    const accessToken = await getAccessToken();

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(parseFloat(amount)),
      PartyA: phoneFormatted,
      PartyB: shortcode,
      PhoneNumber: phoneFormatted,
      CallBackURL: callbackUrl || "https://example.com/callback",
      AccountReference: orderNumber.slice(0, 12),
      TransactionDesc: `Order ${orderNumber}`,
    };

    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPayload),
    });

    const stkData = await stkRes.json();

    if (!stkRes.ok) {
      return NextResponse.json(
        { error: stkData.errorMessage || stkData.error || "STK push failed" },
        { status: stkRes.status }
      );
    }

    if (stkData.ResponseCode && stkData.ResponseCode !== "0") {
      return NextResponse.json(
        { error: stkData.CustomerMessage || stkData.errorMessage || "Request failed" },
        { status: 400 }
      );
    }

    // Store mapping for callback to match payment with order
    await prisma.mpesaStkRequest.create({
      data: {
        checkoutRequestId: stkData.CheckoutRequestID,
        orderNumber,
        amount: parseFloat(amount),
        phone: phoneFormatted,
        status: "pending",
      },
    }).catch((err) => console.error("Failed to store STK request:", err));

    return NextResponse.json({
      checkoutRequestID: stkData.CheckoutRequestID,
      message: "STK push sent. Please complete payment on your phone.",
    });
  } catch (error: any) {
    console.error("M-Pesa STK push error:", error);
    return NextResponse.json(
      { error: error?.message || "Payment request failed" },
      { status: 500 }
    );
  }
}
