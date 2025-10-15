// Example Frontend Integration for Location-Based Route Search
// This shows how to integrate the new backend APIs with the React Native frontend

import axios from 'axios';
import * as Location from 'expo-location';

const API_BASE_URL = 'http://your-backend-url/api';

export class LocationBasedRouteService {
  
  // Get user's current location with permission handling
  static async getCurrentLocation() {
    try {
      // Request permission to access location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }

      // Get current position
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      };
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  }

  // Find nearby bus stops
  static async getNearbyStops(latitude, longitude, radius = 2) {
    try {
      const response = await axios.get(`${API_BASE_URL}/routes/nearby-stops`, {
        params: {
          latitude,
          longitude,
          radius
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching nearby stops:', error);
      throw error;
    }
  }

  // Find routes from current location to a destination stop
  static async getRoutesFromCurrentLocation(latitude, longitude, destinationStopId, radius = 2) {
    try {
      const response = await axios.get(`${API_BASE_URL}/routes/from-location`, {
        params: {
          latitude,
          longitude,
          destinationStopId,
          radius
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching routes from location:', error);
      throw error;
    }
  }

  // Find routes between two geographical locations
  static async getRoutesBetweenLocations(fromLat, fromLng, toLat, toLng, radius = 2) {
    try {
      const response = await axios.get(`${API_BASE_URL}/routes/between-locations`, {
        params: {
          fromLat,
          fromLng,
          toLat,
          toLng,
          radius
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching routes between locations:', error);
      throw error;
    }
  }

  // Enhanced search that automatically detects if user wants location-based search
  static async smartRouteSearch(fromInput, toInput, userLocation = null) {
    try {
      // Case 1: Both inputs are coordinates (lat,lng format)
      const coordRegex = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
      
      if (coordRegex.test(fromInput) && coordRegex.test(toInput)) {
        const [fromLat, fromLng] = fromInput.split(',').map(Number);
        const [toLat, toLng] = toInput.split(',').map(Number);
        return await this.getRoutesBetweenLocations(fromLat, fromLng, toLat, toLng);
      }
      
      // Case 2: From input is "My Location" or current location and to is a stop
      if ((fromInput === 'My Location' || fromInput === 'Current Location') && userLocation) {
        // Find the stop ID for the destination
        const stopsResponse = await axios.get(`${API_BASE_URL}/stops`);
        const destinationStop = stopsResponse.data.data.find(
          stop => stop.stops_name.toLowerCase() === toInput.toLowerCase()
        );
        
        if (destinationStop) {
          return await this.getRoutesFromCurrentLocation(
            userLocation.latitude,
            userLocation.longitude,
            destinationStop.id
          );
        }
      }
      
      // Case 3: Traditional stop-to-stop search
      const stopsResponse = await axios.get(`${API_BASE_URL}/stops`);
      const stops = stopsResponse.data.data;
      
      const fromStop = stops.find(stop => 
        stop.stops_name.toLowerCase() === fromInput.toLowerCase()
      );
      const toStop = stops.find(stop => 
        stop.stops_name.toLowerCase() === toInput.toLowerCase()
      );
      
      if (fromStop && toStop) {
        const response = await axios.get(`${API_BASE_URL}/routes/stops`, {
          params: {
            stop1: fromStop.id,
            stop2: toStop.id
          }
        });
        return response.data;
      }
      
      throw new Error('Unable to find matching stops for the provided inputs');
      
    } catch (error) {
      console.error('Error in smart route search:', error);
      throw error;
    }
  }
}

// Example usage in a React Native component:

/*
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { LocationBasedRouteService } from './LocationBasedRouteService';

const LocationSearchExample = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get user location on component mount
  useEffect(() => {
    getCurrentLocationAndNearbyStops();
  }, []);

  const getCurrentLocationAndNearbyStops = async () => {
    try {
      setLoading(true);
      
      // Get current location
      const location = await LocationBasedRouteService.getCurrentLocation();
      setUserLocation(location);
      
      // Get nearby stops
      const nearbyData = await LocationBasedRouteService.getNearbyStops(
        location.latitude, 
        location.longitude,
        1.5 // 1.5km radius
      );
      setNearbyStops(nearbyData.data);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to get location or nearby stops');
    } finally {
      setLoading(false);
    }
  };

  const searchFromCurrentLocation = async (destinationStopId) => {
    if (!userLocation) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    try {
      setLoading(true);
      
      const routeData = await LocationBasedRouteService.getRoutesFromCurrentLocation(
        userLocation.latitude,
        userLocation.longitude,
        destinationStopId
      );
      
      // Navigate to results screen or handle the route data
      console.log('Routes found:', routeData);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to find routes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={getCurrentLocationAndNearbyStops}>
        <Text>Find Nearby Stops</Text>
      </TouchableOpacity>
      
      {nearbyStops.map(stop => (
        <TouchableOpacity 
          key={stop.id}
          onPress={() => searchFromCurrentLocation(stop.id)}
        >
          <Text>{stop.stops_name} - {stop.distance}km away</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default LocationSearchExample;
*/