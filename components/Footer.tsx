"use client";

import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ChevronUp,
  Mail,
} from "lucide-react";

export default function Footer() {
  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  const quickLinks = [
    { href: "/news", label: "News" },
    { href: "/matches", label: "Matches" },
    { href: "/shop", label: "Shop" },
    { href: "/teams", label: "Teams" },
  ];

  const legalLinks = [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/return-policy", label: "Return Policy" },
    { href: "/about", label: "About" },
  ];

  const socialLinks = [
    { href: "#", icon: Facebook, label: "Facebook" },
    { href: "#", icon: Twitter, label: "Twitter" },
    { href: "#", icon: Instagram, label: "Instagram" },
    { href: "#", icon: Youtube, label: "YouTube" },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300">
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand & Tagline */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <h3 className="text-white text-xl font-bold mb-3 hover:text-red-400 transition-colors">
                Local Sports Hub
              </h3>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Your local sports destination for news, merchandise, and live
              matches.
            </p>
            <div className="flex gap-3 mt-5">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="p-2 rounded-lg bg-gray-800/60 text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map(({ href, label }) => (
                <li key={`${href}-${label}`}>
                  <Link
                    href={href}
                    className="text-sm text-gray-400 hover:text-red-400 transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-red-500 transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Streaming */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Streaming
            </h4>
            <Link
              href="/subscribe"
              className="text-sm text-gray-400 hover:text-red-400 transition-colors inline-flex items-center gap-2 group"
            >
              <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-red-500 transition-colors" />
              Subscribe
            </Link>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Support
            </h4>
            <p className="text-sm text-gray-400 mb-3">
              Contact us for any questions
            </p>
            <a
              href="mailto:support@sportshub.local"
              className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
            >
              <Mail className="h-4 w-4" />
              support@sportshub.local
            </a>
            <div className="mt-4 space-y-2">
              <Link
                href="/contact"
                className="block text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                Contact Form
              </Link>
              <Link
                href="/faq"
                className="block text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                FAQ
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; 2026 Local Sports Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {legalLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {label}
              </Link>
            ))}
            <button
              onClick={scrollToTop}
              aria-label="Back to top"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              Top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

