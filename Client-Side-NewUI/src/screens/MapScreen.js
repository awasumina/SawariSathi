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
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSizes } from '../constants/theme';

const GOOGLE_MAPS_API_KEY = '';

export default function MapScreen({ route, navigation }) {
  const [routeCoords, setRouteCoords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);
  
  // Default values in case route.params is undefined
  const stops = route.params?.stops || [];
  const fromLocation = route.params?.fromLocation || 'Starting Point';
  const toLocation = route.params?.toLocation || 'Destination';
  const routeInfo = route.params?.routeInfo || {};
  
  const convertedStops = stops.map((stop) => ({
    latitude: parseFloat(stop.lat || stop.stops_lat || 0),
    longitude: parseFloat(stop.lon || stop.stops_lon || 0),
    name: stop.name || stop.stops_name || 'Stop',
  }));

  useEffect(() => {
    // Prevent multiple fetches for the same route
    if (convertedStops.length < 2 || fetchedRef.current) {
      return;
    }

    const getRoute = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const origin = convertedStops[0];
        const destination = convertedStops[convertedStops.length - 1];
        const waypoints = convertedStops.slice(1, -1).map((p) => `${p.latitude},${p.longitude}`).join('|');
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=${waypoints}&key=${GOOGLE_MAPS_API_KEY}`;

        const res = await fetch(url);
        const json = await res.json();

        if (json.routes && json.routes.length > 0) {
          const points = decodePolyline(json.routes[0].overview_polyline.points);
          setRouteCoords(points);
          fetchedRef.current = true; // Mark that we've fetched for this route
        } else {
          console.error('No routes found:', json);
          setError('No route found');
        }
      } catch (error) {
        console.error('Route fetch error:', error);
        setError('Failed to fetch route');
      } finally {
        setLoading(false);
      }
    };

    getRoute();
  }, [JSON.stringify(convertedStops)]); // Use JSON.stringify to properly compare the array

  // Reset the fetch ref when route params change
  useEffect(() => {
    return () => {
      fetchedRef.current = false;
    };
  }, [route.params]);

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
  const initialRegion = convertedStops.length > 0 
    ? {
        latitude: convertedStops[0].latitude,
        longitude: convertedStops[0].longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    : {
        latitude: 27.7172, // Default to Kathmandu if no stops
        longitude: 85.3240,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
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
        style={styles.map}
        initialRegion={initialRegion}
      >
        {convertedStops.map((stop, i) => (
          <Marker
            key={`stop-${i}`}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            title={stop.name}
            description={`Stop ${i + 1}`}
          >
            <View style={styles.markerContainer}>
              {i === 0 || i === convertedStops.length - 1 ? (
                <MaterialCommunityIcons
                  name={i === 0 ? 'flag-variant' : 'flag-checkered'}
                  size={24}
                  color={i === 0 ? colors.primary : colors.success}
                />
              ) : (
                <View style={styles.stopMarker} />
              )}
            </View>
          </Marker>
        ))}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={colors.primary}
            strokeWidth={4}
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

      {convertedStops.length === 0 && <EmptyState />}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.routeName} numberOfLines={1}>
            {routeInfo?.name || 'Route Map'}
          </Text>
          {convertedStops.length > 0 && (
            <Text style={styles.routePath} numberOfLines={1}>
              {fromLocation} → {toLocation}
            </Text>
          )}
        </View>
      </View>

      {convertedStops.length > 0 && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <MaterialCommunityIcons
              name="flag-variant"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.legendText}>Start</Text>
          </View>
          <View style={styles.legendItem}>
            <MaterialCommunityIcons
              name="flag-checkered"
              size={16}
              color={colors.success}
            />
            <Text style={styles.legendText}>End</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.stopMarker, { width: 10, height: 10 }]} />
            <Text style={styles.legendText}>Stop</Text>
          </View>
        </View>
      )}
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
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  legendText: {
    fontSize: fontSizes.sm,
    color: colors.primaryText,
    marginLeft: spacing.xs,
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
});