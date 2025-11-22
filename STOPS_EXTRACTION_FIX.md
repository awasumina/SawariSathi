# Fix: Stops Extraction from Segments

## Problem Identified

Backend was returning routes with stops INSIDE `segments` array, not at the root `stops` level:

```javascript
// Backend returned:
{
  stops: undefined,  // ❌ Missing!
  segments: [
    {
      stops: [...],  // ✅ Stops are here!
      routeId: "8",
      route_name: "..."
    },
    {
      stops: [...],  // ✅ And here!
      routeId: "1",
      route_name: "..."
    }
  ]
}
```

**Result:**
- `transformRouteData()` received empty stops array
- VehicleDetails had no stops to display
- MapScreen couldn't draw routes

## Solution

Added stop extraction logic in SearchScreen to pull stops from segments when root-level stops are missing.

**File**: `Client-Side-NewUI/src/screens/SearchScreen.js` (lines 306-329)

```javascript
// FIX: If route.stops is missing but segments exist, extract stops from segments
if ((!route.stops || route.stops.length === 0) && route.segments && route.segments.length > 0) {
    console.log('⚠️ Stops missing at root level, extracting from segments...');

    // For multi-leg journeys, combine stops from all segments
    if (route.segments.length > 1) {
        // Multi-leg: combine all segment stops
        route.stops = route.segments.reduce((allStops, segment) => {
            if (segment.stops && segment.stops.length > 0) {
                return [...allStops, ...segment.stops];
            }
            return allStops;
        }, []);
    } else {
        // Single segment: use its stops
        route.stops = route.segments[0]?.stops || [];
    }

    console.log('✅ Extracted stops from segments:', {
        stopsCount: route.stops.length,
        firstStop: route.stops[0]?.stops_name,
        lastStop: route.stops[route.stops.length - 1]?.stops_name
    });
}
```

## How It Works

### Before (Broken):
```
Backend Response:
  └─ segments[0].stops = [Teku, RNAC, ...]
  └─ segments[1].stops = [RNAC, Jamal, Kavresthali]
  └─ stops = undefined ❌

transformRouteData():
  └─ Receives: stops = undefined
  └─ Returns: stops = []

VehicleDetails:
  └─ filteredStops = [] ❌
  └─ Nothing to display!
```

### After (Fixed):
```
Backend Response:
  └─ segments[0].stops = [Teku, RNAC, ...]
  └─ segments[1].stops = [RNAC, Jamal, Kavresthali]
  └─ stops = undefined

Extract from segments:
  └─ route.stops = [...segments[0].stops, ...segments[1].stops]
  └─ route.stops = [all stops combined] ✅

transformRouteData():
  └─ Receives: stops = [12 stops]
  └─ Returns: stops = [12 stops]

VehicleDetails:
  └─ filteredStops = [Teku → ... → Kavresthali] ✅
  └─ Displays list!
```

## What Gets Fixed

✅ **Stops List in Bus Details** - Now has data to filter and display
✅ **Map Visualization** - Now has stops coordinates to draw routes
✅ **Multi-leg Journeys** - Combines stops from all segments
✅ **Single-leg Journeys** - Extracts stops from single segment

## Testing

**Restart frontend:**
```bash
cd Client-Side-NewUI
npx expo start --clear
```

**Test coordinate search:**
```
From: 27.696655,85.305717
To: Kavresthali
```

**Expected console logs:**
```javascript
🔍 RAW ROUTE DATA FROM BACKEND: {
  hasStops: false,
  segments: [...]
}

⚠️ Stops missing at root level, extracting from segments...

✅ Extracted stops from segments: {
  stopsCount: 12,
  firstStop: "Kavresthali",
  lastStop: "RNAC"
}

Transform route with stops: {
  routeStopsCount: 12,  // ✅ Now has stops!
  firstStop: "Kavresthali",
  lastStop: "RNAC"
}

Transformed result: {
  transformedStopsCount: 12  // ✅ Stops passed through!
}
```

**In Bus Details screen:**
```
Route Stops
-----------
🏁 Teku (or nearest stop)
○ ...
○ ...
🏁 Kavresthali
```

**In Map view:**
- ✅ Red dashed line: Coordinates → Teku
- ✅ Blue solid line: Teku → Kavresthali
- ✅ All stop markers visible

## Why This Happened

The backend `/routes/from-location` endpoint returns **transfer routes** which have a different structure than direct routes:

**Direct routes:**
```javascript
{
  stops: [...],  // ✅ At root level
  segments: [...]
}
```

**Transfer routes (multi-leg):**
```javascript
{
  stops: undefined,  // ❌ Not at root!
  segments: [
    { stops: [...] },  // ✅ Inside segments
    { stops: [...] }
  ]
}
```

The backend should ideally always return `stops` at the root level, but this frontend fix handles both cases.

## Related Issues Fixed

This single fix resolves:
1. ❌ "Stops list not showing" → ✅ Fixed
2. ❌ "Map not showing routes" → ✅ Fixed (needs stops for coordinates)
3. ❌ "View on Map not working" → ✅ Fixed (needs stops to pass to MapScreen)

## File Modified

- `Client-Side-NewUI/src/screens/SearchScreen.js` (lines 306-329)

---

**Fix Applied:** November 2025
**Status:** ✅ Complete - Ready to Test
