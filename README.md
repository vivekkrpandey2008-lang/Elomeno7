# Class 12 Test Portal — Render Deployment Guide

Yeh app 3 files se bana hai:
- `server.js` — backend (Node + Express + PostgreSQL)
- `public/index.html` — frontend (jo browser mein dikhta hai)
- `package.json` — dependencies list

## Step 1: GitHub par code daalein (command line ki zaroorat nahi)

1. https://github.com par free account banayein (agar nahi hai)
2. **New repository** banayein (naam jo chahe rakhein, jaise `test-portal`) → Public/Private koi bhi chalega → **Create repository**
3. Repo page par **"uploading an existing file"** link pe click karein
4. Is poore folder ke andar ki saari files (`server.js`, `package.json`, `README.md`, aur `public` folder ke saath `index.html`) drag-and-drop karein
5. Neeche **Commit changes** pe click karein

## Step 2: Render par PostgreSQL database banayein

1. https://render.com par free account banayein → login karein
2. Dashboard mein **New +** → **PostgreSQL**
3. Naam dein (jaise `test-portal-db`) → Free plan select karein → **Create Database**
4. Database ready hone ke baad, **"Internal Database URL"** copy kar lein (baad mein chahiye hoga)

## Step 3: Render par Web Service banayein

1. Dashboard mein **New +** → **Web Service**
2. Apna GitHub repo connect karein (jo Step 1 mein banaya tha)
3. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - Plan: **Free**
4. Neeche **Environment Variables** section mein yeh add karein:
   - `DATABASE_URL` → wahi Internal Database URL jo Step 2 mein copy kiya tha
   - `ADMIN_PASSCODE` → jo bhi passcode aap admin panel ke liye rakhna chahte hain (jaise `mySchool2026`)
5. **Create Web Service** pe click karein

Render ab automatically build karke deploy kar dega. 2-3 minute mein aapko ek URL milega jaisa:
`https://test-portal-xxxx.onrender.com`

Yahi link students aur admin dono use karenge.

## Important notes

- **Free tier**: Render ka free web service kuch der inactive rehne par "sleep" ho jaata hai — pehli request pe 30-50 second lag sakte hain wake up hone mein. School time mein test dene se pehle ek baar link khol kar "wake up" kar dein.
- **Free PostgreSQL**: Render ka free database 90 din baad expire ho jaata hai (naya banana padega). Agar zyada permanent chahiye, paid plan lena padega (~$7/month).
- **Admin passcode** change karna ho toh Render dashboard → apni Web Service → Environment → `ADMIN_PASSCODE` value edit karein.
