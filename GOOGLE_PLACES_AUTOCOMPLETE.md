# Google Places Autocomplete Feature

## Overview

The "Plan Your Trip" screen now supports Google Places Autocomplete, allowing users to search for **any location** (not just bus stops) like "The Plaza", "Radhe Radhe Bhatbhateni", "City Center Mall", etc.

## How It Works

### User Experience

1. **Open From/To Dropdown**: Tap on the From or To input field
2. **Start Typing**: Enter any place name (e.g., "The Plaza", "Bhatbhateni")
3. **See Suggestions**: Two types of suggestions appear:
   - **🚌 Bus Stops**: Matching bus stops from the database
   - **📍 Places**: Google Places suggestions for any location
4. **Select a Place**:
   - Bus Stop: Uses the stop name directly
   - Google Place: Fetches coordinates and uses them for route calculation

### Visual Layout

```
┌─────────────────────────────────────┐
│ 🔍 Search: "plaza"                  │
├─────────────────────────────────────┤
│ 🚌 Bus Stops                        │
│ ├─ Plaza Bus Stop                   │
│ └─ Plaza Chowk                      │
├─────────────────────────────────────┤
│ 📍 Places                           │
│ ├─ The Plaza Hotel                  │
│ │   Lazimpat, Kathmandu             │
│ ├─ Plaza Restaurant                 │
│ │   Thamel, Kathmandu               │
│ └─ City Center Plaza                │
│     Kamaladi, Kathmandu             │
└─────────────────────────────────────┘
```

## Technical Implementation

### Backend Endpoints

#### 1. Places Autocomplete
```
GET /api/places/autocomplete?input=the+plaza
```

**Parameters:**
- `input`: Search query (required)
- `location`: Center point for bias (optional, defaults to Kathmandu)
- `radius`: Search radius in meters (optional, default 50000)

**Response:**
```json
{
  "places": [
    {
      "placeId": "ChIJ...",
      "name": "The Plaza Hotel",
      "fullAddress": "Lazimpat, Kathmandu, Nepal",
      "types": ["lodging", "establishment"]
    }
  ],
  "status": "OK"
}
```

#### 2. Place Details (Get Coordinates)
```
GET /api/places/details?placeId=ChIJ...
```

**Response:**
```json
{
  "name": "The Plaza Hotel",
  "address": "Lazimpat, Kathmandu 44600, Nepal",
  "coordinates": {
    "latitude": 27.7195,
    "longitude": 85.3221
  }
}
```

### Frontend Components

#### SearchScreen.js Changes

1. **New State Variables:**
```javascript
const [googlePlaces, setGooglePlaces] = useState([]);
const [placesLoading, setPlacesLoading] = useState(false);
const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);
```

2. **Fetch Google Places (with debounce):**
```javascript
const fetchGooglePlaces = async (query) => {
    if (!query || query.length < 2) {
        setGooglePlaces([]);
        return;
    }

    try {
        setPlacesLoading(true);
        const response = await axios.get(`${API_BASE_URL}/places/autocomplete`, {
            params: { input: query }
        });
        setGooglePlaces(response.data.places || []);
    } catch (error) {
        console.error('Google Places fetch error:', error);
        setGooglePlaces([]);
    } finally {
        setPlacesLoading(false);
    }
};
```

3. **Get Place Coordinates:**
```javascript
const getPlaceCoordinates = async (placeId) => {
    const response = await axios.get(`${API_BASE_URL}/places/details`, {
        params: { placeId }
    });
    return response.data.coordinates;
};
```

4. **Handle Place Selection:**
```javascript
const handleGooglePlaceSelect = async (place, onSelect, onClose) => {
    const coordinates = await getPlaceCoordinates(place.placeId);
    if (coordinates) {
        // Use coordinates format: "lat,lng"
        const coordString = `${coordinates.latitude},${coordinates.longitude}`;
        onSelect(coordString);
    }
};
```

## Data Flow

### Selecting a Google Place

```
User types "The Plaza"
        ↓
Debounce (300ms)
        ↓
fetchGooglePlaces("The Plaza")
        ↓
Backend calls Google Places Autocomplete API
        ↓
Returns list of matching places
        ↓
User selects "The Plaza Hotel"
        ↓
handleGooglePlaceSelect()
        ↓
Backend calls Google Place Details API
        ↓
Gets coordinates: { lat: 27.7195, lng: 85.3221 }
        ↓
Sets location as "27.7195,85.3221"
        ↓
Existing coordinate search logic handles the rest
```

### Search Flow After Selection

```
From: "27.7195,85.3221" (The Plaza)
To: "Jamal"
        ↓
LocationService.parseCoordinateInput() detects coordinates
        ↓
API: /routes/from-location?latitude=27.7195&longitude=85.3221&destinationStopId=XXX
        ↓
Backend finds nearest stop to "The Plaza"
        ↓
Returns routes with walkingToStop info
        ↓
MapScreen displays:
  - Walking path: The Plaza → Nearest Bus Stop
  - Bus route: Nearest Stop → Jamal
```

## Features

### 1. Debounced Search
- Waits 300ms after user stops typing
- Prevents excessive API calls
- Provides smooth UX

### 2. Combined Results
- Shows both bus stops AND Google Places
- Bus stops appear first (faster, local data)
- Google Places appear below (API call)

### 3. Visual Differentiation
- 🚌 Bus stops: Blue icon, "Bus Stop" label
- 📍 Google Places: Green icon, full address shown

### 4. Loading States
- Shows spinner while fetching places
- "Searching places..." text during API call

### 5. Country Restriction
- Results restricted to Nepal (`components=country:np`)
- Location biased to Kathmandu area

## Console Logs

When selecting a Google Place:
```
📍 Selected Google Place: The Plaza Hotel → 27.7195,85.3221
```

## Files Modified

### Backend
1. **backend/src/controllers/routeControllers.js**
   - Added `getPlacesAutocomplete()` function
   - Added `getPlaceDetails()` function

2. **backend/src/routes/api.js**
   - Added `/api/places/autocomplete` route
   - Added `/api/places/details` route

### Frontend
1. **Client-Side-NewUI/src/screens/SearchScreen.js**
   - Added Google Places state variables
   - Added `fetchGooglePlaces()` function
   - Added `getPlaceCoordinates()` function
   - Added `handleGooglePlaceSelect()` function
   - Updated `LocationDropdown` to show Google Places
   - Added new styles for sections

## Usage Examples

### Example 1: The Plaza to Jamal
```
From: "The Plaza" → Select from Google Places
      → Converts to "27.7195,85.3221"
To: "Jamal" → Select from Bus Stops

Result:
- Walk 0.3km to Lazimpat Bus Stop
- Take Bus #XX to Jamal
```

### Example 2: Bhatbhateni to Ratnapark
```
From: "Radhe Radhe Bhatbhateni" → Select from Google Places
      → Converts to "27.6875,85.3324"
To: "Ratnapark" → Select from Bus Stops

Result:
- Walk 0.5km to Naya Baneshwor
- Take Bus #XX to Ratnapark
```

### Example 3: City Center to Coordinates
```
From: "City Center Mall" → Select from Google Places
      → Converts to "27.7089,85.3197"
To: "27.720,85.330" → Enter as coordinates

Result:
- Walk 0.2km to Kamaladi
- Take Bus #XX to Nearest Stop
- Walk 0.4km to destination
```

## API Costs

### Google Places API Pricing
- **Autocomplete**: $2.83 per 1000 requests
- **Place Details**: $17.00 per 1000 requests

### Optimization Strategies
1. **Debouncing**: 300ms delay reduces requests
2. **Minimum Query Length**: Only search when >= 2 characters
3. **Caching**: Consider adding Redis cache for popular searches
4. **Session Tokens**: Use session tokens to group autocomplete + details calls

## Testing

### Test Cases

1. **Search for known place:**
   - Type "The Plaza"
   - Verify Google Places appear
   - Select and verify coordinates are used

2. **Search for bus stop:**
   - Type "Ratnapark"
   - Verify bus stops appear first
   - Select and verify name is used

3. **Mixed search:**
   - Type "Thamel"
   - Verify both bus stops and places appear
   - Test selecting each type

4. **No results:**
   - Type random gibberish
   - Verify empty state shows correctly

## Troubleshooting

### Issue: No Google Places appearing
**Cause:** API key not enabled for Places API
**Solution:** Enable Places API in Google Cloud Console

### Issue: Places not in Nepal
**Cause:** Country restriction not applied
**Solution:** Check `components=country:np` in API call

### Issue: Coordinates not resolving
**Cause:** Place Details API call failing
**Solution:** Check API key permissions, verify placeId is valid

---

**Status:** ✅ Implemented and Ready
**Date:** December 2025
