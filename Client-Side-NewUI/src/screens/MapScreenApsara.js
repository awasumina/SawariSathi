import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const MapScreen = ({ route, navigation }) => {
  const { stops, fromLocation, toLocation, routeInfo } = route.params;
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  // Transform stops data into coordinates
  const routeCoordinates = stops?.map(stop => ({
    latitude: parseFloat(stop.lat),
    longitude: parseFloat(stop.lon)
  })) || [];

  // Calculate initial region to fit all markers
  useEffect(() => {
    if (stops?.length > 0) {
      const coordinates = stops.map(stop => ({
        latitude: parseFloat(stop.lat),
        longitude: parseFloat(stop.lon)
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

    coords.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLon = Math.min(minLon, coord.longitude);
      maxLon = Math.max(maxLon, coord.longitude);
    });

    setRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5,
      longitudeDelta: (maxLon - minLon) * 1.5,
    });
    setLoading(false);
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
            {routeInfo?.name || 'Route'}
          </Text>
          <Text style={styles.routePath} numberOfLines={1}>
            {fromLocation} → {toLocation}
          </Text>
        </View>
      </View>

      {/* Map View */}
      <MapView
        style={styles.map}
        region={region}
        provider="google"
        showsUserLocation={false}
        showsTraffic={false}
        showsPointsOfInterest={false}
        customMapStyle={mapStyle}
      >
        {/* Route Line */}
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#ff6b00"
          strokeWidth={4}
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
            {routeInfo?.type || 'Vehicle'}: {routeInfo?.name || 'Route'}
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
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#ff6b00',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '600',
  },
  routePath: {
    fontSize: 14,
    color: '#666',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  startMarker: {
    backgroundColor: '#2ecc71',
  },
  stopMarker: {
    backgroundColor: '#3498db',
  },
  endMarker: {
    backgroundColor: '#e74c3c',
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
});

export default MapScreen;