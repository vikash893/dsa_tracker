# 🏆 DSATracker — Competitive Programming Tracker Platform

A production-quality platform for tracking competitive programming progress, built with a Chrome Extension, MERN stack web application, and role-based dashboards.

## Architecture

```
DSATracker/
├── apps/
│   ├── api/          # Express.js + TypeScript backend
│   ├── web/          # React + Vite + TypeScript frontend (Phase 14)
│   ├── extension/    # Chrome Extension - Manifest V3 (Phase 6)
│   └── worker/       # BullMQ background workers (Phase 11)
├── packages/
│   ├── types/        # Shared TypeScript types & enums
│   ├── config/       # Shared configuration
│   └── utils/        # Shared utilities
├── docs/             # Documentation
└── docker/           # Docker configs
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js, Express 5, TypeScript, MongoDB, Mongoose, JWT, bcrypt, Zod |
| **Frontend** | React, Vite, TypeScript, TailwindCSS, TanStack Query, Recharts |
| **Extension** | Chrome Manifest V3, TypeScript, React, Service Worker |
| **Workers** | BullMQ, Redis |
| **Tooling** | npm workspaces, Turborepo, ESLint, Prettier |

## Features

- 🔐 **Authentication** — JWT access/refresh tokens, HTTP-only cookies, bcrypt
- 👥 **RBAC** — Super Admin, Admin, User roles
- 📝 **Question Management** — Manual, Excel/CSV, PDF, URL import
- 📊 **Analytics** — User, group, platform-wide dashboards
- 🏆 **Leaderboard** — Overall, weekly, monthly, group, platform, speed, accuracy
- 🎮 **Gamification** — Badges, XP, levels, streaks
- ⏱️ **Smart Timer** — Active time tracking with pause/resume
- 🔌 **Chrome Extension** — Popup dashboard, content scripts, submission detection
- 📧 **Invitations** — Token-based invite flow with email
- 🔍 **Search** — Global search across questions, users, topics

## Quick Start

### Prerequisites

- **Node.js** ≥ 20.0.0
- **MongoDB** running locally or MongoDB Atlas URI
- **npm** ≥ 10.0.0

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd DSATracker

# Install all dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Build shared packages
npm run build --workspace=packages/types

# Seed the database (creates Super Admin)
npm run seed

# Start the API server (development)
npm run dev:api
```

### Default Super Admin Credentials

| Field | Value |
|-------|-------|
| Email | `admin@dsatracker.com` |
| Password | `SuperAdmin@123` |

> ⚠️ **Change these in production!**

## API Endpoints (Phase 1)

### Health
```
GET  /api/health
```

### Authentication
```
POST /api/auth/register       # Create account
POST /api/auth/login           # Login
POST /api/auth/logout          # Logout (auth required)
POST /api/auth/refresh         # Refresh access token
POST /api/auth/forgot-password # Request password reset
POST /api/auth/reset-password  # Reset password
GET  /api/auth/verify-email    # Verify email (?token=xxx)
GET  /api/auth/me              # Get current user (auth required)
```

### Users
```
GET    /api/users              # List users (admin+)
GET    /api/users/:id          # Get user (admin+)
PATCH  /api/users/:id          # Update user (admin+)
PATCH  /api/users/:id/role     # Change role (super admin)
DELETE /api/users/:id          # Deactivate user (super admin)
PATCH  /api/users/me/profile   # Update own profile (auth)
```

## Development

```bash
# Run all apps in parallel
npm run dev

# Run only API
npm run dev:api

# Build everything
npm run build

# Run seed
npm run seed
```

## Security

- ✅ Helmet security headers
- ✅ CORS whitelist
- ✅ Rate limiting (general + auth-specific)
- ✅ MongoDB query sanitization
- ✅ Zod input validation
- ✅ bcrypt password hashing (12 rounds)
- ✅ JWT with refresh token rotation
- ✅ HTTP-only cookies for refresh tokens
- ✅ Sensitive fields excluded from API responses
- ✅ Audit logging for admin actions

## License

Private — All rights reserved.
