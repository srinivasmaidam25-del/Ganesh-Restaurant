# Multi-Tenant Restaurant QR Ordering & Management System (Next.js & Supabase)

An enterprise-ready, multi-tenant QR code dining, checkout, and kitchen queue management system built as a unified **Next.js** application powered by **Supabase (PostgreSQL + Realtime)**.

---

## 🛠️ Technology Stack
* **Frontend/Backend**: Next.js 15, TypeScript, Tailwind CSS, Framer Motion, TanStack Query, Axios
* **Database & Realtime**: Supabase (PostgreSQL + Supabase Realtime Channels)
* **PDF Services**: PDFKit (Receipt invoice A6 generator & QR printable A4 flyer compiler)

---

## 🚀 Getting Started

This application features a **Standalone Demo Fallback**. If no Supabase credentials are set, the application automatically seeds an in-memory mock database and runs offline out of the box.

### 1. Standalone Demo Mode (Zero Configuration)
To boot the demo mode:
```bash
# Go to the client directory
cd client

# Install packages
npm install

# Start Next.js Development Server (runs on http://localhost:3000)
npm run dev
```

---

### 2. Connect Live Supabase Database
To connect your own live database:

1. **Database Schema**: 
   * Open the **Supabase SQL Editor** console in your dashboard.
   * Copy, paste, and run the queries inside the root [supabase-schema.sql](file:///c:/Users/SRINIVAS/OneDrive/Documents/projects/Project%202%20cafe/supabase-schema.sql) file. This creates the PostgreSQL tables, indices, and registers real-time replication публикации.
   
2. **Environment Variables**:
   * Create a `client/.env.local` file.
   * Fill in your Supabase connection parameters:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```
     
3. **Launch**:
   ```bash
   npm run dev
   ```

---

## 🐳 Running with Docker
```bash
# Build and run the Next.js container (runs on http://localhost:3000)
docker-compose up --build
```

---

## 📋 Interactive Demo Navigation Paths (Port 3000)

* **Multi-tenant Portal Landing**: [http://localhost:3000](http://localhost:3000)
* **Pizzeria Menu Catalog**: [http://localhost:3000/r/la-piazza](http://localhost:3000/r/la-piazza)
* **QR Table Scan Simulator (Table 3)**: [http://localhost:3000/r/la-piazza/table/3](http://localhost:3000/r/la-piazza/table/3) (Redirects to menu with locked table location state)
* **Admin Dashboard Panel**: [http://localhost:3000/r/la-piazza/admin](http://localhost:3000/r/la-piazza/admin)
  * Demo Mode Account: `admin@lapiazza.com`
  * Password: `password123`
* **Kitchen Order Queue**: [http://localhost:3000/r/la-piazza/kitchen](http://localhost:3000/r/la-piazza/kitchen)
  * Demo Mode Account: `kitchen@lapiazza.com`
  * Password: `password123`
