import { NextRequest, NextResponse } from "next/server";
import { cognitoSignUp, isCognitoConfigured } from "@/lib/cognito-auth";
import { validatePassword, validateEmail } from "@/lib/password-validation";
import { withRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  return withRateLimit(request, handlePost, "auth:cognito:sign-up", {
    limit: 5,
    windowMs: 60_000,
  });
}

async function handlePost(request: NextRequest) {
  try {
    if (!isCognitoConfigured()) {
      return NextResponse.json(
        { error: "Sign up is not configured. Please use the legacy sign-up." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const passwordResult = validatePassword(String(password));
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

    if (String(name).trim().length > 100) {
      return NextResponse.json(
        { error: "Name is too long" },
        { status: 400 }
      );
    }

    const result = await cognitoSignUp({
      email: emailTrimmed,
      password: String(password),
      name: String(name).trim().slice(0, 100),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: "Verification email sent",
      email: emailTrimmed,
    });
  } catch (error) {
    console.error("Cognito sign-up error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

