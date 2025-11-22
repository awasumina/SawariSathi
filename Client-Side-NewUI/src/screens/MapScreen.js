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
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSizes } from '../constants/theme';
import { API_BASE_URL } from '../config/api';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function MapScreen({ route, navigation }) {
  const [firstLegCoords, setFirstLegCoords] = useState([]);
  const [secondLegCoords, setSecondLegCoords] = useState([]);
  const [walkingToStartCoords, setWalkingToStartCoords] = useState([]);
  const [walkingFromEndCoords, setWalkingFromEndCoords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapLayout, setMapLayout] = useState(null);
  const fetchedRef = useRef(false);
  const mapRef = useRef(null);

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

  useEffect(() => {
    // Prevent multiple fetches for the same route
    if ((convertedStops.length < 2 && !isMultiLeg) || fetchedRef.current) {
      return;
    }

    const getRoutes = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch walking path from origin to first bus stop if coordinates provided
        if (fromCoordinates && convertedStops.length > 0) {
          await fetchWalkingRoute(
            { latitude: fromCoordinates.latitude, longitude: fromCoordinates.longitude },
            convertedStops[0],
            setWalkingToStartCoords
          );
        }

        // For first leg (bus route)
        if (convertedStops.length >= 2) {
          await fetchRoute(convertedStops, setFirstLegCoords);
        }

        // For second leg (if multi-leg journey)
        if (isMultiLeg && convertedSecondLegStops.length >= 2) {
          await fetchRoute(convertedSecondLegStops, setSecondLegCoords);
        }

        // Fetch walking path from last bus stop to destination if coordinates provided
        if (toCoordinates) {
          const lastStop = isMultiLeg && convertedSecondLegStops.length > 0
            ? convertedSecondLegStops[convertedSecondLegStops.length - 1]
            : convertedStops[convertedStops.length - 1];

          if (lastStop) {
            await fetchWalkingRoute(
              lastStop,
              { latitude: toCoordinates.latitude, longitude: toCoordinates.longitude },
              setWalkingFromEndCoords
            );
          }
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
  }, [JSON.stringify(convertedStops), JSON.stringify(convertedSecondLegStops), isMultiLeg, fromCoordinates, toCoordinates]);

  // Reset the fetch ref when route params change
  useEffect(() => {
    return () => {
      fetchedRef.current = false;
    };
  }, [route.params]);

  const fetchRoute = async (stops, setCoords) => {
    if (stops.length < 2) return;

    try {
      const origin = stops[0];
      const destination = stops[stops.length - 1];
      const waypoints = stops.slice(1, -1).map((p) => `${p.latitude},${p.longitude}`).join('|');
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=${waypoints}&key=${GOOGLE_MAPS_API_KEY}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.routes && json.routes.length > 0) {
        const points = decodePolyline(json.routes[0].overview_polyline.points);
        setCoords(points);
      } else {
        console.error('No routes found:', json);
        setError('No route found');
      }
    } catch (error) {
      console.error('Route fetch error:', error);
      throw error;
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
  const initialRegion = allStops.length > 0 
    ? {
        latitude: allStops[0].latitude,
        longitude: allStops[0].longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    : {
        latitude: 27.7172, // Default to Kathmandu if no stops
        longitude: 85.3240,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
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
      
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={onMapReady}
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
          const isFirstStop = i === 0;
          const isLastStop = i === allStops.length - 1;
          const isTransferStop = stop.isTransfer;

          return (
            <Marker
              key={`stop-${i}-${stop.latitude}-${stop.longitude}`}
              coordinate={{
                latitude: stop.latitude,
                longitude: stop.longitude,
              }}
              title={stop.name}
              description={isTransferStop ? 'Transfer Point' : `Stop ${i + 1}`}
            >
              <View style={styles.markerContainer}>
                {isFirstStop ? (
                  <MaterialCommunityIcons
                    name="bus-stop"
                    size={24}
                    color={colors.primary}
                  />
                ) : isLastStop ? (
                  <MaterialCommunityIcons
                    name="bus-stop"
                    size={24}
                    color={colors.primary}
                  />
                ) : isTransferStop ? (
                  <MaterialCommunityIcons
                    name="transfer"
                    size={24}
                    color={colors.accent}
                  />
                ) : (
                  <View style={styles.stopMarker} />
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

        {/* First leg bus route polyline */}
        {firstLegCoords.length > 0 && (
          <Polyline
            coordinates={firstLegCoords}
            strokeColor={colors.primary}
            strokeWidth={5}
          />
        )}

        {/* Second leg bus route polyline with different color */}
        {secondLegCoords.length > 0 && isMultiLeg && (
          <Polyline
            coordinates={secondLegCoords}
            strokeColor={colors.accent}
            strokeWidth={5}
          />
        )}

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

      {allStops.length > 0 && (
        <View style={styles.legend}>
          {fromCoordinates && (
            <View style={styles.legendItem}>
              <MaterialCommunityIcons
                name="home"
                size={16}
                color={colors.success}
              />
              <Text style={styles.legendText}>Home</Text>
            </View>
          )}

          <View style={styles.legendItem}>
            <MaterialCommunityIcons
              name="bus-stop"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.legendText}>Bus Stop</Text>
          </View>

          {isMultiLeg && (
            <View style={styles.legendItem}>
              <MaterialCommunityIcons
                name="transfer"
                size={16}
                color={colors.accent}
              />
              <Text style={styles.legendText}>Transfer</Text>
            </View>
          )}

          {toCoordinates && (
            <View style={styles.legendItem}>
              <MaterialCommunityIcons
                name="home-map-marker"
                size={16}
                color={colors.danger}
              />
              <Text style={styles.legendText}>Destination</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.routeLegend}>
        {(walkingToStartCoords.length > 0 || walkingFromEndCoords.length > 0) && (
          <View style={styles.legendItem}>
            <View style={styles.lineExample}>
              <View style={[styles.lineColor, { backgroundColor: '#FF6B6B' }]} />
            </View>
            <Text style={styles.legendText}>Walking</Text>
          </View>
        )}

        <View style={styles.legendItem}>
          <View style={styles.lineExample}>
            <View style={[styles.lineColor, { backgroundColor: colors.primary }]} />
          </View>
          <Text style={styles.legendText}>{isMultiLeg ? 'First Bus' : 'Bus Route'}</Text>
        </View>

        {isMultiLeg && (
          <View style={styles.legendItem}>
            <View style={styles.lineExample}>
              <View style={[styles.lineColor, { backgroundColor: colors.accent }]} />
            </View>
            <Text style={styles.legendText}>Second Bus</Text>
          </View>
        )}
      </View>

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
  map: {
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