import { NextRequest, NextResponse } from "next/server";
import {
  cognitoForgotPassword,
  isCognitoConfigured,
} from "@/lib/cognito-auth";
import { validateEmail } from "@/lib/password-validation";

export async function POST(request: NextRequest) {
  try {
    if (!isCognitoConfigured()) {
      return NextResponse.json(
        { error: "Password reset is not configured." },
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

    const emailTrimmed = String(email).trim().toLowerCase();
    if (!validateEmail(emailTrimmed)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const result = await cognitoForgotPassword({ email: emailTrimmed });

    if (!result.ok) {
      // Don't reveal whether email exists - show generic success for security
      return NextResponse.json({
        message: "If an account exists, a password reset code was sent.",
      });
    }

    return NextResponse.json({
      message: "If an account exists, a password reset code was sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to send reset code" },
      { status: 500 }
    );
  }
}
