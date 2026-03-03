import { NextRequest, NextResponse } from "next/server";
import { cognitoConfirmSignUp, isCognitoConfigured } from "@/lib/cognito-auth";

export async function POST(request: NextRequest) {
  try {
    if (!isCognitoConfigured()) {
      return NextResponse.json(
        { error: "Email verification is not configured." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    const result = await cognitoConfirmSignUp({
      email: String(email).trim().toLowerCase(),
      code: String(code).trim(),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: "Email verified. You can now sign in.",
    });
  } catch (error) {
    console.error("Cognito confirm error:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
