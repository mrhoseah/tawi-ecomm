import type { Metadata } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Tawi TV. Email, phone, and contact form for support and inquiries.",
};
import Footer from "@/components/Footer";
import ContactForm from "@/app/contact/ContactForm";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Contact Us
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Have a question about an order, a product, or partnering with Tawi Shop?
              Reach out and our team will get back to you as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left sidebar - Contact info */}
            <aside className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <a
                      href="mailto:support@tawishop.com"
                      className="text-gray-600 hover:text-red-600 transition-colors"
                    >
                      support@tawishop.com
                    </a>
                    <p className="text-sm text-gray-500 mt-1">
                      We&apos;ll respond within 24 hours
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ideal for general questions, feedback, and partnership inquiries.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                    <a
                      href="tel:+254700000000"
                      className="text-gray-600 hover:text-red-600 transition-colors"
                    >
                      +254 700 000 000
                    </a>
                    <p className="text-sm text-gray-500 mt-1">
                      Mon–Fri 9am–6pm EAT
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      For urgent order issues or time-sensitive support.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                    <p className="text-gray-600">
                      Tawi Shop HQ
                      <br />
                      Nairobi, Kenya
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Visit us by appointment
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-400">
                  In-person visits are currently by appointment only. Please contact us in advance
                  so we can make sure the right team member is available to assist you.
                </p>
              </div>
            </aside>

            {/* Right side - Contact form */}
            <div className="lg:col-span-2">
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
