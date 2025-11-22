# Environment Variable Migration - Summary

## What Changed

Moved hardcoded Google Maps API key from code to environment variables for better security and configuration management.

---

## Changes Made

### 1. Created `.env` File
**File**: [Client-Side-NewUI/.env](Client-Side-NewUI/.env)

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

### 2. Updated MapScreen.js
**File**: [Client-Side-NewUI/src/screens/MapScreen.js](Client-Side-NewUI/src/screens/MapScreen.js#L17)

**Before:**
```javascript
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
```

**After:**
```javascript
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
```

### 3. Created Example File
**File**: [Client-Side-NewUI/.env.example](Client-Side-NewUI/.env.example)

Template file for other developers (committed to git).

### 4. Created Documentation
**File**: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)

Complete guide for environment variable setup.

---

## Important Notes

### ⚠️ Expo Environment Variables

In Expo/React Native, environment variables **MUST** be prefixed with `EXPO_PUBLIC_`:

✅ **Correct:**
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-key
```

❌ **Wrong:**
```env
GOOGLE_MAPS_API_KEY=your-key  # Won't work in Expo!
```

### 🔄 Restart Required

After changing `.env` file:
```bash
# Kill the current Expo dev server
# Then restart with:
npx expo start --clear
```

The `--clear` flag clears the cache and ensures new env vars are loaded.

---

## Benefits

### 1. Security
- API key not exposed in source code
- Different keys for dev/staging/prod
- Keys can be rotated without code changes

### 2. Flexibility
- Each developer can use their own API key
- Easy to configure CI/CD pipelines
- Environment-specific configurations

### 3. Best Practices
- Follows industry standards
- Compatible with deployment platforms (Vercel, Netlify, EAS)
- Easy to manage secrets

---

## Current Configuration

### Backend
```env
# backend/.env
SUPABASE_URL=your-supabase-url-here
SUPABASE_KEY=your-supabase-key-here
GOOGLE_MAPS=YOUR_GOOGLE_MAPS_API_KEY
```

### Frontend
```env
# Client-Side-NewUI/.env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

### Android Native
```json
// Client-Side-NewUI/app.json
{
  "android": {
    "config": {
      "googleMaps": {
        "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
      }
    }
  }
}
```

**Note:** The `app.json` API key is still hardcoded because it's needed for native Android builds. This is standard practice for React Native apps.

---

## Testing Checklist

- [ ] `.env` file exists in `Client-Side-NewUI/` folder
- [ ] `.env` contains `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-key`
- [ ] Expo dev server restarted with `--clear` flag
- [ ] App loads without errors
- [ ] Map displays correctly
- [ ] Walking paths show up (test with coordinates)
- [ ] Console doesn't show "API key is empty" errors

---

## How to Test

### 1. Verify Environment Variable is Loaded

Add temporary logging in MapScreen.js:
```javascript
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
console.log('Google Maps API Key loaded:', GOOGLE_MAPS_API_KEY ? '✓' : '✗');
```

### 2. Test the App

```bash
cd Client-Side-NewUI
npx expo start --clear
```

Then in the app:
1. Search with coordinates: `27.7172, 85.3240` → `27.6766, 85.3250`
2. Select a route
3. Tap "View on Map"
4. Check if walking paths appear

---

## Troubleshooting

### Problem: "API key is empty" in console

**Solution:**
```bash
# 1. Check if .env file exists
ls Client-Side-NewUI/.env

# 2. Check contents
cat Client-Side-NewUI/.env

# 3. Restart with clear cache
cd Client-Side-NewUI
npx expo start --clear
```

### Problem: Maps not loading

**Check:**
1. API key is correct in `.env`
2. API key has correct prefix: `EXPO_PUBLIC_`
3. Expo dev server was restarted
4. No typos in variable name

### Problem: Build fails

**For production builds:**
```bash
# Set env var inline for build
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-prod-key eas build --platform android
```

---

## Git Status

### Files Added (not committed to git):
- `Client-Side-NewUI/.env` - Contains actual API key ✅ In `.gitignore`

### Files Added (committed to git):
- `Client-Side-NewUI/.env.example` - Template file
- `ENVIRONMENT_SETUP.md` - Documentation
- `ENV_MIGRATION_SUMMARY.md` - This file

### Files Modified:
- `Client-Side-NewUI/src/screens/MapScreen.js` - Uses env var instead of hardcoded key

---

## Next Steps for Team Members

When pulling this code:

1. **Copy the example file:**
   ```bash
   cd Client-Side-NewUI
   cp .env.example .env
   ```

2. **Add your API key:**
   ```bash
   # Edit .env and replace with your key
   nano .env
   ```

3. **Restart Expo:**
   ```bash
   npx expo start --clear
   ```

---

## Production Deployment

### For EAS Build:
```bash
# Set environment variable for build
eas build --platform android \
  --non-interactive \
  --profile production \
  --no-wait
```

Add to `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY": "production-key-here"
      }
    }
  }
}
```

---

## Summary

✅ **Completed:**
- Moved API key from code to `.env`
- Created example and documentation files
- Updated MapScreen to use environment variable
- Verified `.gitignore` includes `.env`

✅ **Benefits:**
- More secure (keys not in source code)
- Easier to manage
- Follows best practices
- Ready for production deployment

🔄 **Action Required:**
- Restart Expo dev server with `--clear` flag
- Test the app to ensure everything works

---

**Migration Date:** November 2025
