# 🔐 Vault This File
> "Totally not Google Drive" — A sarcastic reference from Voltees V

A file locker/vault web app where anyone can **download** without an account, but **uploading requires a sign-in**. Create public or private vaults, share via link or QR code, and lock private vaults with a PIN/password.

---

## 🏗️ Tech Stack

| Layer       | Technology                         |
|-------------|-------------------------------------|
| Frontend    | React 18 + Vite + React Router v6  |
| Styling     | CSS Modules + Custom CSS Variables  |
| Backend     | Node.js + Express.js               |
| Database    | PostgreSQL via Supabase (or swap to PlanetScale) |
| File Storage| Cloudflare R2 (S3-compatible)      |
| Auth        | JWT + bcrypt + speakeasy (2FA)     |
| QR Codes    | qrcode library                     |
| Email       | Resend                             |
| Deploy FE   | Vercel                             |
| Deploy BE   | Railway or Render                  |

---

## 📁 Project Structure

```
vault-this-file/
├── frontend/                  # React + Vite app
│   ├── public/
│   ├── src/
│   │   ├── api/               # Axios API clients
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Layout/
│   │   │   ├── Modals/
│   │   │   ├── Vault/
│   │   │   └── UI/
│   │   ├── context/           # React Context (Auth, Vault)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Route-level page components
│   │   ├── styles/            # Global styles & variables
│   │   └── utils/             # Helper functions
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                   # Node.js + Express API
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Auth, upload, error handling
│   │   ├── models/            # DB models/queries
│   │   ├── routes/            # Express routers
│   │   ├── services/          # Business logic (storage, email, 2FA)
│   │   ├── utils/             # Helpers
│   │   └── app.js             # Express app setup
│   ├── server.js              # Entry point
│   └── package.json
│
├── package.json               # Root monorepo scripts
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- A Supabase account (free) OR PostgreSQL locally
- A Cloudflare R2 bucket (free 10 GB)

### 1. Clone & Install

> ⚠️ **Important:** Dependencies must be installed in **each folder separately**.
> Running `npm install` only from the root will cause `ERR_MODULE_NOT_FOUND` build errors.

```bash
# Step 1 — Install root tools (concurrently)
cd vault-this-file
npm install

# Step 2 — Install frontend
cd frontend
npm install

# Step 3 — Install backend
cd ../backend
npm install
```

**Shortcut** — or from the root, run:
```bash
npm run setup   # does all 3 steps automatically
```

### 2. Configure Environment Variables

**Backend** — create `backend/.env`:
```env
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Cloudflare R2 (S3-compatible)
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=vault-this-file
R2_PUBLIC_URL=https://your-r2-public-url.r2.dev

# Email (Resend)
RESEND_API_KEY=re_your_resend_key
FROM_EMAIL=noreply@yourdomain.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

**Frontend** — create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_URL=http://localhost:5173
```

### 3. Set Up Database

Run the SQL schema in your Supabase SQL editor (or any PostgreSQL):
```bash
# Schema is in backend/src/db/schema.sql
```

### 4. Run Development

```bash
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:5000
```

---

## 🗄️ Database Recommendations

| Option          | Free Tier          | Best For              |
|-----------------|--------------------|-----------------------|
| **PlanetScale** | 5 GB, 1B reads/mo  | Best free tier overall |
| **Supabase**    | 500 MB + 1 GB storage | All-in-one with auth |
| **Railway**     | $5 credit/mo       | Bundled with backend  |
| **MongoDB Atlas**| 512 MB            | NoSQL preference      |

**Recommendation**: Use **PlanetScale** for metadata DB + **Cloudflare R2** for files. This gives you 5 GB DB + 10 GB file storage free with zero egress fees.

---

## ☁️ File Storage Recommendations

| Option              | Free             | Egress Fees | Notes               |
|---------------------|------------------|-------------|---------------------|
| **Cloudflare R2** ⭐ | 10 GB + ops      | **FREE**    | Best for downloads  |
| Backblaze B2        | 10 GB            | Free w/ CF  | Pair with Cloudflare|
| AWS S3              | 5 GB (12mo only) | $0.09/GB    | Gets expensive      |
| Supabase Storage    | 1 GB             | Limited     | Too small           |

**Winner**: Cloudflare R2. Zero egress fees = free downloads at scale. This app downloads a lot — this matters.

---

## 🚀 Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
# Set VITE_API_URL to your backend URL
```

### Backend → Railway (Recommended)
```bash
# Connect your GitHub repo on railway.app
# Add environment variables in Railway dashboard
# Railway auto-detects Node.js and deploys
```

### Backend → Render (Alternative)
```bash
# Free tier: sleeps after 15min inactivity (bad for UX)
# $7/mo starter stays always-on
# Connect GitHub → New Web Service → backend/ directory
```

---

## 🔒 Security Features

- **JWT authentication** with refresh tokens
- **bcrypt** password hashing (cost factor 12)
- **TOTP-based 2FA** via speakeasy (Google Authenticator compatible)
- **Rate limiting** on auth endpoints
- **Helmet.js** security headers
- **CORS** whitelisting
- **File type validation** server-side
- **Signed URLs** for private file access
- **PIN/password hashing** for vault protection

---

## 📱 Features

- ✅ Create public/private vaults
- ✅ Upload files & folders (no zipping needed)
- ✅ Share via link or QR code
- ✅ Download without account (public vaults)
- ✅ PIN/password protected downloads (private vaults)
- ✅ Profile with avatar, name, phone, bio
- ✅ Password change
- ✅ 2FA with TOTP (Google Authenticator)
- ✅ Responsive on all devices
- ✅ Dark mode UI with animations

---

## 📄 License
MIT — do whatever, just don't pretend you built it from scratch.
