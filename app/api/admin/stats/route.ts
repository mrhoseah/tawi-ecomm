import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  if (role !== "admin" && role !== "support") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const today = startOfToday();
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const [
      teamsCount,
      faqsCount,
      productsCount,
      ordersCount,
      pendingReturnsCount,
      newsCount,
      upcomingMatchesCount,
      liveMatchesCount,
      revenuePaid,
      todayRevenuePaid,
      orderStatusCounts,
      recentOrders,
      revenueByDay,
      matchAccessRevenue,
      usersCount,
      newUsersToday,
      lowStockList,
      topProducts,
      recentMatchAccesses,
      categoriesCount,
      couponsCount,
      pendingPaymentsCount,
      ordersThisWeek,
      ordersLastWeek,
    ] = await Promise.all([
      prisma.team.count({ where: { active: true } }),
      prisma.faq.count({ where: { active: true } }),
      prisma.product.count({ where: { active: true } }),
      prisma.order.count(),
      prisma.orderReturn.count({ where: { status: "pending" } }),
      prisma.news.count(),
      prisma.match.count({
        where: { matchDate: { gte: today }, status: "scheduled" },
      }),
      prisma.match.count({
        where: { status: "live" },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: "paid" },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: "paid",
          createdAt: { gte: today },
        },
        _sum: { total: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          createdAt: true,
        },
      }),
      // Revenue by day (last 14 days)
      prisma.order.findMany({
        where: {
          paymentStatus: "paid",
          createdAt: { gte: fourteenDaysAgo },
        },
        select: { total: true, createdAt: true },
      }),
      // Match access revenue (streaming)
      prisma.matchAccess.aggregate({
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.product.findMany({
        where: { active: true },
        select: { id: true, name: true, stock: true, lowStockThreshold: true, slug: true },
        take: 200,
      }),
      prisma.product.findMany({
        where: { active: true },
        orderBy: { viewCount: "desc" },
        take: 5,
        select: { id: true, name: true, viewCount: true, slug: true },
      }),
      prisma.matchAccess.findMany({
        take: 5,
        orderBy: { paidAt: "desc" },
        include: { match: { select: { homeTeam: true, awayTeam: true } } },
      }),
      prisma.category.count({ where: { active: true } }),
      prisma.coupon.count({ where: { active: true } }),
      prisma.order.count({ where: { paymentStatus: "pending" } }),
      prisma.order.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.order.count({
        where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
      }),
    ]);

    // Compute low stock (stock <= lowStockThreshold)
    const lowStockItemsFiltered = lowStockList.filter((p) => p.stock <= (p.lowStockThreshold ?? 10));
    const lowStockCount = lowStockItemsFiltered.length;
    const lowStockItems = lowStockItemsFiltered.slice(0, 5).map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      slug: p.slug,
    }));

    // Aggregate revenue by day
    const revenueMap = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (13 - i));
      revenueMap.set(startOfDay(d).toISOString().slice(0, 10), 0);
    }
    revenueByDay.forEach((o) => {
      const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
      if (revenueMap.has(key)) {
        revenueMap.set(key, (revenueMap.get(key) ?? 0) + o.total);
      }
    });
    const revenueChartData = Array.from(revenueMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, revenue]) => ({ date, revenue }));

    const statusMap: Record<string, number> = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    orderStatusCounts.forEach((s) => {
      statusMap[s.status] = s._count.id;
    });

    return NextResponse.json({
      teams: teamsCount,
      faqs: faqsCount,
      products: productsCount,
      orders: ordersCount,
      pendingReturns: pendingReturnsCount,
      news: newsCount,
      upcomingMatches: upcomingMatchesCount,
      liveMatches: liveMatchesCount,
      totalRevenue: revenuePaid._sum.total ?? 0,
      todayRevenue: todayRevenuePaid._sum.total ?? 0,
      matchAccessRevenue: matchAccessRevenue._sum.amount ?? 0,
      matchAccessCount: matchAccessRevenue._count.id,
      orderStatusCounts: statusMap,
      recentOrders,
      revenueChartData,
      usersCount,
      newUsersToday,
      lowStockCount,
      lowStockItems,
      topProducts: topProducts.map((p) => ({
        id: p.id,
        name: p.name,
        viewCount: p.viewCount,
        slug: p.slug,
      })),
      recentMatchAccesses: recentMatchAccesses.map((ma) => ({
        id: ma.id,
        amount: ma.amount,
        paidAt: ma.paidAt,
        match: ma.match,
      })),
      categoriesCount,
      couponsCount,
      pendingPaymentsCount,
      ordersThisWeek,
      ordersLastWeek,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
