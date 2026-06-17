# Smart Online Examination System — Backend

Node.js + Express + MongoDB (Mongoose) REST API with real-time proctoring over Socket.io.

## Setup

```bash
cd backend
npm install
cp .env.example .env      # then fill in MONGO_URI, JWT_SECRET, SMTP_*
npm run seed              # optional: load sample admin, students, exam
npm run dev               # nodemon, or `npm start`
```

Server runs on `http://localhost:5000` (configurable via `PORT`).

### Seeded credentials (after `npm run seed`)
- **Admin:** `admin@smartexam.com` / `admin123`
- **Student:** `asha@student.com` / `student123`

## Architecture

```
config/        db connection
models/        User, Exam, Question, Result, Notification
middleware/    auth (protect/admin), error handler, multer upload
controllers/   business logic per resource
routes/        Express routers mounted under /api/*
utils/         JWT, Socket.io, email, async wrapper, seed
```

Auth uses JWT delivered both as an httpOnly cookie and in the
`Authorization: Bearer <token>` header.

## API Overview

All routes are under `/api`. 🔒 = auth required, 👑 = admin only.

### Auth — `/api/auth`
| Method | Path | Notes |
|---|---|---|
| POST | `/register` | First admin can self-register; others become students |
| POST | `/login` | |
| POST | `/logout` | |
| GET  | `/me` 🔒 | Current user |
| PUT  | `/profile` 🔒 | Update profile / password |
| POST | `/forgot-password` | Emails a reset link |
| PUT  | `/reset-password/:token` | |

### Exams — `/api/exams` 🔒
| Method | Path | Notes |
|---|---|---|
| GET | `/` | Students see published, in-window exams (with `attempted` flag) |
| POST | `/` 👑 | Create |
| GET | `/:id` | |
| PUT | `/:id` 👑 | Update |
| DELETE | `/:id` 👑 | Cascades to questions & results |
| PATCH | `/:id/publish` 👑 | Toggle visibility |
| PATCH | `/:id/publish-results` 👑 | Toggle score visibility |
| GET | `/:id/start` | Student: questions **without** answers, randomized subset |

### Questions — `/api/questions` 👑
| Method | Path | Notes |
|---|---|---|
| GET | `/exam/:examId` | List (includes correct answers) |
| POST | `/exam/:examId` | Add one |
| POST | `/exam/:examId/bulk` | Add many |
| PUT | `/:id` | Update |
| DELETE | `/:id` | |

### Results — `/api/results` 🔒
| Method | Path | Notes |
|---|---|---|
| POST | `/exam/:examId/submit` | Auto-graded; negative marking; subject breakdown |
| GET | `/me` | Own results (scores masked until published) |
| GET | `/:id` | Owner or admin |
| GET | `/exam/:examId/leaderboard` | Ranked top 50 |
| GET | `/exam/:examId` 👑 | All results for an exam |
| GET | `/exam/:examId/analytics` 👑 | Averages, pass rate, distribution |

### Users — `/api/users` 👑
List/search, view, toggle active status, change role, delete, `/stats/overview`.

### Monitoring — `/api/monitoring` 🔒
| Method | Path | Notes |
|---|---|---|
| POST | `/exam/:examId/snapshot` | Student uploads webcam image (multipart `snapshot`) |
| POST | `/exam/:examId/violation` | Report tab-switch etc. |
| GET | `/exam/:examId/live` 👑 | Live submission/flag status |
| GET | `/flagged` 👑 | All flagged attempts |

### Notifications — `/api/notifications` 🔒
List, mark read / read-all, delete; admin `broadcast` and per-user `notify`.

## Real-time (Socket.io)

Connect with `{ auth: { token } }`. Events:
- `monitor:join` / `monitor:leave` `(examId)` — admin joins an exam room
- `student:snapshot` / `student:violation` — student → server
- `monitor:snapshot` / `monitor:violation` / `monitor:submitted` — server → admins
