import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "hoseahkplgt@gmail.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin123!";

async function ensureCognitoUser(email: string, password: string, name: string) {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const region = process.env.COGNITO_REGION;
  if (!userPoolId || !region) {
    console.log("Skipping Cognito: COGNITO_USER_POOL_ID or COGNITO_REGION not set");
    return;
  }
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn(
      "Skipping Cognito: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY required (these are IAM credentials, not COGNITO_CLIENT_ID/SECRET)"
    );
    return;
  }
  const client = new CognitoIdentityProviderClient({ region });

  try {
    await client.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
          { Name: "name", Value: name },
        ],
        TemporaryPassword: password,
        MessageAction: "SUPPRESS",
      })
    );
    await client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: password,
        Permanent: true,
      })
    );
    console.log(`Cognito user created: ${email}`);
  } catch (err: unknown) {
    if (err instanceof UsernameExistsException) {
      console.log(`Cognito user already exists: ${email}`);
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Could not load credentials")) {
        console.warn(
          "Cognito skip: Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env for Cognito user creation."
        );
      } else {
        console.error("Cognito create failed:", err);
      }
    }
  }
}

async function main() {
  console.log("Seeding database...");

  // Ensure admin user exists (Prisma + Cognito)
  const existingAdmin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });
  if (existingAdmin) {
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { role: "admin" },
    });
    console.log(`Admin role set for ${ADMIN_EMAIL}`);
  } else {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: "Admin",
        password: hashedPassword,
        role: "admin",
      },
    });
    console.log(`Admin user created in DB: ${ADMIN_EMAIL} (default password: ${ADMIN_PASSWORD})`);
  }

  // Create admin in Cognito if env vars are set (needed for Cognito sign-in)
  await ensureCognitoUser(ADMIN_EMAIL, ADMIN_PASSWORD, "Admin");

  // Create categories
  const categorySlugs = ["jerseys", "apparel", "accessories"];
  for (const [idx, slug] of categorySlugs.entries()) {
    await prisma.category.upsert({
      where: { slug },
      create: {
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
        slug,
        description: slug === "jerseys" ? "Official & replica kits" : slug === "apparel" ? "Training wear & more" : "Caps, scarves & more",
        imageUrl: slug === "jerseys" ? "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600" : slug === "apparel" ? "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600" : "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600",
        sortOrder: idx,
      },
      update: {},
    });
  }
  console.log("Categories seeded");

  // Create sample products
  const products = [
    {
      name: "Classic Home Jersey",
      slug: "classic-home-jersey",
      description: "Premium quality home jersey with team colors. Made from breathable fabric for maximum comfort during games. Add your name and number for official match-day style.",
      price: 79.99,
      compareAtPrice: 99.99,
      onSale: true,
      sku: "JER-HOME-001",
      category: "jerseys",
      tags: ["home", "classic", "popular", "Gor Mahia", "AFC Leopards"],
      images: [
        "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Red", "White", "Blue"],
      stock: 50,
      featured: true,
      active: true,
      printable: true,
      printingCost: 15,
      newArrival: true,
      bestSeller: true,
    },
    {
      name: "Away Jersey",
      slug: "away-jersey",
      description: "Stylish away jersey perfect for supporting your team on the road. Lightweight and durable. Personalize with name and number.",
      price: 79.99,
      sku: "JER-AWAY-001",
      category: "jerseys",
      tags: ["away", "travel", "Tusker FC", "KCB FC"],
      images: [
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
      ],
      sizes: ["S", "M", "L", "XL"],
      colors: ["White", "Black"],
      stock: 30,
      featured: true,
      active: true,
      printable: true,
      printingCost: 15,
      newArrival: true,
    },
    {
      name: "Training Shorts",
      slug: "training-shorts",
      description: "Comfortable training shorts made from moisture-wicking material. Perfect for practice sessions.",
      price: 34.99,
      sku: "APP-SHORTS-001",
      category: "apparel",
      tags: ["training", "shorts", "Gor Mahia", "Bandari FC"],
      images: [
        "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800",
      ],
      sizes: ["S", "M", "L", "XL"],
      colors: ["Black", "Gray", "Navy"],
      stock: 75,
      featured: true,
      active: true,
      onSale: true,
    },
    {
      name: "Team Cap",
      slug: "team-cap",
      description: "Official team cap with embroidered logo. Adjustable strap for perfect fit.",
      price: 24.99,
      sku: "ACC-CAP-001",
      category: "accessories",
      tags: ["cap", "headwear", "Gor Mahia", "AFC Leopards", "Tusker FC"],
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
      description: "Special goalkeeper jersey with extra padding and unique design. Stand out in the goal! Add your name and number.",
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
      printable: true,
      printingCost: 15,
    },
    {
      name: "Team Scarf",
      slug: "team-scarf",
      description: "Warm and stylish team scarf. Show your support in any weather!",
      price: 19.99,
      sku: "ACC-SCARF-001",
      category: "accessories",
      tags: ["scarf", "winter", "Gor Mahia", "AFC Leopards"],
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

  // Seed matches
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);

  const matches = [
    { homeTeam: "Gor Mahia", awayTeam: "AFC Leopards", matchDate: futureDate, venue: "Nyayo National Stadium", status: "scheduled", accessPrice: 12.99 },
    { homeTeam: "Tusker FC", awayTeam: "KCB FC", matchDate: futureDate, venue: "Ruaraka Grounds", status: "scheduled", accessPrice: 14.99 },
    { homeTeam: "Bandari FC", awayTeam: "Posta Rangers", matchDate: pastDate, venue: "Mbaraki Sports Club", status: "finished", accessPrice: 9.99 },
  ];

  await prisma.match.deleteMany({});
  await prisma.match.createMany({ data: matches });

  // Seed teams (Local Sports Hub style - Kenyan Premier League / local sports)
  const teams = [
    { name: "Gor Mahia", slug: "gor-mahia", sportType: "Football", description: "FKF Premier League club" },
    { name: "AFC Leopards", slug: "afc-leopards", sportType: "Football", description: "FKF Premier League club" },
    { name: "Tusker FC", slug: "tusker-fc", sportType: "Football", description: "FKF Premier League club" },
    { name: "KCB FC", slug: "kcb-fc", sportType: "Football", description: "FKF Premier League club" },
    { name: "Bandari FC", slug: "bandari-fc", sportType: "Football", description: "FKF Premier League club" },
    { name: "Posta Rangers", slug: "posta-rangers", sportType: "Football", description: "FKF Premier League club" },
    { name: "Kakamega Homeboyz", slug: "kakamega-homeboyz", sportType: "Football", description: "FKF Premier League club" },
    { name: "Muhoroni Youth", slug: "muhoroni-youth", sportType: "Football", description: "FKF Premier League club" },
    { name: "Nzoia Sugar", slug: "nzoia-sugar", sportType: "Football", description: "FKF Premier League club" },
    { name: "Ulinzi Stars", slug: "ulinzi-stars", sportType: "Football", description: "FKF Premier League club" },
  ];
  await prisma.team.deleteMany({});
  await prisma.team.createMany({ data: teams });

  // Seed news
  const newsItems = [
    { title: "Gor Mahia extend lead at top", excerpt: "K'Ogalo clinch crucial win to stay ahead in title race.", content: "Gor Mahia secured three points with a convincing home win...", teams: ["Gor Mahia"] },
    { title: "Gor Mahia vs AFC Leopards: Derby day", excerpt: "Historic rivals face off in Mashemeji derby.", content: "The Mashemeji derby between Gor Mahia and AFC Leopards continues...", teams: ["Gor Mahia", "AFC Leopards"] },
    { title: "Tusker FC strengthen squad", excerpt: "Brewers add new signings ahead of transfer deadline.", content: "Tusker FC have completed signings to bolster their squad...", teams: ["Tusker FC"] },
  ];

  await prisma.news.deleteMany({});
  for (const n of newsItems) {
    await prisma.news.create({ data: n });
  }

  // Seed default pages
  const defaultPages = [
    { slug: "privacy-policy", title: "Privacy Policy", content: "<p>Your privacy is important to us. This page will be updated by the admin.</p>" },
    { slug: "about-us", title: "About Us", content: "<p>Local Sports Hub is your neighborhood destination for official jerseys and match-day gear.</p>" },
    { slug: "terms-of-service", title: "Terms of Service", content: "<p>By using our service, you agree to these terms. This page will be updated by the admin.</p>" },
    { slug: "return-policy", title: "Return Policy & Refunds", content: "<h2>Returns</h2><p>We accept returns within 30 days of delivery for unused items in original packaging with tags attached. Items must not show signs of wear or use.</p><h2>How to Request a Return</h2><p>Sign in to your account, go to the <a href=\"/returns\">Returns</a> page, and submit a return request for your delivered order. We will review your request and respond within 2–3 business days.</p><h2>Refunds</h2><p>Once your return is approved and processed:</p><ul><li><strong>M-Pesa:</strong> Refunds are processed via M-Pesa reversal and typically appear within 24–48 hours.</li><li><strong>Bank Transfer:</strong> Refunds are processed manually to the account you used. Please allow 5–10 business days.</li><li><strong>PayPal:</strong> Refunds are processed to your PayPal account within 3–5 business days.</li></ul><h2>Exclusions</h2><p>Custom-printed or personalized items cannot be returned unless defective. Sale items may have different return conditions.</p>" },
  ];
  for (const p of defaultPages) {
    await prisma.page.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  // Seed streaming plans
  const streamingPlans = [
    {
      slug: "monthly",
      name: "Monthly Pass",
      description: "Unlimited live match streaming",
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
      sortOrder: 0,
    },
    {
      slug: "season",
      name: "Season Pass",
      description: "Save 17%",
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
      sortOrder: 1,
    },
  ];
  for (const plan of streamingPlans) {
    await prisma.streamingPlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    });
  }

  // Seed sample FAQs
  const faqs = [
    { question: "What is your return policy?", answer: "We accept returns within 30 days of delivery for unused items in original packaging.", sortOrder: 0 },
    { question: "How can I track my order?", answer: "Once shipped, you will receive an email with a tracking number. You can also check your order status in your account.", sortOrder: 1 },
  ];
  await prisma.faq.deleteMany({});
  await prisma.faq.createMany({ data: faqs });

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

