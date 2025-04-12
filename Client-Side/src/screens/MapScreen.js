import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

const MapScreen = ({ route, navigation }) => {
  const { stops, fromLocation, toLocation, routeInfo } = route.params;
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  // Transform stops data into coordinates
  const routeCoordinates =
    stops?.map((stop) => ({
      latitude: parseFloat(stop.lat),
      longitude: parseFloat(stop.lon),
    })) || [];

  // Calculate initial region to fit all markers
  useEffect(() => {
    if (stops?.length > 0) {
      const coordinates = stops.map((stop) => ({
        latitude: parseFloat(stop.lat),
        longitude: parseFloat(stop.lon),
      }));

      fitToCoordinates(coordinates);
    }
  }, [stops]);

  const fitToCoordinates = (coords) => {
    if (!coords || coords.length === 0) return;

    let minLat = coords[0].latitude;
    let maxLat = coords[0].latitude;
    let minLon = coords[0].longitude;
    let maxLon = coords[0].longitude;

    coords.forEach((coord) => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLon = Math.min(minLon, coord.longitude);
      maxLon = Math.max(maxLon, coord.longitude);
    });

    // Add padding to the bounds
    const latDelta = (maxLat - minLat) * 1.5;
    const lonDelta = (maxLon - minLon) * 1.5;

    setRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lonDelta,
    });
    setLoading(false);
  };

  // Fit map to route coordinates
  const handleMapReady = () => {
    if (mapRef.current && routeCoordinates.length > 0) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  // Match current location to the route
  const findNearestPointOnRoute = (userLocation) => {
    if (!routeCoordinates || routeCoordinates.length === 0) return null;

    let minDistance = Number.MAX_VALUE;
    let closestPoint = null;
    let segmentIndex = 0;

    // Find the closest segment on the route
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const start = routeCoordinates[i];
      const end = routeCoordinates[i + 1];

      const projection = projectPointToLineSegment(userLocation, start, end);

      const distance = calculateDistance(userLocation, projection);

      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = projection;
        segmentIndex = i;
      }
    }

    return {
      point: closestPoint,
      distance: minDistance,
      segmentIndex: segmentIndex,
      progress: segmentIndex / (routeCoordinates.length - 1),
    };
  };

  // Project a point onto a line segment
  const projectPointToLineSegment = (point, segStart, segEnd) => {
    const dx = segEnd.longitude - segStart.longitude;
    const dy = segEnd.latitude - segStart.latitude;

    // If segment is a point, return segment start
    if (dx === 0 && dy === 0) {
      return segStart;
    }

    // Calculate projection scalar
    const t =
      ((point.longitude - segStart.longitude) * dx +
        (point.latitude - segStart.latitude) * dy) /
      (dx * dx + dy * dy);

    // Constrain to segment
    const tConstrained = Math.max(0, Math.min(1, t));

    // Calculate projected point
    return {
      latitude: segStart.latitude + tConstrained * dy,
      longitude: segStart.longitude + tConstrained * dx,
    };
  };

  // Calculate distance between two points in km
  const calculateDistance = (point1, point2) => {
    const R = 6371; // Earth radius in km
    const dLat = deg2rad(point2.latitude - point1.latitude);
    const dLon = deg2rad(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(point1.latitude)) *
        Math.cos(deg2rad(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  // This would be called whenever the user's location changes
  const handleUserLocationChange = (event) => {
    const userLocation = event.nativeEvent.coordinate;
    const nearestInfo = findNearestPointOnRoute(userLocation);

    if (nearestInfo) {
      console.log(`Distance to route: ${nearestInfo.distance.toFixed(2)} km`);
      console.log(`Progress: ${(nearestInfo.progress * 100).toFixed(0)}%`);
      // You can use this info to update UI showing progress, ETA, etc.
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#ff6b00" />
        <Text style={styles.loadingText}>Loading Map...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.routeName} numberOfLines={1}>
            {routeInfo?.name || "Route"}
          </Text>
          <Text style={styles.routePath} numberOfLines={1}>
            {fromLocation} → {toLocation}
          </Text>
        </View>
      </View>

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={false}
        onMapReady={handleMapReady}
        onUserLocationChange={handleUserLocationChange}
        customMapStyle={mapStyle}
      >
        {/* Route Line */}
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#ff6b00"
          strokeWidth={4}
          lineDashPattern={[0]}
        />

        {/* Start Marker */}
        {stops.length > 0 && (
          <Marker
            coordinate={{
              latitude: parseFloat(stops[0].lat),
              longitude: parseFloat(stops[0].lon),
            }}
            title={`Start: ${fromLocation}`}
            description="Departure point"
          >
            <View style={[styles.marker, styles.startMarker]}>
              <Ionicons name="location" size={16} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Stop Markers */}
        {stops.slice(1, -1).map((stop, index) => (
          <Marker
            key={`stop-${index}`}
            coordinate={{
              latitude: parseFloat(stop.lat),
              longitude: parseFloat(stop.lon),
            }}
            title={`Stop ${index + 1}`}
            description={stop.name}
          >
            <View style={[styles.marker, styles.stopMarker]}>
              <Text style={styles.markerText}>{index + 1}</Text>
            </View>
          </Marker>
        ))}

        {/* End Marker */}
        {stops.length > 1 && (
          <Marker
            coordinate={{
              latitude: parseFloat(stops[stops.length - 1].lat),
              longitude: parseFloat(stops[stops.length - 1].lon),
            }}
            title={`End: ${toLocation}`}
            description="Destination point"
          >
            <View style={[styles.marker, styles.endMarker]}>
              <Ionicons name="flag" size={16} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Route Information</Text>
        <View style={styles.infoRow}>
          <Ionicons name="bus" size={18} color="#ff6b00" />
          <Text style={styles.infoText}>
            {routeInfo?.type || "Vehicle"}: {routeInfo?.name || "Route"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={18} color="#ff6b00" />
          <Text style={styles.infoText}>
            {stops.length} stops from {fromLocation} to {toLocation}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Custom map styling
const mapStyle = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#f5f5f5",
      },
    ],
  },
  {
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#ff6b00",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: "600",
  },
  routePath: {
    fontSize: 14,
    color: "#666",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  startMarker: {
    backgroundColor: "#2ecc71",
  },
  stopMarker: {
    backgroundColor: "#3498db",
  },
  endMarker: {
    backgroundColor: "#e74c3c",
  },
  markerText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  infoCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
});

export default MapScreen;
