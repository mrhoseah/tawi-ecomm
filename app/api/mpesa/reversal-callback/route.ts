import { NextRequest, NextResponse } from "next/server";

/**
 * M-Pesa Reversal API callback - Safaricom posts here with reversal result.
 * No auth - called by Safaricom. Validate via IP/signature in production.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = body?.Result;
    if (result) {
      const { ResultCode, ResultDesc, OriginatorConversationID } = result;
      console.log("M-Pesa reversal callback:", { ResultCode, ResultDesc, OriginatorConversationID });
      if (ResultCode !== 0) {
        console.warn("M-Pesa reversal failed:", ResultDesc);
      }
    }
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("M-Pesa reversal callback error:", error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
