# Location-Based Route Search API

This document describes the new location-based route search functionality added to the SawariSathi backend.

## New Endpoints

### 1. Get Nearby Bus Stops
**Endpoint:** `GET /api/routes/nearby-stops`

Find bus stops within a specified radius of the user's current location.

**Query Parameters:**
- `latitude` (required): User's latitude coordinate
- `longitude` (required): User's longitude coordinate  
- `radius` (optional): Search radius in kilometers (default: 2km)

**Example Request:**
```
GET /api/routes/nearby-stops?latitude=27.7172&longitude=85.3240&radius=1.5
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 1,
      "stops_name": "Ratna Park",
      "stops_lat": "27.7158",
      "stops_lon": "85.3289",
      "distance": 0.45
    }
  ],
  "userLocation": {
    "latitude": 27.7172,
    "longitude": 85.3240
  },
  "searchRadius": 1.5
}
```

### 2. Get Routes from Current Location to Destination Stop
**Endpoint:** `GET /api/routes/from-location`

Find routes from user's current location to a specific destination bus stop.

**Query Parameters:**
- `latitude` (required): User's latitude coordinate
- `longitude` (required): User's longitude coordinate
- `destinationStopId` (required): ID of the destination bus stop
- `radius` (optional): Search radius for nearby stops in kilometers (default: 2km)

**Example Request:**
```
GET /api/routes/from-location?latitude=27.7172&longitude=85.3240&destinationStopId=5&radius=2
```

**Example Response:**
```json
{
  "data": [
    {
      "routeId": "123",
      "route_no": "12A",
      "route_name": "Kathmandu - Bhaktapur",
      "walkingToStop": {
        "stopName": "Ratna Park",
        "distance": 0.45,
        "estimatedTime": 5,
        "stopId": 1,
        "coordinates": {
          "latitude": 27.7158,
          "longitude": 85.3289
        }
      },
      "totalJourneyTime": 35,
      "stops": [...],
      "vehicles": [...]
    }
  ],
  "userLocation": {
    "latitude": 27.7172,
    "longitude": 85.3240
  },
  "nearbyStops": [...],
  "searchRadius": 2
}
```

### 3. Get Routes Between Two Locations (Both Coordinates)
**Endpoint:** `GET /api/routes/between-locations`

Find routes between two geographical locations (both provided as coordinates).

**Query Parameters:**
- `fromLat` (required): Source location latitude
- `fromLng` (required): Source location longitude
- `toLat` (required): Destination location latitude
- `toLng` (required): Destination location longitude
- `radius` (optional): Search radius for nearby stops in kilometers (default: 2km)

**Example Request:**
```
GET /api/routes/between-locations?fromLat=27.7172&fromLng=85.3240&toLat=27.6710&toLng=85.4298&radius=2
```

**Example Response:**
```json
{
  "data": [
    {
      "routeId": "123",
      "route_no": "12A",
      "route_name": "Kathmandu - Bhaktapur",
      "walkingInfo": {
        "toSourceStop": {
          "stopName": "Ratna Park",
          "distance": 0.45,
          "estimatedTime": 5,
          "stopId": 1,
          "coordinates": {...}
        },
        "fromDestStop": {
          "stopName": "Bhaktapur Durbar Square",
          "distance": 0.8,
          "estimatedTime": 10,
          "stopId": 25,
          "coordinates": {...}
        }
      },
      "totalJourneyTime": 45,
      "stops": [...],
      "vehicles": [...]
    }
  ],
  "sourceLocation": {...},
  "destinationLocation": {...},
  "sourceStops": [...],
  "destinationStops": [...],
  "searchRadius": 2
}
```

### 4. Enhanced Existing Endpoint
**Endpoint:** `GET /api/routes/stops` (Enhanced)

The existing endpoint now also supports location-based queries.

**Traditional Query (unchanged):**
```
GET /api/routes/stops?stop1=1&stop2=5
```

**New Location-based Query:**
```
GET /api/routes/stops?latitude=27.7172&longitude=85.3240&stop2=5&radius=2
```

## Usage Notes

1. **Walking Time Calculation**: Assumes average walking speed of 5 km/h (12 minutes per kilometer)

2. **Distance Calculation**: Uses Haversine formula for calculating distances between coordinates

3. **Search Limits**: 
   - Maximum 5 nearby stops for source location searches
   - Maximum 3 transfer route options to avoid overwhelming responses

4. **Error Handling**: Returns appropriate HTTP status codes:
   - 400: Bad Request (missing or invalid parameters)
   - 500: Internal Server Error

5. **Coordinate Format**: Use decimal degrees format (e.g., 27.7172, not degrees/minutes/seconds)

## Integration with Frontend

The frontend can now offer these new search options:

1. **"Search from my location"** - Use GPS to get user coordinates and search for routes
2. **"Find nearby stops"** - Show nearby bus stops on a map
3. **"Door-to-door directions"** - Provide walking + transit directions

The response includes walking distances and times to help users understand the complete journey requirements.