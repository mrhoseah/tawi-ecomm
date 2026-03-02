import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Check, Tv, Sparkles, Film } from "lucide-react";

export const metadata: Metadata = {
  title: "Streaming Plans",
  description: "Subscribe and get unlimited access to all live matches from your favorite local teams.",
};

async function getStreamingPlans() {
  try {
    return await prisma.streamingPlan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    return null;
  }
}

const FALLBACK_PLANS = [
  {
    slug: "monthly",
    name: "Monthly Pass",
    description: "$29.99/month",
    price: 29.99,
    interval: "month",
    features: [
      "Unlimited live match streaming",
      "All teams coverage",
      "HD quality streams",
      "Watch on any device",
      "Cancel anytime",
      "Priority customer support",
      "Exclusive content",
    ],
    popular: false,
  },
  {
    slug: "season",
    name: "Season Pass",
    description: "$149.99/6 months - Save 17%",
    price: 149.99,
    interval: "6months",
    features: [
      "Unlimited live match streaming",
      "All teams coverage",
      "HD quality streams",
      "Watch on any device",
      "Priority customer support",
      "Exclusive behind-the-scenes content",
      "Match highlights & replays",
    ],
    popular: true,
  },
];

const BENEFITS = [
  {
    icon: Tv,
    title: "All Matches Live",
    description: "Watch every match from all local teams in real-time",
  },
  {
    icon: Sparkles,
    title: "HD Quality",
    description: "Crystal clear streaming on any device",
  },
  {
    icon: Film,
    title: "Exclusive Access",
    description: "Get behind-the-scenes content and replays",
  },
];

export default async function SubscriptionPage() {
  const plansData = await getStreamingPlans();
  const plans = (plansData ?? FALLBACK_PLANS) as Array<{
    slug: string;
    name: string;
    description?: string | null;
    price: number;
    interval: string;
    features: string[];
    popular?: boolean;
  }>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-900 text-white py-14 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Link
              href="/matches"
              className="inline-flex items-center gap-2 text-red-100 hover:text-white mb-8 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Matches
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Streaming Plans
            </h1>
            <p className="text-xl text-red-100 max-w-2xl mx-auto">
              Watch Every Match Live. Subscribe and get unlimited access to all live
              matches from your favorite local teams.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
          {/* Pricing cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
            {plans.map((plan) => (
              <div
                key={plan.slug}
                className={`relative rounded-2xl border-2 bg-white p-8 shadow-sm transition-all ${
                  plan.popular
                    ? "border-red-500 shadow-lg ring-2 ring-red-500/20"
                    : "border-gray-200 hover:border-red-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex px-4 py-1 bg-red-600 text-white text-sm font-semibold rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-3xl font-bold text-red-600 mb-6">
                  ${plan.price.toFixed(2)}
                  <span className="text-base font-normal text-gray-500">
                    /{plan.interval === "month" ? "month" : "6 months"}
                  </span>
                </p>
                {plan.description?.includes("Save") && (
                  <p className="text-sm font-semibold text-green-600 mb-4">{plan.description}</p>
                )}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.popular ? "/sign-in?callbackUrl=/subscription" : "/sign-in?callbackUrl=/subscription"}
                  className={`block w-full text-center py-3.5 rounded-xl font-semibold transition-colors ${
                    plan.popular
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  Subscribe Now
                </Link>
              </div>
            ))}
          </div>

          {/* What You Get */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">What You Get</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="inline-flex p-4 bg-red-50 rounded-xl mb-4">
                  <benefit.icon className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
