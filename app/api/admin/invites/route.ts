import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/casbin";

const INVITE_EXPIRY_DAYS = 7;

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "users", "read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const invites = await prisma.adminInvite.findMany({
      where: { acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Admin invites fetch error:", error);
    return NextResponse.json({ error: "Failed to load invites" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";
  const userId = (session.user as { id?: string })?.id;

  try {
    await requirePermission(role, "users", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, role: inviteRole } = body;
    const emailTrimmed = String(email ?? "").trim().toLowerCase();

    if (!emailTrimmed) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const roleValue = inviteRole === "support" ? "support" : "admin";

    const existingUser = await prisma.user.findUnique({ where: { email: emailTrimmed } });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const existingInvite = await prisma.adminInvite.findFirst({
      where: { email: emailTrimmed, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingInvite) {
      return NextResponse.json(
        { error: "An active invite for this email already exists" },
        { status: 400 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const invite = await prisma.adminInvite.create({
      data: {
        email: emailTrimmed,
        token,
        role: roleValue,
        invitedById: userId || null,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/invite/${token}`;

    return NextResponse.json({
      invite: { id: invite.id, email: invite.email, role: invite.role, expiresAt: invite.expiresAt },
      inviteLink,
    });
  } catch (error) {
    console.error("Admin invite create error:", error);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
