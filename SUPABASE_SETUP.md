# Supabase Setup Guide for StudentHub

This guide walks you through connecting your **StudentHub** academic & project management platform with your own **Supabase** cloud PostgreSQL database in under 3 minutes.

---

## 🚀 Quick Setup Steps

### Step 1: Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **"New Project"**.
3. Enter:
   - **Project Name**: `StudentHub`
   - **Database Password**: *(Choose a strong password and save it)*
   - **Region**: Choose the region closest to you (e.g. `ap-south-1` Mumbai or `ap-southeast-1` Singapore).
4. Click **"Create new project"** (takes ~1 minute to spin up).

---

### Step 2: Run the Database Schema Migration
1. In your Supabase Dashboard, open the **SQL Editor** from the left navigation (or press `Ctrl` + `K` and type "SQL Editor").
2. Click **"New Query"**.
3. Open the file [`supabase/schema.sql`](file:///c:/project1/AI-Powered-Academic-Platform/supabase/schema.sql) in this repository or click the **"Copy SQL Schema"** button in StudentHub Settings.
4. Paste the entire SQL script into the Supabase SQL editor and click **Run** (`Ctrl` + `Enter`).
5. You should see `Success. No rows returned.` in the results pane.

---

### Step 3: Get Your API Credentials
1. In your Supabase Dashboard, go to **Project Settings** (gear icon at bottom left).
2. Click **API** under Configuration.
3. Copy your:
   - **Project URL** (e.g. `https://xyzabcdefghijklm.supabase.co`)
   - **Project API Keys**: Copy the `anon` / `public` key (or `service_role` secret key).

---

### Step 4: Connect to StudentHub

You can connect in either of two ways:

#### Option A: Direct from the StudentHub UI (Recommended)
1. Open StudentHub in your browser (`http://localhost:8000`).
2. Go to **Settings** from the sidebar.
3. Scroll to the **"Supabase Cloud Database"** card.
4. Paste your **Supabase URL** and **API Key**.
5. Click **"Test & Connect"**.
6. Once connected, click **"Sync Local Data to Supabase"** to push your existing subjects, notes, and tasks up to the cloud!

#### Option B: Via `.env` File
1. Open the [`.env`](file:///c:/project1/AI-Powered-Academic-Platform/.env) file in your workspace.
2. Update the keys:
   ```env
   PORT=8000
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-supabase-anon-or-service-role-key
   ```
3. Restart the server (`python server.py`).

---

## 🛡️ Dual-Mode Resilience (Offline Fallback)
StudentHub features automatic dual-mode database routing:
- **Cloud Mode**: When valid Supabase credentials are provided, all note generation, assignments, tasks, and project activities sync in real-time with your Supabase PostgreSQL database.
- **Local Fallback Mode**: If network is disconnected or Supabase credentials are blank, StudentHub automatically falls back to `data/database.json` with zero downtime.
