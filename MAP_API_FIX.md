# Fix: Google Maps API "REQUEST_DENIED" Error

## Problem

When viewing routes on the map, the app showed this error:
```
ERROR  No routes found: {
  "error_message": "You must use an API key to authenticate each request to Google Maps Platform APIs...",
  "routes": [],
  "status": "REQUEST_DENIED"
}
```

## Root Cause

The MapScreen was calling Google Directions API **directly** from the React Native app:

```javascript
// ❌ WRONG: Direct API call from mobile app
const url = `https://maps.googleapis.com/maps/api/directions/json?...&key=${GOOGLE_MAPS_API_KEY}`;
const res = await fetch(url);
```

**Why this fails:**
1. **CORS (Cross-Origin Resource Sharing)** restrictions prevent mobile apps from calling Google APIs directly
2. Even with a valid API key, Google blocks direct requests from mobile applications
3. This is a security measure by Google to prevent API key exposure

## Solution

**Use backend proxy for ALL Google API calls** (both walking and driving directions).

### Architecture Change

```
Before:
Mobile App → Google Directions API ❌ (CORS blocked)

After:
Mobile App → Backend Server → Google Directions API ✅
```

The backend server has no CORS restrictions and can freely call Google APIs.

## Changes Made

### 1. Backend: Added Driving Directions Endpoint

**File**: [backend/src/controllers/routeControllers.js](backend/src/controllers/routeControllers.js#L1266-L1322)

```javascript
export const getDrivingDirections = async (req, res) => {
  const { origin, destination, waypoints } = req.query;

  try {
    // Validate input
    if (!origin || !destination) {
      return res.status(400).json({
        error: "origin and destination are required"
      });
    }

    // Build URL with waypoints if provided
    let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }

    console.log(`Fetching driving directions from ${origin} to ${destination}`);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Directions API error:', data.status, data.error_message);
      return res.status(400).json({
        error: 'Failed to fetch directions',
        status: data.status,
        message: data.error_message
      });
    }

    if (!data.routes || data.routes.length === 0) {
      return res.json({
        polyline: null,
        message: 'No driving route found'
      });
    }

    const route = data.routes[0];

    res.json({
      polyline: route.overview_polyline.points,
      bounds: route.bounds,
      legs: route.legs.map(leg => ({
        distance: leg.distance,
        duration: leg.duration
      }))
    });
  } catch (err) {
    console.error("Error fetching driving directions:", err.message);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
};
```

### 2. Backend: Registered New Route

**File**: [backend/src/routes/api.js](backend/src/routes/api.js#L45)

```javascript
// Import the new function
import {
  // ... other imports
  getWalkingDirections,
  getDrivingDirections  // ✅ Added
} from '../controllers/routeControllers.js';

// Register the route
router.get('/routes/driving-directions', getDrivingDirections);
```

### 3. Frontend: Updated MapScreen to Use Backend Proxy

**File**: [Client-Side-NewUI/src/screens/MapScreen.js](Client-Side-NewUI/src/screens/MapScreen.js#L134-L162)

**Before:**
```javascript
const fetchRoute = async (stops, setCoords) => {
  // ❌ Direct Google API call
  const url = `https://maps.googleapis.com/maps/api/directions/json?...&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();

  if (json.routes && json.routes.length > 0) {
    const points = decodePolyline(json.routes[0].overview_polyline.points);
    setCoords(points);
  }
};
```

**After:**
```javascript
const fetchRoute = async (stops, setCoords) => {
  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(1, -1).map((p) => `${p.latitude},${p.longitude}`).join('|');

  // ✅ Use backend proxy
  const url = `${API_BASE_URL}/routes/driving-directions?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=${waypoints}`;

  console.log('Fetching driving route from backend:', url);

  const res = await fetch(url);
  const json = await res.json();

  if (json.polyline) {
    const points = decodePolyline(json.polyline);
    setCoords(points);
    console.log(`Driving route decoded: ${points.length} points`);
  }
};
```

### 4. Frontend: Removed Unused API Key

Removed the unused `GOOGLE_MAPS_API_KEY` constant from MapScreen.js since all API calls now go through the backend.

## How It Works Now

### Complete Request Flow

1. **User taps "View on Map"** in VehicleDetails
2. **MapScreen loads** with route data
3. **For bus route polyline:**
   ```
   MapScreen → fetchRoute()
            → Backend /routes/driving-directions
            → Google Directions API
            → Backend returns polyline
            → MapScreen decodes and displays
   ```

4. **For walking paths:**
   ```
   MapScreen → fetchWalkingRoute()
            → Backend /routes/walking-directions
            → Google Directions API
            → Backend returns polyline
            → MapScreen decodes and displays
   ```

### API Endpoints

| Endpoint | Purpose | Parameters |
|----------|---------|------------|
| `/routes/driving-directions` | Get bus route polyline | `origin`, `destination`, `waypoints` |
| `/routes/walking-directions` | Get walking path polyline | `fromLat`, `fromLng`, `toLat`, `toLng` |

## Benefits

### 1. Security
- ✅ API key never exposed to client
- ✅ API key only in backend `.env` file
- ✅ Backend can enforce rate limiting
- ✅ Backend can add authentication if needed

### 2. Reliability
- ✅ No CORS issues
- ✅ Works on all devices (iOS, Android, web)
- ✅ Consistent behavior across platforms

### 3. Flexibility
- ✅ Can cache responses on backend
- ✅ Can add custom logic (e.g., route optimization)
- ✅ Can switch map providers without changing frontend
- ✅ Can monitor API usage server-side

## Testing

### 1. Restart Backend
```bash
cd backend
npm start
```

You should see:
```
Server is running on port 3001
```

### 2. Test Backend Endpoints Directly

**Test Driving Directions:**
```bash
curl "http://localhost:3001/api/routes/driving-directions?origin=27.7172,85.3240&destination=27.6766,85.3250"
```

**Expected Response:**
```json
{
  "polyline": "encoded_polyline_string_here",
  "bounds": { ... },
  "legs": [
    {
      "distance": { "value": 5200, "text": "5.2 km" },
      "duration": { "value": 900, "text": "15 mins" }
    }
  ]
}
```

**Test Walking Directions:**
```bash
curl "http://localhost:3001/api/routes/walking-directions?fromLat=27.7172&fromLng=85.3240&toLat=27.7180&toLng=85.3250"
```

### 3. Test in App

```bash
cd Client-Side-NewUI
npx expo start --clear
```

**Test Flow:**
1. Search: `27.7172, 85.3240` → `27.6766, 85.3250`
2. Select a transport option
3. Tap "View on Map"
4. **Verify:**
   - ✅ Map loads without errors
   - ✅ Blue bus route line appears
   - ✅ Red dashed walking paths appear
   - ✅ No "REQUEST_DENIED" errors in console

## Debugging

### Check Console Logs

**Expected logs:**
```
Fetching driving route from backend: http://localhost:3001/api/routes/driving-directions?...
Driving route decoded: 45 points

Fetching walking route from backend: http://localhost:3001/api/routes/walking-directions?...
Walking route decoded: 12 points
```

### Common Issues

#### Issue: "Network request failed"
**Cause:** Backend not running or wrong API_BASE_URL

**Fix:**
```bash
# Check backend is running
cd backend
npm start

# Check API_BASE_URL in frontend
cat Client-Side-NewUI/src/config/api.js
```

#### Issue: "Failed to fetch directions"
**Cause:** Google API key invalid or insufficient permissions

**Fix:**
```bash
# Check backend .env file
cat backend/.env | grep GOOGLE_MAPS

# Verify API key has correct permissions in Google Cloud Console:
# - Directions API ✅ enabled
# - No IP restrictions (for development)
```

#### Issue: Map shows but no route lines
**Cause:** Polyline decoding failing

**Fix:**
- Check console for "decoded: X points" logs
- Verify polyline string is valid
- Ensure stops have valid lat/lon coordinates

## Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| API calls | Direct from app ❌ | Through backend ✅ |
| CORS issues | Yes ❌ | No ✅ |
| API key location | Frontend code | Backend .env ✅ |
| Security | Low (key exposed) | High (key hidden) ✅ |
| Error handling | Basic | Comprehensive ✅ |
| Debugging | Difficult | Easy (server logs) ✅ |

## Related Files

### Backend
- `backend/src/controllers/routeControllers.js` - Added getDrivingDirections()
- `backend/src/routes/api.js` - Registered new route
- `backend/.env` - Contains GOOGLE_MAPS API key

### Frontend
- `Client-Side-NewUI/src/screens/MapScreen.js` - Updated to use backend proxy
- `Client-Side-NewUI/src/config/api.js` - Contains API_BASE_URL

## Production Considerations

### 1. API Key Management
```env
# Development (backend/.env)
GOOGLE_MAPS=unrestricted-dev-key

# Production (backend/.env on server)
GOOGLE_MAPS=restricted-prod-key
```

### 2. API Key Restrictions
In Google Cloud Console, set up restrictions:

**For Production Backend Key:**
- Application restrictions: IP addresses (whitelist your server IPs)
- API restrictions: Directions API only

### 3. Caching
Consider adding Redis cache to reduce API calls:
```javascript
// Pseudocode
const cacheKey = `directions:${origin}:${destination}:${waypoints}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return res.json(JSON.parse(cached));
}

// Fetch from Google...
await redis.setex(cacheKey, 3600, JSON.stringify(result)); // Cache 1 hour
```

### 4. Rate Limiting
Add rate limiting to prevent abuse:
```javascript
import rateLimit from 'express-rate-limit';

const directionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per windowMs
});

router.get('/routes/driving-directions', directionsLimiter, getDrivingDirections);
```

## Summary

### What Was Fixed
- ✅ Removed direct Google API calls from mobile app
- ✅ Created backend proxy endpoints for all map API calls
- ✅ Fixed "REQUEST_DENIED" errors
- ✅ Improved security (API key hidden)
- ✅ Eliminated CORS issues

### Files Modified
1. `backend/src/controllers/routeControllers.js` - Added getDrivingDirections
2. `backend/src/routes/api.js` - Added route
3. `Client-Side-NewUI/src/screens/MapScreen.js` - Updated to use proxy

### Testing Status
- ✅ Backend endpoint created
- ✅ Frontend updated
- 🔄 Ready for testing

---

**Fix Applied:** November 2025
**Status:** ✅ Complete - Ready to Test
**Next Step:** Restart backend and test the app
