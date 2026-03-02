import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    return NextResponse.json({ hasPassword: !!user?.password });
  } catch (error) {
    return NextResponse.json({ hasPassword: false });
  }
}
