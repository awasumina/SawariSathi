# Environment Variables Setup Guide

## Overview
This guide explains how to configure environment variables for both frontend and backend of the Sawari Sathi app.

---

## Backend Configuration

### File: `backend/.env`

**Current Configuration:**
```env
SUPABASE_URL=your-supabase-url-here
SUPABASE_KEY=your-supabase-key-here
GOOGLE_MAPS=your-google-maps-api-key-here
```

**Variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon/public key
- `GOOGLE_MAPS` - Google Maps API key for server-side API calls

**Usage in Code:**
```javascript
// backend/src/controllers/routeControllers.js
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS || '';
```

---

## Frontend Configuration

### File: `Client-Side-NewUI/.env`

**Current Configuration:**
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

**Important Notes:**
1. In Expo/React Native, environment variables **must** be prefixed with `EXPO_PUBLIC_`
2. The app needs to be restarted after changing `.env` file
3. Variables are embedded at build time, not runtime

**Usage in Code:**
```javascript
// Client-Side-NewUI/src/screens/MapScreen.js
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
```

---

## Why Two API Keys?

You might notice we have Google Maps API keys in both places:

### Backend API Key (`backend/.env`)
- Used for **server-side** API calls
- Calls Google Directions API to get walking routes
- More secure (not exposed to users)
- Can have different restrictions

### Frontend API Key (`Client-Side-NewUI/.env`)
- Used for **displaying maps** in the app
- Android native map display (configured in `app.json`)
- Can be the same key or different key

**Recommendation**: Use the **same key** for both to simplify management.

---

## Security Best Practices

### 1. Never Commit `.env` Files
Add to `.gitignore`:
```
# Environment variables
.env
.env.local
.env.*.local
```

### 2. Use Different Keys for Production
- **Development**: Unrestricted or localhost-only
- **Production**: Restricted by app bundle ID / package name

### 3. Google Maps API Key Restrictions

#### For Backend Key:
```
API Restrictions:
- Restrict to: Directions API only

Application Restrictions:
- IP addresses (accept requests from server IPs only)
```

#### For Frontend Key:
```
API Restrictions:
- Restrict to: Maps SDK for Android, Maps SDK for iOS

Application Restrictions:
- Android: Restrict to package name: com.app.sawarisathi
- iOS: Restrict to bundle ID: com.app.sawarisathi
```

---

## Setup Instructions

### First Time Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SawariSathi
   ```

2. **Setup Backend Environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your keys
   ```

3. **Setup Frontend Environment**
   ```bash
   cd ../Client-Side-NewUI
   cp .env.example .env
   # Edit .env and add your keys
   ```

4. **Update `app.json`** (for Android builds)
   ```json
   {
     "android": {
       "config": {
         "googleMaps": {
           "apiKey": "your-key-here"
         }
       }
     }
   }
   ```

---

## Testing Environment Variables

### Backend Test
```bash
cd backend
node -e "require('dotenv').config(); console.log(process.env.GOOGLE_MAPS)"
```

Should output your Google Maps API key.

### Frontend Test
```bash
cd Client-Side-NewUI
npx expo start
```

In the app, check the console logs in MapScreen - it should show the API key being used (first few characters).

---

## Troubleshooting

### Problem: "API key is empty"

**Backend:**
```bash
# Check if .env file exists
ls backend/.env

# Check contents
cat backend/.env | grep GOOGLE_MAPS
```

**Frontend:**
```bash
# Check if .env file exists
ls Client-Side-NewUI/.env

# Restart Expo dev server (required after .env changes)
npx expo start --clear
```

### Problem: "REQUEST_DENIED" from Google Maps

**Cause:** API key restrictions are too strict or key is invalid.

**Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to: APIs & Services → Credentials
3. Find your API key
4. Click "Edit"
5. Check "API restrictions" - ensure required APIs are enabled:
   - Directions API (for backend)
   - Maps SDK for Android (for frontend)
6. Check "Application restrictions" - loosen during development

### Problem: Maps not showing in app

**Check:**
1. API key is in `app.json` (line 47)
2. API key is in `.env` file
3. Expo dev server was restarted after adding `.env`
4. API key has correct permissions in Google Cloud Console

---

## Environment-Specific Configuration

### Development
```env
# backend/.env
GOOGLE_MAPS=development-key-unrestricted

# Client-Side-NewUI/.env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=development-key-unrestricted
```

### Production
```env
# backend/.env (on production server)
GOOGLE_MAPS=production-key-ip-restricted

# Client-Side-NewUI/.env (for builds)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=production-key-app-restricted
```

**Build Command:**
```bash
# For production build with env vars
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=prod-key eas build --platform android
```

---

## Common Patterns

### Loading Environment Variables

**Backend (Node.js):**
```javascript
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GOOGLE_MAPS;
```

**Frontend (Expo):**
```javascript
// No need to import dotenv, Expo handles it automatically
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
```

### Default Values
```javascript
// Always provide fallback
const API_KEY = process.env.GOOGLE_MAPS || 'fallback-key';

// Or error if missing
if (!process.env.GOOGLE_MAPS) {
  throw new Error('GOOGLE_MAPS environment variable is required');
}
```

---

## File Structure

```
SawariSathi/
├── backend/
│   ├── .env                    # ✅ Git ignored
│   ├── .env.example            # 📝 Committed (template)
│   └── src/
│       └── controllers/
│           └── routeControllers.js  # Uses process.env.GOOGLE_MAPS
│
└── Client-Side-NewUI/
    ├── .env                    # ✅ Git ignored
    ├── .env.example            # 📝 Committed (template)
    ├── app.json                # Google Maps key for Android
    └── src/
        └── screens/
            └── MapScreen.js    # Uses process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
```

---

## Quick Reference

| Variable | Location | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | `backend/.env` | Database connection |
| `SUPABASE_KEY` | `backend/.env` | Database authentication |
| `GOOGLE_MAPS` | `backend/.env` | Server-side API calls |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | `Client-Side-NewUI/.env` | Frontend map display |

---

## Next Steps

1. ✅ Create `.env` files in both directories
2. ✅ Add your API keys
3. ✅ Add `.env` to `.gitignore`
4. ✅ Restart backend server
5. ✅ Restart Expo dev server with `--clear` flag
6. ✅ Test the app

---

**Last Updated:** November 2025
