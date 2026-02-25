# Firebase Seeding Script Setup Guide

## Step 1: Get Firebase Service Account Key

**Important:** The service account key determines **which Firebase project** gets seeded. It must be from the **same project** as your app (the one in `.env` as `REACT_APP_FIREBASE_PROJECT_ID`). If your app uses `glasses-project-clone`, download the key from that project.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the project you want to seed (e.g. **glasses-project-clone** if that’s in your `.env`)
3. Click on the gear icon ⚙️ next to "Project Overview"
4. Select **"Project settings"**
5. Go to the **"Service accounts"** tab
6. Click **"Generate new private key"**
7. A JSON file will be downloaded - this is your service account key
8. **Rename** the downloaded file to `firebase-service-account.json`
9. **Move** it to the root directory of this project (same level as `package.json`)

## Step 2: Install Dependencies

```bash
npm install
```

This will install `firebase-admin` which is required for the seeding script.

## Step 3: Run the Seeding Script

```bash
npm run seed:firebase
```

Or directly:

```bash
node scripts/seed-firebase.js
```

## What the Script Does

The script will:

1. ✅ Create 2 authentication users:
   - `admin@opticalservice.com` (Password: `Admin@123`)
   - `staff@opticalservice.com` (Password: `Staff@123`)

2. ✅ Seed 5 categories:
   - Frames
   - Lenses
   - Sunglasses
   - Contact Lenses
   - Accessories

3. ✅ Seed 7 items linked to categories

4. ✅ Seed 7 stock items with quantities and prices

5. ✅ Seed 3 sample customers with prescriptions and orders

## Important Notes

- ⚠️ **Security**: The `firebase-service-account.json` file contains sensitive credentials. It's already added to `.gitignore` - **DO NOT** commit it to version control.

- ✅ **Idempotent**: The script is safe to run multiple times. It won't create duplicates.

- 🔄 **Updates**: If you need to update existing data, you'll need to manually edit or delete records in Firebase Console, or modify the script.

## Troubleshooting

### "Error initializing Firebase Admin"
- Make sure `firebase-service-account.json` is in the root directory
- Check that the file is valid JSON
- Verify the service account has proper permissions

### "Permission denied" errors
- Ensure Firestore is enabled in Firebase Console
- Ensure Authentication is enabled in Firebase Console
- Check that your service account has "Editor" or "Owner" role

### Users already exist
- This is normal! The script skips existing users/records
- If you want to recreate users, delete them from Firebase Console first

## Next Steps

After seeding:
1. Test login with the created users
2. Verify data in Firebase Console
3. Start using your application!

