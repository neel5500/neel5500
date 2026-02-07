# PVD Stock Inward & Outward Management System

Production-ready starter for a secure stock inward/outward platform for a PVD coating manufacturing business.

## Monorepo Structure

- `backend/` Express REST API with JWT + RBAC, audit logs, stock inward/outward workflows, dashboard analytics endpoints.
- `frontend/` React + Vite + Tailwind UI for admin and manager workflows.
- `database/` PostgreSQL schema and seed starter data.
- `docs/` API docs, AWS deployment guide, and face authentication setup.

## Quick Start

### 1) Database

```bash
createdb pvd_stock
psql -d pvd_stock -f database/schema.sql
```

### 2) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 3) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Default Admin Setup

Use the seed script to create the first admin:

```bash
cd backend
npm run seed:admin -- --email admin@pvd.local --name "Super Admin" --password "ChangeMe@123"
```

Then enroll face using `POST /api/v1/auth/face/enroll`.

## Go Live on AWS

If you already have AWS and want to make the app live, follow:

- `docs/LIVE_ON_AWS.md` for exact deployment steps (ECR + ECS + RDS + S3 + CloudFront).
- `docs/AWS_DEPLOYMENT.md` for architecture and hardening checklist.
