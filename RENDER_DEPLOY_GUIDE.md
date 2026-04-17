# 🚀 Deployment Guide — Render.com

This guide explains how to deploy the **BoonSonClon Furniture Store** to Render as a unified Web Service.

## 1. Prepare your Repository
Ensure you have committed and pushed the latest changes to your GitHub repository (the one I just updated with the unified `server.js`).

## 2. Create a New Web Service on Render
1.  Log in to [dashboard.render.com](https://dashboard.render.com).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.

## 3. Configure the Service
Use the following settings during creation:

*   **Name**: `boonsonclon-furniture` (or your choice)
*   **Environment**: `Node`
*   **Build Command**: `npm install`
*   **Start Command**: `npm run render:start`

## 4. Set Environment Variables
Go to the **Environment** tab in your Render service and add these variables:

| Variable | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `3000` (Render will override this, but good to have) |
| `JWT_SECRET` | *[A long random string]* |
| `SESSION_SECRET` | *[A long random string]* |
| `DATABASE_PATH` | `./sec2_gr14_ws_src/data/sec2_gr14_database.sqlite` |

## 5. Deployment
*   Render will automatically trigger a build and deploy.
*   Once finished, your site will be live at the URL provided by Render (e.g., `https://boonsonclon.onrender.com`).

---
> [!NOTE]
> **About SQLite Persistence**: 
> In this configuration (Option A), the database file will be reset whenever the service restarts or redeploys. For a persistent database on Render, you would need to add a "Disk" in the Render dashboard and update the `DATABASE_PATH` to point to the disk's mount point.
