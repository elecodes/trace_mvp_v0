# TRACE MVP (v0)

TRACE is a Next.js web application designed to track project asset lifecycles, rights/ownership records, and sustainability metrics (such as carbon footprints and recyclability).

## 🚀 Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL database, authentication session middleware)
- **Object Storage**: [Supabase Storage](https://supabase.com/docs/guides/storage) (Private bucket for asset images with signed URL previews)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [lucide-react](https://lucide.dev/)
- **State & Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) validation
- **Visualization**: [Recharts](https://recharts.org/) (for dashboard analytics)
- **Reports**: [@react-pdf/renderer](https://react-pdf.org/) (for document generation)

---

## 📂 Project Structure

```
├── prisma/
│   ├── schema.prisma        # Database models, enums & relationships
│   └── migrations/          # Applied schema migrations
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages (login, signup)
│   │   ├── (dashboard)/     # Authenticated dashboard views
│   │   │   ├── assets/      # Asset listing, creation, and detail views
│   │   │   ├── dashboard/   # Dashboard analytics and charts
│   │   │   └── projects/    # Project organization and metadata
│   │   ├── globals.css      # Core styles
│   │   └── layout.tsx       # Root layout
│   ├── components/          # Shared UI components (asset forms, uploader)
│   ├── lib/                 # Core utilities (Prisma client, Supabase config, Server Actions)
│   └── middleware.ts        # Next.js middleware handling Supabase auth sessions
```

---

## 🛠️ Database Schema & Object Storage Summary

### Database Entities
The database uses PostgreSQL via Prisma with the following core entities:

- **User**: System user linked to Supabase Auth.
- **Project**: Represents a group of assets owned by a user.
- **Asset**: The central entity representing a tracked physical or digital item. Has a `LifecycleStage` (`DESIGN`, `PRODUCTION`, `SHOOTING`, `FINAL_DESTINATION`).
- **LifecycleEvent**: Tracks history of lifecycle stage transitions for auditability.
- **RightsRecord**: License type (`ORIGINAL`, `STOCK_LICENSED`, `AI_GENERATED`, `PUBLIC_DOMAIN`, `UNKNOWN`), source, legal status, and AI tool logs associated with an asset.
- **SustainabilityRecord**: Material type, weight, emission factors, dynamic CO₂eq calculations, circularity outcome (`PENDING`, `REUSED`, `DONATED`, `RECYCLED`, `DISCARDED`), and notes.

### Supabase Storage Setup
Images are stored in a private Supabase Storage bucket.
- **Bucket Name**: `asset-images`
- **Access Level**: Private (renders via client/server signed URLs valid for 1 hour).
- **Directory Structure**: `{userId}/{projectId}/{assetId}/{unique-file-name}.webp`

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

Fill in the credentials from your Supabase project and Gemini API:
- `DATABASE_URL`: Connection pooler URL (port 6543)
- `DIRECT_URL`: Direct database connection URL (port 5432)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Project API URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Public Key
- `GEMINI_API_KEY`: API Key from Google AI Studio (uses `gemini-2.5-flash` model for asset description and category analysis)

### 4. Supabase Storage Configuration
1. Go to your Supabase Dashboard ➔ **Storage**.
2. Create a new bucket named **`asset-images`** and check the **Private** option.
3. Configure RLS Policies for the bucket to allow authenticated reads and writes under their own user folders:
   ```sql
   -- Allow users to upload, read, and delete their own files
   (bucket_id = 'asset-images'::text) AND (auth.role() = 'authenticated'::text) AND ((select auth.uid()::text) = (storage.foldername(name))[1])
   ```

### 5. Database Setup & Migrations

Deploy the database schema to your Supabase PostgreSQL instance:

```bash
npx prisma db push
```

Or run development migrations:

```bash
npx prisma migrate dev
```

### 6. Running the Application

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
