# Walking Path Feature - Implementation Guide

## Overview
The Sawari Sathi app now supports complete journey visualization including:
- **Walking from Home/Location to Bus Stop** (with dashed red line)
- **Bus Route** (solid blue/purple line)
- **Walking from Bus Stop to Destination** (with dashed red line)

All routes are displayed on Google Maps with proper markers and legends.

---

## Features Implemented

### 1. **MapScreen Enhancements** ([MapScreen.js:16-595](Client-Side-NewUI/src/screens/MapScreen.js))
- ✅ Added Google Maps API Key
- ✅ Added walking path visualization (dashed red lines)
- ✅ Added home/origin marker (green home icon)
- ✅ Added destination marker (red home-map-marker icon)
- ✅ Added bus stop markers (blue bus-stop icons)
- ✅ Implemented `fetchWalkingRoute()` function using Google Directions API
- ✅ Updated map to fit all markers including home locations
- ✅ Added comprehensive legend showing all marker types and route types

### 2. **VehicleDetails Enhancements** ([VehicleDetails.js:120-167](Client-Side-NewUI/src/components/VehicleDetails.js))
- ✅ Updated to pass walking coordinates to MapScreen
- ✅ Added support for `fromLocation` and `toLocation` coordinates
- ✅ Handles location-based searches properly

### 3. **Backend API Updates** ([routeControllers.js](backend/src/controllers/routeControllers.js))
- ✅ `getRoutesBetweenLocations()` now includes origin and destination coordinates
- ✅ `getRoutesFromLocation()` now includes origin coordinates
- ✅ Walking information includes proper coordinates for both ends

---

## How to Test

### Prerequisites
1. Ensure you have Node.js installed
2. Ensure you have Expo CLI installed
3. Ensure backend database (Supabase) is configured

### Step 1: Start Backend Server

```bash
cd backend
npm install
npm start
```

Backend will run on `http://192.168.1.113:3000` (or your LOCAL_IP)

### Step 2: Start Frontend App

```bash
cd Client-Side-NewUI
npm install
npx expo start
```

Then scan QR code with Expo Go app (Android/iOS)

### Step 3: Test Walking Path Feature

#### Test Case 1: Location-to-Location Search (Complete Journey)

1. **Open the app** and go to Search screen
2. **Enter Origin**: Paste coordinates like `27.7172, 85.3240` (any home location)
3. **Enter Destination**: Paste coordinates like `27.6915, 85.3206` (another location)
4. **Search** for routes
5. **Select a route** from results
6. **View on Map** - You should see:
   - 🟢 Green home icon at origin
   - 🔴 Red home icon at destination
   - 🔵 Blue bus stop icons
   - Red dashed line from home to first bus stop
   - Blue solid line for bus route
   - Red dashed line from last bus stop to destination

#### Test Case 2: GPS to Bus Stop

1. **Enable GPS** on Search screen
2. **From**: Toggle "Use Current Location"
3. **To**: Select any bus stop
4. **Search** and **View on Map**
5. Should show walking path from your GPS location to the nearest bus stop

#### Test Case 3: Coordinates to Bus Stop

1. **From**: Paste `27.7172, 85.3240`
2. **To**: Select "Ratnapark" (or any bus stop)
3. **Search** and **View on Map**
4. Should show walking from coordinates to bus stop, then bus route

---

## Example Test Coordinates (Kathmandu, Nepal)

```javascript
// Home Location 1 (Thamel area)
Origin: 27.7172, 85.3240

// Home Location 2 (Patan area)
Destination: 27.6766, 85.3250

// Nearby Bus Stops:
Ratnapark: ~27.7017, 85.3142
Jamal: ~27.7085, 85.3150
Tripureshwor: ~27.6915, 85.3206
```

### Testing Workflow:
```
Home1 (27.7172, 85.3240)
    ↓ (walking - red dashed)
Ratnapark Bus Stop
    ↓ (bus route - blue solid)
Tripureshwor Bus Stop
    ↓ (walking - red dashed)
Home2 (27.6766, 85.3250)
```

---

## API Configuration

### Frontend API Configuration
Location: [api.js:1-3](Client-Side-NewUI/src/config/api.js)

```javascript
const LOCAL_IP = '192.168.1.113'; // Update this to your machine's IP
export const API_BASE_URL = `http://${LOCAL_IP}:3000/api`;
```

### Google Maps API Key
Location: [app.json:46-48](Client-Side-NewUI/app.json)

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
    }
  }
}
```

---

## Map Legend

### Markers:
- 🏠 **Green Home Icon**: Origin/Starting location
- 🏡 **Red Home Icon**: Destination location
- 🚏 **Blue Bus Stop**: Bus stops along the route
- 🔄 **Orange Transfer**: Transfer point (for multi-leg journeys)

### Routes:
- **Red Dashed Line**: Walking path (10-5 dash pattern)
- **Blue Solid Line**: First bus route
- **Purple Solid Line**: Second bus route (if multi-leg)

---

## Backend API Endpoints

### 1. Routes Between Locations
```
GET /api/routes/between-locations
Query Params:
  - fromLat: Starting latitude
  - fromLng: Starting longitude
  - toLat: Destination latitude
  - toLng: Destination longitude
  - radius: Search radius in km (default: 2)

Response includes:
  - routes with walkingInfo
  - fromLocation coordinates
  - toLocation coordinates
```

### 2. Routes from Current Location
```
GET /api/routes/from-location
Query Params:
  - latitude: User's current latitude
  - longitude: User's current longitude
  - destinationStopId: Target bus stop ID
  - radius: Search radius in km (default: 2)

Response includes:
  - routes with walkingToStop info
  - fromLocation coordinates
```

---

## Code Structure

```
Client-Side-NewUI/
├── src/
│   ├── screens/
│   │   └── MapScreen.js          # Main map visualization
│   ├── components/
│   │   ├── VehicleDetails.js     # Route details with map button
│   │   └── SearchResults.js      # Search results display
│   ├── utils/
│   │   └── locationService.js    # Location utilities
│   └── config/
│       └── api.js                # API configuration

backend/
└── src/
    └── controllers/
        └── routeControllers.js   # API endpoints
```

---

## Production Checklist

### Before Deploying:

1. **Environment Variables**
   - [ ] Set up `.env` file in backend with Supabase credentials
   - [ ] Update `LOCAL_IP` in [api.js](Client-Side-NewUI/src/config/api.js)
   - [ ] Verify Google Maps API key is valid and has proper restrictions

2. **API Security**
   - [ ] Add API key restrictions (HTTP referrers for Android, Bundle IDs for iOS)
   - [ ] Enable only required Google Maps APIs (Directions API, Maps SDK)
   - [ ] Set up billing alerts

3. **Testing**
   - [ ] Test with real GPS locations
   - [ ] Test with manual coordinates
   - [ ] Test multi-leg journeys
   - [ ] Test error cases (no routes found, GPS denied, etc.)
   - [ ] Test on both Android and iOS

4. **Performance**
   - [ ] Ensure map fits to bounds correctly
   - [ ] Verify polylines render smoothly
   - [ ] Check memory usage with multiple routes

5. **User Experience**
   - [ ] Add loading indicators
   - [ ] Add error messages
   - [ ] Add empty states
   - [ ] Ensure markers are tappable

---

## Troubleshooting

### Map not showing routes:
- Check if Google Maps API key is valid
- Verify network connectivity
- Check browser/app console for errors
- Ensure coordinates are valid (lat: -90 to 90, lng: -180 to 180)

### Walking paths not appearing:
- Verify backend is returning `fromLocation`/`toLocation` coordinates
- Check if `walkingInfo` is present in API response
- Ensure `fetchWalkingRoute()` is being called in MapScreen

### Backend errors:
- Verify Supabase credentials in `.env`
- Check database has proper stops data
- Ensure routes table has required relationships

---

## Future Enhancements

### Potential Features:
1. **Turn-by-turn walking directions** using Google Directions API steps
2. **Estimated walking time** display on map
3. **Alternative routes** with different walking distances
4. **Real-time bus tracking** integration
5. **Save favorite home locations** for quick access
6. **Offline map support** for downloaded areas
7. **Accessibility features** (voice navigation, high contrast)

---

## Support

For issues or questions:
- Check the console logs for detailed error messages
- Verify all API keys are properly configured
- Ensure device has location permissions enabled
- Test with known working coordinates first

---

## Contributors

- Implementation: Claude (AI Assistant)
- Project Owner: Sumina Awa

## Last Updated
November 19, 2025
