# Fix: Coordinate-Based Search - Stops List & Map Display

## Problem

When searching with coordinates (e.g., `27.696655,85.305717`) as origin and "Jamal" as destination:

**Expected:**
1. Backend finds nearest stop to coordinates (e.g., "Ratnapark")
2. Bus Details shows stops: Ratnapark → ... → Jamal
3. Map shows: Walking path (coordinates → Ratnapark) + Bus route (Ratnapark → Jamal)

**Actual:**
- ❌ Stops list empty or shows all stops
- ❌ Map not loading
- ❌ Walking path not shown

## Root Causes

### 1. Wrong Function Parameters in transformRouteData

**File**: `Client-Side-NewUI/src/screens/SearchScreen.js` (line 283)

**Problem:**
```javascript
// ❌ WRONG: Wrong parameters passed
const transformed = transformRouteData(route, searchType, destinationStopId);
```

The function signature is:
```javascript
transformRouteData(apiDetailData, fromStopId, toStopId, isMultiLeg, transferStop, secondLeg)
```

But it was being called with `(route, searchType, destinationStopId)` where:
- `searchType` is a string like "location" or "traditional" (not a stop ID!)
- `destinationStopId` is sometimes null
- Missing actual stop IDs from the route data

### 2. Missing Origin Coordinates

The `fromLocation` coordinates from the backend weren't being passed through to the transformed data, so MapScreen couldn't draw the walking path.

### 3. Google API Not Enabled

The Directions API wasn't enabled in Google Cloud Console (user has now fixed this ✅).

## Solutions

### Fix 1: Correct transformRouteData Call

**File**: [Client-Side-NewUI/src/screens/SearchScreen.js](Client-Side-NewUI/src/screens/SearchScreen.js#L270-L306)

**Before:**
```javascript
const transformedResults = routeData.data.map(route => {
    let searchType = 'traditional';
    let destinationStopId = null;

    if (route.walkingToStop || route.walkingInfo) {
        searchType = 'location';
        const toStop = locations.find(stop => stop.name === toLocation);
        destinationStopId = toStop ? toStop.id : null;
    }

    // ❌ Wrong parameters!
    const transformed = transformRouteData(route, searchType, destinationStopId);
    ...
});
```

**After:**
```javascript
const transformedResults = routeData.data.map(route => {
    let fromStopId = null;
    let toStopId = null;

    // For location-based search (coordinates or "My Location")
    if (route.walkingToStop) {
        // The route starts from the nearest stop found by backend
        fromStopId = route.walkingToStop.stopId;  // ✅ Correct!

        // Find destination stop ID
        const toStop = locations.find(stop =>
            (stop.stops_name || stop.name || '').toLowerCase() === toLocation.toLowerCase()
        );
        toStopId = toStop ? toStop.id : null;
    } else {
        // Traditional stop-to-stop search
        const fromStop = locations.find(stop =>
            (stop.stops_name || stop.name || '').toLowerCase() === fromLocation.toLowerCase()
        );
        const toStop = locations.find(stop =>
            (stop.stops_name || stop.name || '').toLowerCase() === toLocation.toLowerCase()
        );
        fromStopId = fromStop ? fromStop.id : null;
        toStopId = toStop ? toStop.id : null;
    }

    console.log('Transform route with stops:', { fromStopId, toStopId, hasWalking: !!route.walkingToStop });

    // ✅ Correct parameters!
    const transformed = transformRouteData(
        route,
        fromStopId,
        toStopId,
        route.isMultiLeg || false,
        route.transferStop || null,
        route.secondLeg || null
    );
    ...
});
```

### Fix 2: Pass Origin Coordinates

**File**: [Client-Side-NewUI/src/screens/SearchScreen.js](Client-Side-NewUI/src/screens/SearchScreen.js#L308-L323)

**Added:**
```javascript
// Add location-specific information
if (route.walkingToStop) {
    transformed.walkingToStop = route.walkingToStop;
    transformed.totalJourneyTime = route.totalJourneyTime;

    // ✅ Add origin coordinates for map walking path
    if (route.fromLocation) {
        transformed.fromLocation = route.fromLocation;
    }
}
```

## How It Works Now

### Data Flow for Coordinate Search

```
User Input:
  From: 27.696655,85.305717 (coordinates)
  To: Jamal (stop name)
        ↓
LocationService.smartRouteSearch()
  → Detects coordinates (line 181)
  → Calls getRoutesFromCurrentLocation()
        ↓
Backend /routes/from-location
  → Finds nearest stops to coordinates
  → Finds "Ratnapark" is closest (0.5km away)
  → Finds routes from Ratnapark to Jamal
  → Returns routes with:
     {
       walkingToStop: {
         stopId: 101,              // Ratnapark's ID
         stopName: "Ratnapark",
         distance: 0.5,
         coordinates: { lat, lon }
       },
       fromLocation: {
         latitude: 27.696655,
         longitude: 85.305717
       },
       stops: [
         { id: 101, stops_name: "Ratnapark", ... },
         { id: 105, stops_name: "New Road", ... },
         { id: 120, stops_name: "Jamal", ... }
       ]
     }
        ↓
SearchScreen.transformRouteData()
  → fromStopId = 101 (Ratnapark) ✅
  → toStopId = 120 (Jamal) ✅
  → Adds fromLocation coordinates ✅
        ↓
VehicleDetails receives:
  {
    fromStopId: 101,
    toStopId: 120,
    stops: [...],
    fromLocation: { latitude, longitude },
    walkingToStop: { ... }
  }
        ↓
VehicleDetails.useEffect() filters stops:
  → Finds fromIndex by matching fromStopId (101) ✅
  → Finds toIndex by matching toStopId (120) ✅
  → Filters stops[fromIndex...toIndex]
  → Shows: Ratnapark → New Road → Jamal ✅
        ↓
VehicleDetails.handleViewMap() passes to MapScreen:
  → stops: [Ratnapark, New Road, Jamal]
  → fromCoordinates: { 27.696655, 85.305717 }
  → walkingToStop: { ... }
        ↓
MapScreen displays:
  → 🚶 Red dashed line: Coordinates → Ratnapark
  → 🚌 Blue solid line: Ratnapark → New Road → Jamal
  → 📍 Markers at all stops
```

## Testing

### 1. Restart Frontend
```bash
cd Client-Side-NewUI
npx expo start --clear
```

### 2. Test Coordinate Search

**Input:**
```
From: 27.696655,85.305717
To: Jamal
```

**Steps:**
1. Paste coordinates in "From" field
2. Type "Jamal" in "To" field
3. Tap Search
4. Select any transport option

**Expected Results:**

#### In Bus Details Screen:
```
✅ Route Stops section visible
✅ Shows stops from nearest stop to Jamal:
   🏁 Ratnapark (or whatever nearest stop is)
   ○ New Road
   ○ Bhotahity
   ○ ...
   🏁 Jamal
```

#### In Map View:
```
✅ Map loads without errors
✅ Red dashed line from coordinates to first stop
✅ Blue solid line connecting all bus stops
✅ Markers at all stops
✅ No "REQUEST_DENIED" errors
```

### 3. Check Console Logs

You should see:
```
Transform route with stops: {
  fromStopId: 101,
  toStopId: 120,
  hasWalking: true
}

VehicleDetails - Processing stops: {
  totalStops: 15,
  fromStopId: 101,
  toStopId: 120,
  isMultiLeg: false
}

VehicleDetails - Matched by ID: {
  fromIndex: 0,
  toIndex: 8,
  fromStopId: 101,
  toStopId: 120
}

VehicleDetails - Filtered stops: 9 out of 15
```

### 4. Test Traditional Search (Still Works)

**Input:**
```
From: Ratnapark
To: Jamal
```

**Should work as before:**
- ✅ Stops list shows correctly
- ✅ Map shows route (no walking path)

## What Was Fixed

| Issue | Before | After |
|-------|--------|-------|
| transformRouteData params | ❌ Wrong (searchType, destId) | ✅ Correct (fromStopId, toStopId) |
| fromStopId source | ❌ Always null | ✅ From walkingToStop.stopId |
| Origin coordinates | ❌ Not passed | ✅ Passed to MapScreen |
| Stops filtering | ❌ Failed (no ID match) | ✅ Works (matches by ID) |
| Map walking path | ❌ No coordinates | ✅ Has coordinates |
| Console logs | ❌ No debugging | ✅ Clear debug output |

## Key Changes

### SearchScreen.js Changes

**Lines 270-306**: Complete rewrite of route transformation logic
- ✅ Correctly extracts fromStopId from walkingToStop.stopId
- ✅ Correctly finds toStopId from locations array
- ✅ Passes correct parameters to transformRouteData
- ✅ Handles both location-based and traditional searches

**Lines 308-323**: Added origin coordinates passthrough
- ✅ Passes fromLocation coordinates to transformed object
- ✅ Enables MapScreen to draw walking path

## Related Fixes

This fix builds on previous fixes:

1. **VehicleDetails Stop Filtering** ([BUS_STOPS_FIX.md](BUS_STOPS_FIX.md))
   - Uses stop IDs instead of names
   - Handles coordinate searches

2. **Map API Proxy** ([MAP_API_FIX.md](MAP_API_FIX.md))
   - Backend proxy for Directions API
   - Fixed CORS issues

3. **Data Display Fix** ([DATA_DISPLAY_FIX.md](DATA_DISPLAY_FIX.md))
   - Flattened vehicle data structure

## Architecture

### Backend Returns (from `/routes/from-location`):
```javascript
{
  data: [
    {
      routeId: 1,
      route_no: "Route 1",
      stops: [ /* array of stop objects */ ],
      walkingToStop: {
        stopId: 101,           // ← Used as fromStopId
        stopName: "Ratnapark",
        distance: 0.5,
        coordinates: { lat, lon }
      },
      fromLocation: {          // ← Passed to MapScreen
        latitude: 27.696655,
        longitude: 85.305717
      }
    }
  ]
}
```

### Frontend Transforms:
```javascript
{
  fromStopId: 101,             // ← From walkingToStop.stopId
  toStopId: 120,               // ← From locations array lookup
  stops: [...],
  fromLocation: { lat, lon },  // ← From backend
  walkingToStop: { ... }       // ← From backend
}
```

### VehicleDetails Uses:
```javascript
// Filter stops by ID
const fromIndex = stops.findIndex(stop => stop.id == fromStopId);
const toIndex = stops.findIndex(stop => stop.id == toStopId);
const filteredStops = stops.slice(fromIndex, toIndex + 1);
```

### MapScreen Uses:
```javascript
// Draw walking path
fetchWalkingRoute(
  fromLocation,              // Origin coordinates
  stops[0],                  // First bus stop
  setWalkingToStartCoords
);

// Draw bus route
fetchRoute(stops, setFirstLegCoords);
```

## Troubleshooting

### Issue: Stops list still empty

**Check console for:**
```
Transform route with stops: { fromStopId: null, ... }
```

**Cause:** fromStopId is null
**Fix:** Backend not returning walkingToStop, or stopId missing

### Issue: Map not showing walking path

**Check console for:**
```
VehicleDetails - fromLocation not found
```

**Cause:** fromLocation coordinates not passed
**Fix:** Verify SearchScreen is adding transformed.fromLocation

### Issue: Wrong stops showing

**Check console for:**
```
VehicleDetails - Matched by ID: { fromIndex: -1, ... }
```

**Cause:** Stop ID doesn't exist in stops array
**Fix:** Backend returning wrong stop IDs

## Summary

### Files Modified
1. **Client-Side-NewUI/src/screens/SearchScreen.js**
   - Lines 270-306: Fixed transformRouteData call with correct parameters
   - Lines 308-323: Added origin coordinates passthrough

### What It Fixes
- ✅ Stops list now shows correct stops (nearest stop → destination)
- ✅ Map shows walking path from coordinates to nearest stop
- ✅ Map shows bus route from nearest stop to destination
- ✅ Works for both coordinate and "My Location" searches
- ✅ Traditional searches still work

### Testing Status
- ✅ Code changes complete
- 🔄 Ready for testing (user needs to restart app)
- ✅ Google Directions API enabled (user confirmed)

---

**Fix Applied:** November 2025
**Status:** ✅ Complete - Ready to Test
**Next Step:** Restart frontend app and test with coordinates
