import { NextRequest, NextResponse } from "next/server";
import {
  cognitoConfirmForgotPassword,
  isCognitoConfigured,
} from "@/lib/cognito-auth";
import { validatePassword, validateEmail } from "@/lib/password-validation";
import { withRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  return withRateLimit(request, handlePost, "auth:cognito:reset-password", {
    limit: 5,
    windowMs: 60_000,
  });
}

async function handlePost(request: NextRequest) {
  try {
    if (!isCognitoConfigured()) {
      return NextResponse.json(
        { error: "Password reset is not configured." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, code, and new password are required" },
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

    const passwordResult = validatePassword(String(newPassword));
    if (!passwordResult.valid) {
      return NextResponse.json(
        {
          error:
            passwordResult.errors[0] ||
            "Password does not meet security requirements",
        },
        { status: 400 }
      );
    }

    const result = await cognitoConfirmForgotPassword({
      email: emailTrimmed,
      code: String(code).trim(),
      newPassword: String(newPassword),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}

