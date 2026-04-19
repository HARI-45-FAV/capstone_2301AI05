# SACME Manual Run Guide

Follow these steps to set up and run the SACME project locally on your machine.

---

## 1. Backend Setup

The backend is built with Node.js, Express, and Prisma (SQLite).

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
1. Open a terminal and navigate to the backend directory:
   ```powershell
   cd sacme-backend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```

### Database Configuration (Prisma)
1. Generate the Prisma client:
   ```powershell
   npx prisma generate
   ```
2. Apply migrations to set up the SQLite database:
   ```powershell
   npx prisma migrate dev --name init
   ```
3. (Optional) Seed the database with initial data:
   ```powershell
   node seed.js
   ```

### Start the Backend
Run the following command to start the API server:
```powershell
node server.js
```
The server will be running at `http://localhost:5000`. You can verify it's working by visiting `http://localhost:5000/api/health`.

---

## 2. Frontend Setup

The frontend is built with Next.js.

### Installation
1. Open a NEW terminal/tab and navigate to the frontend directory:
   ```powershell
   cd sacme-frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```

### Start the Frontend
Run the following command to start the development server:
```powershell
npm run dev
```
The frontend will be running at `http://localhost:3000`.

---

## 3. Usage Summary
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:3000`
- **Database**: SQLite (Stored in `sacme-backend/prisma/dev.db`)
