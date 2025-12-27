import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSizes } from '../constants/theme';
import { API_BASE_URL } from '../config/api';

export default function MapScreen({ route, navigation }) {
  const [routeSegments, setRouteSegments] = useState([]);
  const [walkingToStartCoords, setWalkingToStartCoords] = useState([]);
  const [walkingFromEndCoords, setWalkingFromEndCoords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const fetchedRef = useRef(false);
  const webViewRef = useRef(null);

  // Define colors for route segments
  const ROUTE_COLORS = {
    fullRoute: '#9E9E9E',           // Gray for parts of route user is NOT travelling
    userJourney: colors.primary,     // Orange for user's journey (C to D)
    walking: '#FF6B6B',              // Red dashed for walking
    firstLeg: colors.primary,        // Orange for first bus in multi-route
    secondLeg: '#2196F3',            // Blue for second bus in multi-route
    transfer: '#FF9800',             // Orange for transfer point
  };

  // Default values
  const stops = route.params?.stops || [];
  const fromLocation = route.params?.fromLocation || 'Starting Point';
  const toLocation = route.params?.toLocation || 'Destination';
  const routeInfo = route.params?.routeInfo || {};
  const routeName = route.params?.routeName || routeInfo?.name || '';
  const routeNo = route.params?.routeNo || '';
  const paramIsMultiLeg = route.params?.isMultiLeg || false;
  const transferStop = route.params?.transferStop || null;
  const secondLegStops = route.params?.secondLegStops || [];
  const fromCoordinates = route.params?.fromCoordinates || null;
  const toCoordinates = route.params?.toCoordinates || null;
  const userJourneyFromIndex = route.params?.userJourneyFromIndex ?? 0;
  const userJourneyToIndex = route.params?.userJourneyToIndex ?? (stops.length - 1);

  // Log all stops for debugging
  console.log('🛑 All stops received:', stops.map((s, i) => ({
    index: i,
    name: s.name || s.stops_name,
    id: s.id || s.stops_id,
    lat: s.lat || s.stops_lat,
    lon: s.lon || s.stops_lon
  })));

  // Detect multi-leg route by checking:
  // 1. Route name contains " → " (arrow separator)
  // 2. Route number contains " → "
  // 3. There's a duplicate stop (same coordinates appearing twice = transfer point)
  const findDuplicateStopIndex = (stopsArray) => {
    for (let i = 0; i < stopsArray.length - 1; i++) {
      const stop = stopsArray[i];
      const lat = parseFloat(stop.lat || stop.stops_lat || 0);
      const lon = parseFloat(stop.lon || stop.stops_lon || 0);
      const name = stop.name || stop.stops_name || '';

      // Check if this stop appears again later
      for (let j = i + 1; j < stopsArray.length; j++) {
        const nextStop = stopsArray[j];
        const nextLat = parseFloat(nextStop.lat || nextStop.stops_lat || 0);
        const nextLon = parseFloat(nextStop.lon || nextStop.stops_lon || 0);
        const nextName = nextStop.name || nextStop.stops_name || '';

        // Same coordinates or same name = transfer point
        if ((Math.abs(lat - nextLat) < 0.0001 && Math.abs(lon - nextLon) < 0.0001) || name === nextName) {
          return { firstIndex: i, secondIndex: j, stopName: name };
        }
      }
    }
    return null;
  };

  const duplicateStop = findDuplicateStopIndex(stops);
  const hasArrowInName = routeName.includes(' → ') || routeNo.includes(' → ');
  const detectedMultiLeg = paramIsMultiLeg || hasArrowInName || duplicateStop !== null;
  const isMultiLeg = detectedMultiLeg;

  // Find the transfer point index
  const transferPointIndex = duplicateStop ? duplicateStop.firstIndex : -1;
  const transferPointName = duplicateStop ? duplicateStop.stopName : (transferStop?.stops_name || null);

  console.log('🗺️ Multi-leg detection:', {
    paramIsMultiLeg,
    hasArrowInName,
    routeName,
    routeNo,
    duplicateStop,
    detectedMultiLeg,
    isMultiLeg,
    transferPointIndex,
    transferPointName,
    totalStops: stops.length,
    secondLegStopsFromParams: secondLegStops.length
  });

  // Convert stops to proper format with leg info
  const convertedStops = stops.map((stop, index) => {
    const isBeforeTransfer = transferPointIndex === -1 || index <= transferPointIndex;
    const stopName = stop.name || stop.stops_name || 'Stop';

    return {
      latitude: parseFloat(stop.lat || stop.stops_lat || 0),
      longitude: parseFloat(stop.lon || stop.stops_lon || 0),
      name: stopName,
      isTransfer: transferPointName ? stopName === transferPointName : false,
      leg: isBeforeTransfer ? 1 : 2,
      originalIndex: index
    };
  });

  const convertedSecondLegStops = secondLegStops.map((stop) => ({
    latitude: parseFloat(stop.lat || stop.stops_lat || 0),
    longitude: parseFloat(stop.lon || stop.stops_lon || 0),
    name: stop.name || stop.stops_name || 'Stop',
    isTransfer: transferStop ?
      (stop.name === transferStop.stops_name || stop.stops_name === transferStop.stops_name) : false,
    leg: 2 // Second leg
  }));

  // For multi-leg detected from duplicate stops, split the stops into two legs
  let firstLegStops = [];
  let secondLegStopsConverted = [];

  if (isMultiLeg && transferPointIndex >= 0 && secondLegStops.length === 0) {
    // Split based on detected transfer point
    firstLegStops = convertedStops.slice(0, transferPointIndex + 1);
    secondLegStopsConverted = convertedStops.slice(transferPointIndex).map(s => ({ ...s, leg: 2 }));
    console.log('🚌 Split route at transfer point:', {
      firstLegCount: firstLegStops.length,
      secondLegCount: secondLegStopsConverted.length,
      transferAt: firstLegStops[firstLegStops.length - 1]?.name
    });
  } else if (isMultiLeg && secondLegStops.length > 0) {
    // Use provided second leg stops
    firstLegStops = convertedStops;
    secondLegStopsConverted = convertedSecondLegStops;
    console.log('🚌 Using provided second leg stops:', {
      firstLegCount: firstLegStops.length,
      secondLegCount: secondLegStopsConverted.length
    });
  } else {
    firstLegStops = convertedStops;
    secondLegStopsConverted = convertedSecondLegStops;
    console.log('🚌 Single leg route:', { stopsCount: firstLegStops.length });
  }

  // Combined stops for markers (avoid duplicates at transfer point)
  const allStops = isMultiLeg && secondLegStopsConverted.length > 0 ?
    [...firstLegStops, ...secondLegStopsConverted.filter(stop =>
      !firstLegStops.some(s => s.latitude === stop.latitude && s.longitude === stop.longitude)
    )] :
    convertedStops;

  // Find transfer stop index and coordinate
  const transferStopIndex = transferPointIndex >= 0 ? transferPointIndex : allStops.findIndex(stop => stop.isTransfer);
  const transferStopCoord = transferPointIndex >= 0 ? firstLegStops[transferPointIndex] : allStops.find(stop => stop.isTransfer);

  // Filter valid stops
  const validStops = allStops.filter(stop => stop.latitude !== 0 && stop.longitude !== 0);

  // Calculate center
  const centerLat = validStops.length > 0
    ? validStops.reduce((sum, s) => sum + s.latitude, 0) / validStops.length
    : 27.7172;
  const centerLng = validStops.length > 0
    ? validStops.reduce((sum, s) => sum + s.longitude, 0) / validStops.length
    : 85.3240;

  useEffect(() => {
    if (allStops.length < 2 || fetchedRef.current) return;

    const getRoutes = async () => {
      setLoading(true);
      setError(null);

      try {
        const segmentsData = [];

        // Fetch walking path from home to first stop if coordinates provided
        if (fromCoordinates && firstLegStops.length > 0) {
          const boardingStop = firstLegStops[userJourneyFromIndex] || firstLegStops[0];
          await fetchWalkingRoute(
            { latitude: fromCoordinates.latitude, longitude: fromCoordinates.longitude },
            boardingStop,
            setWalkingToStartCoords
          );
        }

        if (isMultiLeg) {
          // MULTI-LEG ROUTE: Show each leg in different color
          console.log('🎨 Drawing multi-leg route:', {
            firstLegStopsCount: firstLegStops.length,
            secondLegStopsCount: secondLegStopsConverted.length,
            userJourneyFromIndex,
            userJourneyToIndex,
            transferStopIndex
          });

          // First leg - before user journey (gray)
          if (userJourneyFromIndex > 0 && firstLegStops.length >= 2) {
            const beforeUserStops = firstLegStops.slice(0, userJourneyFromIndex + 1);
            if (beforeUserStops.length >= 2) {
              const coords = await fetchRouteForSegment(beforeUserStops);
              if (coords && coords.length > 0) {
                segmentsData.push({ coords, color: ROUTE_COLORS.fullRoute, type: 'firstLeg-before', leg: 1 });
                console.log('🟡 Added firstLeg-before (gray):', beforeUserStops.length, 'stops');
              }
            }
          }

          // First leg - user's journey (orange)
          const firstLegUserStart = Math.max(0, userJourneyFromIndex);
          const firstLegUserEnd = transferStopIndex >= 0 ? transferStopIndex : firstLegStops.length - 1;
          const firstLegUserStops = firstLegStops.slice(firstLegUserStart, firstLegUserEnd + 1);
          if (firstLegUserStops.length >= 2) {
            const coords = await fetchRouteForSegment(firstLegUserStops);
            if (coords && coords.length > 0) {
              segmentsData.push({ coords, color: ROUTE_COLORS.firstLeg, type: 'firstLeg-user', leg: 1 });
              console.log('🟠 Added firstLeg-user (orange):', firstLegUserStops.length, 'stops');
            }
          }

          // Second leg - user's journey (blue)
          if (secondLegStopsConverted.length >= 2) {
            const secondLegUserEnd = Math.min(userJourneyToIndex - firstLegStops.length + 1, secondLegStopsConverted.length - 1);
            const secondLegUserStops = secondLegStopsConverted.slice(0, Math.max(secondLegUserEnd + 1, secondLegStopsConverted.length));
            if (secondLegUserStops.length >= 2) {
              const coords = await fetchRouteForSegment(secondLegUserStops);
              if (coords && coords.length > 0) {
                segmentsData.push({ coords, color: ROUTE_COLORS.secondLeg, type: 'secondLeg-user', leg: 2 });
                console.log('🔵 Added secondLeg-user (blue):', secondLegUserStops.length, 'stops');
              }
            }
          }

          // Second leg - after user journey (gray) - if user doesn't travel to the end
          const userEndInSecondLeg = userJourneyToIndex - firstLegStops.length;
          if (userEndInSecondLeg < secondLegStopsConverted.length - 1 && secondLegStopsConverted.length >= 2) {
            const afterUserStops = secondLegStopsConverted.slice(userEndInSecondLeg);
            if (afterUserStops.length >= 2) {
              const coords = await fetchRouteForSegment(afterUserStops);
              if (coords && coords.length > 0) {
                segmentsData.push({ coords, color: ROUTE_COLORS.fullRoute, type: 'secondLeg-after', leg: 2 });
                console.log('🔘 Added secondLeg-after (gray):', afterUserStops.length, 'stops');
              }
            }
          }

        } else {
          // SINGLE ROUTE: Show user journey vs full route

          // Before user journey (A to C) - Gray
          if (userJourneyFromIndex > 0) {
            const beforeStops = allStops.slice(0, userJourneyFromIndex + 1);
            if (beforeStops.length >= 2) {
              const coords = await fetchRouteForSegment(beforeStops);
              if (coords && coords.length > 0) {
                segmentsData.push({ coords, color: ROUTE_COLORS.fullRoute, type: 'before' });
              }
            }
          }

          // User journey (C to D) - Orange (highlighted)
          const userStops = allStops.slice(userJourneyFromIndex, userJourneyToIndex + 1);
          if (userStops.length >= 2) {
            const coords = await fetchRouteForSegment(userStops);
            if (coords && coords.length > 0) {
              segmentsData.push({ coords, color: ROUTE_COLORS.userJourney, type: 'userJourney' });
            }
          }

          // After user journey (D to G) - Gray
          if (userJourneyToIndex < allStops.length - 1) {
            const afterStops = allStops.slice(userJourneyToIndex);
            if (afterStops.length >= 2) {
              const coords = await fetchRouteForSegment(afterStops);
              if (coords && coords.length > 0) {
                segmentsData.push({ coords, color: ROUTE_COLORS.fullRoute, type: 'after' });
              }
            }
          }
        }

        setRouteSegments(segmentsData);

        // Fetch walking path from last stop to destination if coordinates provided
        if (toCoordinates) {
          const lastStop = isMultiLeg && secondLegStopsConverted.length > 0
            ? secondLegStopsConverted[secondLegStopsConverted.length - 1]
            : allStops[userJourneyToIndex] || allStops[allStops.length - 1];
          await fetchWalkingRoute(
            lastStop,
            { latitude: toCoordinates.latitude, longitude: toCoordinates.longitude },
            setWalkingFromEndCoords
          );
        }

        fetchedRef.current = true;
      } catch (err) {
        console.error('Route fetch error:', err);
        setError('Failed to fetch route');
      } finally {
        setLoading(false);
      }
    };

    getRoutes();
  }, [JSON.stringify(allStops), userJourneyFromIndex, userJourneyToIndex, isMultiLeg]);

  useEffect(() => {
    return () => { fetchedRef.current = false; };
  }, [route.params]);

  const fetchRouteForSegment = async (stops) => {
    if (stops.length < 2) return [];
    try {
      const origin = stops[0];
      const destination = stops[stops.length - 1];
      const waypoints = stops.slice(1, -1).map((p) => `${p.latitude},${p.longitude}`).join('|');
      const url = `${API_BASE_URL}/routes/driving-directions?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=${waypoints}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.polyline) {
        return decodePolyline(json.polyline);
      }
      return [];
    } catch (err) {
      console.error('Route fetch error:', err);
      return [];
    }
  };

  const fetchWalkingRoute = async (origin, destination, setCoords) => {
    if (!origin || !destination) return;
    try {
      const url = `${API_BASE_URL}/routes/walking-directions?fromLat=${origin.latitude}&fromLng=${origin.longitude}&toLat=${destination.latitude}&toLng=${destination.longitude}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.polyline) {
        setCoords(decodePolyline(json.polyline));
      }
    } catch (err) {
      console.error('Walking route fetch error:', err);
    }
  };

  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lat += result & 1 ? ~(result >> 1) : result >> 1;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lng += result & 1 ? ~(result >> 1) : result >> 1;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  // Generate HTML for WebView map
  const generateMapHTML = () => {
    // Home icon SVG (for origin/destination that are not bus stops)
    const homeIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28"><path fill="%234CAF50" d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/></svg>`;
    const destinationIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28"><path fill="%23F44336" d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/></svg>`;

    // Generate markers for all stops
    const markersJS = allStops.map((stop, i) => {
      const isUserBoardingStop = i === userJourneyFromIndex;
      const isUserAlightingStop = i === userJourneyToIndex;
      const isOnUserJourney = i >= userJourneyFromIndex && i <= userJourneyToIndex;
      const isTransferPoint = stop.isTransfer;

      // Determine which leg this stop belongs to (for multi-leg)
      const isFirstLeg = i < firstLegStops.length;
      const legColor = isFirstLeg ? ROUTE_COLORS.firstLeg : ROUTE_COLORS.secondLeg;

      let markerColor = ROUTE_COLORS.fullRoute; // Gray for non-journey stops
      let markerSize = 8;
      let popupText = `Stop ${i + 1}`;

      if (isTransferPoint) {
        markerColor = ROUTE_COLORS.transfer;
        markerSize = 14;
        popupText = '🔄 Transfer Point';
      } else if (isUserBoardingStop) {
        markerColor = isMultiLeg ? legColor : ROUTE_COLORS.userJourney;
        markerSize = 12;
        popupText = '🚌 Board Here';
      } else if (isUserAlightingStop) {
        markerColor = isMultiLeg ? legColor : ROUTE_COLORS.userJourney;
        markerSize = 12;
        popupText = '🚌 Alight Here';
      } else if (isOnUserJourney) {
        markerColor = isMultiLeg ? legColor : ROUTE_COLORS.userJourney;
        markerSize = 8;
      }

      return `
        L.circleMarker([${stop.latitude}, ${stop.longitude}], {
          radius: ${markerSize},
          fillColor: '${markerColor}',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(map).bindPopup('<b>${stop.name}</b><br>${popupText}');
      `;
    }).join('\n');

    // Generate polylines for route segments
    const polylinesJS = routeSegments.map((segment) => {
      const coords = segment.coords.map(c => `[${c.latitude}, ${c.longitude}]`).join(',');
      const isUserSegment = segment.type.includes('user') || segment.type === 'userJourney';
      return `
        L.polyline([${coords}], {
          color: '${segment.color}',
          weight: ${isUserSegment ? 6 : 4},
          opacity: ${isUserSegment ? 1 : 0.6}
        }).addTo(map);
      `;
    }).join('\n');

    // Walking path from home to first stop
    const walkingToStartJS = walkingToStartCoords.length > 0 ? `
      L.polyline([${walkingToStartCoords.map(c => `[${c.latitude}, ${c.longitude}]`).join(',')}], {
        color: '${ROUTE_COLORS.walking}',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 8'
      }).addTo(map);
    ` : '';

    // Walking path from last stop to destination
    const walkingFromEndJS = walkingFromEndCoords.length > 0 ? `
      L.polyline([${walkingFromEndCoords.map(c => `[${c.latitude}, ${c.longitude}]`).join(',')}], {
        color: '${ROUTE_COLORS.walking}',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 8'
      }).addTo(map);
    ` : '';

    // Home/Origin marker with home icon
    const fromMarkerJS = fromCoordinates ? `
      L.marker([${fromCoordinates.latitude}, ${fromCoordinates.longitude}], {
        icon: L.divIcon({
          className: 'home-marker',
          html: '<div style="background-color: white; border-radius: 50%; padding: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><img src="data:image/svg+xml,${encodeURIComponent(homeIconSVG)}" width="24" height="24"/></div>',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      }).addTo(map).bindPopup('<b>🏠 Your Location</b><br>${fromLocation}');
    ` : '';

    // Destination marker with location pin icon
    const toMarkerJS = toCoordinates ? `
      L.marker([${toCoordinates.latitude}, ${toCoordinates.longitude}], {
        icon: L.divIcon({
          className: 'destination-marker',
          html: '<div style="background-color: white; border-radius: 50%; padding: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><img src="data:image/svg+xml,${encodeURIComponent(destinationIconSVG)}" width="24" height="24"/></div>',
          iconSize: [36, 36],
          iconAnchor: [18, 36]
        })
      }).addTo(map).bindPopup('<b>📍 Destination</b><br>${toLocation}');
    ` : '';

    // Calculate bounds
    let boundsCoords = validStops.map(s => [s.latitude, s.longitude]);
    if (fromCoordinates) boundsCoords.push([fromCoordinates.latitude, fromCoordinates.longitude]);
    if (toCoordinates) boundsCoords.push([toCoordinates.latitude, toCoordinates.longitude]);

    const boundsJS = boundsCoords.length > 0
      ? `map.fitBounds([${boundsCoords.map(c => `[${c[0]}, ${c[1]}]`).join(',')}], { padding: [50, 50] });`
      : `map.setView([${centerLat}, ${centerLng}], 13);`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; overflow: hidden; }
          #map { width: 100%; height: 100%; }
          .home-marker, .destination-marker { background: transparent !important; border: none !important; }
          .leaflet-popup-content { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .leaflet-popup-content b { color: #333; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: true,
            attributionControl: false
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          ${boundsJS}
          ${polylinesJS}
          ${walkingToStartJS}
          ${walkingFromEndJS}
          ${markersJS}
          ${fromMarkerJS}
          ${toMarkerJS}

          window.ReactNativeWebView.postMessage('mapReady');
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event) => {
    if (event.nativeEvent.data === 'mapReady') {
      setMapReady(true);
    }
  };

  const EmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialCommunityIcons
        name="map-search"
        size={64}
        color={`${colors.primary}80`}
      />
      <Text style={styles.emptyStateTitle}>No Route Selected</Text>
      <Text style={styles.emptyStateText}>
        Please search for a route on the Search screen and view it on the map.
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate('SearchTab')}
      >
        <Text style={styles.emptyStateButtonText}>Search Routes</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.mapContainer}>
        {allStops.length > 0 ? (
          <WebView
            ref={webViewRef}
            source={{ html: generateMapHTML() }}
            style={styles.map}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          />
        ) : (
          <EmptyState />
        )}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading route...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.routeName} numberOfLines={1}>
            {isMultiLeg ? 'Multi-Leg Journey' : routeInfo?.name || 'Route Map'}
          </Text>
          {allStops.length > 0 && (
            <Text style={styles.routePath} numberOfLines={1}>
              {fromLocation} → {isMultiLeg && transferStopCoord ?
                `${transferStopCoord.name} → ` : ''}{toLocation}
            </Text>
          )}
        </View>
      </View>

      {/* Route Legend */}
      {allStops.length > 0 && (
        <View style={styles.routeLegend}>
          {/* Walking legend */}
          {(walkingToStartCoords.length > 0 || walkingFromEndCoords.length > 0) && (
            <View style={styles.legendItem}>
              <View style={[styles.lineColor, { backgroundColor: ROUTE_COLORS.walking, borderStyle: 'dashed' }]} />
              <Text style={styles.legendText}>Walking</Text>
            </View>
          )}

          {isMultiLeg ? (
            <>
              {/* First leg */}
              <View style={styles.legendItem}>
                <View style={[styles.lineColor, { backgroundColor: ROUTE_COLORS.firstLeg }]} />
                <Text style={styles.legendText}>Bus 1</Text>
              </View>
              {/* Second leg */}
              <View style={styles.legendItem}>
                <View style={[styles.lineColor, { backgroundColor: ROUTE_COLORS.secondLeg }]} />
                <Text style={styles.legendText}>Bus 2</Text>
              </View>
              {/* Transfer */}
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: ROUTE_COLORS.transfer }]} />
                <Text style={styles.legendText}>Transfer</Text>
              </View>
            </>
          ) : (
            <>
              {/* User Journey */}
              <View style={styles.legendItem}>
                <View style={[styles.lineColor, { backgroundColor: ROUTE_COLORS.userJourney }]} />
                <Text style={styles.legendText}>Your Journey</Text>
              </View>
              {/* Full Route (if there's before/after) */}
              {(userJourneyFromIndex > 0 || userJourneyToIndex < allStops.length - 1) && (
                <View style={styles.legendItem}>
                  <View style={[styles.lineColor, { backgroundColor: ROUTE_COLORS.fullRoute }]} />
                  <Text style={styles.legendText}>Full Route</Text>
                </View>
              )}
            </>
          )}

          {/* Home marker legend */}
          {fromCoordinates && (
            <View style={styles.legendItem}>
              <MaterialCommunityIcons name="home" size={16} color="#4CAF50" />
              <Text style={styles.legendText}>Start</Text>
            </View>
          )}

          {/* Destination marker legend */}
          {toCoordinates && (
            <View style={styles.legendItem}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#F44336" />
              <Text style={styles.legendText}>End</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.fitToMarkersButton}
        onPress={() => {
          if (webViewRef.current) {
            let boundsCoords = validStops.map(s => [s.latitude, s.longitude]);
            if (fromCoordinates) boundsCoords.push([fromCoordinates.latitude, fromCoordinates.longitude]);
            if (toCoordinates) boundsCoords.push([toCoordinates.latitude, toCoordinates.longitude]);
            const js = `map.fitBounds([${boundsCoords.map(c => `[${c[0]}, ${c[1]}]`).join(',')}], { padding: [50, 50] }); true;`;
            webViewRef.current.injectJavaScript(js);
          }
        }}
      >
        <MaterialCommunityIcons
          name="fit-to-page-outline"
          size={24}
          color={colors.background}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  routeName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primaryText,
  },
  routePath: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
  },
  routeLegend: {
    position: 'absolute',
    bottom: 20,
    right: 70,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.sm,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendText: {
    fontSize: fontSizes.xs,
    color: colors.primaryText,
    marginLeft: 8,
  },
  lineColor: {
    height: 4,
    width: 20,
    borderRadius: 2,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 4,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.primaryText,
    fontSize: fontSizes.sm,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: colors.danger,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    color: colors.background,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: fontSizes.md,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateButtonText: {
    color: colors.background,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  fitToMarkersButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
