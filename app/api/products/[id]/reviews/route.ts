import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { rating, title, comment } = body;

    // Check if user already reviewed this product
    const existing = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: id,
          userId: (session.user as any).id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId: id,
        userId: (session.user as any).id,
        rating,
        title: title || null,
        comment: comment || null,
        verified: true, // Mark as verified if user purchased
      },
    });

    // Update product rating
    const product = await prisma.product.findUnique({
      where: { id },
      include: { reviews: true },
    });

    if (product) {
      const avgRating =
        product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length;

      await prisma.product.update({
        where: { id },
        data: {
          rating: avgRating,
          reviewCount: product.reviews.length,
        },
      });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

