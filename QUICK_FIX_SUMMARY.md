# Quick Fix: Google Maps Walking Directions

## Problem
The map was not showing walking paths because Google Directions API cannot be called directly from React Native apps due to CORS restrictions.

## Solution
Moved the Google Directions API call to the backend server.

---

## Changes Made

### 1. Backend API Route
**File**: [backend/src/routes/api.js](backend/src/routes/api.js#L43)

Added new endpoint:
```javascript
router.get('/routes/walking-directions', getWalkingDirections);
```

### 2. Backend Controller Function
**File**: [backend/src/controllers/routeControllers.js](backend/src/controllers/routeControllers.js#L1194-L1248)

Added `getWalkingDirections()` function:
- Takes `fromLat`, `fromLng`, `toLat`, `toLng` as query parameters
- Calls Google Directions API with `mode=walking`
- Returns polyline, distance, and duration
- Uses `GOOGLE_MAPS` environment variable for API key

### 3. Frontend MapScreen
**File**: [Client-Side-NewUI/src/screens/MapScreen.js](Client-Side-NewUI/src/screens/MapScreen.js#L159-L181)

Updated `fetchWalkingRoute()` function:
- Now calls backend API instead of Google directly
- URL: `/api/routes/walking-directions`
- Properly decodes polyline returned from backend

---

## How It Works Now

```
MapScreen (Frontend)
    ↓
fetchWalkingRoute() calls backend API
    ↓
Backend: /api/routes/walking-directions
    ↓
Backend calls Google Directions API
    ↓
Returns polyline to frontend
    ↓
Frontend decodes polyline
    ↓
Displays walking path on map
```

---

## Testing Steps

### 1. Start Backend
```bash
cd backend
npm start
```

**Verify backend is running:**
- Open browser: `http://localhost:3000/api/stops`
- Should see list of bus stops

### 2. Test Walking Directions Endpoint
```bash
# Test the new endpoint directly
curl "http://localhost:3000/api/routes/walking-directions?fromLat=27.7172&fromLng=85.3240&toLat=27.7017&toLng=85.3142"
```

Expected response:
```json
{
  "polyline": "encoded_polyline_string",
  "distance": {
    "text": "2.1 km",
    "value": 2100
  },
  "duration": {
    "text": "25 mins",
    "value": 1500
  }
}
```

### 3. Start Frontend
```bash
cd Client-Side-NewUI
npx expo start
```

### 4. Test in App
1. Go to Search screen
2. Enter coordinates:
   - From: `27.7172, 85.3240`
   - To: `27.6766, 85.3250`
3. Search for routes
4. Select a route
5. Tap "View on Map"
6. **Check console logs** in Expo:
   - Should see: "Fetching walking route from backend"
   - Should see: "Walking route decoded: X points"

---

## Environment Variables

**Backend `.env` file must have:**
```env
GOOGLE_MAPS=AIzaSyByws6vEMv6x4oUvxmMoA1-gh_V5Y-RYO4
```

*(You already have this configured)*

---

## Troubleshooting

### Problem: "No walking route found"
**Check:**
- Backend logs for Google API errors
- Google Maps API key is valid
- Coordinates are valid (lat: -90 to 90, lng: -180 to 180)

### Problem: "Failed to fetch"
**Check:**
- Backend is running on port 3000
- Frontend `LOCAL_IP` matches your computer's IP
- Firewall isn't blocking connections

### Problem: Map shows but no walking paths
**Check Expo console logs:**
```javascript
// Should see these logs:
"Fetching walking route from backend: http://..."
"Walking route decoded: 50 points"  // or similar number
```

If you see errors, copy them and we can debug further.

---

## What Should Happen

When you "View on Map" for a location-based search:

1. **Map loads** with:
   - 🏠 Green home icon at starting location
   - 🏡 Red home icon at destination
   - 🚏 Blue bus stop icons

2. **Walking paths appear** (may take 1-2 seconds):
   - Red dashed line from home to first bus stop
   - Blue solid line for bus route
   - Red dashed line from last bus stop to destination

3. **Legend shows**:
   - All marker types
   - Walking and bus route indicators

---

## Debug Commands

### Check Backend Logs
The backend console will show:
```
Fetching walking directions from 27.7172,85.3240 to 27.7017,85.3142
```

### Check Frontend Logs
In Expo DevTools, look for:
```
Fetching walking route from backend: http://192.168.1.113:3000/api/routes/walking-directions?...
Walking route decoded: 45 points
```

---

## Next Steps

1. ✅ Start backend server
2. ✅ Verify backend endpoint works (test with curl)
3. ✅ Start frontend app
4. ✅ Test with coordinates in app
5. ✅ Check console logs for any errors

If you see any errors in the console, let me know and I'll help debug!

---

## Key Files Modified

1. [backend/src/routes/api.js](backend/src/routes/api.js) - Added route
2. [backend/src/controllers/routeControllers.js](backend/src/controllers/routeControllers.js) - Added controller
3. [Client-Side-NewUI/src/screens/MapScreen.js](Client-Side-NewUI/src/screens/MapScreen.js) - Updated API call

---

**Status**: ✅ Fixed - Ready to test
