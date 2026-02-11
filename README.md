## Gilabun — Smart Waitlist / Table Flow

Restaurant hostess dashboard for **Gilabun**. Built with **Next.js (App Router)**, **TypeScript**, **TailwindCSS**, and **Firebase (Firestore)**.

### Stack

- **Framework**: Next.js 14 (App Router, server actions)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: Firebase Firestore (single source of truth)
- **Server**: Firebase Admin SDK for secure writes in server actions
- **Client**: Firebase web SDK (optional) for Auth / client reads

### Data model (Firestore)

All data is scoped per user under `/users/{userId}/`:

- **templates/{templateId}**: name, createdAt, updatedAt, isDefault
- **templates/{templateId}/tables/{tableId}**: tableNumber, seats, x, y, w, h, rotDeg
- **workspaces/{workspaceId}**: name, templateId, templateName, createdAt, updatedAt, status, isActive
- **workspaces/{workspaceId}/parties/{partyId}**: name, phone, size, notes, status, createdAt, seatedAt, quotedWaitMin
- **workspaces/{workspaceId}/tableStates/{tableNumber}**: tableNumber, capacity, status, lastSeatedAt, expectedFreeAt, updatedAt
- **workspaces/{workspaceId}/seatings/{seatingId}**: partyId, tableNumber, seatedAt, clearedAt, durationMin

Templates persist until deleted. Workspaces are service sessions; creating a new workspace from a template creates a fresh workspace with table states from the template and an empty waitlist.

### Firebase setup

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com/).

2. **Enable Firestore** (Create database → start in production or test mode; you will deploy rules below).

3. **Template logos** use [Cloudinary](https://cloudinary.com/); set `CLOUDINARY_*` in step 6. (Firebase Storage is not used for logos.)

4. **Get client config**: Project settings → General → Your apps → Add app (Web). Copy the config (apiKey, authDomain, projectId, etc.).

5. **Get Admin SDK credentials**: Project settings → Service accounts → Generate new private key. From the downloaded JSON you need `project_id`, `client_email`, and `private_key`.

6. **Create `.env.local`** (copy from `.env.local.example`):

   - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` from the client config.
   - `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` from the service account JSON. For the private key, paste the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`; use real newlines or `\n` (escape in `.env` as needed).
   - Each user's data is isolated under `/users/{uid}/`. Sign in with Google is required.
   - For template logos: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` from [Cloudinary Dashboard](https://console.cloudinary.com/) → Settings → API Keys.

7. **Deploy Firestore rules** so only the signed-in user can access their data:

   ```bash
   firebase deploy --only firestore:rules
   ```

   Or in Firebase Console → Firestore → Rules, paste the contents of `firestore.rules` (only allow read/write under `/users/{userId}/` when `request.auth.uid == userId`).

8. **Enable Google sign-in**: Firebase Console → Authentication → Sign-in method → Enable Google.

### How to run

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up Firebase**

   Copy `.env.local.example` to `.env.local` and fill in all Firebase keys (see Firebase setup above).

3. **Start the app**

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`.

### Routes

- **/** — Landing page.
- **/login** — Sign in with Google (required before using the app).
- **/app** — Dashboard: recent workspaces, start new workspace (choose template), list templates.
- **/choose-template** — List templates; Use (set active) or Edit (builder).
- **/choose-template/new** — Create a new template (name), then redirects to choose-template.
- **/builder/[templateId]** — Template builder: drag, resize, rotate tables; add/edit/delete tables; start service with this template.
- **/workspace/[workspaceId]** — Service mode: floor map, waitlist, next-to-seat, Seat Now, table actions (Turning, Free, Clear, +10), Kitchen slow (+10 min).

### Security

- All writes go through server actions using the **Firebase Admin SDK** (never expose admin keys to the client).
- **Firebase Auth (Google sign-in)** is required. Each user gets their own data under `/users/{uid}/` – no shared templates or workspaces.
- Firestore Security Rules restrict access to `/users/{userId}/` so that only `request.auth.uid == userId` can read/write.

### Notes

- No data is stored outside Firestore (Prisma/SQLite removed).
- Seat Now uses a Firestore transaction to update party + table state atomically.
- Template drag/resize/rotate persist on pointer stop to reduce write cost.
