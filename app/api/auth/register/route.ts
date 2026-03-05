import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validatePassword, validateEmail } from "@/lib/password-validation";
import { createCognitoUser } from "@/lib/cognito";
import { sendWelcomeEmail } from "@/lib/email";
import { withRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  return withRateLimit(request, handlePost, "auth:register", {
    limit: 5,
    windowMs: 60_000,
  });
}

async function handlePost(request: NextRequest) {
  try {
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
        { error: passwordResult.errors[0] || "Password does not meet security requirements" },
        { status: 400 }
      );
    }

    if (String(name).trim().length > 100) {
      return NextResponse.json(
        { error: "Name is too long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailTrimmed },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Prisma
    const user = await prisma.user.create({
      data: {
        name: String(name).trim().slice(0, 100),
        email: emailTrimmed,
        password: hashedPassword,
      },
    });

    // Create user in Cognito so they can also sign in via Cognito provider
    const cognitoResult = await createCognitoUser(
      emailTrimmed,
      String(password),
      user.name || emailTrimmed
    );
    if (!cognitoResult.ok) {
      console.error("Cognito user creation failed:", cognitoResult.error);
      return NextResponse.json(
        {
          error: "Account created but could not sync with identity provider. You can still sign in with email/password.",
          user: { id: user.id, email: user.email, name: user.name },
          cognitoFailed: true,
        },
        { status: 201 }
      );
    }

    const emailSent = await sendWelcomeEmail({
      to: emailTrimmed,
      name: user.name,
    });

    return NextResponse.json({
      message: "User created successfully",
      user: { id: user.id, email: user.email, name: user.name },
      cognitoSynced: !cognitoResult.skipped,
      emailSent,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}


