# Quick Test Instructions for Walking Path Feature

## 🚀 Quick Start (5 Minutes)

### 1. Start Backend
```bash
cd backend
npm install      # First time only
npm start        # Starts server on port 3000
```

### 2. Start Frontend (New Terminal)
```bash
cd Client-Side-NewUI
npm install      # First time only
npx expo start   # Opens Expo DevTools
```

### 3. Open on Device
- Scan QR code with **Expo Go** app (Android/iOS)
- Or press `a` for Android emulator, `i` for iOS simulator

---

## 📱 Testing the Walking Path Feature

### Quick Test Scenario

1. **Open App** → Go to "Search" tab
2. **Enter These Coordinates:**
   - **From**: `27.7172, 85.3240`
   - **To**: `27.6766, 85.3250`
3. **Tap Search**
4. **Select any route** from results
5. **Tap "View on Map"**

### ✅ Expected Result:

You should see on the map:
- 🏠 **Green home icon** at start (27.7172, 85.3240)
- 🏡 **Red home icon** at end (27.6766, 85.3250)
- 🔴 **Red dashed line** (walking from home to nearest bus stop)
- 🔵 **Blue solid line** (bus route)
- 🔴 **Red dashed line** (walking from bus stop to destination)
- 🚏 **Blue bus stop markers** along the route

---

## 🎯 More Test Cases

### Test 1: GPS-Based Search
```
1. Enable Location on your device
2. In Search screen, toggle "Use Current Location"
3. Select any bus stop as destination
4. View on Map
```
**Expected**: Walking path from your location to nearest bus stop

### Test 2: Different Coordinates
```
From: 27.7085, 85.3150 (Near Jamal)
To: 27.6915, 85.3206 (Near Tripureshwor)
```

### Test 3: Multi-leg Journey
```
Search between two distant stops that require transfer
Example: From "Ratnapark" to "Koteshwor"
```
**Expected**: Two bus routes with different colors + transfer marker

---

## 🔧 Configuration Check

### Before Testing, Verify:

1. **Backend API URL** ([api.js](Client-Side-NewUI/src/config/api.js))
   ```javascript
   const LOCAL_IP = '192.168.1.113'; // Your computer's IP
   ```

   **To find your IP:**
   - Windows: `ipconfig` → Look for "IPv4 Address"
   - Mac/Linux: `ifconfig` → Look for "inet"

2. **Google Maps API Key** ([app.json](Client-Side-NewUI/app.json))
   ```json
   "apiKey": "AIzaSyBZcJXrLsY22iUxc4k1i-H2dzpt2B8PtIg"
   ```

3. **Backend Running**:
   - Open browser → `http://localhost:3000/api/stops`
   - Should return JSON with bus stops

---

## ❌ Troubleshooting

### Problem: "No routes found"
**Solution**:
- Check if backend is running
- Verify coordinates are in Kathmandu valley
- Try wider radius (default is 2km)

### Problem: Map shows but no walking paths
**Solution**:
- Check backend response includes `fromLocation`/`toLocation`
- Verify Google Maps API key is enabled
- Check console for errors

### Problem: "Unable to connect to server"
**Solution**:
- Verify backend is running on port 3000
- Update LOCAL_IP in api.js
- Check firewall isn't blocking connection

### Problem: Markers not showing
**Solution**:
- Tap the "fit to markers" button (bottom right)
- Check if coordinates are valid
- Restart the app

---

## 📊 What to Look For

### On Search Results Screen:
- ✅ Walking distance and time displayed
- ✅ Total journey time includes walking
- ✅ "From Location" and "To Location" shown clearly

### On Vehicle Details Screen:
- ✅ Complete list of bus stops
- ✅ "View on Map" button enabled
- ✅ Route information displayed

### On Map Screen:
- ✅ All markers visible
- ✅ Walking paths (dashed red lines)
- ✅ Bus routes (solid blue/purple lines)
- ✅ Legend showing marker types
- ✅ Map auto-fits to show entire journey
- ✅ Smooth animations

---

## 📸 Screenshot Checklist

Take screenshots of:
1. Search screen with coordinates entered
2. Search results showing walking info
3. Map showing complete journey with legend
4. Vehicle details showing all stops

---

## 🎉 Success Criteria

Your implementation is working if:
- ✅ User can enter coordinates and see routes
- ✅ Map shows walking paths from home to bus stop
- ✅ Map shows bus route with proper stops
- ✅ Map shows walking path from bus stop to destination
- ✅ All markers are clearly visible
- ✅ Legend explains all elements
- ✅ Map fits all points properly

---

## ⚡ Performance Tips

1. **Limit nearby stops**: Backend limits to 3 closest stops (already configured)
2. **Cache results**: Recent searches are saved automatically
3. **Debounce API calls**: Wait for user to finish typing
4. **Use production build**: For final testing, build release APK/IPA

---

## 📞 Need Help?

Check these files if something isn't working:
- [MapScreen.js](Client-Side-NewUI/src/screens/MapScreen.js) - Map visualization
- [routeControllers.js](backend/src/controllers/routeControllers.js) - API logic
- [WALKING_PATH_FEATURE.md](WALKING_PATH_FEATURE.md) - Full documentation

---

## 🚀 Production Deployment

Once testing is complete:

1. **Build APK/IPA:**
   ```bash
   cd Client-Side-NewUI
   eas build --platform android  # or ios
   ```

2. **Update API URL** to production server

3. **Secure API keys** with proper restrictions

4. **Submit to Play Store / App Store**

---

**Happy Testing! 🎊**
