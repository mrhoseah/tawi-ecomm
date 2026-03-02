import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforce } from "@/lib/casbin";

export async function GET() {
  try {
    const faqs = await prisma.faq.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(faqs);
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const allowed = await enforce(role || "customer", "faqs", "write");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    const { question, answer, sortOrder } = body;
    if (!question || !answer) return NextResponse.json({ error: "question and answer required" }, { status: 400 });
    const faq = await prisma.faq.create({
      data: { question, answer, sortOrder: sortOrder ?? 0 },
    });
    return NextResponse.json(faq);
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
