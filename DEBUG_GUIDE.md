# Debug Guide - Coordinate Search Not Working

## Your Issue

**Input:**
- From: `27.696655,85.305717` (coordinates)
- To: `Jamal` (bus stop)

**Expected:**
1. Backend finds nearest stop to coordinates (e.g., "Bus Stop 1")
2. Bus Details shows: Bus Stop 1 → ... → Jamal
3. Map shows: Walking path (coordinates → Bus Stop 1) + Bus route (Bus Stop 1 → Jamal)

**Actual:**
- ❌ Stops list NOT showing in Bus Details
- ❌ Map NOT opening/showing

## Step-by-Step Debugging

### Step 1: Verify Backend is Running

```bash
cd backend
npm start
```

**Expected output:**
```
Server running on port 3000
```

**Test backend directly:**
```bash
curl http://192.168.1.76:3000/api/stops
```

Should return JSON with stops data.

### Step 2: Restart Frontend with Correct IP

I've updated the IP to `192.168.1.76` in `api.js`.

```bash
cd Client-Side-NewUI
npx expo start --clear
```

**Look for this log:**
```
🌐 API_BASE_URL: http://192.168.1.76:3000/api
```

### Step 3: Test the Search

1. Enter: `27.696655,85.305717` in From field
2. Enter: `Jamal` in To field
3. Click Search

**Watch the console for these logs:**

#### A. Search Processing
```javascript
Smart route search: {
  fromInput: "27.696655,85.305717",
  toInput: "Jamal",
  hasLocation: false
}

Coordinate-based search detected (pasted coordinates)
Finding routes from location: lat=27.696655, lng=85.305717 to stop: [jamalId]
```

#### B. Transform Route Logs
```javascript
Transform route with stops: {
  fromStopId: 101,        // ← Should be a NUMBER (not null!)
  toStopId: 120,          // ← Should be a NUMBER (not null!)
  hasWalking: true,
  walkingToStopId: 101,
  walkingToStopName: "Ratnapark"  // or whatever nearest stop is
  routeStopsCount: 15,
  firstStop: "Ratnapark",
  lastStop: "Jamal"
}

Transformed result: {
  hasStops: true,
  transformedStopsCount: 15,
  fromStopId: 101,
  toStopId: 120,
  hasFromLocation: true,
  hasWalkingToStop: true
}
```

#### C. VehicleDetails Logs (when you click "View Full Details")
```javascript
VehicleDetails - Processing stops: {
  totalStops: 15,
  fromStopId: 101,
  toStopId: 120,
  isMultiLeg: false
}

VehicleDetails - Available stops: [
  { id: 101, name: "Ratnapark" },
  { id: 105, name: "New Road" },
  ...
  { id: 120, name: "Jamal" }
]

VehicleDetails - Matched by ID: {
  fromIndex: 0,           // ← Should NOT be -1
  toIndex: 8,             // ← Should NOT be -1
  fromStopId: 101,
  toStopId: 120
}

VehicleDetails - Filtered stops: 9 out of 15
```

#### D. Map Logs (when you click "View on Map")
```javascript
Fetching driving route from backend: http://192.168.1.76:3000/api/routes/driving-directions?...
Driving route decoded: 45 points

Fetching walking route from backend: http://192.168.1.76:3000/api/routes/walking-directions?...
Walking route decoded: 12 points
```

## Common Issues & Fixes

### Issue 1: fromStopId is null

**Console shows:**
```javascript
Transform route with stops: { fromStopId: null, toStopId: null, ... }
```

**Cause:** Backend not returning `walkingToStop.stopId`

**Debug:**
1. Check backend logs - should show:
   ```
   Finding routes from location: lat=27.696655, lng=85.305717 to stop: 120
   Found 3 nearby stops, searching for routes...
   ```

2. If backend isn't logging this, the frontend isn't calling the right endpoint

3. Check Network tab in browser/Expo DevTools for the API call

**Fix:**
- Verify backend is using the correct endpoint: `/api/routes/from-location`
- Check `LocationService.smartRouteSearch()` is calling the right function

### Issue 2: Stops List Empty

**Console shows:**
```javascript
VehicleDetails - Matched by ID: { fromIndex: -1, toIndex: -1 }
```

**Cause:** `fromStopId`/`toStopId` not present in transport object

**Fix:**
1. Check "Transformed result" log - should have `fromStopId` and `toStopId`
2. If missing, the issue is in SearchScreen transform logic
3. If present but stops list still empty, check VehicleDetails is receiving the data

### Issue 3: Map Not Opening

**Console shows:**
```javascript
Network Error
```

**Cause:** Backend not accessible or wrong IP

**Fix:**
1. Verify IP address: `192.168.1.76` is correct
2. Test backend: `curl http://192.168.1.76:3000/api/stops`
3. Restart frontend: `npx expo start --clear`

### Issue 4: "REQUEST_DENIED" on Map

**Console shows:**
```javascript
No routes found: {"error_message": "You must use an API key...
```

**Cause:** Google Directions API not enabled or wrong key

**Fix:**
1. Verify backend `.env` has correct Google Maps API key
2. Restart backend to load new key
3. Check Google Cloud Console - Directions API should be enabled

## Quick Test Commands

### Test Backend Directly

```bash
# Test stops endpoint
curl http://192.168.1.76:3000/api/stops

# Test from-location endpoint (coordinate search)
curl "http://192.168.1.76:3000/api/routes/from-location?latitude=27.696655&longitude=85.305717&destinationStopId=120"

# Should return JSON with routes including walkingToStop data

# Test driving directions
curl "http://192.168.1.76:3000/api/routes/driving-directions?origin=27.7,85.3&destination=27.6,85.3"

# Should return JSON with polyline

# Test walking directions
curl "http://192.168.1.76:3000/api/routes/walking-directions?fromLat=27.696655&fromLng=85.305717&toLat=27.7&toLng=85.3"

# Should return JSON with polyline
```

### Check What Jamal's ID Is

```bash
curl http://192.168.1.76:3000/api/stops | grep -i jamal
```

## Restart Checklist

**When you've made changes, follow this exact order:**

1. ✅ Stop backend (Ctrl+C)
2. ✅ Stop frontend (Ctrl+C)
3. ✅ Start backend:
   ```bash
   cd backend
   npm start
   # Wait for "Server running on port 3000"
   ```
4. ✅ Start frontend:
   ```bash
   cd Client-Side-NewUI
   npx expo start --clear
   # --clear is CRITICAL to reload code changes
   ```
5. ✅ Look for: `🌐 API_BASE_URL: http://192.168.1.76:3000/api`
6. ✅ Test search

## What to Share If Still Not Working

If it still doesn't work, share these exact console logs:

1. **From Search:**
   - "Transform route with stops" log
   - "Transformed result" log

2. **From Bus Details:**
   - "VehicleDetails - Processing stops" log
   - "VehicleDetails - Matched by ID" log

3. **Any error messages**

4. **Backend terminal output** when you search

## Files I Changed

1. ✅ `Client-Side-NewUI/src/config/api.js` - Updated IP to 192.168.1.76
2. ✅ `Client-Side-NewUI/src/screens/SearchScreen.js` - Added debug logs
3. ✅ `Client-Side-NewUI/src/components/VehicleDetails.js` - Added debug logs
4. ✅ `Client-Side-NewUI/src/screens/MapScreen.js` - Uses backend proxy
5. ✅ `backend/src/controllers/routeControllers.js` - Added getDrivingDirections
6. ✅ `backend/src/routes/api.js` - Added /driving-directions route
7. ✅ `backend/.env` - Updated Google Maps API key

## Expected Complete Flow

```
1. User enters: 27.696655,85.305717 → Jamal
2. LocationService detects coordinates
3. Calls backend: /api/routes/from-location?lat=27.696655&lng=85.305717&destinationStopId=120
4. Backend finds nearest stop (e.g., "Ratnapark" ID: 101)
5. Backend finds routes from Ratnapark (101) → Jamal (120)
6. Backend returns: { walkingToStop: { stopId: 101, ... }, stops: [...] }
7. SearchScreen transforms with fromStopId=101, toStopId=120
8. Available Transport shows: "Walk 0.5km to Ratnapark"
9. Click "View Full Details"
10. VehicleDetails filters stops[101...120]
11. Shows: Ratnapark → New Road → ... → Jamal ✅
12. Click "View on Map"
13. MapScreen fetches walking route (coords → Ratnapark)
14. MapScreen fetches driving route (Ratnapark → Jamal)
15. Map shows both paths ✅
```

---

**Current Status:** IP address updated to 192.168.1.76
**Next Step:** Restart both backend and frontend, then test and share console logs
