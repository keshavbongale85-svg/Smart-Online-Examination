# Deployment Guide — Smart Online Assessment

Architecture: **Frontend → Vercel**, **Backend → Railway**, **Database → MongoDB Atlas**.

> Why split? The backend uses **Socket.io** (live proctoring) and writes **file uploads**
> to disk. Vercel's serverless functions can't hold WebSocket connections or persist
> files, so the Express server runs on Railway (a persistent Node host) instead.

---

## 0. Push the code to GitHub (one time)

A local git repo with a first commit already exists. Create an **empty** GitHub repo
(no README/license), then:

```bash
cd "c:/Users/prajw/Desktop/SMART  ONLINE ASSESSMENT"
git remote add origin https://github.com/<your-username>/smart-online-assessment.git
git branch -M main
git push -u origin main
```

`.env` files are git-ignored, so your Atlas/SMTP secrets are **never** pushed.

---

## 1. MongoDB Atlas (already set up)

- Cluster: `cluster0.hxcdltd.mongodb.net`, database `smart_exam`.
- **Network Access** → add `0.0.0.0/0` (Allow from Anywhere) so Railway can connect.
- Have your connection string ready (the `MONGO_URI` value).

---

## 2. Backend → Railway

1. Go to https://railway.app → **New Project** → **Deploy from GitHub repo** → pick this repo.
2. **Set the root directory to `backend`** (Settings → Root Directory = `backend`).
   Railway auto-detects Node and runs `npm start` (see `backend/railway.json`).
3. Add **Variables** (Settings → Variables):

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | your Atlas connection string (with `/smart_exam`) |
   | `JWT_SECRET` | a long random string |
   | `JWT_EXPIRE` | `7d` |
   | `CLIENT_URL` | your Vercel URL (fill in after step 3) |
   | `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `FROM_EMAIL` | optional (email); leave blank to disable |

   > Do **not** set `PORT` — Railway provides it automatically and the server reads `process.env.PORT`.
4. Deploy. Once live, copy the public URL, e.g. `https://smart-exam-backend-production.up.railway.app`.
5. Verify: open `https://<that-url>/api/health` → should return `{"status":"ok",...}`.

---

## 3. Frontend → Vercel

1. Go to https://vercel.com → **Add New Project** → import this GitHub repo.
2. **Set the Root Directory to `frontend`.** Framework preset: **Vite** (auto-detected via `frontend/vercel.json`).
3. Add **Environment Variables** (point at the Railway backend from step 2):

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://<railway-url>/api` |
   | `VITE_SOCKET_URL` | `https://<railway-url>` |

4. Deploy. Copy the resulting Vercel URL, e.g. `https://smart-online-assessment.vercel.app`.

---

## 4. Connect the two (CORS)

1. Back in **Railway**, set `CLIENT_URL` to your Vercel URL (from step 3) and redeploy.
2. Open the Vercel URL and log in:
   - Admin: `admin@smartexam.com` / `admin123`
   - Student: `asha@student.com` / `student123`

   (These are auto-seeded on first connect to an empty Atlas database.)

---

## Notes & limits on free tiers

- **File uploads** (proctoring snapshots) are written to the Railway container's disk and are
  **lost on every redeploy**. For permanent storage, switch multer to a cloud bucket
  (S3/Cloudinary) later — not required for a demo.
- Railway free usage is metered by a monthly credit; the service may pause when exhausted.
- Changing frontend `VITE_*` vars requires a **redeploy** on Vercel (they're baked in at build time).
</content>
