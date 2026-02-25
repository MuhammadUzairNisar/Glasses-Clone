# Firebase Seeding Script

This script seeds your Firebase Firestore database with initial data and creates authentication users.

## Prerequisites

1. **Firebase Admin SDK Setup**
   - You need a Firebase service account key to run this script
   - Download it from Firebase Console → Project Settings → Service Accounts
   - Save it as `firebase-service-account.json` in the root directory

2. **Install Dependencies**
   ```bash
   npm install firebase-admin
   ```

## Usage

1. **Set up service account key:**
   - Download your Firebase service account key from Firebase Console
   - Place it in the root directory as `firebase-service-account.json`
   - **Important:** Add `firebase-service-account.json` to `.gitignore` to keep it secure

2. **Run the seeding script:**
   ```bash
   npm run seed:firebase
   ```

   If your `.env` points to a different project than your service key, seed the project from the key:
   ```bash
   npm run seed:firebase:use-key
   ```
   Or: `npm run seed:firebase -- --use-service-project`

   Or directly:
   ```bash
   node scripts/seed-firebase.js
   ```

## What Gets Seeded

### Authentication Users
- `admin@opticalservice.com` (Password: `Admin@123`)
- `staff@opticalservice.com` (Password: `Staff@123`)

### Categories (5)
- Frames
- Lenses
- Sunglasses
- Contact Lenses
- Accessories

### Items (7)
- Various items linked to categories

### Stock Items (7)
- Stock entries for all items with quantities, prices, and suppliers

### Sample Customers (3)
- Sample customer records with prescriptions, products, and payment information

## Notes

- The script is **idempotent** - it won't create duplicates if run multiple times
- Existing records are detected and skipped
- All timestamps are set automatically using Firestore server timestamps
- Make sure your Firebase project has Firestore enabled
- Make sure your Firebase project has Authentication enabled

## Troubleshooting

### Error: "Error initializing Firebase Admin"
- Make sure `firebase-service-account.json` exists in the root directory
- Or set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

### Error: "Permission denied"
- Check that your service account has proper permissions
- Ensure Firestore and Authentication are enabled in Firebase Console

### Project mismatch (`.env` vs service key)
- If your app uses project **A** (in `.env`) but your key is for project **B**, run:
  `npm run seed:firebase:use-key` to seed project **B**. To see that data in the app, update `.env` with project **B**’s Firebase config from the Console.

### Users already exist
- The script will skip creating users that already exist
- This is normal behavior

