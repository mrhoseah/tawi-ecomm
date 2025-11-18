"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import QuickAddToCart from "./QuickAddToCart";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  category: string;
}

interface ProductCarouselProps {
  products: Product[];
  title?: string;
  subtitle?: string;
}

export default function ProductCarousel({
  products,
  title = "Featured Products",
  subtitle,
}: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [itemsPerView, setItemsPerView] = useState(3);

  // Responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1); // Mobile: 1 item
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2); // Tablet: 2 items
      } else {
        setItemsPerView(3); // Desktop: 3 items
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  const maxIndex = Math.max(0, products.length - itemsPerView);

  useEffect(() => {
    if (!isAutoPlaying || products.length <= itemsPerView) return;

    const calculatedMaxIndex = Math.max(0, products.length - itemsPerView);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= calculatedMaxIndex ? 0 : prev + 1));
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, itemsPerView, products.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {subtitle && (
            <p className="text-gray-600 text-lg">{subtitle}</p>
          )}
        </div>

        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="min-w-0 flex-shrink-0 px-2 sm:px-3"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <div className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                    <Link href={`/product/${product.slug}`} className="block">
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                        {product.compareAtPrice && (
                          <span className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-sm font-semibold">
                            Sale
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="absolute top-2 right-2 z-10">
                      <QuickAddToCart
                        product={product}
                        variant="icon"
                        className="opacity-0 group-hover:opacity-100"
                      />
                    </div>
                    <div className="p-4">
                      <Link href={`/product/${product.slug}`}>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          {product.compareAtPrice ? (
                            <div className="flex items-center gap-2">
                              <span className="text-red-600 font-bold text-lg">
                                ${product.price.toFixed(2)}
                              </span>
                              <span className="text-gray-400 line-through text-sm">
                                ${product.compareAtPrice.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-900 font-bold text-lg">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 capitalize">
                          {product.category}
                        </span>
                      </div>
                      <QuickAddToCart
                        product={product}
                        variant="button"
                        className="w-full text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {products.length > itemsPerView && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10 hidden md:block"
                aria-label="Previous products"
              >
                <ChevronLeft className="h-6 w-6 text-gray-700" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10 hidden md:block"
                aria-label="Next products"
              >
                <ChevronRight className="h-6 w-6 text-gray-700" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {products.length > itemsPerView && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "w-8 bg-red-600"
                      : "w-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {products.length > itemsPerView && (
          <div className="flex justify-center gap-4 mt-6 md:hidden">
            <button
              onClick={prevSlide}
              className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
              aria-label="Previous products"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={nextSlide}
              className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
              aria-label="Next products"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

