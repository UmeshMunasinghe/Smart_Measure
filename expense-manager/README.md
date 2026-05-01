# 💰 Oshi Wallet — PWA

> A mobile-friendly Progressive Web App to track monthly expenses with Google Sign-In and Firebase cloud sync.
> © 2026 UR Productions. Oshi rights reserved.

---

## 🌐 Live Deployment

| Item | Value |
|---|---|
| **Hosted URL** | Your Netlify URL (e.g. `https://oshi-wallet.netlify.app`) |
| **Hosting Platform** | [Netlify](https://netlify.com) — Free tier |
| **Firebase Project** | `oshi-expenses` |
| **Firebase Auth** | Google Sign-In |
| **Database** | Firestore (region: `asia-south1`) |
| **Repo (private)** | `github.com/UmeshMunasinghe/oshi-finance` |

---

## 📁 Project Structure

```
├── index.html              ← Main HTML shell
├── style.css               ← All styles
├── manifest.json           ← PWA manifest (name, icons, theme)
├── sw.js                   ← Service worker — offline support + auto-update
├── firestore.rules         ← Firestore security rules
│
├── js/
│   ├── firebase-config.js  ← 🔑 Firebase project keys
│   ├── state.js            ← App state, categories, helper functions
│   ├── auth.js             ← Google sign-in / sign-out
│   ├── db.js               ← All Firestore read/write operations
│   ├── render.js           ← All UI drawing functions
│   ├── events.js           ← All button clicks and listeners
│   ├── charts.js           ← Chart.js bar & doughnut charts
│   └── app.js              ← Entry point, bootstraps the app
│
└── icons/
    ├── icon-192.svg
    └── icon-512.svg
```

---

## 🔥 Firebase Configuration

Firebase config is stored in `js/firebase-config.js`.

```js
const firebaseConfig = {
  apiKey:            "...",
  authDomain:        "oshi-expenses.firebaseapp.com",
  projectId:         "oshi-expenses",
  storageBucket:     "oshi-expenses.firebasestorage.app",
  messagingSenderId: "...",
  appId:             "...",
  measurementId:     "..."
};
```

### Firestore Data Structure
```
users/{uid}/
  settings/prefs        ← currency symbol, custom categories
  months/{YYYY-MM}      ← monthly capital amount
  expenses/{id}         ← individual expense documents
```

### Security Rules
Rules are in `firestore.rules`. Each user can only read/write their own data.
To apply: Firebase Console → Firestore → Rules tab → paste → Publish.

---

## 🚀 How to Deploy (Netlify)

### Option A — Drag & Drop (easiest)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Open File Explorer and go **inside** this folder
3. Select **all files** (Ctrl+A) and drag onto the Netlify drop zone
4. Get a free live URL instantly

### Option B — Connect GitHub repo
1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**
2. Connect your GitHub account → select `oshi-finance` repo
3. Build settings: leave blank (no build command needed)
4. Click **Deploy** — auto-deploys on every push to `master`

> ⚠️ After deploying, add your Netlify domain to Firebase:
> Authentication → Settings → Authorized domains → Add domain

---

## 🔄 Updating the App

1. Make changes to files locally
2. `git add -A`
3. `git commit -m "your message"`
4. `git push`
5. If using Netlify GitHub integration → auto-deploys instantly
6. If using drag & drop → re-drag the updated files to Netlify

The service worker auto-updates users within 60 seconds of a new deploy — no manual cache clearing needed.

---

## 📱 Install on Mobile (Add to Home Screen)

### Android (Chrome)
1. Open the app URL in Chrome
2. Tap **⋮ menu → "Add to Home screen"** → Add

### iPhone (Safari)
1. Open the app URL in **Safari** (must be Safari, not Chrome)
2. Tap **Share button (□↑) → "Add to Home Screen"** → Add

---

## ✨ Features

| Feature | Details |
|---|---|
| Authentication | Google Sign-In via Firebase Auth |
| Cloud sync | Firestore — data available on all devices |
| Offline support | Service worker caches app, works without internet |
| Monthly budget | Set capital per month, track remaining balance |
| Categories | 10 built-in + unlimited custom categories |
| Dashboard | Balance cards, progress bar, category breakdown |
| History | Search, filter by category, delete expenses |
| Charts | Daily spending bar chart + category doughnut chart |
| Auto-update | New versions deploy silently, no cache clearing needed |
| PWA | Installs on iPhone and Android like a native app |
| Fun mode | App name changes to "Wesi Wallet 😅" when over budget |

---

## 🛠 Tech Stack

- **Frontend** — Vanilla HTML, CSS, JavaScript (ES Modules)
- **Auth** — Firebase Authentication (Google)
- **Database** — Firebase Firestore
- **Charts** — Chart.js v4
- **Hosting** — Netlify (free)
- **PWA** — Web App Manifest + Service Worker
- **No build step** — runs directly in the browser
