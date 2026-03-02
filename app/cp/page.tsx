"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Settings,
  Users,
  UserCog,
  Shield,
  HelpCircle,
  FileText,
  FolderTree,
  RotateCcw,
  ArrowRight,
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronRight,
  Trophy,
  ShoppingBag,
  Newspaper,
  Tv,
  AlertTriangle,
  BarChart3,
  Activity,
  Tag,
} from "lucide-react";
import { ADMIN_PATH } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis } from "recharts";

interface Stats {
  teams: number;
  faqs: number;
  products: number;
  orders: number;
  pendingReturns: number;
  news: number;
  upcomingMatches: number;
  liveMatches: number;
  totalRevenue: number;
  todayRevenue: number;
  matchAccessRevenue: number;
  matchAccessCount: number;
  orderStatusCounts: Record<string, number>;
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    createdAt: string;
  }[];
  revenueChartData: { date: string; revenue: number }[];
  usersCount: number;
  newUsersToday: number;
  lowStockCount: number;
  lowStockItems: { id: string; name: string; stock: number; slug: string }[];
  topProducts: { id: string; name: string; viewCount: number; slug: string }[];
  recentMatchAccesses: {
    id: string;
    amount: number;
    paidAt: string;
    match: { homeTeam: string; awayTeam: string };
  }[];
  categoriesCount?: number;
  couponsCount?: number;
  pendingPaymentsCount?: number;
  ordersThisWeek?: number;
  ordersLastWeek?: number;
}

const quickLinks = [
  { href: `${ADMIN_PATH}/products`, label: "Products", icon: ShoppingBag, desc: "Manage products and inventory" },
  { href: `${ADMIN_PATH}/categories`, label: "Categories", icon: FolderTree, desc: "Manage product categories" },
  { href: `${ADMIN_PATH}/orders`, label: "Orders", icon: Package, desc: "View and manage orders" },
  { href: `${ADMIN_PATH}/coupons`, label: "Coupons", icon: Tag, desc: "Discount codes and promotions" },
  { href: `${ADMIN_PATH}/returns`, label: "Returns", icon: RotateCcw, desc: "Process return requests" },
  { href: `${ADMIN_PATH}/users`, label: "Users", icon: Users, desc: "Manage customer accounts" },
  { href: `${ADMIN_PATH}/admins`, label: "Staff & Admins", icon: UserCog, desc: "Manage administrators and support staff" },
  { href: `${ADMIN_PATH}/roles`, label: "Roles & Permissions", icon: Shield, desc: "View role definitions and access levels" },
  { href: `${ADMIN_PATH}/teams`, label: "Teams", icon: Users, desc: "Manage teams" },
  { href: `${ADMIN_PATH}/faqs`, label: "FAQs", icon: HelpCircle, desc: "Manage FAQ entries" },
  { href: `${ADMIN_PATH}/pages`, label: "Pages", icon: FileText, desc: "Edit static pages" },
  { href: `${ADMIN_PATH}/settings`, label: "Settings", icon: Settings, desc: "Site, payment, SEO, currency" },
];

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  date: {
    label: "Date",
  },
} satisfies ChartConfig;

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const KpiCard = ({
    title,
    value,
    sub,
    icon: Icon,
    iconBg,
    href,
    alert,
  }: {
    title: string;
    value: string | number;
    sub: string;
    icon: typeof DollarSign;
    iconBg: string;
    href?: string;
    alert?: boolean;
  }) => {
    const content = (
      <div
        className={`rounded-xl border bg-card p-6 shadow-sm transition-colors ${
          href ? "hover:border-primary/30 hover:bg-muted/30 cursor-pointer" : ""
        } ${alert ? "ring-2 ring-destructive/50" : ""}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    );
    return href ? <Link href={href}>{content}</Link> : content;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
          <p className="text-muted-foreground mt-1">
            {session?.user?.name || session?.user?.email || "Admin"} · {today}
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-muted/50 transition-colors"
        >
          View store
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Primary KPI Row - E-commerce */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          E-commerce Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Revenue"
            value={stats ? formatCurrency(stats.totalRevenue) : "—"}
            sub="All time"
            icon={DollarSign}
            iconBg="bg-chart-1/20 text-chart-1"
          />
          <KpiCard
            title="Today's Revenue"
            value={stats ? formatCurrency(stats.todayRevenue) : "—"}
            sub="Paid orders"
            icon={TrendingUp}
            iconBg="bg-chart-2/20 text-chart-2"
          />
          <KpiCard
            title="Orders"
            value={stats?.orders ?? "—"}
            sub={
              stats?.ordersThisWeek != null && stats?.ordersLastWeek != null
                ? `${stats.ordersThisWeek} this week${stats.ordersLastWeek > 0 ? ` · ${stats.ordersThisWeek > stats.ordersLastWeek ? "+" : ""}${stats.ordersThisWeek - stats.ordersLastWeek} vs last week` : ""}`
                : "Total orders"
            }
            icon={Package}
            iconBg="bg-chart-3/20 text-chart-3"
            href={`${ADMIN_PATH}/orders`}
          />
          <KpiCard
            title="Pending Returns"
            value={stats?.pendingReturns ?? "—"}
            sub={stats?.pendingReturns ? "Needs attention" : "Up to date"}
            icon={RotateCcw}
            iconBg="bg-chart-4/20 text-chart-4"
            href={`${ADMIN_PATH}/returns`}
            alert={!!stats?.pendingReturns}
          />
        </div>
      </div>

      {/* Secondary KPI Row - Sports & Users */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Sports & Audience
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Match Access Revenue"
            value={stats ? formatCurrency(stats.matchAccessRevenue) : "—"}
            sub={`${stats?.matchAccessCount ?? 0} purchases`}
            icon={Tv}
            iconBg="bg-chart-1/20 text-chart-1"
          />
          <KpiCard
            title="Total Users"
            value={stats?.usersCount ?? "—"}
            sub={stats?.newUsersToday ? `+${stats.newUsersToday} today` : "All time"}
            icon={Users}
            iconBg="bg-chart-5/20 text-chart-5"
            href={`${ADMIN_PATH}/users`}
          />
          <KpiCard
            title="Pending Payments"
            value={stats?.pendingPaymentsCount ?? "—"}
            sub={stats?.pendingPaymentsCount ? "Awaiting payment" : "All clear"}
            icon={Clock}
            iconBg={stats?.pendingPaymentsCount ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground"}
            href={`${ADMIN_PATH}/orders`}
            alert={!!stats?.pendingPaymentsCount}
          />
          <KpiCard
            title="Low Stock"
            value={stats?.lowStockCount ?? "—"}
            sub={stats?.lowStockCount ? "Products need restock" : "All stocked"}
            icon={AlertTriangle}
            iconBg={stats?.lowStockCount ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}
            href={stats?.lowStockCount ? `${ADMIN_PATH}/products` : undefined}
            alert={!!stats?.lowStockCount}
          />
        </div>
      </div>

      {/* Charts & Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue (Last 14 Days)
            </CardTitle>
            <CardDescription>Daily revenue from paid orders</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !stats?.revenueChartData?.length ? (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                <Activity className="h-12 w-12 animate-pulse" />
              </div>
            ) : (
              <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
                <AreaChart data={stats.revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis tickFormatter={(v) => `KES ${v}`} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Orders by status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !stats?.orderStatusCounts ? (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                <Clock className="h-8 w-8 animate-pulse" />
              </div>
            ) : (
              <div className="space-y-4">
                {["pending", "processing", "shipped", "delivered", "cancelled"].map((status) => {
                  const count = stats.orderStatusCounts[status] ?? 0;
                  const total = stats.orders || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={status} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize text-muted-foreground">{status}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            status === "delivered"
                              ? "bg-chart-4"
                              : status === "cancelled"
                                ? "bg-gray-400"
                                : "bg-primary"
                          }`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders</CardDescription>
            </div>
            <Link
              href={`${ADMIN_PATH}/orders`}
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {stats?.recentOrders?.length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Order</th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Total</th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Payment</th>
                      <th className="px-6 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((o) => (
                      <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-6 py-3">
                          <Link
                            href={`/order/${o.orderNumber}`}
                            className="font-medium text-primary hover:underline"
                          >
                            #{o.orderNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-3 font-medium">{formatCurrency(o.total)}</td>
                        <td className="px-6 py-3">
                          <Badge
                            variant={
                              o.status === "delivered" ? "default" : o.status === "cancelled" ? "secondary" : "outline"
                            }
                          >
                            {o.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant={o.paymentStatus === "paid" ? "default" : "outline"}>
                            {o.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Link href={`/order/${o.orderNumber}`} className="text-muted-foreground hover:text-foreground">
                            <ChevronRight className="h-4 w-4 inline-block" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Package className="h-12 w-12 mb-3 opacity-50" />
                  <p>No orders yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sports: Recent Match Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tv className="h-5 w-5" />
              Recent Match Access
            </CardTitle>
            <CardDescription>Latest streaming purchases</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentMatchAccesses?.length ? (
              <ul className="space-y-3">
                {stats.recentMatchAccesses.map((ma) => (
                  <li key={ma.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">
                        {ma.match.homeTeam} vs {ma.match.awayTeam}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ma.paidAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-semibold text-chart-1">{formatCurrency(ma.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                <Tv className="h-10 w-10 mb-2 opacity-50" />
                <p>No match access sales yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock & Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Products
            </CardTitle>
            <CardDescription>Products needing restock</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.lowStockItems?.length ? (
              <ul className="space-y-2">
                {stats.lowStockItems.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <Link href={`/product/${p.slug}`} className="font-medium hover:text-primary hover:underline truncate">
                      {p.name}
                    </Link>
                    <Badge variant="default" className="shrink-0 ml-2">
                      {p.stock} left
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground py-4">All products are well stocked</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Viewed Products
            </CardTitle>
            <CardDescription>Most viewed items</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topProducts?.length ? (
              <ul className="space-y-2">
                {stats.topProducts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <Link href={`/product/${p.slug}`} className="font-medium hover:text-primary hover:underline truncate">
                      {p.name}
                    </Link>
                    <span className="text-muted-foreground shrink-0 ml-2">{p.viewCount} views</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No product views yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Counts Row */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Content & Catalog
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Link
            href={`${ADMIN_PATH}/categories`}
            className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-xl font-bold mt-0.5">{stats?.categoriesCount ?? "—"}</p>
              </div>
              <FolderTree className="h-8 w-8 text-chart-1/70" />
            </div>
          </Link>
          <Link href={`${ADMIN_PATH}/products`} className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Products</p>
                <p className="text-xl font-bold mt-0.5">{stats?.products ?? "—"}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-chart-2/70" />
            </div>
          </Link>
          <Link href={`${ADMIN_PATH}/coupons`} className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coupons</p>
                <p className="text-xl font-bold mt-0.5">{stats?.couponsCount ?? "—"}</p>
              </div>
              <Tag className="h-8 w-8 text-chart-3/70" />
            </div>
          </Link>
          <Link href={`${ADMIN_PATH}/teams`} className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teams</p>
                <p className="text-xl font-bold mt-0.5">{stats?.teams ?? "—"}</p>
              </div>
              <Users className="h-8 w-8 text-chart-4/70" />
            </div>
          </Link>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">News</p>
                <p className="text-xl font-bold mt-0.5">{stats?.news ?? "—"}</p>
              </div>
              <Newspaper className="h-8 w-8 text-chart-5/70" />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">FAQs</p>
                <p className="text-xl font-bold mt-0.5">{stats?.faqs ?? "—"}</p>
              </div>
              <HelpCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/30"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold group-hover:text-primary transition-colors">{item.label}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
