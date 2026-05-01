# 💰 Oshi Wallet — PWA

A mobile-friendly Progressive Web App to track monthly expenses with cloud sync via Firebase.

---

## 📁 Project Structure

```
expense-manager/
├── index.html              ← Main HTML shell
├── style.css               ← All styles
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service worker (offline support)
├── firestore.rules         ← Firestore security rules (paste into Firebase Console)
│
├── js/
│   ├── firebase-config.js  ← 🔑 YOUR FIREBASE KEYS GO HERE
│   ├── state.js            ← App state, categories, helper functions
│   ├── auth.js             ← Google sign-in / sign-out
│   ├── db.js               ← All Firestore read/write operations
│   ├── render.js           ← All UI drawing functions
│   ├── events.js           ← All button clicks and listeners
│   └── app.js              ← Entry point, starts everything
│
└── icons/
    ├── icon-192.svg
    └── icon-512.svg
```

---

## 🔥 Firebase Setup (Required for cloud sync)

### Step 1 — Create a Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → enter a name (e.g. `oshi-expenses`) → Create

### Step 2 — Enable Google Authentication
1. In your project, go to **Build → Authentication → Get started**
2. Click **"Google"** under Sign-in providers
3. Toggle **Enable** → Save
4. Set your **Project support email** (your Gmail)

### Step 3 — Create Firestore Database
1. Go to **Build → Firestore Database → Create database**
2. Choose **"Start in production mode"** → Next
3. Select a region close to you (e.g. `asia-south1` for Sri Lanka) → Enable

### Step 4 — Apply Security Rules
1. In Firestore, click the **"Rules"** tab
2. Replace all existing text with the contents of `firestore.rules`
3. Click **"Publish"**

### Step 5 — Get Your Web App Config
1. Go to **Project Settings** (gear icon) → **Your apps**
2. Click **"Add app"** → choose **Web** (</> icon)
3. Enter a nickname (e.g. `oshi-web`) → Register app
4. Copy the `firebaseConfig` object values

### Step 6 — Add Config to the App
Open `js/firebase-config.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",          // ← your value
  authDomain:        "oshi-expenses.firebaseapp.com",
  projectId:         "oshi-expenses",
  storageBucket:     "oshi-expenses.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

### Step 7 — Add Your Domain to Authorized Domains
1. Go to **Authentication → Settings → Authorized domains**
2. Click **"Add domain"**
3. Add your Netlify URL (e.g. `your-app.netlify.app`)

---

## 🚀 Deploy to Netlify (Free)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Open File Explorer, go **inside** the `expense-manager` folder
3. Select **all files and folders** (Ctrl+A)
4. Drag the selection onto the Netlify drop zone
5. Done — you get a free URL like `https://your-app.netlify.app`

---

## 📱 Install on Mobile (Add to Home Screen)

### Android (Chrome)
1. Open the app URL in Chrome
2. Tap **⋮ menu → "Add to Home screen"**

### iPhone (Safari)
1. Open the app URL in **Safari** (must be Safari)
2. Tap **Share button (□↑) → "Add to Home Screen"**

---

## ✨ Features
- Google Sign-In — your data is private to your account
- Monthly capital/budget setting per month
- Add expenses with 10 built-in categories + custom categories
- Dashboard: balance cards, progress bar, category breakdown
- History tab: search and filter by category
- Works offline — data syncs when back online
- Installs as a native-like app on iPhone and Android
