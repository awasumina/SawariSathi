import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ASPECT_RATIO = SCREEN_WIDTH / SCREEN_HEIGHT;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSizes } from '../constants/theme';
import { API_BASE_URL } from '../config/api';

export default function MapScreen({ route, navigation }) {
  const [routeSegments, setRouteSegments] = useState([]); // Array of {coords, color} objects
  const [walkingToStartCoords, setWalkingToStartCoords] = useState([]);
  const [walkingFromEndCoords, setWalkingFromEndCoords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapLayout, setMapLayout] = useState(null);
  const fetchedRef = useRef(false);
  const mapRef = useRef(null);

  // Define colors for route segments
  const ROUTE_COLORS = {
    completeRoute: '#9E9E9E', // Gray for complete bus route (C to D)
    userJourney: colors.primary, // Orange/Primary for user's journey (A to B)
    walking: '#FF6B6B', // Red for walking paths
  };

  // Default values in case route.params is undefined
  const stops = route.params?.stops || [];
  const fromLocation = route.params?.fromLocation || 'Starting Point';
  const toLocation = route.params?.toLocation || 'Destination';
  const routeInfo = route.params?.routeInfo || {};
  const isMultiLeg = route.params?.isMultiLeg || false;
  const transferStop = route.params?.transferStop || null;
  const secondLegStops = route.params?.secondLegStops || [];
  const walkingInfo = route.params?.walkingInfo || null;
  const fromCoordinates = route.params?.fromCoordinates || null;
  const toCoordinates = route.params?.toCoordinates || null;

  // User journey segment indices (A to B within complete route C to D)
  const userJourneyFromIndex = route.params?.userJourneyFromIndex ?? 0;
  const userJourneyToIndex = route.params?.userJourneyToIndex ?? (stops.length - 1);

  // Debug: Log what coordinates were received
  console.log('🗺️ MapScreen received:', {
    hasFromCoordinates: !!fromCoordinates,
    hasToCoordinates: !!toCoordinates,
    stopsCount: stops.length,
    userJourneyFromIndex,
    userJourneyToIndex,
    isMultiLeg
  });
  
  // Convert received stops to proper format
  const convertedStops = stops.map((stop) => ({
    latitude: parseFloat(stop.lat || stop.stops_lat || 0),
    longitude: parseFloat(stop.lon || stop.stops_lon || 0),
    name: stop.name || stop.stops_name || 'Stop',
    isTransfer: transferStop ? 
      (stop.name === transferStop.stops_name || stop.stops_name === transferStop.stops_name) : false
  }));

  // Convert second leg stops if available
  const convertedSecondLegStops = secondLegStops.map((stop) => ({
    latitude: parseFloat(stop.lat || stop.stops_lat || 0),
    longitude: parseFloat(stop.lon || stop.stops_lon || 0),
    name: stop.name || stop.stops_name || 'Stop',
    isTransfer: transferStop ?
      (stop.name === transferStop.stops_name || stop.stops_name === transferStop.stops_name) : false
  }));

  // Combine both legs for visualization
  const allStops = isMultiLeg ?
    [...convertedStops, ...convertedSecondLegStops.filter(stop =>
      !convertedStops.some(s => s.latitude === stop.latitude && s.longitude === stop.longitude)
    )] :
    convertedStops;

  // Find transfer stop if it exists
  const transferStopCoord = allStops.find(stop => stop.isTransfer);

  // Split route into segments: before user journey, user journey, after user journey
  const splitRouteIntoJourneySegments = (stops, fromIdx, toIdx) => {
    if (stops.length < 2) return { beforeJourney: [], userJourney: [], afterJourney: [] };

    const safeFromIdx = Math.max(0, Math.min(fromIdx, stops.length - 1));
    const safeToIdx = Math.max(0, Math.min(toIdx, stops.length - 1));

    // Segment before user journey (route start C to user's start A)
    const beforeJourney = safeFromIdx > 0 ? stops.slice(0, safeFromIdx + 1) : [];

    // User's journey segment (A to B)
    const userJourney = stops.slice(safeFromIdx, safeToIdx + 1);

    // Segment after user journey (user's end B to route end D)
    const afterJourney = safeToIdx < stops.length - 1 ? stops.slice(safeToIdx) : [];

    return { beforeJourney, userJourney, afterJourney };
  };

  console.log('🔍 All Stops:', allStops.map(s => s.name));

  // Get journey segments for highlighting
  const journeySegments = splitRouteIntoJourneySegments(allStops, userJourneyFromIndex, userJourneyToIndex);
  console.log('📍 Route Segments:', {
    beforeJourney: journeySegments.beforeJourney.map(s => s.name),
    userJourney: journeySegments.userJourney.map(s => s.name),
    afterJourney: journeySegments.afterJourney.map(s => s.name),
  });

  useEffect(() => {
    // Prevent multiple fetches for the same route
    if (allStops.length < 2 || fetchedRef.current) {
      return;
    }

    const getRoutes = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch walking path from origin to user's boarding stop (A) if coordinates provided
        if (fromCoordinates && journeySegments.userJourney.length > 0) {
          const userBoardingStop = journeySegments.userJourney[0];
          console.log('🎯 Origin coordinates detected:', fromCoordinates);
          console.log('🚶 Fetching walking path from origin to boarding stop...');
          await fetchWalkingRoute(
            { latitude: fromCoordinates.latitude, longitude: fromCoordinates.longitude },
            userBoardingStop,
            setWalkingToStartCoords
          );
        }

        const segmentsData = [];

        // Fetch route BEFORE user journey (C to A) - Gray color
        if (journeySegments.beforeJourney.length >= 2) {
          console.log('🚌 Fetching BEFORE journey segment (gray):',
            journeySegments.beforeJourney.map(s => s.name).join(' → '));
          const coords = await fetchRouteForSegment(journeySegments.beforeJourney);
          if (coords && coords.length > 0) {
            segmentsData.push({ coords, color: ROUTE_COLORS.completeRoute, type: 'before' });
          }
        }

        // Fetch USER JOURNEY route (A to B) - Highlighted color
        if (journeySegments.userJourney.length >= 2) {
          console.log('🚌 Fetching USER JOURNEY segment (highlighted):',
            journeySegments.userJourney.map(s => s.name).join(' → '));
          const coords = await fetchRouteForSegment(journeySegments.userJourney);
          if (coords && coords.length > 0) {
            segmentsData.push({ coords, color: ROUTE_COLORS.userJourney, type: 'userJourney' });
          }
        }

        // Fetch route AFTER user journey (B to D) - Gray color
        if (journeySegments.afterJourney.length >= 2) {
          console.log('🚌 Fetching AFTER journey segment (gray):',
            journeySegments.afterJourney.map(s => s.name).join(' → '));
          const coords = await fetchRouteForSegment(journeySegments.afterJourney);
          if (coords && coords.length > 0) {
            segmentsData.push({ coords, color: ROUTE_COLORS.completeRoute, type: 'after' });
          }
        }

        setRouteSegments(segmentsData);
        console.log(`📊 Total segments displayed: ${segmentsData.length}`);

        // Fetch walking path from user's alighting stop (B) to destination if coordinates provided
        if (toCoordinates && journeySegments.userJourney.length > 0) {
          const userAlightingStop = journeySegments.userJourney[journeySegments.userJourney.length - 1];
          console.log('🎯 Destination coordinates detected:', toCoordinates);
          console.log('🚶 Fetching walking path from alighting stop to destination...');
          await fetchWalkingRoute(
            userAlightingStop,
            { latitude: toCoordinates.latitude, longitude: toCoordinates.longitude },
            setWalkingFromEndCoords
          );
        }

        fetchedRef.current = true; // Mark that we've fetched for this route
      } catch (error) {
        console.error('Route fetch error:', error);
        setError('Failed to fetch route');
      } finally {
        setLoading(false);
      }
    };

    getRoutes();
  }, [JSON.stringify(allStops), userJourneyFromIndex, userJourneyToIndex]);

  // Reset the fetch ref when route params change
  useEffect(() => {
    return () => {
      fetchedRef.current = false;
    };
  }, [route.params]);

  const fetchRouteForSegment = async (stops) => {
    if (stops.length < 2) return [];

    try {
      const origin = stops[0];
      const destination = stops[stops.length - 1];
      const waypoints = stops.slice(1, -1).map((p) => `${p.latitude},${p.longitude}`).join('|');

      // Use backend proxy instead of calling Google API directly
      const url = `${API_BASE_URL}/routes/driving-directions?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=${waypoints}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.polyline) {
        const points = decodePolyline(json.polyline);
        return points;
      } else {
        console.error('No routes found for segment:', json);
        return [];
      }
    } catch (error) {
      console.error('Route fetch error:', error);
      return [];
    }
  };

  const fetchWalkingRoute = async (origin, destination, setCoords) => {
    if (!origin || !destination) return;

    try {
      const url = `${API_BASE_URL}/routes/walking-directions?fromLat=${origin.latitude}&fromLng=${origin.longitude}&toLat=${destination.latitude}&toLng=${destination.longitude}`;

      console.log('Fetching walking route from backend:', url);

      const res = await fetch(url);
      const json = await res.json();

      if (json.polyline) {
        const points = decodePolyline(json.polyline);
        setCoords(points);
        console.log(`Walking route decoded: ${points.length} points`);
      } else {
        console.warn('No walking route found:', json.message);
      }
    } catch (error) {
      console.error('Walking route fetch error:', error);
      // Don't throw error for walking routes, just log it
    }
  };

  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return points;
  };

  // Calculate the initial region based on available stops
  // Filter out invalid coordinates (0,0)
  const validStops = allStops.filter(stop => stop.latitude !== 0 && stop.longitude !== 0);

  console.log('🗺️ Valid stops count:', validStops.length, 'First stop coords:', validStops[0]);

  const initialRegion = validStops.length > 0
    ? {
        latitude: validStops[0].latitude,
        longitude: validStops[0].longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }
    : {
        latitude: 27.7172, // Default to Kathmandu if no stops
        longitude: 85.3240,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };

  // Fit map to show all markers
  const fitMapToMarkers = () => {
    if (mapRef.current && mapLayout) {
      const coordinatesToFit = [...allStops];

      // Add home/origin coordinates if available
      if (fromCoordinates) {
        coordinatesToFit.unshift({
          latitude: fromCoordinates.latitude,
          longitude: fromCoordinates.longitude,
        });
      }

      // Add destination coordinates if available
      if (toCoordinates) {
        coordinatesToFit.push({
          latitude: toCoordinates.latitude,
          longitude: toCoordinates.longitude,
        });
      }

      if (coordinatesToFit.length > 0) {
        mapRef.current.fitToCoordinates(
          coordinatesToFit,
          {
            edgePadding: {
              top: 100,
              right: 50,
              bottom: 150,
              left: 50,
            },
            animated: true,
          }
        );
      }
    }
  };

  // Handle map layout ready
  const onMapReady = () => {
    setMapLayout(true);
    setTimeout(fitMapToMarkers, 500);
  };

  // Empty state component to show when no route is selected
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
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          onMapReady={onMapReady}
          showsUserLocation={true}
          showsMyLocationButton={false}
          mapType="standard"
          loadingEnabled={true}
          loadingIndicatorColor={colors.primary}
          loadingBackgroundColor={colors.background}
        >
        {/* Home/Origin Marker */}
        {fromCoordinates && (
          <Marker
            coordinate={{
              latitude: fromCoordinates.latitude,
              longitude: fromCoordinates.longitude,
            }}
            title="Starting Location"
            description={fromLocation}
          >
            <View style={styles.markerContainer}>
              <MaterialCommunityIcons
                name="home"
                size={28}
                color={colors.success}
              />
            </View>
          </Marker>
        )}

        {/* Destination/Home Marker */}
        {toCoordinates && (
          <Marker
            coordinate={{
              latitude: toCoordinates.latitude,
              longitude: toCoordinates.longitude,
            }}
            title="Destination"
            description={toLocation}
          >
            <View style={styles.markerContainer}>
              <MaterialCommunityIcons
                name="home-map-marker"
                size={28}
                color={colors.danger}
              />
            </View>
          </Marker>
        )}

        {/* Bus Stop Markers */}
        {allStops.map((stop, i) => {
          const isRouteStart = i === 0; // Route start (C)
          const isRouteEnd = i === allStops.length - 1; // Route end (D)
          const isUserBoardingStop = i === userJourneyFromIndex; // User boards here (A)
          const isUserAlightingStop = i === userJourneyToIndex; // User alights here (B)
          const isOnUserJourney = i >= userJourneyFromIndex && i <= userJourneyToIndex;

          // Check if this stop is a transfer point (appears multiple times)
          const occurrences = allStops.filter(
            s => s.name === stop.name &&
                 s.latitude === stop.latitude &&
                 s.longitude === stop.longitude
          ).length;
          const isTransferStop = occurrences > 1 || stop.isTransfer;

          // Determine marker description
          let description = `Stop ${i + 1}`;
          if (isUserBoardingStop) description = '🚌 Board Here (Your Start)';
          else if (isUserAlightingStop) description = '🚌 Alight Here (Your Destination)';
          else if (isRouteStart) description = '🚏 Route Start';
          else if (isRouteEnd) description = '🚏 Route End';
          else if (isTransferStop) description = '🔄 Transfer Point';

          return (
            <Marker
              key={`stop-${i}-${stop.latitude}-${stop.longitude}`}
              coordinate={{
                latitude: stop.latitude,
                longitude: stop.longitude,
              }}
              title={stop.name}
              description={description}
            >
              <View style={styles.markerContainer}>
                {isUserBoardingStop ? (
                  <MaterialCommunityIcons
                    name="bus-stop"
                    size={28}
                    color={colors.primary}
                  />
                ) : isUserAlightingStop ? (
                  <MaterialCommunityIcons
                    name="bus-stop-covered"
                    size={28}
                    color={colors.primary}
                  />
                ) : isRouteStart ? (
                  <MaterialCommunityIcons
                    name="flag"
                    size={24}
                    color="#9E9E9E"
                  />
                ) : isRouteEnd ? (
                  <MaterialCommunityIcons
                    name="flag-checkered"
                    size={24}
                    color="#9E9E9E"
                  />
                ) : isTransferStop ? (
                  <MaterialCommunityIcons
                    name="transfer"
                    size={28}
                    color="#FF9800"
                  />
                ) : isOnUserJourney ? (
                  <View style={[styles.stopMarker, { backgroundColor: colors.primary }]} />
                ) : (
                  <View style={[styles.stopMarker, { backgroundColor: '#BDBDBD' }]} />
                )}
              </View>
            </Marker>
          );
        })}

        {/* Walking path from home to first bus stop */}
        {walkingToStartCoords.length > 0 && (
          <Polyline
            coordinates={walkingToStartCoords}
            strokeColor="#FF6B6B"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}

        {/* Render all route segments with different colors */}
        {routeSegments.map((segment, index) => (
          <Polyline
            key={`segment-${index}`}
            coordinates={segment.coords}
            strokeColor={segment.color}
            strokeWidth={5}
          />
        ))}

        {/* Walking path from last bus stop to destination */}
        {walkingFromEndCoords.length > 0 && (
          <Polyline
            coordinates={walkingFromEndCoords}
            strokeColor="#FF6B6B"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {allStops.length === 0 && <EmptyState />}

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
          {/* Walking legend item */}
          {(walkingToStartCoords.length > 0 || walkingFromEndCoords.length > 0) && (
            <View style={styles.legendItem}>
              <View style={styles.lineExample}>
                <View style={[styles.lineColor, { backgroundColor: ROUTE_COLORS.walking }]} />
              </View>
              <Text style={styles.legendText}>Walking</Text>
            </View>
          )}

          {/* User Journey (highlighted) */}
          <View style={styles.legendItem}>
            <View style={styles.lineExample}>
              <View style={[styles.lineColor, { backgroundColor: ROUTE_COLORS.userJourney }]} />
            </View>
            <Text style={styles.legendText}>Your Journey</Text>
          </View>

          {/* Complete Route (gray) - show only if there are segments before/after user journey */}
          {(journeySegments.beforeJourney.length >= 2 || journeySegments.afterJourney.length >= 2) && (
            <View style={styles.legendItem}>
              <View style={styles.lineExample}>
                <View style={[styles.lineColor, { backgroundColor: ROUTE_COLORS.completeRoute }]} />
              </View>
              <Text style={styles.legendText}>Full Route</Text>
            </View>
          )}

          {/* Boarding/Alighting markers */}
          <View style={styles.legendItem}>
            <MaterialCommunityIcons name="bus-stop" size={16} color={colors.primary} />
            <Text style={styles.legendText}>Board/Alight</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.fitToMarkersButton}
        onPress={fitMapToMarkers}
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
  markerContainer: {
    backgroundColor: colors.background,
    padding: 4,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stopMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.sm,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
  legendLine: {
    width: 20,
    height: 4,
    borderRadius: 2,
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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