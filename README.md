# TRACE MVP (v0)

TRACE is a Next.js web application designed to track project asset lifecycles, rights/ownership records, and sustainability metrics (such as carbon footprints and recyclability).

## 🚀 Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL database, authentication session middleware)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [lucide-react](https://lucide.dev/)
- **State & Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) validation
- **Visualization**: [Recharts](https://recharts.org/) (for dashboard analytics)
- **Reports**: [@react-pdf/renderer](https://react-pdf.org/) (for document generation)

---

## 📂 Project Structure

```
├── prisma/
│   └── schema.prisma        # Database models & relationships
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages (login, signup)
│   │   ├── (dashboard)/     # Authenticated dashboard views
│   │   │   ├── assets/      # Asset listing, creation, and detail views
│   │   │   ├── dashboard/   # Dashboard analytics and charts
│   │   │   └── projects/    # Project organization and metadata
│   │   ├── globals.css      # Core styles
│   │   └── layout.tsx       # Root layout
│   ├── components/          # Shared UI components
│   ├── lib/                 # Core utilities and client libraries (Prisma client, Supabase config)
│   └── middleware.ts        # Next.js middleware handling Supabase auth sessions
```

---

## 🛠️ Database Schema Summary

The database uses PostgreSQL via Prisma with the following core entities:

- **User**: System user linked to Supabase Auth.
- **Project**: Represents a group of assets owned by a user.
- **Asset**: The central entity representing a tracked physical or digital item. Has a `LifecycleStatus` (`CONCEPT`, `PRODUCTION`, `IN_USE`, `END_OF_LIFE`).
- **LifecycleEvent**: Tracks history of lifecycle status transitions for auditability.
- **RightsRecord**: License and ownership information associated with an asset.
- **SustainabilityRecord**: Carbon footprint (kg), weight (kg), and recyclability percentage.

---

## ⚙️ Getting Started

### 1. Prerequisites

Make sure you have Node.js (v18+) and npm installed.

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Fill in the credentials from your Supabase project:
- `DATABASE_URL`: Connection pooler URL (port 6543)
- `DIRECT_URL`: Direct database connection URL (port 5432)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Project API URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Public Key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role secret key

### 4. Database Setup & Migrations

Deploy the database schema to your Supabase PostgreSQL instance:

```bash
npx prisma db push
```

Or run development migrations:

```bash
npx prisma migrate dev
```

### 5. Running the Application

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
npm start
```
