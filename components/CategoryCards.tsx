import Link from "next/link";

const DEFAULT_CATEGORIES = [
  { name: "Jerseys", slug: "jerseys", description: "Official & replica kits", imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600" },
  { name: "Apparel", slug: "apparel", description: "Training wear & more", imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600" },
  { name: "Accessories", slug: "accessories", description: "Caps, scarves & more", imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600" },
];

type CategoryProp = {
  name: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
};

export default function CategoryCards({ categories = [] }: { categories?: CategoryProp[] }) {
  const list = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  return (
    <section id="shop" className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Shop by Category
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Jerseys, apparel, and accessories for every fan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {list.map((category) => (
            <Link
              key={category.slug}
              href={`/shop?category=${category.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-gray-100 aspect-[4/3] block shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <img
                src={category.imageUrl || "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600"}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-1 group-hover:text-red-400 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-300">{category.description}</p>
                <span className="inline-block mt-2 text-sm font-medium text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Shop now →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
