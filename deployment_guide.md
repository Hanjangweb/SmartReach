# 🚀 Production Deployment Guide

Follow these steps to deploy **SmartReach** to GitHub, Vercel (Frontend), and Render (Backend).

## 1. Push to GitHub
1. Create a new repository on GitHub.
2. Run these commands in the project root:
   ```bash
   git add .
   git commit -m "Initial production-ready commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

## 2. Deploy Backend (Render)
1. Go to [Render](https://render.com/) and create a new **Web Service**.
2. Connect your GitHub repository.
3. **Settings:**
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. **Environment Variables:**
   - `PORT`: `5000`
   - `MONGO_URI`: (Your MongoDB Atlas URI)
   - `JWT_SECRET`: (Your secret)
   - `FRONTEND_URL`: (Your Vercel URL - come back here after Step 3)
   - `RAZORPAY_KEY_ID`: ...
   - `RAZORPAY_KEY_SECRET`: ...
   - `PAYPAL_CLIENT_ID`: ...
   - `PAYPAL_CLIENT_SECRET`: ...
   - `OPENROUTER_API_KEY`: ...

## 3. Deploy Frontend (Vercel)
1. Go to [Vercel](https://vercel.com/) and create a new **Project**.
2. Connect your GitHub repository.
3. **Settings:**
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
4. **Environment Variables:**
   - `VITE_API_URL`: (Your Render URL + `/api`)
   - `VITE_RAZORPAY_KEY_ID`: ...
   - `VITE_PAYPAL_CLIENT_ID`: ...

---

## 🛠 Production Fixes Applied:
- **Dynamic CORS:** Backend now allows your Vercel URL and local testing.
- **Security Headers:** Added `helmet` and `compression` for better security and speed.
- **SPA Routing:** Added `vercel.json` so page refreshes don't cause 404s.
- **Root Git:** Initialized git and created a `.gitignore` to prevent leaking `.env` files.
