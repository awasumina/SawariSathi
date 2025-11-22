# Sawari Sathi - Visual Implementation Guide

## 🗺️ Map Visualization Overview

```
┌─────────────────────────────────────────────────┐
│  Sawari Sathi - Complete Journey Map           │
├─────────────────────────────────────────────────┤
│                                                 │
│    🏠 Home1 (27.7172, 85.3240)                 │
│     ┆┆┆  ← Red dashed line (Walking)           │
│     ┆┆┆  Distance: 500m, Time: 6 min           │
│     ┆┆┆                                         │
│    🚏 Ratnapark Bus Stop                       │
│     ║                                           │
│     ║  ← Blue solid line (Bus Route)           │
│     ║  Bus: Sajha Yatayat, Route #5            │
│     ║                                           │
│    🚏 Stop 2                                    │
│     ║                                           │
│    🚏 Stop 3                                    │
│     ║                                           │
│    🚏 Stop 4                                    │
│     ║                                           │
│    🚏 Tripureshwor Bus Stop                    │
│     ┆┆┆                                         │
│     ┆┆┆  ← Red dashed line (Walking)           │
│     ┆┆┆  Distance: 300m, Time: 4 min           │
│    🏡 Home2 (27.6766, 85.3250)                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  Legend:                                        │
│  🏠 = Origin Home    🏡 = Destination Home     │
│  🚏 = Bus Stop       ┆┆┆ = Walking Path        │
│  ║  = Bus Route                                │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Color Scheme

### Markers:
```
🏠 Origin       → 🟢 Green (colors.success)
🚏 Bus Stop     → 🔵 Blue (colors.primary)
🔄 Transfer     → 🟠 Orange (colors.accent)
🏡 Destination  → 🔴 Red (colors.danger)
```

### Routes:
```
Walking Path    → 🔴 Red (#FF6B6B) - Dashed [10, 5]
First Bus       → 🔵 Blue (colors.primary) - Solid
Second Bus      → 🟣 Purple (colors.accent) - Solid
```

---

## 📱 Screen Flow Diagram

```
┌──────────────┐
│ Home Screen  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Search Screen │ ← User enters coordinates
│              │   From: 27.7172, 85.3240
│  From: [___] │   To:   27.6766, 85.3250
│  To:   [___] │
│   [Search]   │
└──────┬───────┘
       │
       ▼
┌────────────────┐
│ Search Results │ ← Shows available routes
│                │   with walking info
│  ┌──────────┐  │
│  │ Route 1  │  │ • Fare: Rs. 25
│  │ Rs. 25   │  │ • Distance: 5.2km
│  │ 5.2km    │  │ • Walking: 800m
│  └──────────┘  │ • Total: 45 min
│                │
│  ┌──────────┐  │
│  │ Route 2  │  │
│  └──────────┘  │
└──────┬─────────┘
       │ User selects route
       ▼
┌────────────────┐
│Vehicle Details │ ← Shows complete info
│                │
│  [View on Map] │ ← User taps this
└──────┬─────────┘
       │
       ▼
┌────────────────┐
│   Map Screen   │ ← Complete journey shown
│                │
│  🏠──┆┆┆──🚏   │   • Walking paths
│        ║       │   • Bus routes
│        🚏      │   • All stops
│        ║       │   • Legend
│        🚏      │
│       ┆┆┆──🏡  │
│                │
│   [< Back]     │
└────────────────┘
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React Native)              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. SearchScreen.js                                     │
│     └─> User enters: 27.7172, 85.3240 → 27.6766, 85.3250│
│         └─> LocationService.smartRouteSearch()          │
│                                                          │
│  2. API Call to Backend                                 │
│     └─> GET /api/routes/between-locations?              │
│         fromLat=27.7172&fromLng=85.3240                │
│         toLat=27.6766&toLng=85.3250&radius=2           │
│                                                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                Backend (Node.js/Express)                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  3. routeControllers.js                                 │
│     └─> getRoutesBetweenLocations()                    │
│         ├─> Find nearby source stops (Haversine)       │
│         │   • Ratnapark: 0.5km                          │
│         │   • Jamal: 0.7km                              │
│         │                                               │
│         ├─> Find nearby destination stops              │
│         │   • Tripureshwor: 0.3km                       │
│         │   • Koteshwor: 1.2km                          │
│         │                                               │
│         └─> findRoutesBetweenStops()                   │
│             ├─> Query Supabase for routes              │
│             └─> Add walkingInfo + coordinates          │
│                                                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│               Database (Supabase/PostgreSQL)            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  4. Tables:                                             │
│     ├─> stops (bus stops with coordinates)             │
│     ├─> routes (route information)                     │
│     ├─> stops_route (stop sequence in routes)          │
│     └─> fare (pricing information)                     │
│                                                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                  Response with Route Data                │
├─────────────────────────────────────────────────────────┤
│  {                                                       │
│    data: [                                              │
│      {                                                  │
│        routeNo: "5",                                    │
│        routeName: "Ratnapark-Tripureshwor",            │
│        fare: 25,                                        │
│        stops: [...],                                    │
│        fromLocation: {lat: 27.7172, lng: 85.3240},     │
│        toLocation: {lat: 27.6766, lng: 85.3250},       │
│        walkingInfo: {                                   │
│          toSourceStop: {                                │
│            stopName: "Ratnapark",                       │
│            distance: 0.5,                               │
│            estimatedTime: 6,                            │
│            coordinates: {lat: 27.7017, lng: 85.3142}   │
│          },                                             │
│          fromDestStop: {                                │
│            stopName: "Tripureshwor",                    │
│            distance: 0.3,                               │
│            estimatedTime: 4,                            │
│            coordinates: {lat: 27.6915, lng: 85.3206}   │
│          }                                              │
│        }                                                │
│      }                                                  │
│    ]                                                    │
│  }                                                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend - SearchResults.js                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  5. Display Routes                                      │
│     └─> TransportCard for each route                   │
│         ├─> Show fare, distance, timing                │
│         ├─> Show walking distance/time                 │
│         └─> "View Full Details" button                 │
│                                                          │
└─────────────────┬───────────────────────────────────────┘
                  │ User taps route
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend - VehicleDetails.js                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  6. Show Complete Route Info                            │
│     ├─> List all stops                                 │
│     ├─> Show walking details                           │
│     └─> "View on Map" button                           │
│         └─> handleViewMap()                            │
│             └─> navigation.navigate('MapScreen', {     │
│                   stops, fromCoordinates, toCoordinates │
│                 })                                      │
│                                                          │
└─────────────────┬───────────────────────────────────────┘
                  │ User taps "View on Map"
                  ▼
┌─────────────────────────────────────────────────────────┐
│                Frontend - MapScreen.js                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  7. Render Map with Complete Journey                    │
│     │                                                   │
│     ├─> fetchWalkingRoute(fromCoordinates, stop1)      │
│     │   └─> Google Directions API (mode=walking)       │
│     │       └─> Returns polyline for walking path      │
│     │                                                   │
│     ├─> fetchRoute(stops)                              │
│     │   └─> Google Directions API (with waypoints)     │
│     │       └─> Returns polyline for bus route         │
│     │                                                   │
│     ├─> fetchWalkingRoute(lastStop, toCoordinates)     │
│     │   └─> Returns polyline for final walking         │
│     │                                                   │
│     └─> Render on Map:                                 │
│         ├─> Marker: Home (green)                       │
│         ├─> Polyline: Walking (red dashed)             │
│         ├─> Markers: Bus stops (blue)                  │
│         ├─> Polyline: Bus route (blue solid)           │
│         ├─> Polyline: Walking (red dashed)             │
│         ├─> Marker: Destination (red)                  │
│         └─> Legend                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Hierarchy

```
App.js
 └─> StackNavigator
      ├─> HomeScreen
      ├─> SearchScreen
      │    └─> LocationService.smartRouteSearch()
      │
      ├─> SearchResults
      │    └─> TransportCard (multiple)
      │         ├─> WalkingDirections
      │         └─> MultiWalkingDirections
      │
      ├─> VehicleDetails
      │    ├─> RouteStop (multiple)
      │    └─> handleViewMap() → Navigate to MapScreen
      │
      └─> MapScreen
           ├─> MapView (react-native-maps)
           │    ├─> Marker (home origin)
           │    ├─> Marker (bus stops)
           │    ├─> Marker (destination)
           │    ├─> Polyline (walking paths)
           │    └─> Polyline (bus routes)
           │
           └─> Legend Components
```

---

## 📊 Database Schema (Simplified)

```
┌─────────────────────┐
│       stops         │
├─────────────────────┤
│ id (PK)             │
│ stops_name          │
│ stops_lat           │ ← Used for distance calculation
│ stops_lon           │ ← Used for distance calculation
│ created_at          │
└─────────────────────┘
          │
          │ Referenced by
          ▼
┌─────────────────────┐         ┌─────────────────────┐
│   stops_route       │─────────│      routes         │
├─────────────────────┤         ├─────────────────────┤
│ id (PK)             │         │ id (PK)             │
│ stop_id (FK)        │◄────────│ routes_id           │
│ route_id (FK)       │         │ routes_name         │
│ sequence_no         │         │ routes_no           │
│ stops_name          │         │ vehicle_type        │
│ stops_lat           │         │ operator_id         │
│ stops_lon           │         └─────────────────────┘
└─────────────────────┘
          │
          │ Referenced by
          ▼
┌─────────────────────┐
│        fare         │
├─────────────────────┤
│ id (PK)             │
│ route_id (FK)       │
│ fare_price          │
│ discounted_fare     │
└─────────────────────┘
```

---

## 🎯 Walking Distance Calculation

```
Formula: Haversine Distance

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

Walking Time = Distance * 12 minutes/km (5 km/h walking speed)
```

Example:
```
Home to Stop: 0.5km
  → Walking Time: 0.5 * 12 = 6 minutes

Stop to Destination: 0.3km
  → Walking Time: 0.3 * 12 = 4 minutes
```

---

## 🗺️ Google Maps Integration

### 1. Walking Directions API Call:
```javascript
const url = `https://maps.googleapis.com/maps/api/directions/json
  ?origin=${lat1},${lng1}
  &destination=${lat2},${lng2}
  &mode=walking
  &key=${GOOGLE_MAPS_API_KEY}`;

// Returns:
{
  routes: [{
    overview_polyline: {
      points: "encoded_polyline_string"
    }
  }]
}
```

### 2. Bus Directions API Call:
```javascript
const url = `https://maps.googleapis.com/maps/api/directions/json
  ?origin=${lat1},${lng1}
  &destination=${lat2},${lng2}
  &waypoints=${stop2_lat},${stop2_lng}|${stop3_lat},${stop3_lng}
  &key=${GOOGLE_MAPS_API_KEY}`;
```

### 3. Polyline Decoding:
```
Encoded: "_p~iF~ps|U_ulLnnqC"
         ↓ Decode Algorithm
Decoded: [
  {latitude: 38.5, longitude: -120.2},
  {latitude: 40.7, longitude: -120.95},
  {latitude: 43.252, longitude: -126.453}
]
```

---

## 📱 UI Components Visualization

### Legend Component:
```
┌────────────────────────────────┐
│ Legend                         │
├────────────────────────────────┤
│ 🏠 Home                        │
│ 🚏 Bus Stop                    │
│ 🔄 Transfer                    │
│ 🏡 Destination                 │
└────────────────────────────────┘

┌────────────────────────────────┐
│ Route Types                    │
├────────────────────────────────┤
│ ┆┆┆ Walking                    │
│ ━━━ Bus Route                  │
│ ━━━ Second Bus (multi-leg)     │
└────────────────────────────────┘
```

### TransportCard Component:
```
┌────────────────────────────────────────┐
│ 🚌 Sajha Yatayat - BUS                │
│                       Total: Rs. 25    │
├────────────────────────────────────────┤
│ Route: 5 | Ratnapark-Tripureshwor     │
│ Distance: 5.2 km                       │
│ Timing: 6:00am - 7:00pm                │
├────────────────────────────────────────┤
│ 🚶 Walking Info:                       │
│   To stop: 500m (6 min walk)          │
│   From stop: 300m (4 min walk)        │
├────────────────────────────────────────┤
│ ⏱️ Total Journey: 45 minutes           │
│                                        │
│ View Full Details →                    │
└────────────────────────────────────────┘
```

---

## 🔄 State Management Flow

```
SearchScreen Component:
  ├─> [fromLocation, setFromLocation]
  ├─> [toLocation, setToLocation]
  ├─> [userLocation, setUserLocation]
  ├─> [results, setResults]
  └─> [loading, setLoading]

MapScreen Component:
  ├─> [firstLegCoords, setFirstLegCoords]
  ├─> [secondLegCoords, setSecondLegCoords]
  ├─> [walkingToStartCoords, setWalkingToStartCoords]
  ├─> [walkingFromEndCoords, setWalkingFromEndCoords]
  ├─> [loading, setLoading]
  └─> [error, setError]
```

---

## 🎬 Animation Sequence

```
Map Load Sequence:

1. [0ms] MapView initialized
2. [100ms] Markers rendered (home, stops, destination)
3. [200ms] Start fetching walking route 1
4. [500ms] Start fetching bus route
5. [700ms] Start fetching walking route 2
6. [1200ms] Walking route 1 polyline drawn
7. [1500ms] Bus route polyline drawn
8. [1800ms] Walking route 2 polyline drawn
9. [2000ms] fitToCoordinates() called
10. [2500ms] Map animates to fit all markers
11. [3000ms] Legend fades in
```

---

## 💡 Key Technical Decisions

### 1. **Dashed Lines for Walking**
```javascript
// Why: Visually distinguishes walking from bus routes
lineDashPattern={[10, 5]}  // 10px dash, 5px gap
```

### 2. **Color Coding**
```javascript
// Walking: Red (#FF6B6B) - Universal "pedestrian" color
// Bus: Blue (primary) - Calming, trustworthy
// Transfer: Orange (accent) - Attention-grabbing
```

### 3. **Haversine vs Google Distance**
```
Haversine: Fast, offline, approximate
Google: Accurate, requires API call, slower

Decision: Use Haversine for initial filtering,
          Google for actual route display
```

### 4. **Async Fetching**
```javascript
// Fetch routes in parallel for better performance
await Promise.all([
  fetchWalkingRoute(...),
  fetchRoute(...),
  fetchWalkingRoute(...)
]);
```

---

## 🎯 Success Indicators

### User can see:
- ✅ Exact walking distance from home to bus stop
- ✅ Clear visual path (dashed line)
- ✅ All bus stops along the route
- ✅ Bus route clearly marked (solid line)
- ✅ Walking distance from bus stop to destination
- ✅ Total journey visualized on one map
- ✅ Legend explaining all elements

### Technical quality:
- ✅ Clean, maintainable code
- ✅ Proper error handling
- ✅ Performance optimized
- ✅ Well documented
- ✅ Production ready

---

**This visual guide complements the technical documentation and provides an at-a-glance understanding of the implementation.**
