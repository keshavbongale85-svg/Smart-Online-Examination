# 🎓 Smart Online Assessment

A full-stack **MERN** online examination system with auto-grading, analytics, and
live webcam proctoring. Students take timed exams; admins author exams, monitor
live attempts, and review results.

![Stack](https://img.shields.io/badge/stack-MERN-3FB984)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933)
![React](https://img.shields.io/badge/react-18-61DAFB)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

**Students**
- 🔐 Register / login (JWT auth)
- 📝 Take timed exams with auto-save and a live countdown
- 📊 Instant results with subject-wise breakdown (once published)
- 📈 Personal performance history & analytics

**Admins**
- 🛠️ Create & manage exams and questions (full CRUD)
- ➖ Negative marking, passing marks, per-attempt question limits
- 👁️ **Live proctoring** — webcam snapshots + tab-switch violation flagging over Socket.io
- 🏆 Leaderboards, score distribution charts, and result publishing control
- 👥 User management & broadcast notifications

---

## 🧱 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite 5, React Router 6, Tailwind CSS, axios, Recharts, react-webcam |
| Backend | Node.js, Express 4, Mongoose 8, Socket.io, JWT, bcryptjs, multer |
| Database | MongoDB Atlas (or in-process local MongoDB for offline dev) |
| Realtime | Socket.io (live proctoring) |

---

## 🚀 Quick Start (local)

**Prerequisites:** Node.js ≥ 18.

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env      # then edit values (or leave MONGO_URI blank for offline mode)
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Open **http://localhost:5173**.

### Database modes
- **Offline / zero-config:** leave `MONGO_URI` **blank** in `backend/.env`. An in-process
  MongoDB starts automatically and persists to `backend/.localdb` — no cloud, no setup.
- **Cloud:** set `MONGO_URI` to your MongoDB Atlas connection string.

The database **auto-seeds** demo data on first run when empty.

### 🔑 Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@smartexam.com` | `admin123` |
| Student | `asha@student.com` | `student123` |
| Student | `ravi@student.com` | `student123` |
| Student | `neha@student.com` | `student123` |

Re-seed anytime with `cd backend && npm run seed`.

---

## 📁 Project Structure

```
.
├── backend/            # Express API + Socket.io
│   ├── config/         # DB connection (Atlas or in-process)
│   ├── controllers/    # Route handlers
│   ├── middleware/     # auth, error, file-upload
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   └── utils/          # seed data, socket, email, tokens
└── frontend/           # React + Vite + Tailwind SPA
    └── src/
        ├── api/        # axios + socket clients (env-aware)
        ├── components/ # shared UI
        ├── context/    # AuthContext
        └── pages/      # student/ + admin/ views
```

---

## ☁️ Deployment

**Frontend → Vercel**, **Backend → Railway**, **Database → MongoDB Atlas**.

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the complete step-by-step guide.

> The backend can't run on Vercel (Socket.io needs a persistent WebSocket server and
> multer writes files to disk), so it's hosted on Railway while Vercel serves the SPA.

---

## 📜 License

MIT
</content>
