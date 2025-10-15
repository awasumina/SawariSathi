// src/utils/locationService.js
import * as Location from 'expo-location';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export class LocationService {
  
  // Request location permissions and get current location
  static async getCurrentLocation() {
    try {
      console.log('Requesting location permissions...');
      
      // Request permission to access location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }

      console.log('Getting current position...');
      
      // Get current position with high accuracy
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });

      const result = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp
      };

      console.log('Location obtained:', result);
      return result;
      
    } catch (error) {
      console.error('Error getting location:', error);
      if (error.message.includes('Permission')) {
        throw new Error('Location permission denied. Please enable location access in settings.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Location request timed out. Please try again.');
      } else {
        throw new Error('Unable to get your location. Please check if location services are enabled.');
      }
    }
  }

  // Check if location permissions are granted
  static async hasLocationPermission() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  // Find nearby bus stops within a specified radius
  static async getNearbyStops(latitude, longitude, radius = 2) {
    try {
      console.log(`Fetching nearby stops for lat: ${latitude}, lng: ${longitude}, radius: ${radius}km`);
      
      const response = await axios.get(`${API_BASE_URL}/routes/nearby-stops`, {
        params: {
          latitude,
          longitude,
          radius
        },
        timeout: 15000
      });

      console.log(`Found ${response.data.data.length} nearby stops`);
      return response.data;
      
    } catch (error) {
      console.error('Error fetching nearby stops:', error);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please check your internet connection.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid location data provided.');
      } else {
        throw new Error('Unable to find nearby bus stops. Please try again.');
      }
    }
  }

  // Find routes from current location to a destination stop
  static async getRoutesFromCurrentLocation(latitude, longitude, destinationStopId, radius = 2) {
    try {
      console.log(`Finding routes from location to stop ${destinationStopId}`);
      
      const response = await axios.get(`${API_BASE_URL}/routes/from-location`, {
        params: {
          latitude,
          longitude,
          destinationStopId,
          radius
        },
        timeout: 20000
      });

      console.log(`Found ${response.data.data.length} route options from current location`);
      return response.data;
      
    } catch (error) {
      console.error('Error fetching routes from location:', error);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please check your internet connection.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid location or destination provided.');
      } else {
        throw new Error('Unable to find routes from your location. Please try again.');
      }
    }
  }

  // Find routes between two geographical locations
  static async getRoutesBetweenLocations(fromLat, fromLng, toLat, toLng, radius = 2) {
    try {
      console.log(`Finding routes between locations: (${fromLat}, ${fromLng}) to (${toLat}, ${toLng})`);
      
      const response = await axios.get(`${API_BASE_URL}/routes/between-locations`, {
        params: {
          fromLat,
          fromLng,
          toLat,
          toLng,
          radius
        },
        timeout: 25000
      });

      console.log(`Found ${response.data.data.length} route options between locations`);
      return response.data;
      
    } catch (error) {
      console.error('Error fetching routes between locations:', error);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please check your internet connection.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid location coordinates provided.');
      } else {
        throw new Error('Unable to find routes between locations. Please try again.');
      }
    }
  }

  // Enhanced search that handles both traditional and location-based queries
  static async smartRouteSearch(fromInput, toInput, userLocation = null, allStops = []) {
    try {
      console.log('Smart route search:', { fromInput, toInput, hasLocation: !!userLocation });

      // Case 1: From input is "My Location" or similar and we have user location
      if (this.isCurrentLocationInput(fromInput) && userLocation) {
        console.log('Location-based search detected');
        
        // Find the destination stop
        const destinationStop = allStops.find(
          stop => stop.stops_name.toLowerCase() === toInput.toLowerCase()
        );
        
        if (destinationStop) {
          return await this.getRoutesFromCurrentLocation(
            userLocation.latitude,
            userLocation.longitude,
            destinationStop.id
          );
        } else {
          throw new Error(`Destination stop "${toInput}" not found`);
        }
      }

      // Case 2: Both inputs are location names (traditional search)
      const fromStop = allStops.find(stop => 
        stop.stops_name.toLowerCase() === fromInput.toLowerCase()
      );
      const toStop = allStops.find(stop => 
        stop.stops_name.toLowerCase() === toInput.toLowerCase()
      );
      
      if (fromStop && toStop) {
        console.log('Traditional stop-to-stop search');
        const response = await axios.get(`${API_BASE_URL}/routes/stops`, {
          params: {
            stop1: fromStop.id,
            stop2: toStop.id
          },
          timeout: 20000
        });
        return response.data;
      }
      
      throw new Error('Unable to find matching stops for the provided inputs');
      
    } catch (error) {
      console.error('Error in smart route search:', error);
      throw error;
    }
  }

  // Helper method to check if input represents current location
  static isCurrentLocationInput(input) {
    if (!input || typeof input !== 'string') return false;
    
    const currentLocationKeywords = [
      'my location',
      'current location', 
      'here',
      'gps',
      'my position',
      'current position'
    ];
    
    return currentLocationKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
  }

  // Calculate walking time based on distance (assumes 5 km/h walking speed)
  static calculateWalkingTime(distanceKm) {
    if (!distanceKm || distanceKm <= 0) return 0;
    return Math.round(distanceKm * 12); // 12 minutes per km at 5 km/h
  }

  // Format distance for display
  static formatDistance(distanceKm) {
    if (!distanceKm || distanceKm <= 0) return 'N/A';
    
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else {
      return `${distanceKm.toFixed(1)}km`;
    }
  }

  // Format walking time for display
  static formatWalkingTime(minutes) {
    if (!minutes || minutes <= 0) return 'N/A';
    
    if (minutes < 60) {
      return `${minutes} min walk`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m walk`;
    }
  }

  // Check if coordinates are within a reasonable range (basic validation)
  static isValidCoordinate(latitude, longitude) {
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  // Get address from coordinates (reverse geocoding)
  static async getAddressFromCoordinates(latitude, longitude) {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      if (results && results.length > 0) {
        const address = results[0];
        return {
          formattedAddress: `${address.name || ''} ${address.street || ''}, ${address.city || ''} ${address.postalCode || ''}`.trim(),
          name: address.name,
          street: address.street,
          city: address.city,
          region: address.region,
          country: address.country,
          postalCode: address.postalCode
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }
}