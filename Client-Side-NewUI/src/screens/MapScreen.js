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
    completeRoute: '#9E9E9E',
    userJourney: colors.primary,
    walking: '#FF6B6B',
  };

  // Default values
  const stops = route.params?.stops || [];
  const fromLocation = route.params?.fromLocation || 'Starting Point';
  const toLocation = route.params?.toLocation || 'Destination';
  const routeInfo = route.params?.routeInfo || {};
  const isMultiLeg = route.params?.isMultiLeg || false;
  const transferStop = route.params?.transferStop || null;
  const secondLegStops = route.params?.secondLegStops || [];
  const fromCoordinates = route.params?.fromCoordinates || null;
  const toCoordinates = route.params?.toCoordinates || null;
  const userJourneyFromIndex = route.params?.userJourneyFromIndex ?? 0;
  const userJourneyToIndex = route.params?.userJourneyToIndex ?? (stops.length - 1);

  // Convert stops to proper format
  const convertedStops = stops.map((stop) => ({
    latitude: parseFloat(stop.lat || stop.stops_lat || 0),
    longitude: parseFloat(stop.lon || stop.stops_lon || 0),
    name: stop.name || stop.stops_name || 'Stop',
    isTransfer: transferStop ?
      (stop.name === transferStop.stops_name || stop.stops_name === transferStop.stops_name) : false
  }));

  const convertedSecondLegStops = secondLegStops.map((stop) => ({
    latitude: parseFloat(stop.lat || stop.stops_lat || 0),
    longitude: parseFloat(stop.lon || stop.stops_lon || 0),
    name: stop.name || stop.stops_name || 'Stop',
    isTransfer: transferStop ?
      (stop.name === transferStop.stops_name || stop.stops_name === transferStop.stops_name) : false
  }));

  const allStops = isMultiLeg ?
    [...convertedStops, ...convertedSecondLegStops.filter(stop =>
      !convertedStops.some(s => s.latitude === stop.latitude && s.longitude === stop.longitude)
    )] :
    convertedStops;

  const transferStopCoord = allStops.find(stop => stop.isTransfer);

  const splitRouteIntoJourneySegments = (stops, fromIdx, toIdx) => {
    if (stops.length < 2) return { beforeJourney: [], userJourney: [], afterJourney: [] };
    const safeFromIdx = Math.max(0, Math.min(fromIdx, stops.length - 1));
    const safeToIdx = Math.max(0, Math.min(toIdx, stops.length - 1));
    const beforeJourney = safeFromIdx > 0 ? stops.slice(0, safeFromIdx + 1) : [];
    const userJourney = stops.slice(safeFromIdx, safeToIdx + 1);
    const afterJourney = safeToIdx < stops.length - 1 ? stops.slice(safeToIdx) : [];
    return { beforeJourney, userJourney, afterJourney };
  };

  const journeySegments = splitRouteIntoJourneySegments(allStops, userJourneyFromIndex, userJourneyToIndex);

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
        if (fromCoordinates && journeySegments.userJourney.length > 0) {
          const userBoardingStop = journeySegments.userJourney[0];
          await fetchWalkingRoute(
            { latitude: fromCoordinates.latitude, longitude: fromCoordinates.longitude },
            userBoardingStop,
            setWalkingToStartCoords
          );
        }

        const segmentsData = [];

        if (journeySegments.beforeJourney.length >= 2) {
          const coords = await fetchRouteForSegment(journeySegments.beforeJourney);
          if (coords && coords.length > 0) {
            segmentsData.push({ coords, color: ROUTE_COLORS.completeRoute, type: 'before' });
          }
        }

        if (journeySegments.userJourney.length >= 2) {
          const coords = await fetchRouteForSegment(journeySegments.userJourney);
          if (coords && coords.length > 0) {
            segmentsData.push({ coords, color: ROUTE_COLORS.userJourney, type: 'userJourney' });
          }
        }

        if (journeySegments.afterJourney.length >= 2) {
          const coords = await fetchRouteForSegment(journeySegments.afterJourney);
          if (coords && coords.length > 0) {
            segmentsData.push({ coords, color: ROUTE_COLORS.completeRoute, type: 'after' });
          }
        }

        setRouteSegments(segmentsData);

        if (toCoordinates && journeySegments.userJourney.length > 0) {
          const userAlightingStop = journeySegments.userJourney[journeySegments.userJourney.length - 1];
          await fetchWalkingRoute(
            userAlightingStop,
            { latitude: toCoordinates.latitude, longitude: toCoordinates.longitude },
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
  }, [JSON.stringify(allStops), userJourneyFromIndex, userJourneyToIndex]);

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
    } catch (error) {
      console.error('Route fetch error:', error);
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
    } catch (error) {
      console.error('Walking route fetch error:', error);
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
    const markersJS = allStops.map((stop, i) => {
      const isUserBoardingStop = i === userJourneyFromIndex;
      const isUserAlightingStop = i === userJourneyToIndex;
      const isOnUserJourney = i >= userJourneyFromIndex && i <= userJourneyToIndex;

      let markerColor = '#BDBDBD';
      let markerSize = 8;
      if (isUserBoardingStop || isUserAlightingStop) {
        markerColor = colors.primary;
        markerSize = 12;
      } else if (isOnUserJourney) {
        markerColor = colors.primary;
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
        }).addTo(map).bindPopup('<b>${stop.name}</b><br>${isUserBoardingStop ? '🚌 Board Here' : isUserAlightingStop ? '🚌 Alight Here' : 'Stop ' + (i + 1)}');
      `;
    }).join('\n');

    const polylinesJS = routeSegments.map((segment) => {
      const coords = segment.coords.map(c => `[${c.latitude}, ${c.longitude}]`).join(',');
      return `
        L.polyline([${coords}], {
          color: '${segment.color}',
          weight: 5,
          opacity: 0.8
        }).addTo(map);
      `;
    }).join('\n');

    const walkingToStartJS = walkingToStartCoords.length > 0 ? `
      L.polyline([${walkingToStartCoords.map(c => `[${c.latitude}, ${c.longitude}]`).join(',')}], {
        color: '${ROUTE_COLORS.walking}',
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 5'
      }).addTo(map);
    ` : '';

    const walkingFromEndJS = walkingFromEndCoords.length > 0 ? `
      L.polyline([${walkingFromEndCoords.map(c => `[${c.latitude}, ${c.longitude}]`).join(',')}], {
        color: '${ROUTE_COLORS.walking}',
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 5'
      }).addTo(map);
    ` : '';

    const fromMarkerJS = fromCoordinates ? `
      L.marker([${fromCoordinates.latitude}, ${fromCoordinates.longitude}], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: ${colors.success}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map).bindPopup('<b>Starting Location</b>');
    ` : '';

    const toMarkerJS = toCoordinates ? `
      L.marker([${toCoordinates.latitude}, ${toCoordinates.longitude}], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: ${colors.danger || '#F44336'}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map).bindPopup('<b>Destination</b>');
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
          .custom-marker { background: transparent !important; border: none !important; }
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
          ${markersJS}
          ${polylinesJS}
          ${walkingToStartJS}
          ${walkingFromEndJS}
          ${fromMarkerJS}
          ${toMarkerJS}

          // Signal that map is ready
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
          {(walkingToStartCoords.length > 0 || walkingFromEndCoords.length > 0) && (
            <View style={styles.legendItem}>
              <View style={styles.lineExample}>
                <View style={[styles.lineColor, { backgroundColor: ROUTE_COLORS.walking }]} />
              </View>
              <Text style={styles.legendText}>Walking</Text>
            </View>
          )}

          <View style={styles.legendItem}>
            <View style={styles.lineExample}>
              <View style={[styles.lineColor, { backgroundColor: ROUTE_COLORS.userJourney }]} />
            </View>
            <Text style={styles.legendText}>Your Journey</Text>
          </View>

          {(journeySegments.beforeJourney.length >= 2 || journeySegments.afterJourney.length >= 2) && (
            <View style={styles.legendItem}>
              <View style={styles.lineExample}>
                <View style={[styles.lineColor, { backgroundColor: ROUTE_COLORS.completeRoute }]} />
              </View>
              <Text style={styles.legendText}>Full Route</Text>
            </View>
          )}

          <View style={styles.legendItem}>
            <MaterialCommunityIcons name="bus-stop" size={16} color={colors.primary} />
            <Text style={styles.legendText}>Board/Alight</Text>
          </View>
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
    right: 20,
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
    marginRight: spacing.md,
    marginBottom: spacing.xs,
  },
  legendText: {
    fontSize: fontSizes.sm,
    color: colors.primaryText,
    marginLeft: spacing.xs,
  },
  lineExample: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineColor: {
    height: 3,
    width: 16,
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
    bottom: 100,
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
