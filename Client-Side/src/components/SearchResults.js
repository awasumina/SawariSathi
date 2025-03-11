
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Helper function to get the appropriate vehicle icon
const getVehicleIcon = (vehicleType) => {
  switch (vehicleType?.toLowerCase()) {
    case 'bus':
      return 'bus-outline';
    case 'tempo':
      return 'car-outline';
    case 'microbus':
      return 'car-sport-outline';
    default:
      return 'bus-outline';
  }
};

const TransportCard = ({ route, navigation }) => {
  const timing = route.estimatedTime || '6:00am - 8:00pm';
  
  return (
    <>
    <TouchableOpacity 
  onPress={() => navigation.navigate('MapScreen', {
    fromLocation,
    toLocation
  })}
  style={styles.viewRouteButton}
>
  <Text style={styles.viewRouteText}>View Route</Text>
</TouchableOpacity>
    <TouchableOpacity 
    

      style={styles.transportCard }
      onPress={() => navigation.navigate('VehicleDetails', { transport: route })}
    >

      <View style={styles.transportIconContainer}>
        <Ionicons 
          name={getVehicleIcon(route.vehicle?.type)} 
          size={24} 
          color="#ff6b00" 
        />
      </View>
      <View style={styles.transportInfo}>
        <View style={styles.transportHeader}>
          <Text style={styles.transportName}>
            {route.vehicle?.name || 'Transport'}
          </Text>
          <Text style={styles.transportCount}>
            {route.vehicle?.count || ''} {route.vehicle?.type || 'Vehicles'}
          </Text>
        </View>
        <View style={styles.transportDetails}>
          <Text style={styles.fareText}>
            <Text style={styles.rupeeText}>Rs. </Text>
            {route.fare}
          </Text>
          <View style={styles.dotSeparator} />
          <Text style={styles.distanceText}>
            {/* {route.distance ? `${route.distance} km` : '4.3 km'} */}
          </Text>
          <View style={styles.dotSeparator} />
          <Text style={styles.timingText}>{timing}</Text>
        </View>
      </View>
    </TouchableOpacity>
</>
  );
};

const SearchResults = ({ route, navigation }) => {
  const { results, fromLocation, toLocation } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>SawariSathi</Text>
          <Text style={styles.subtitle}>Your travel guide for the city</Text>
        </View>

        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          <View style={styles.locationContainer}>
            <TouchableOpacity 
              style={styles.locationBox}
              onPress={() => navigation.goBack()}
            >
              <Text>{fromLocation}</Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.locationBox}
              onPress={() => navigation.goBack()}
            >
              <Text>{toLocation}</Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.transportSection}>
          <Text style={styles.sectionTitle}>Available Transport's</Text>
          {results && results.length > 0 ? (
            results.map((route, index) => (
              <TransportCard key={index} route={route} navigation={navigation} />
            ))
          ) : (
            <Text style={styles.noResultsText}>
              No transport routes found between these locations
            </Text>
          )}
        </View>
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
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  locationContainer: {
    gap: 12,
  },
  locationBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  transportSection: {
    padding: 16,
    paddingBottom: 100,
  },
  transportCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  transportIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#fff5ec',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transportInfo: {
    flex: 1,
  },
  transportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transportName: {
    fontSize: 16,
    fontWeight: '500',
  },
  transportCount: {
    fontSize: 14,
    color: '#666',
  },
  transportDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fareText: {
    fontSize: 14,
    color: '#666',
  },
  rupeeText: {
    color: '#ff6b00',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
  },
  timingText: {
    fontSize: 14,
    color: '#666',
  },
  noResultsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
});

export default SearchResults;