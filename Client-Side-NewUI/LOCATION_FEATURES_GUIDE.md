# Frontend Location Features Setup Guide

This guide will help you set up the new location-based route search features in the SawariSathi React Native app.

## ✅ What's Already Done

The following features have been implemented:

### Backend (✅ Complete)
- Location-based route search API endpoints
- Nearby bus stops discovery
- Door-to-door route planning
- Enhanced existing endpoints for GPS compatibility

### Frontend (✅ Complete)
- Location service utility for GPS handling
- Enhanced HomeScreen with "Near Me" functionality
- Updated SearchScreen with GPS toggle
- Walking directions component
- Search results display for location-based routes

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have the following installed:
- `expo-location` (already in package.json)
- All other dependencies are already installed

### 2. Backend Setup
The backend is ready to go. Make sure your backend server is running on the correct IP address as configured in:
- `Client-Side-NewUI/src/config/api.js`

Update the `LOCAL_IP` constant if your server IP changes:
```javascript
const LOCAL_IP = '192.168.1.113'; // <-- Update this to your server IP
```

### 3. App Permissions
The app will automatically request location permissions when users try to use GPS features. No additional setup needed.

## 📱 New User Features

### 1. HomeScreen Features
- **"Near Me" Button**: Users can tap to find nearby bus stops
- **Nearby Stops Display**: Shows closest bus stops with walking distance/time
- **Quick Search**: Tap any nearby stop to start route search from that location

### 2. SearchScreen Features
- **GPS Toggle**: "Use GPS" toggle button to search from current location
- **Smart Location Detection**: App detects when user wants to search from their location
- **Real-time Coordinates**: Shows actual GPS coordinates when using location

### 3. Enhanced Search Results
- **Walking Directions**: Shows walking instructions to/from bus stops
- **Total Journey Time**: Displays complete travel time including walking
- **Distance Information**: Shows walking distances and estimated times

## 🔧 Usage Instructions

### For Users:

#### Option 1: Search from Current Location
1. Open the app and grant location permissions when prompted
2. Go to Search screen
3. Toggle "Use GPS" switch for the "From" location
4. Enter your destination
5. Tap "Find Transport"

#### Option 2: Find Nearby Stops First
1. On HomeScreen, tap the "Near Me" button
2. Grant location permissions when prompted
3. Browse nearby bus stops with distances
4. Tap any stop to search routes from there

#### Option 3: HomeScreen Quick Access
1. On HomeScreen, tap "Near Me" to find nearby stops
2. Tap any nearby stop card to start searching from that location
3. Enter your destination and search

### For Developers:

#### Testing Location Features
1. Use a physical device for best GPS accuracy
2. Enable location services in device settings
3. Test with different permission scenarios (allow/deny)
4. Test with various distances from bus stops

#### Customizing Search Radius
You can adjust the search radius in the LocationService:
```javascript
// In src/utils/locationService.js
const DEFAULT_RADIUS = 2; // Change this value (in km)
```

## 🐛 Troubleshooting

### Common Issues:

#### Location Permission Denied
- App shows clear error messages
- Users can retry or manually enable in device settings
- App gracefully falls back to traditional search

#### No Nearby Stops Found
- App shows helpful message when no stops are within radius
- Users can try increasing search area or use traditional search
- Consider adding manual location input option

#### API Connection Issues
- Check backend server is running
- Verify IP address in api.js config
- Test with traditional search first to ensure basic connectivity

#### GPS Accuracy Issues
- Recommend using outdoors or near windows
- App uses balanced accuracy for good performance
- Falls back gracefully when GPS is inaccurate

## 📊 Technical Details

### API Endpoints Added:
- `GET /api/routes/nearby-stops` - Find nearby bus stops
- `GET /api/routes/from-location` - Routes from GPS location to destination
- `GET /api/routes/between-locations` - Routes between two GPS locations
- `GET /api/routes/stops` - Enhanced to support GPS queries

### Key Components:
- `LocationService` - GPS and API handling utility
- `WalkingDirections` - Walking instruction display
- Enhanced `HomeScreen` - Location-based features
- Enhanced `SearchScreen` - GPS toggle and smart search
- Enhanced `SearchResults` - Location-aware results

### Data Flow:
1. User enables GPS → App requests permissions
2. User location obtained → Find nearby stops
3. User selects destination → Search routes from nearby stops
4. Results include walking directions → Display complete journey

## 🎯 Next Steps (Optional Enhancements)

### Suggested Future Improvements:
1. **Route Planning**: Full door-to-door directions with maps
2. **Real-time Tracking**: Live bus locations and arrival times  
3. **Offline Maps**: Cached bus stops for offline use
4. **Route History**: Save and recall frequent location-based searches
5. **Smart Suggestions**: AI-powered route recommendations based on location patterns

The current implementation provides a solid foundation for location-based transit search while maintaining compatibility with existing features.