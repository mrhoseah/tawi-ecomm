import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import ProductImageGallery from "@/components/ProductImageGallery";
import QuickAddToCart from "@/components/QuickAddToCart";
import RecentlyViewed from "@/components/RecentlyViewed";
import ProductViewTracker from "@/components/ProductViewTracker";
import ProductReviews from "@/components/ProductReviews";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getProduct(slug: string) {
  try {
    // First try with active filter
    let product = await prisma.product.findUnique({
      where: { slug },
    });

    // If product exists but is inactive, still return it (for debugging)
    // In production, you might want to return null here
    if (product && !product.active) {
      console.warn(`Product ${slug} exists but is inactive`);
    }

    // Only return if product is active
    if (product && product.active) {
      return product;
    }

    return null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

async function getRelatedProducts(category: string, currentProductId: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        category,
        active: true,
        id: { not: currentProductId },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    });
    return products;
  } catch (error) {
    return [];
  }
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;
  
  if (!slug) {
    notFound();
  }
  
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.category, product.id);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ProductViewTracker productId={product.id} productSlug={product.slug} />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div>
              <ProductImageGallery
                images={product.images}
                productName={product.name}
              />
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-4">
                <span className="text-sm text-gray-500 uppercase tracking-wide">
                  {product.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {product.name}
              </h1>

              <div className="mb-6">
                {product.compareAtPrice ? (
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-red-600">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-xl text-gray-400 line-through">
                      ${product.compareAtPrice.toFixed(2)}
                    </span>
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-semibold">
                      Save ${(product.compareAtPrice - product.price).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {product.tags.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-b py-6 mb-6">
                <AddToCartButton
                  product={product}
                  disabled={product.stock === 0}
                />
                {product.stock === 0 && (
                  <p className="text-red-600 text-sm mt-2">
                    This item is currently out of stock
                  </p>
                )}
                {product.stock > 0 && product.stock < 10 && (
                  <p className="text-orange-600 text-sm mt-2">
                    Only {product.stock} left in stock!
                  </p>
                )}
              </div>

              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-start">
                  <span className="font-medium w-32">SKU:</span>
                  <span>{product.sku || "N/A"}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-32">Availability:</span>
                  <span
                    className={
                      product.stock > 0 ? "text-green-600" : "text-red-600"
                    }
                  >
                    {product.stock > 0
                      ? `In Stock (${product.stock} available)`
                      : "Out of Stock"}
                  </span>
                </div>
                {product.sizes.length > 0 && (
                  <div className="flex items-start">
                    <span className="font-medium w-32">Sizes:</span>
                    <span>{product.sizes.join(", ")}</span>
                  </div>
                )}
                {product.colors.length > 0 && (
                  <div className="flex items-start">
                    <span className="font-medium w-32">Colors:</span>
                    <span>{product.colors.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Related Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct.id} className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                    <Link href={`/product/${relatedProduct.slug}`} className="block">
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {relatedProduct.images[0] ? (
                          <img
                            src={relatedProduct.images[0]}
                            alt={relatedProduct.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                        {relatedProduct.compareAtPrice && (
                          <span className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                            Sale
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="absolute top-2 right-2 z-10">
                      <QuickAddToCart
                        product={relatedProduct}
                        variant="icon"
                        className="opacity-0 group-hover:opacity-100"
                      />
                    </div>
                    <div className="p-4">
                      <Link href={`/product/${relatedProduct.slug}`}>
                        <h3 className="font-semibold mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                          {relatedProduct.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mb-3">
                        {relatedProduct.compareAtPrice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 font-bold">
                              ${relatedProduct.price.toFixed(2)}
                            </span>
                            <span className="text-gray-400 line-through text-sm">
                              ${relatedProduct.compareAtPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-900 font-bold">
                            ${relatedProduct.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <QuickAddToCart
                        product={relatedProduct}
                        variant="button"
                        className="w-full text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Reviews */}
          <ProductReviews
            productId={product.id}
            productSlug={product.slug}
            averageRating={product.rating || 0}
            reviewCount={product.reviewCount || 0}
          />

          {/* Recently Viewed */}
          <RecentlyViewed />
        </div>
      </main>
      <Footer />
    </div>
  );
}

