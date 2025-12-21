# Complete Test Guide - Sawari Sathi App

## Quick Start

### Step 1: Start Backend
```bash
cd C:\Users\Sumina.Awa\sumina\SawariSathi\backend
npm start
```

**Expected Output:**
```
Server running on port 3000
Connected to Supabase
```

### Step 2: Start Frontend
```bash
cd C:\Users\Sumina.Awa\sumina\SawariSathi\Client-Side-NewUI
npx expo start --clear
```

**Expected Output:**
```
Metro waiting on exp://192.168.1.76:8081
```

### Step 3: Open App
- Press `a` for Android emulator
- Or scan QR code with Expo Go app

---

## Test Cases

### Test 1: Bus Stop to Bus Stop Search
**Input:**
- From: `Ratnapark`
- To: `Jamal`

**Expected:**
1. Both locations auto-complete from bus stop list
2. Search shows available buses
3. "View on Map" shows bus route only (no walking paths)

---

### Test 2: Coordinates to Bus Stop Search
**Input:**
- From: `27.696655,85.305717` (or select "My Location")
- To: `Jamal`

**Expected:**
1. Coordinates option appears in dropdown
2. Search shows buses with walking distance
3. "View on Map" shows:
   - 🚶 Red dashed line (walking from coordinates to nearest stop)
   - 🚌 Colored line (bus route to Jamal)

**Console Logs to Verify:**
```
🎯 Added origin coordinates: { latitude: 27.696655, longitude: 85.305717 }
🗺️ MapScreen received coordinates: { hasFromCoordinates: true, ... }
🚶 Fetching walking path from origin to first stop...
```

---

### Test 3: Bus Stop to Coordinates Search
**Input:**
- From: `Jamal`
- To: `27.720,85.330`

**Expected:**
1. Coordinates option appears in To dropdown
2. Search shows buses with walking distance at end
3. "View on Map" shows:
   - 🚌 Colored line (bus route)
   - 🚶 Red dashed line (walking from last stop to destination)

**Console Logs to Verify:**
```
📍 Added destination coordinates: { latitude: 27.720, longitude: 85.330 }
🗺️ MapScreen received coordinates: { hasToCoordinates: true, ... }
🚶 Fetching walking path from last stop to destination...
```

---

### Test 4: Coordinates to Coordinates Search
**Input:**
- From: `27.696655,85.305717`
- To: `27.720,85.330`

**Expected:**
1. Both coordinate options appear
2. Search shows buses with walking at both ends
3. "View on Map" shows:
   - 🚶 Red dashed line (walking to first stop)
   - 🚌 Colored line (bus route)
   - 🚶 Red dashed line (walking from last stop)

**Console Logs to Verify:**
```
🎯 Added origin coordinates: { latitude: 27.696655, longitude: 85.305717 }
📍 Added destination coordinates: { latitude: 27.720, longitude: 85.330 }
🗺️ MapScreen received coordinates: { hasFromCoordinates: true, hasToCoordinates: true, ... }
```

---

### Test 5: Google Places Search (NEW!)
**Input:**
- From: `The Plaza` (select from Google Places)
- To: `Jamal`

**Steps:**
1. Tap on "From" input field
2. Type "The Plaza"
3. Wait 300ms for results
4. You should see TWO sections:
   - **🚌 Bus Stops** - Any matching bus stops
   - **📍 Places** - Google Places results (The Plaza Hotel, etc.)
5. Select a Google Place

**Expected:**
1. Google Places appear with full address
2. Selecting converts to coordinates automatically
3. Route calculates with walking path

**Console Logs to Verify:**
```
Places Autocomplete search: "The Plaza"
📍 Selected Google Place: The Plaza Hotel → 27.7195,85.3221
```

---

### Test 6: Multi-Color Route Segments (Transfer Points)
**Input:**
Search for a route that has a transfer (duplicate stop)

**Expected:**
1. Different colored paths for each bus segment
2. Transfer icon at duplicate stop
3. Legend shows "Bus 1", "Bus 2" with different colors

**Console Logs to Verify:**
```
🔍 All Stops: ["Stop 1", "Stop 2", "Stop 3", "Stop 3", "Stop 4"]
📍 Detected Segments: [
  { segment: 1, stops: [...], color: "#4CAF50" },
  { segment: 2, stops: [...], color: "#FF9800" }
]
```

---

## API Endpoints to Test Manually

### Test Backend Directly:

1. **Get All Stops:**
```
http://192.168.1.76:3000/api/stops
```

2. **Get Nearby Stops:**
```
http://192.168.1.76:3000/api/routes/nearby-stops?latitude=27.696655&longitude=85.305717&radius=2
```

3. **Google Places Autocomplete:**
```
http://192.168.1.76:3000/api/places/autocomplete?input=the+plaza
```

4. **Place Details:**
```
http://192.168.1.76:3000/api/places/details?placeId=<PLACE_ID_FROM_AUTOCOMPLETE>
```

5. **Walking Directions:**
```
http://192.168.1.76:3000/api/routes/walking-directions?fromLat=27.696655&fromLng=85.305717&toLat=27.7&toLng=85.3
```

6. **Driving Directions:**
```
http://192.168.1.76:3000/api/routes/driving-directions?origin=27.7,85.3&destination=27.6,85.3
```

---

## Troubleshooting

### Issue: Network Error on Frontend
**Solution:**
1. Check backend is running on port 3000
2. Verify IP in `api.js` matches your machine:
```javascript
const LOCAL_IP = '192.168.1.76'; // Update if changed
```
3. Phone/emulator and computer must be on same WiFi

### Issue: Google Places Not Appearing
**Solution:**
1. Check backend console for errors
2. Verify Places API is enabled in Google Cloud Console
3. Check API key in `backend/.env`:
```
GOOGLE_MAPS = AIzaSy...
```

### Issue: Map Not Loading
**Solution:**
1. Check API key in `Client-Side-NewUI/app.json`:
```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "AIzaSy..."
    }
  }
}
```
2. Also check `Client-Side-NewUI/.env`:
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

### Issue: Walking Path Not Showing
**Solution:**
1. Check console logs for coordinate detection
2. Verify `fromCoordinates` or `toCoordinates` are being passed
3. Check backend `/routes/walking-directions` endpoint

### Issue: Empty Stops List in Bus Details
**Solution:**
1. Check console for "Transformed result" log
2. Verify `stopsCount` is > 0
3. Check if stops are extracted from segments

---

## Expected Console Logs Flow

### Successful Coordinate → Bus Stop Search:

```
🌐 API_BASE_URL: http://192.168.1.76:3000/api

// SearchScreen
🔍 RAW ROUTE DATA FROM BACKEND: { hasStops: true, stopsCount: 15, ... }
🎯 Added origin coordinates: { latitude: 27.696655, longitude: 85.305717 }
Transformed result: { transformedStopsCount: 15, hasStops: true, ... }

// VehicleDetails
VehicleDetails - Processing stops: { totalStops: 15, fromStopId: 101, toStopId: 120 }
VehicleDetails - Matched by ID: { fromIndex: 0, toIndex: 14 }
VehicleDetails - Filtered stops: 15 out of 15
🏠 Origin coordinates added for map: { latitude: 27.696655, longitude: 85.305717 }

// MapScreen
🗺️ MapScreen received coordinates: {
  hasFromCoordinates: true,
  hasToCoordinates: false,
  fromCoordinates: { latitude: 27.696655, longitude: 85.305717 },
  stopsCount: 15
}
🎯 Origin coordinates detected: { latitude: 27.696655, longitude: 85.305717 }
🚶 Fetching walking path from origin to first stop...
Fetching walking route from backend: http://192.168.1.76:3000/api/routes/walking-directions?...
Walking route decoded: 8 points
🚌 Fetching segment 1/1: Stop 1 → ... → Stop 15
✅ Segment 1 fetched: 45 points, color: #4CAF50
📊 Total segments displayed: 1
```

---

## Visual Verification Checklist

### On Search Screen:
- [ ] From/To dropdowns open correctly
- [ ] Typing shows bus stops
- [ ] Typing 2+ chars shows Google Places (after 300ms)
- [ ] Section headers "🚌 Bus Stops" and "📍 Places" appear
- [ ] Loading spinner shows while fetching places
- [ ] Selecting Google Place closes dropdown

### On Available Transport:
- [ ] Bus route details show correctly
- [ ] Walking distance shows (if coordinate search)
- [ ] Operator name, timing, fare displayed

### On Bus Details:
- [ ] Stops list shows filtered stops
- [ ] First and last stops marked correctly
- [ ] "View on Map" button enabled

### On Map Screen:
- [ ] Map loads and centers on route
- [ ] Walking paths show as red dashed lines
- [ ] Bus route shows as colored solid line
- [ ] Multiple segments have different colors
- [ ] Transfer points marked with icon
- [ ] Legend shows correct labels

---

## Success Criteria

✅ All four search types work:
1. Bus Stop → Bus Stop
2. Coordinates → Bus Stop
3. Bus Stop → Coordinates
4. Coordinates → Coordinates

✅ Google Places integration:
1. Autocomplete suggestions appear
2. Places convert to coordinates
3. Routes calculate correctly

✅ Map visualization:
1. Walking paths display correctly
2. Bus routes display correctly
3. Multiple colors for transfers
4. All markers visible

---

**Last Updated:** December 2025
