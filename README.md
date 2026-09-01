# TCET R&D Cell — Smart Inventory Management System

A production-ready MERN application for managing laboratory hardware, project checkout requests, faculty mentor reviews, and admin asset tracking.

---

## 1. Directory Structure

```
smart-inventory-system/
├── frontend/             # React client (Vite + Tailwind CSS v3)
├── backend/              # Express API Server
└── database/             # Compass and Atlas configuration notes
```

---

## 2. Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18+ recommended, verified on v24.14.1)
- **npm** (verified on v11.11.0)
- **MongoDB** (running locally on standard port 27017 or a MongoDB Atlas cloud URI)
- **MongoDB Compass** (for database inspection)

---

## 3. Installation & Database Seeding

### Step 1: Install Backend Dependencies & Seed Database
1. Navigate to the backend directory:
   ```bash
   cd smart-inventory-system/backend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Configure the environment variables in a `.env` file (a default one has been created for you):
   ```
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/smart_inventory
   JWT_SECRET=super_secure_tcet_rnd_secret_key_123
   EMAIL_SERVICE=gmail
   EMAIL_USER=rndcelltcet@gmail.com
   EMAIL_PASS=mockpassword123
   ```
4. Run the main database seeding script (creates administrator `Ashish Mudholkar` (`Admin`/`12345678`) and faculty mentors):
   ```bash
   npm run seed
   ```
5. Run the mock data generation script (processes the attendance list spreadsheet, generates student credentials, writes them to `credentials.csv`, seeds hardware inventory components, and creates test checkouts):
   ```bash
   npm run generate-data
   ```

### Step 2: Install Frontend Dependencies
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```

---

## 4. Running the Application

### Start the Backend Server
From the `smart-inventory-system/backend` directory:
```bash
npm run dev
```
*(Runs backend server on port 5000 with auto-restart on code changes)*

### Start the Frontend Client
From the `smart-inventory-system/frontend` directory:
```bash
npm run dev
```
*(Runs the Vite dev server on port 5173 with hot reload)*

Open [http://localhost:5173](http://localhost:5173) in your browser to access the landing portal.

---

## 5. Verification Accounts

The database seeding and mock generation scripts set up the following verification credentials:

### A. Administrators
- **Name:** `Ashish Mudholkar`
- **Email:** `ashish.mudholkar75@gmail.com`
- **User ID / Username:** `Admin` (or `admin`)
- **Password:** `12345678`
*(Available on the Admin portal)*

### B. Faculty Mentors
- **Email:** `vini.dongre@tcetmumbai.in` (Dean R&D)
- **Password:** `Faculty@VINI#2026`
- **Email:** `lochan.jolly@tcetmumbai.in` (Dean SSW)
- **Password:** `Faculty@LOCH#2026`
*(Available on the Faculty portal)*

### C. Students
Students login credentials are listed in **`smart-inventory-system/backend/credentials.csv`**. Here are a few examples:
- **ERP ID:** `1032250997` (User: `tcet.std.1032250997` / Name: Anik Tiwari)
- **ERP ID:** `1032251505` (User: `tcet.std.1032251505` / Name: Aryan Lal)
- **Password:** Check `backend/credentials.csv` for details.
*(Available on the Student portal)*
