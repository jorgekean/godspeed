# Development Environment Setup - Godspeed Grader

This project consists of a React frontend and a Fastify backend.

## Prerequisites
- Node.js (v18+)
- Docker (for the database)

## Backend Setup (`godspeedgrader-api`)
1. **Environment Variables**: The `.env` file has been configured to use the local PostgreSQL database.
2. **Database**: Run `docker-compose up -d` to start the PostgreSQL container.
3. **Dependencies**: `npm install` has been run.
4. **Migrations & Seed**: The database schema has been initialized and seeded with demo users.
   - Admin: `admin@godspeedgrader.local` / `password123`
   - User: `user@godspeedgrader.local` / `password123`

### Start Backend
```bash
cd godspeedgrader-api
npm run dev
```
The API will be available at `http://localhost:5183`.

## Frontend Setup (`godspeed-grader`)
1. **Environment Variables**: The `.env` file has been configured to point to the local backend.
2. **Dependencies**: `npm install --legacy-peer-deps` has been run.

### Start Frontend
```bash
npm run dev
```
The frontend will be available at `https://localhost:5173` (Self-signed SSL enabled).

## Sync Testing
You can now log in with the seeded users and test the synchronization functionality locally.
