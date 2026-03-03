import { NextRequest, NextResponse } from "next/server";
import {
  cognitoResendConfirmationCode,
  isCognitoConfigured,
} from "@/lib/cognito-auth";

export async function POST(request: NextRequest) {
  try {
    if (!isCognitoConfigured()) {
      return NextResponse.json(
        { error: "Email verification is not configured." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await cognitoResendConfirmationCode({
      email: String(email).trim().toLowerCase(),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: "Verification code sent. Check your email.",
    });
  } catch (error) {
    console.error("Resend confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to resend code" },
      { status: 500 }
    );
  }
}
