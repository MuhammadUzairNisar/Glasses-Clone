# Connect Another Firebase Project

## 1. Link project via Firebase CLI (terminal)

Run these in the project folder:

```powershell
# Install Firebase CLI globally (if not already)
npm install -g firebase-tools

# Log in to Firebase (opens browser)
firebase login

# List your Firebase projects
firebase projects:list

# Link this folder to a project (choose the one you want)
firebase use --add
```

When you run `firebase use --add`, you’ll pick a project from the list and optionally give it an alias (e.g. `default`). That creates/updates `.firebaserc` and is used for **deploy** (Hosting, Functions, Firestore rules).

---

## 2. Point the React app at the new project (.env)

The app reads config from `.env`. To use the **other** Firebase project in the browser you must put that project’s web config in `.env`:

1. Open [Firebase Console](https://console.firebase.google.com/) and select the project you want.
2. Go to **Project settings** (gear) → **General** → scroll to **Your apps**.
3. If there’s no web app, click **Add app** → **Web** (</>). Copy the `firebaseConfig` object.
4. In this repo, edit `.env` and set:

```env
REACT_APP_FIREBASE_API_KEY=<that project's apiKey>
REACT_APP_FIREBASE_AUTH_DOMAIN=<that project>.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=<that project id>
REACT_APP_FIREBASE_STORAGE_BUCKET=<that project>.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<sender id>
REACT_APP_FIREBASE_APP_ID=<app id>
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

5. Restart the dev server: stop it (Ctrl+C) and run `npm start` again.

---

**Summary**

- **Terminal (Firebase CLI):** `firebase login` → `firebase use --add` → choose project. Use for deploys.
- **App config:** Update `.env` with the new project’s web config and restart `npm start`.
