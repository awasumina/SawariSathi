# Readme.md

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Search Types & Data Flow](#search-types--data-flow)
4. [Nearby Stop Finding](#nearby-stop-finding)
5. [Walking Path Calculation](#walking-path-calculation)
6. [Route Calculation](#route-calculation)
7. [Map Visualization](#map-visualization)
8. [Multi-Color Route Segments](#multi-color-route-segments)
9. [API Endpoints](#api-endpoints)
10. [Frontend Components](#frontend-components)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Sawari Sathi app provides a comprehensive public transport routing system that supports:

- **Stop-to-Stop searches**: Traditional bus route finding
- **Coordinate-based searches**: Using GPS coordinates or manual lat/long input
- **Mixed searches**: Any combination of stops and coordinates
- **Walking path visualization**: Complete door-to-door journey display
- **Multi-leg journeys**: Routes requiring transfers between buses
- **Color-coded segments**: Visual distinction between different buses

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
├─────────────────────────────────────────────────────────────┤
│  SearchScreen.js                                            │
│  ├─ Input validation                                        │
│  ├─ Coordinate parsing                                      │
│  ├─ API calls to backend                                    │
│  └─ Data transformation                                     │
│                                                              │
│  VehicleDetails.js                                          │
│  ├─ Route information display                               │
│  ├─ Stop filtering                                          │
│  └─ Map navigation preparation                              │
│                                                              │
│  MapScreen.js                                               │
│  ├─ Route visualization                                     │
│  ├─ Walking path display                                    │
│  ├─ Multi-segment rendering                                 │
│  └─ Marker placement                                        │
└─────────────────────────────────────────────────────────────┘
                           ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────┐
│                         Backend                             │
├─────────────────────────────────────────────────────────────┤
│  routeControllers.js                                        │
│  ├─ getNearbyStops()                                        │
│  ├─ getRoutesFromLocation()                                 │
│  ├─ getRoutesBetweenLocations()                             │
│  ├─ getDrivingDirections()                                  │
│  └─ getWalkingDirections()                                  │
│                                                              │
│  Database (Supabase)                                        │
│  ├─ stops table                                             │
│  ├─ routes table                                            │
│  └─ route_stops junction table                              │
│                                                              │
│  External APIs                                              │
│  └─ Google Directions API                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Search Types & Data Flow

### 1. Stop → Stop Search

**User Input:**
```
From: "Jamal"
To: "Ratnapark"
```

**Data Flow:**
```
SearchScreen
    ↓ [LocationService detects both are stop names]
    ↓
API Call: GET /api/routes?from=Jamal&to=Ratnapark
    ↓
Backend queries database:
    1. Find stop IDs for "Jamal" and "Ratnapark"
    2. Find all routes connecting these stops
    3. Return route details with stop sequence
    ↓
SearchScreen transforms data:
    - Extract stops array
    - Set fromStopId and toStopId
    - Calculate distance between stops
    ↓
Display results in Available Transport
    ↓ [User clicks "View on Map"]
    ↓
MapScreen:
    - Fetch driving directions (bus route)
    - Display blue polyline for bus route
    - Place markers at stops
```

**Key Logic:**
```javascript
// SearchScreen.js - Stop detection
const fromStop = locations.find(stop =>
    (stop.stops_name || stop.name || '').toLowerCase() === fromLocation.toLowerCase()
);
const toStop = locations.find(stop =>
    (stop.stops_name || stop.name || '').toLowerCase() === toLocation.toLowerCase()
);
fromStopId = fromStop ? fromStop.id : null;
toStopId = toStop ? toStop.id : null;
```

---

### 2. Coordinates → Stop Search

**User Input:**
```
From: "27.696655,85.305717"
To: "Jamal"
```

**Data Flow:**
```
SearchScreen
    ↓ [LocationService.parseCoordinateInput() detects coordinates]
    ↓
API Call: GET /api/routes/from-location?latitude=27.696655&longitude=85.305717&destinationStopId=120
    ↓
Backend (getRoutesFromLocation):
    1. Call getNearbyStops(lat, lon, radius=2km)
    2. For each nearby stop, find routes to destination
    3. Calculate walking distance to each nearby stop
    4. Sort by total journey time
    5. Return top 5 routes with walkingToStop data
    ↓
Response includes:
{
    walkingToStop: {
        stopId: 101,
        stopName: "Ratnapark",
        distance: 0.5,
        estimatedTime: "6 min",
        coordinates: { lat: 27.7, lon: 85.3 }
    },
    fromLocation: { latitude: 27.696655, longitude: 85.305717 },
    stops: [...],
    ...
}
    ↓
SearchScreen transforms:
    - fromStopId = route.walkingToStop.stopId
    - Add fromLocation coordinates
    - Extract stops array
    ↓
Display in Available Transport:
    - Show "Walk 0.5km to Ratnapark"
    - Show bus route details
    ↓ [User clicks "View on Map"]
    ↓
MapScreen:
    - Fetch walking directions (origin → first stop) [RED DASHED]
    - Fetch driving directions (bus route) [BLUE SOLID]
    - Display both paths
```

**Key Logic:**
```javascript
// Backend - getNearbyStops()
export const getNearbyStops = async (req, res) => {
    const { latitude, longitude, radius = 2 } = req.query;

    // Haversine formula for distance calculation
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Filter stops within radius
    const nearbyStops = allStops.filter(stop => {
        const distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(stop.stops_lat),
            parseFloat(stop.stops_lon)
        );
        return distance <= parseFloat(radius);
    });

    // Sort by distance
    nearbyStops.sort((a, b) => a.distance - b.distance);

    return nearbyStops;
};
```

---

### 3. Stop → Coordinates Search

**User Input:**
```
From: "Jamal"
To: "27.720,85.330"
```

**Data Flow:**
```
SearchScreen
    ↓ [Detects destination is coordinates]
    ↓
API Call: GET /api/routes?from=Jamal&to=<nearestStopToDestination>
    ↓
Backend:
    1. Find nearest stop to destination coordinates
    2. Find routes from "Jamal" to that stop
    3. Calculate walking distance from stop to destination
    4. Return with walkingFromStop data
    ↓
SearchScreen:
    - Parse toLocation as coordinates
    - Add toLocation: { latitude, longitude }
    - Set fromStopId and toStopId
    ↓
MapScreen:
    - Fetch driving directions (bus route) [BLUE SOLID]
    - Fetch walking directions (last stop → destination) [RED DASHED]
    - Display both paths
```

**Key Logic:**
```javascript
// SearchScreen.js - Parse destination coordinates
const toCoords = LocationService.parseCoordinateInput(toLocation);
if (toCoords && !transformed.toLocation) {
    transformed.toLocation = {
        latitude: toCoords.latitude,
        longitude: toCoords.longitude
    };
    console.log('📍 Added destination coordinates:', transformed.toLocation);
}
```

---

### 4. Coordinates → Coordinates Search

**User Input:**
```
From: "27.696655,85.305717"
To: "27.720,85.330"
```

**Data Flow:**
```
SearchScreen
    ↓ [Detects both are coordinates]
    ↓
API Call: GET /api/routes/between-locations?fromLat=27.696655&fromLng=85.305717&toLat=27.720&toLng=85.330
    ↓
Backend (getRoutesBetweenLocations):
    1. Find nearby stops to origin (within 2km)
    2. Find nearby stops to destination (within 2km)
    3. For each origin-destination stop pair:
       - Find connecting routes
       - Calculate total walking + bus time
    4. Sort by total time
    5. Return best routes
    ↓
SearchScreen:
    - Parse BOTH fromLocation and toLocation as coordinates
    - Add both coordinate objects to transformed data
    - Extract stops from segments if needed
    ↓
MapScreen receives BOTH coordinates:
    - fromCoordinates: { lat, lon }
    - toCoordinates: { lat, lon }
    ↓
MapScreen fetches THREE paths:
    1. Walking: origin → first stop [RED DASHED]
    2. Bus: first stop → last stop [BLUE SOLID]
    3. Walking: last stop → destination [RED DASHED]
    ↓
Complete journey visualization:
    🎯┈┈┈●━━━━━●┈┈┈🎯
    origin  bus   dest
```

**Key Logic:**
```javascript
// SearchScreen.js - Parse BOTH coordinates
const fromCoords = LocationService.parseCoordinateInput(fromLocation);
if (fromCoords && !transformed.fromLocation) {
    transformed.fromLocation = {
        latitude: fromCoords.latitude,
        longitude: fromCoords.longitude
    };
    console.log('🎯 Added origin coordinates:', transformed.fromLocation);
}

const toCoords = LocationService.parseCoordinateInput(toLocation);
if (toCoords && !transformed.toLocation) {
    transformed.toLocation = {
        latitude: toCoords.latitude,
        longitude: toCoords.longitude
    };
    console.log('📍 Added destination coordinates:', transformed.toLocation);
}
```

---

## Nearby Stop Finding

### Algorithm

**Haversine Distance Formula:**
```javascript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers

    // Convert degrees to radians
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in km

    return distance;
};
```

### Search Radius

- **Default**: 2 km
- **Adjustable**: Can be modified via query parameter
- **Rationale**: Balance between finding reasonable options and not overwhelming users

### Optimization

```javascript
// Backend - Efficient nearby stop search
export const getNearbyStops = async (req, res) => {
    const { latitude, longitude, radius = 2 } = req.query;

    // 1. Fetch all stops from database (cached for performance)
    const { data: allStops } = await supabase
        .from("stops")
        .select("id, stops_name, stops_lat, stops_lon");

    // 2. Calculate distances in parallel
    const stopsWithDistances = allStops.map(stop => ({
        ...stop,
        distance: calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(stop.stops_lat),
            parseFloat(stop.stops_lon)
        )
    }));

    // 3. Filter by radius
    const nearbyStops = stopsWithDistances.filter(
        stop => stop.distance <= parseFloat(radius)
    );

    // 4. Sort by distance (nearest first)
    nearbyStops.sort((a, b) => a.distance - b.distance);

    // 5. Return top 10
    return res.json(nearbyStops.slice(0, 10));
};
```

---

## Walking Path Calculation

### Google Directions API Integration

**Walking Mode Parameters:**
```javascript
const fetchWalkingDirections = async (origin, destination) => {
    const url = `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${origin.lat},${origin.lng}` +
        `&destination=${destination.lat},${destination.lng}` +
        `&mode=walking` +
        `&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
        return {
            polyline: data.routes[0].overview_polyline.points,
            distance: data.routes[0].legs[0].distance.text,
            duration: data.routes[0].legs[0].duration.text
        };
    }

    throw new Error('No walking route found');
};
```

### Backend Proxy Endpoints

**Why Proxy?**
- Avoid CORS issues
- Centralize API key management
- Add caching layer (future enhancement)
- Monitor API usage

**Walking Directions Endpoint:**
```javascript
// Backend - routeControllers.js
export const getWalkingDirections = async (req, res) => {
    const { fromLat, fromLng, toLat, toLng } = req.query;

    try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?` +
            `origin=${fromLat},${fromLng}` +
            `&destination=${toLat},${toLng}` +
            `&mode=walking` +
            `&key=${process.env.GOOGLE_MAPS}`;

        const response = await axios.get(url);

        if (response.data.status === 'OK') {
            const route = response.data.routes[0];
            return res.json({
                polyline: route.overview_polyline.points,
                distance: route.legs[0].distance,
                duration: route.legs[0].duration
            });
        }

        return res.status(404).json({
            error: 'No walking route found',
            message: response.data.error_message
        });
    } catch (error) {
        console.error('Walking directions error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
```

### Walking Distance Estimation

**Formula:**
```javascript
// Approximate walking speed: 5 km/h
const estimateWalkingTime = (distanceKm) => {
    const walkingSpeedKmh = 5;
    const timeHours = distanceKm / walkingSpeedKmh;
    const timeMinutes = Math.round(timeHours * 60);

    if (timeMinutes < 1) return '< 1 min';
    if (timeMinutes < 60) return `${timeMinutes} min`;

    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;
    return `${hours}h ${minutes}min`;
};
```

---

## Route Calculation

### Database Schema

```sql
-- Stops table
CREATE TABLE stops (
    id SERIAL PRIMARY KEY,
    stops_name VARCHAR(255),
    stops_lat DECIMAL(10, 8),
    stops_lon DECIMAL(11, 8)
);

-- Routes table
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    route_no VARCHAR(50),
    route_name VARCHAR(255),
    operator_name VARCHAR(255),
    vehicle_type VARCHAR(50),
    fare INTEGER,
    timing VARCHAR(100)
);

-- Route stops junction table
CREATE TABLE route_stops (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    stop_id INTEGER REFERENCES stops(id),
    sequence_order INTEGER
);
```

### Stop Filtering Logic

**VehicleDetails.js - ID-based filtering:**
```javascript
useEffect(() => {
    if (!safeTransport.stops || safeTransport.stops.length === 0) {
        setFilteredStops([]);
        return;
    }

    console.log('VehicleDetails - Processing stops:', {
        totalStops: safeTransport.stops.length,
        fromStopId: safeTransport.fromStopId,
        toStopId: safeTransport.toStopId,
        isMultiLeg: safeTransport.isMultiLeg
    });

    // Find indices by matching stop IDs
    let fromIndex = -1;
    let toIndex = -1;

    if (safeTransport.fromStopId && safeTransport.toStopId) {
        fromIndex = safeTransport.stops.findIndex(
            stop => stop.id == safeTransport.fromStopId
        );
        toIndex = safeTransport.stops.findIndex(
            stop => stop.id == safeTransport.toStopId
        );

        console.log('VehicleDetails - Matched by ID:', {
            fromIndex,
            toIndex,
            fromStopId: safeTransport.fromStopId,
            toStopId: safeTransport.toStopId
        });
    }

    // Filter stops between indices
    if (fromIndex !== -1 && toIndex !== -1) {
        const start = Math.min(fromIndex, toIndex);
        const end = Math.max(fromIndex, toIndex);
        const filtered = safeTransport.stops.slice(start, end + 1);

        setFilteredStops(filtered);
        console.log('VehicleDetails - Filtered stops:',
            `${filtered.length} out of ${safeTransport.stops.length}`);
    }
}, [safeTransport]);
```

### Distance Calculation Between Stops

```javascript
const calculateDistance = (stops, fromId, toId) => {
    if (!stops || stops.length < 2) return 'N/A';

    try {
        // Find indices
        const fromIndex = stops.findIndex(stop => stop.id == fromId);
        const toIndex = stops.findIndex(stop => stop.id == toId);

        if (fromIndex === -1 || toIndex === -1) return 'N/A';

        // Get segment stops
        const segmentStops = stops.slice(
            Math.min(fromIndex, toIndex),
            Math.max(fromIndex, toIndex) + 1
        );

        if (segmentStops.length < 2) return 'N/A';

        // Haversine distance calculation
        const R = 6371; // Earth radius in km
        let totalDistance = 0;

        for (let i = 0; i < segmentStops.length - 1; i++) {
            const stop1 = segmentStops[i];
            const stop2 = segmentStops[i + 1];

            const lat1 = parseFloat(stop1.stops_lat || stop1.lat);
            const lon1 = parseFloat(stop1.stops_lon || stop1.lon);
            const lat2 = parseFloat(stop2.stops_lat || stop2.lat);
            const lon2 = parseFloat(stop2.stops_lon || stop2.lon);

            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;

            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI / 180) *
                      Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            totalDistance += R * c;
        }

        return totalDistance.toFixed(2) + ' km';
    } catch (error) {
        console.error('Distance calculation error:', error);
        return 'N/A';
    }
};
```

---

## Map Visualization

### Polyline Decoding

**Google Encoded Polyline Algorithm:**
```javascript
const decodePolyline = (encoded) => {
    let points = [];
    let index = 0;
    let len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;

        // Decode latitude
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;

        // Decode longitude
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        points.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5
        });
    }

    return points;
};
```

### MapScreen Route Fetching

```javascript
useEffect(() => {
    if (allStops.length < 2 || fetchedRef.current) return;

    const getRoutes = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Fetch walking path from origin
            if (fromCoordinates && allStops.length > 0) {
                console.log('🚶 Fetching walking path from origin...');
                await fetchWalkingRoute(
                    fromCoordinates,
                    allStops[0],
                    setWalkingToStartCoords
                );
            }

            // 2. Fetch bus route segments
            if (stopsSegments.length > 0) {
                const segmentsData = [];

                for (let i = 0; i < stopsSegments.length; i++) {
                    const segment = stopsSegments[i];
                    const color = segmentColors[i % segmentColors.length];

                    const coords = await fetchRouteForSegment(segment);
                    if (coords && coords.length > 0) {
                        segmentsData.push({ coords, color });
                    }
                }

                setRouteSegments(segmentsData);
            }

            // 3. Fetch walking path to destination
            if (toCoordinates && allStops.length > 0) {
                console.log('🚶 Fetching walking path to destination...');
                const lastStop = allStops[allStops.length - 1];

                await fetchWalkingRoute(
                    lastStop,
                    toCoordinates,
                    setWalkingFromEndCoords
                );
            }

            fetchedRef.current = true;
        } catch (error) {
            console.error('Route fetch error:', error);
            setError('Failed to fetch route');
        } finally {
            setLoading(false);
        }
    };

    getRoutes();
}, [JSON.stringify(allStops)]);
```

### Polyline Rendering

```jsx
<MapView>
    {/* Walking path from origin */}
    {walkingToStartCoords.length > 0 && (
        <Polyline
            coordinates={walkingToStartCoords}
            strokeColor="#FF6B6B"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
        />
    )}

    {/* Bus route segments with different colors */}
    {routeSegments.map((segment, index) => (
        <Polyline
            key={`segment-${index}`}
            coordinates={segment.coords}
            strokeColor={segment.color}
            strokeWidth={5}
        />
    ))}

    {/* Walking path to destination */}
    {walkingFromEndCoords.length > 0 && (
        <Polyline
            coordinates={walkingFromEndCoords}
            strokeColor="#FF6B6B"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
        />
    )}
</MapView>
```

---

## Multi-Color Route Segments

### Duplicate Stop Detection

When a stop appears multiple times in the route, it indicates a **transfer point** where the user must change buses.

**Algorithm:**
```javascript
const splitIntoSegments = (stops) => {
    if (stops.length < 2) return [];

    const segments = [];
    let currentSegment = [stops[0]];

    for (let i = 1; i < stops.length; i++) {
        currentSegment.push(stops[i]);

        // Check if current stop is duplicate
        const isDuplicate = stops.slice(i + 1).some(
            s => s.name === stops[i].name &&
                 s.latitude === stops[i].latitude &&
                 s.longitude === stops[i].longitude
        );

        // If duplicate found, save segment and start new one
        if (isDuplicate || i === stops.length - 1) {
            if (currentSegment.length >= 2) {
                segments.push([...currentSegment]);
            }

            if (isDuplicate && i < stops.length - 1) {
                currentSegment = [stops[i]]; // Start new segment from transfer point
            }
        }
    }

    return segments;
};
```

### Color Assignment

```javascript
const segmentColors = [
    '#4CAF50', // Green - First bus
    '#FF9800', // Orange - Second bus
    '#2196F3', // Blue - Third bus
    '#E91E63', // Pink - Fourth bus
    '#9C27B0', // Purple - Fifth bus
    '#00BCD4', // Cyan - Sixth bus
];

// Assign colors cyclically
for (let i = 0; i < segments.length; i++) {
    const color = segmentColors[i % segmentColors.length];
    // Fetch and render segment with this color
}
```

### Example - Transfer at Duplicate Stop

**Input Stops:**
```
Bus Stop 1
Bus Stop 2
Bus Stop 3
Bus Stop 3  ← Duplicate (Transfer)
Bus Stop 4
Bus Stop 5
```

**Segments Created:**
```
Segment 1 (Green):  [Stop 1, Stop 2, Stop 3]
Segment 2 (Orange): [Stop 3, Stop 4, Stop 5]
```

**Map Visualization:**
```
●━━━━━━━●━━━━━●  Transfer  ●━━━━━●━━━━━●
Stop 1   Stop 2  Stop 3    Stop 4  Stop 5
    Green Path        Orange Path
```

---

## API Endpoints

### Base URL
```
http://192.168.1.76:3000/api
```

### 1. Get All Stops
```
GET /stops
```

**Response:**
```json
[
    {
        "id": 1,
        "stops_name": "Ratnapark",
        "stops_lat": 27.7024,
        "stops_lon": 85.3137
    },
    ...
]
```

### 2. Get Nearby Stops
```
GET /routes/nearby-stops?latitude=27.696655&longitude=85.305717&radius=2
```

**Parameters:**
- `latitude`: Origin latitude
- `longitude`: Origin longitude
- `radius`: Search radius in km (default: 2)

**Response:**
```json
[
    {
        "id": 101,
        "stops_name": "Ratnapark",
        "stops_lat": 27.7024,
        "stops_lon": 85.3137,
        "distance": 0.5
    },
    ...
]
```

### 3. Get Routes from Location
```
GET /routes/from-location?latitude=27.696655&longitude=85.305717&destinationStopId=120
```

**Parameters:**
- `latitude`: Origin latitude
- `longitude`: Origin longitude
- `destinationStopId`: Destination stop ID

**Response:**
```json
[
    {
        "walkingToStop": {
            "stopId": 101,
            "stopName": "Ratnapark",
            "distance": 0.5,
            "estimatedTime": "6 min",
            "coordinates": { "lat": 27.7024, "lon": 85.3137 }
        },
        "fromLocation": {
            "latitude": 27.696655,
            "longitude": 85.305717
        },
        "stops": [...],
        "vehicle": {...},
        "totalJourneyTime": "25 min"
    },
    ...
]
```

### 4. Get Routes Between Locations
```
GET /routes/between-locations?fromLat=27.696655&fromLng=85.305717&toLat=27.720&toLng=85.330
```

**Parameters:**
- `fromLat`: Origin latitude
- `fromLng`: Origin longitude
- `toLat`: Destination latitude
- `toLng`: Destination longitude

**Response:**
```json
[
    {
        "walkingToStop": {...},
        "walkingFromStop": {...},
        "fromLocation": {...},
        "toLocation": {...},
        "stops": [...],
        "totalJourneyTime": "35 min"
    },
    ...
]
```

### 5. Get Driving Directions (Backend Proxy)
```
GET /routes/driving-directions?origin=27.7,85.3&destination=27.6,85.3&waypoints=27.65,85.31|27.68,85.32
```

**Parameters:**
- `origin`: Starting coordinates (lat,lng)
- `destination`: Ending coordinates (lat,lng)
- `waypoints`: Intermediate points (optional)

**Response:**
```json
{
    "polyline": "encoded_polyline_string",
    "distance": { "text": "5.2 km", "value": 5200 },
    "duration": { "text": "15 mins", "value": 900 }
}
```

### 6. Get Walking Directions (Backend Proxy)
```
GET /routes/walking-directions?fromLat=27.696655&fromLng=85.305717&toLat=27.7&toLng=85.3
```

**Parameters:**
- `fromLat`: Starting latitude
- `fromLng`: Starting longitude
- `toLat`: Ending latitude
- `toLng`: Ending longitude

**Response:**
```json
{
    "polyline": "encoded_polyline_string",
    "distance": { "text": "500 m", "value": 500 },
    "duration": { "text": "6 mins", "value": 360 }
}
```

---

## Frontend Components

### SearchScreen.js

**Responsibilities:**
- Input validation
- Coordinate parsing
- API calls
- Data transformation
- Stop ID resolution

**Key Functions:**
```javascript
// Parse coordinate input
LocationService.parseCoordinateInput(input)

// Transform route data
transformRouteData(route, fromStopId, toStopId, isMultiLeg, transferStop, secondLeg)

// Extract stops from segments
if ((!route.stops || route.stops.length === 0) && route.segments) {
    route.stops = route.segments.reduce((allStops, segment) => {
        return segment.stops ? [...allStops, ...segment.stops] : allStops;
    }, []);
}
```

### VehicleDetails.js

**Responsibilities:**
- Display route information
- Filter stops by ID
- Show walking instructions
- Navigate to map

**Key Logic:**
```javascript
// ID-based stop filtering
const fromIndex = stops.findIndex(stop => stop.id == fromStopId);
const toIndex = stops.findIndex(stop => stop.id == toStopId);
const filteredStops = stops.slice(
    Math.min(fromIndex, toIndex),
    Math.max(fromIndex, toIndex) + 1
);
```

### MapScreen.js

**Responsibilities:**
- Render map
- Display polylines
- Place markers
- Fetch route data

**Key Features:**
- Multi-segment rendering
- Walking path visualization
- Transfer point detection
- Color-coded routes

---

## Troubleshooting

### Issue 1: Empty Stops List in Bus Details

**Symptoms:**
```
VehicleDetails - Matched by ID: { fromIndex: -1, toIndex: -1 }
```

**Cause:** `fromStopId` or `toStopId` not present in transformed data

**Solution:**
1. Check console for "Transform route with stops" log
2. Verify `fromStopId` and `toStopId` are numbers (not null)
3. Check if stops were extracted from segments

### Issue 2: Walking Path Not Showing

**Symptoms:**
- Only bus route visible
- No red dotted line

**Cause:** Coordinates not passed to MapScreen

**Solution:**
1. Check console: "🗺️ MapScreen received coordinates"
2. Verify `hasFromCoordinates` and/or `hasToCoordinates` is true
3. Check SearchScreen added coordinates to transformed data

### Issue 3: Wrong Walking Path

**Symptoms:**
- Walking path to wrong location
- Unexpected route

**Cause:** Incorrect coordinate parsing or passing

**Solution:**
1. Check "Added origin/destination coordinates" logs
2. Verify coordinate format: `lat,lon` (no spaces)
3. Check VehicleDetails passes correct coordinates

### Issue 4: Multiple Colors Not Showing

**Symptoms:**
- All segments same color
- No visual distinction between buses

**Cause:** Duplicate stops not detected

**Solution:**
1. Check console: "📍 Detected Segments"
2. Verify duplicate stops have same name AND coordinates
3. Check `splitIntoSegments()` function

### Issue 5: API Request Failed

**Symptoms:**
```
ERROR Network Error
```

**Cause:** Backend not running or wrong IP

**Solution:**
1. Verify backend running: `npm start` in backend directory
2. Check IP address in `api.js` matches machine IP
3. Test backend: `curl http://192.168.1.76:3000/api/stops`

---

## Performance Optimization

### 1. Stop Caching
```javascript
// Cache all stops in memory
let cachedStops = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getAllStops = async () => {
    const now = Date.now();

    if (cachedStops && (now - cacheTimestamp < CACHE_DURATION)) {
        return cachedStops;
    }

    const { data: stops } = await supabase.from("stops").select("*");
    cachedStops = stops;
    cacheTimestamp = now;

    return stops;
};
```

### 2. Route Calculation Optimization
```javascript
// Pre-filter routes by operator/vehicle type before distance calculation
const optimizedRouteSearch = async (fromId, toId) => {
    // 1. Get routes that contain both stops
    const candidateRoutes = await findRoutesWithBothStops(fromId, toId);

    // 2. Calculate distances only for candidates
    const routesWithDistances = candidateRoutes.map(route => ({
        ...route,
        distance: calculateRouteDistance(route, fromId, toId)
    }));

    // 3. Sort by distance
    return routesWithDistances.sort((a, b) =>
        parseFloat(a.distance) - parseFloat(b.distance)
    );
};
```

### 3. Map Rendering Optimization
```javascript
// Debounce map updates
const debouncedFitToMarkers = debounce(() => {
    if (mapRef.current) {
        mapRef.current.fitToCoordinates(coordinatesToFit, {
            edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
            animated: true
        });
    }
}, 300);
```

---

## Future Enhancements

### 1. Real-time Bus Tracking
- Integrate GPS data from buses
- Show live location on map
- Estimate arrival times

### 2. Offline Mode
- Cache routes and stops locally
- Fallback to cached data when offline
- Sync when connection restored

### 3. Multi-modal Transport
- Include other transport types (metro, cable car)
- Walking-only routes
- Bicycle routes

### 4. Fare Calculation
- Show fare for each segment
- Total journey cost
- Discount information

### 5. Accessibility Features
- Wheelchair-accessible routes
- Elevator/ramp information
- Audio guidance

---

## Appendix

### Coordinate Format Examples

**Valid Formats:**
```
27.696655,85.305717
27.696655, 85.305717
27.696655 , 85.305717
```

**Invalid Formats:**
```
27.696655 85.305717  (missing comma)
lat:27.696655,lon:85.305717  (has labels)
85.305717,27.696655  (reversed - lon,lat)
```

### Stop Name Matching

**Case-insensitive:**
```
"Jamal" == "jamal" == "JAMAL"
```

**Partial matching not supported:**
```
"Jama" != "Jamal"
```

### Distance Units

- **Haversine calculation**: Kilometers
- **Display**: Kilometers (km)
- **Walking speed**: 5 km/h (average)
- **Driving speed**: Varies by traffic

---

**Last Updated:** November 2025
**Version:** 2.0
**Maintainer:** Sawari Sathi Development Team
