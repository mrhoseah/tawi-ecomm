# Tawi Shop - E-Commerce Platform

A fully featured e-commerce shop for selling sports jerseys and athletic apparel, owned by Tawi TV.

## Features

- 🛍️ **Product Catalog** - Browse and search through jerseys, apparel, and accessories
- 🛒 **Shopping Cart** - Add items to cart with size and color options
- 💳 **Checkout Process** - Complete order placement with shipping information
- 👤 **User Authentication** - Sign up, sign in with credentials, Google, or GitHub
- 📦 **Order Management** - View order history and track order status
- 🎨 **Modern UI** - Professional landing page with Tailwind CSS
- 🔐 **NextAuth Integration** - Secure authentication with multiple providers

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Prisma** - Database ORM with PostgreSQL
- **NextAuth.js** - Authentication
- **Tailwind CSS** - Styling
- **Zustand** - State management for cart
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tawi-ecomm
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://dev:5210@localhost:5432/tawi_shop?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

4. Set up the database:
```bash
# Push the schema to your database
npm run db:push

# Seed the database with sample products
npm run db:seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The application uses PostgreSQL. Make sure your database is running and accessible with the credentials in your `.env` file.

To create the database schema:
```bash
npm run db:push
```

To seed sample products:
```bash
npm run db:seed
```

## Project Structure

```
tawi-ecomm/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── shop/              # Shop pages
│   ├── product/           # Product detail pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout process
│   └── account/           # User account pages
├── components/            # React components
├── lib/                   # Utilities and configurations
├── prisma/                # Prisma schema and migrations
└── types/                 # TypeScript type definitions
```

## Features in Detail

### Product Management
- Product listing with filters (category, search, sort)
- Product detail pages with image gallery
- Size and color selection
- Stock management

### Shopping Cart
- Add/remove items
- Update quantities
- Persistent cart (localStorage + database)
- Cart summary with totals

### Checkout
- Shipping information form
- Payment method selection
- Order confirmation
- Order tracking

### User Account
- Order history
- Account information
- Address management (coming soon)

## Authentication

The app supports multiple authentication methods:
- **Credentials** - Email and password
- **Google OAuth** - Sign in with Google
- **GitHub OAuth** - Sign in with GitHub

To enable OAuth providers, add your client IDs and secrets to the `.env` file.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Base URL of your application | Yes |
| `NEXTAUTH_SECRET` | Secret for JWT encryption | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | No |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | No |

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## License

Private - Tawi TV
