import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

const MapScreen = ({ route }) => {
  const { fromLocation, toLocation } = route.params;
  console.log(fromLocation, toLocation);
  
  const [coordinates, setCoordinates] = useState({
    from: { latitude: 27.7017, longitude: 85.3206 }, // Default Kathmandu coordinates
    to: { latitude: 27.6668, longitude: 85.3250 }, // Default Patan coordinates
  });

  // Function to get coordinates from location names (you can use an API or hardcoded values)
  const getCoordinates = (location) => {
    // You can use a geocoding API to convert location names to coordinates
    // For simplicity, I'm using hardcoded values here
    switch (location.toLowerCase()) {
      case 'kathmandu':
        return { latitude: 27.7017, longitude: 85.3206 };
      case 'patan durbar square':
        return { latitude: 40.6668, longitude: 45.3250 };
      default:
        return { latitude: 27.7017, longitude: 85.3206 };
    }
  };

  useEffect(() => {
    // Update coordinates when fromLocation or toLocation changes
    setCoordinates({
      from: getCoordinates(fromLocation),
      to: getCoordinates(toLocation),
    });
  }, [fromLocation, toLocation]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Route from {fromLocation} to {toLocation}</Text>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 27.7017,
          longitude: 85.3206,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        <Marker coordinate={coordinates.from} title="From Location" />
        <Marker coordinate={coordinates.to} title="To Location" />

        {/* <MapViewDirections
          origin={coordinates.from}
          destination={coordinates.to}
          apikey="YOUR_GOOGLE_MAPS_API_KEY" // Replace with your Google Maps API key
          strokeWidth={4}
          strokeColor="blue"
        /> */}
        <MapViewDirections
  origin={coordinates.from}
  destination={coordinates.to}
  //apikey="AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao"// Replace this with your actual API key
  strokeWidth={4}
  strokeColor="blue"
/>

      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingTop: 20,
  },
  map: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
});

export default MapScreen;
