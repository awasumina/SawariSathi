import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getVehicleIcon = (vehicleType) => {
  switch ((vehicleType || '').toLowerCase()) {
    case 'bus': return 'bus-outline';
    case 'microbus': return 'car-sport-outline';
    case 'tempo': return 'car-outline';
    default: return 'help-outline';
  }
};

const VehicleDetails = ({ route, navigation }) => {
  const { transport, fromLocation, toLocation } = route.params;
  
  const safeTransport = {
    ...transport,
    vehicle: {
      type: transport.vehicle?.type || 'bus',
      name: transport.vehicle?.name || 'Unknown Service',
      count: transport.vehicle?.count || 'N/A',
    },
    stops: transport.stops?.map(stop => ({
      name: stop.stops_name || 'Unknown Stop',
      lat: parseFloat(stop.stops_lat) || 0,
      lon: parseFloat(stop.stops_lon) || 0
    })) || [],
    fare: transport.fare ? `Rs. ${transport.fare}` : 'N/A',
    discountedFare: transport.discounted_fare ? `Rs. ${transport.discounted_fare}` : null,
    distance: transport.distance ? `${transport.distance} km` : 'Distance unavailable',
    routeNumber: transport.id || 'N/A',
    timing: transport.estimatedTime || '6:00am - 8:00pm'
  };

  const handleViewMap = () => {
    navigation.navigate('MapScreen', {
      stops: safeTransport.stops,
      fromLocation,
      toLocation,
      routeInfo: {
        name: safeTransport.vehicle.name,
        type: safeTransport.vehicle.type,
        number: safeTransport.routeNumber
      }
    });
  };

  const RouteStop = ({ stop, isLast }) => (
    <View style={styles.stopContainer}>
      <View style={styles.stopIndicator}>
        <View style={styles.dot} />
        {!isLast && <View style={styles.line} />}
      </View>
      <Text style={styles.stopText}>{stop.name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.vehicleHeader}>
            <Ionicons 
              name={getVehicleIcon(safeTransport.vehicle.type)} 
              size={32} 
              color="#ff6b00" 
              style={styles.vehicleIcon}
            />
            <View>
              <Text style={styles.routeName}>{safeTransport.vehicle.name}</Text>
              <Text style={styles.vehicleType}>
                {safeTransport.vehicle.type.toUpperCase()} SERVICE
              </Text>
            </View>
          </View>
          
          <Text style={styles.routePath}>
            {fromLocation} → {toLocation}
          </Text>
        </View>

        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="wallet-outline" size={22} color="#666" />
            <Text style={styles.statValue}>
              {safeTransport.fare}
              {safeTransport.discountedFare && (
                <Text style={styles.discountText}> ({safeTransport.discountedFare})</Text>
              )}
            </Text>
            <Text style={styles.statLabel}>Fare</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={22} color="#666" />
            <Text style={styles.statValue}>{safeTransport.distance}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={22} color="#666" />
            <Text style={styles.statValue}>{safeTransport.timing}</Text>
            <Text style={styles.statLabel}>Timing</Text>
          </View>
        </View>

        {/* Route Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Details</Text>
          <View style={styles.routeNumberContainer}>
            <Text style={styles.routeNumber}>Route #{safeTransport.routeNumber}</Text>
            <Text style={styles.vehicleCount}>
              {safeTransport.vehicle.count} vehicles operating
            </Text>
          </View>

          {/* Stops List */}
          <View style={styles.stopsList}>
            {safeTransport.stops.map((stop, index) => (
              <RouteStop 
                key={`${stop.name}-${index}`}
                stop={stop}
                isLast={index === safeTransport.stops.length - 1}
              />
            ))}
          </View>
        </View>

        {/* Map Button */}
        <TouchableOpacity 
          style={styles.mapButton}
          onPress={handleViewMap}
        >
          <Ionicons name="map" size={20} color="#fff" />
          <Text style={styles.mapButtonText}>View Route Map</Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          *Fares and schedules are subject to change without prior notice
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff5ec',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginBottom: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  vehicleIcon: {
    marginRight: 8,
  },
  routeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleType: {
    color: '#666',
    fontSize: 14,
  },
  routePath: {
    color: '#666',
    fontSize: 16,
    marginTop: 8,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginVertical: 4,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
  },
  discountText: {
    color: '#666',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  routeNumberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  routeNumber: {
    color: '#666',
  },
  vehicleCount: {
    color: '#666',
  },
  stopsList: {
    marginLeft: 8,
  },
  stopContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stopIndicator: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff6b00',
  },
  line: {
    width: 2,
    height: 40,
    backgroundColor: '#ddd',
    marginTop: 4,
  },
  stopText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b00',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    gap: 8,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  disclaimer: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
  },
});

export default VehicleDetails;