# 🚀 AMDOX Certificate Verification System — Setup Guide

## 📁 Project Structure
```
amdox-cert-verify/
├── frontend/          → HTML + CSS + JS (static files)
│   ├── index.html     → Landing / Verification page
│   ├── pages/         → Admin pages + Certificate page
│   └── assets/        → CSS, JS, Images
├── backend/           → Next.js API Routes (serverless)
│   ├── pages/api/     → All API endpoints
│   ├── lib/           → DB connection
│   ├── middleware/     → Auth middleware
│   └── schema.sql     → MySQL database schema
├── vercel.json        → Deployment config
└── SETUP.md           → This file
```

---

## 🖥️ LOCAL DEVELOPMENT SETUP (XAMPP)

### Step 1 — Prerequisites
Make sure you have installed:
- [Node.js](https://nodejs.org) v18 or higher
- [XAMPP](https://www.apachefriends.org) (for MySQL)
- [VS Code](https://code.visualstudio.com)
- [Git](https://git-scm.com)

### Step 2 — Start XAMPP
1. Open **XAMPP Control Panel**
2. Start **Apache** and **MySQL**
3. Open browser → go to `http://localhost/phpmyadmin`

### Step 3 — Create Database
1. In phpMyAdmin, click **New** (left sidebar)
2. Click the **SQL** tab at the top
3. Copy the entire contents of `backend/schema.sql`
4. Paste it in the SQL box and click **Go**
5. You should see the `amdox_certificates` database created ✅

### Step 4 — Backend Setup
Open a terminal in VS Code:

```bash
cd backend
npm install
```

Create your `.env` file:
```bash
# Windows:
copy .env.example .env

# Mac/Linux:
cp .env.example .env
```

Open `backend/.env` and configure:
```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=         ← leave empty if XAMPP default
DB_NAME=amdox_certificates
JWT_SECRET=amdox_change_this_random_string_2024
FRONTEND_URL=http://localhost:5500
```

Start the backend:
```bash
npm run dev
```
✅ Backend running at: `http://localhost:4000`

### Step 5 — Frontend Setup
The frontend is pure HTML/CSS/JS — no build needed!

**Option A: VS Code Live Server (Recommended)**
1. Install VS Code extension: **Live Server** (by Ritwick Dey)
2. Right-click `frontend/index.html` → **Open with Live Server**
3. Opens at `http://127.0.0.1:5500`

**Option B: XAMPP Apache**
1. Copy the `frontend/` folder to `C:/xampp/htdocs/amdox/`
2. Visit `http://localhost/amdox/`

### Step 6 — Create First Admin Account
Open your browser and go to:
```
http://localhost:4000/api/auth/register
```

Use **Postman** or **Thunder Client** (VS Code extension):
```json
POST http://localhost:4000/api/auth/register
Content-Type: application/json

{
  "name": "Admin",
  "email": "admin@amdox.in",
  "password": "Admin@123",
  "setupKey": "amdox_setup_2024"
}
```
✅ Admin account created!

### Step 7 — Login to Admin Panel
1. Open `http://localhost:5500/pages/admin-login.html`
2. Login with the email and password you just created
3. You're in! 🎉

---

## 📊 UPLOADING CERTIFICATES

### Excel File Format
Your Excel file columns must be:

| Column | Required | Example |
|--------|----------|---------|
| certificate_id | ✅ Yes | AMDOX-2024-0001 |
| student_name | ✅ Yes | Rahul Sharma |
| domain | ✅ Yes | Web Development |
| start_date | ✅ Yes | 2024-01-15 |
| end_date | ✅ Yes | 2024-04-15 |
| email | ❌ Optional | rahul@email.com |
| duration | ❌ Optional | 3 Months |
| grade | ❌ Optional | Excellent |

### Upload Steps
1. Go to **Admin → Upload Certificates**
2. Drag & drop your Excel file (or click to browse)
3. Click **Upload & Import**
4. Review the success/error summary

---

## 🌐 PRODUCTION DEPLOYMENT (VERCEL)

### Step 1 — Cloud Database Setup
Sign up free at **[Neon.tech](https://neon.tech)** (MySQL-compatible):
1. Create account → New Project → `amdox-certificates`
2. Copy the **connection string** (looks like: `mysql://user:pass@host/dbname`)
3. In Neon dashboard → **SQL Editor** → paste and run `backend/schema.sql`

### Step 2 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: AMDOX Certificate Verification System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/amdox-cert-verify.git
git push -u origin main
```

### Step 3 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **New Project** → Import your GitHub repo
3. **Root Directory**: Leave as `/` (root)
4. **Framework Preset**: Other
5. Add **Environment Variables** (click "Add"):

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon.tech connection string |
| `JWT_SECRET` | Any long random string |
| `SETUP_KEY` | amdox_setup_2024 |

6. Click **Deploy** 🚀

### Step 4 — After Deployment
Your app will be live at: `https://your-project.vercel.app`

Create your admin account in production:
```json
POST https://your-project.vercel.app/api/auth/register
{
  "name": "Admin",
  "email": "admin@amdox.in",
  "password": "YourSecurePassword",
  "setupKey": "amdox_setup_2024"
}
```

---

## 🔑 API ENDPOINTS REFERENCE

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | No | Admin login |
| POST | /api/auth/register | No (setup key) | Create admin |
| GET | /api/certificates/verify?id=CERT_ID | No | Verify certificate |
| GET | /api/admin/stats | ✅ Yes | Dashboard stats |
| GET | /api/admin/certificates | ✅ Yes | List certificates |
| PATCH | /api/admin/certificates | ✅ Yes | Toggle active status |
| DELETE | /api/admin/certificates | ✅ Yes | Delete certificate |
| POST | /api/admin/upload | ✅ Yes | Upload Excel file |

---

## 🔧 TROUBLESHOOTING

**"Cannot connect to database"**
- Make sure XAMPP MySQL is running
- Check `.env` DB credentials (password is empty by default in XAMPP)

**"CORS error" in browser**
- Make sure `FRONTEND_URL` in `.env` matches your frontend URL exactly
- For Live Server: `http://127.0.0.1:5500`

**"401 Unauthorized" on API calls**
- Your login token expired — log out and log in again

**Excel upload not working**
- Ensure first row has column headers exactly as shown in the template
- Date format should be: `YYYY-MM-DD` or `DD/MM/YYYY`

**PDF download blank**
- Try using Chrome/Edge — html2canvas works best there
- Disable any ad blockers

---

## 📞 TECH STACK SUMMARY

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend | Next.js API Routes (Serverless) |
| Database | MySQL (XAMPP local / Neon.tech production) |
| Auth | JWT (JSON Web Tokens) |
| PDF | jsPDF + html2canvas |
| Excel | xlsx (SheetJS) |
| Hosting | Vercel (frontend + backend together) |
| DB Hosting | Neon.tech (free tier) |

---

## ✅ FEATURES CHECKLIST

- [x] Admin login with JWT auth
- [x] Bulk upload via Excel (.xlsx/.xls/.csv)
- [x] Validation and error reporting on upload
- [x] Public certificate verification by ID
- [x] Auto-populated certificate with student data
- [x] PDF download of certificate
- [x] Print certificate
- [x] Admin dashboard with stats
- [x] Search & filter certificates
- [x] Toggle certificate active/inactive
- [x] Delete certificate
- [x] Export all certificates as CSV
- [x] Responsive design (mobile-friendly)
- [x] Beautiful animations and loading effects
- [x] Vercel + Neon.tech production deployment

---

*Built with ♥ for AMDOX Technologies — Internship Certificate Verification System v1.0*
