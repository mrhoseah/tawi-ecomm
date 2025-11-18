import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create sample products
  const products = [
    {
      name: "Classic Home Jersey",
      slug: "classic-home-jersey",
      description: "Premium quality home jersey with team colors. Made from breathable fabric for maximum comfort during games.",
      price: 79.99,
      compareAtPrice: 99.99,
      sku: "JER-HOME-001",
      category: "jerseys",
      tags: ["home", "classic", "popular"],
      images: [
        "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Red", "White", "Blue"],
      stock: 50,
      featured: true,
      active: true,
    },
    {
      name: "Away Jersey",
      slug: "away-jersey",
      description: "Stylish away jersey perfect for supporting your team on the road. Lightweight and durable.",
      price: 79.99,
      sku: "JER-AWAY-001",
      category: "jerseys",
      tags: ["away", "travel"],
      images: [
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
      ],
      sizes: ["S", "M", "L", "XL"],
      colors: ["White", "Black"],
      stock: 30,
      featured: true,
      active: true,
    },
    {
      name: "Training Shorts",
      slug: "training-shorts",
      description: "Comfortable training shorts made from moisture-wicking material. Perfect for practice sessions.",
      price: 34.99,
      sku: "APP-SHORTS-001",
      category: "apparel",
      tags: ["training", "shorts"],
      images: [
        "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800",
      ],
      sizes: ["S", "M", "L", "XL"],
      colors: ["Black", "Gray", "Navy"],
      stock: 75,
      featured: true,
      active: true,
    },
    {
      name: "Team Cap",
      slug: "team-cap",
      description: "Official team cap with embroidered logo. Adjustable strap for perfect fit.",
      price: 24.99,
      sku: "ACC-CAP-001",
      category: "accessories",
      tags: ["cap", "headwear"],
      images: [
        "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800",
      ],
      sizes: ["One Size"],
      colors: ["Black", "Red", "Blue"],
      stock: 100,
      featured: false,
      active: true,
    },
    {
      name: "Training T-Shirt",
      slug: "training-tshirt",
      description: "Breathable training t-shirt with team branding. Ideal for workouts and casual wear.",
      price: 29.99,
      sku: "APP-TSHIRT-001",
      category: "apparel",
      tags: ["training", "tshirt"],
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["White", "Black", "Gray"],
      stock: 60,
      featured: true,
      active: true,
    },
    {
      name: "Goalkeeper Jersey",
      slug: "goalkeeper-jersey",
      description: "Special goalkeeper jersey with extra padding and unique design. Stand out in the goal!",
      price: 89.99,
      compareAtPrice: 109.99,
      sku: "JER-GK-001",
      category: "jerseys",
      tags: ["goalkeeper", "special"],
      images: [
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
      ],
      sizes: ["M", "L", "XL"],
      colors: ["Green", "Yellow", "Orange"],
      stock: 20,
      featured: false,
      active: true,
    },
    {
      name: "Team Scarf",
      slug: "team-scarf",
      description: "Warm and stylish team scarf. Show your support in any weather!",
      price: 19.99,
      sku: "ACC-SCARF-001",
      category: "accessories",
      tags: ["scarf", "winter"],
      images: [
        "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800",
      ],
      sizes: ["One Size"],
      colors: ["Red/White", "Blue/White"],
      stock: 80,
      featured: false,
      active: true,
    },
    {
      name: "Match Day Socks",
      slug: "match-day-socks",
      description: "High-performance match day socks with cushioning and moisture control.",
      price: 14.99,
      sku: "ACC-SOCKS-001",
      category: "accessories",
      tags: ["socks", "footwear"],
      images: [
        "https://images.unsplash.com/photo-1586350977773-bf6f7ad5e0d0?w=800",
      ],
      sizes: ["S", "M", "L"],
      colors: ["White", "Black"],
      stock: 120,
      featured: false,
      active: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

