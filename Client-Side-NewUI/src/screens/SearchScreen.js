// src/screens/SearchScreen.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    TextInput,
    Modal,
    ScrollView,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
    StatusBar,
    FlatList,
    Dimensions,
    Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { colors, spacing, fontSizes, borderRadius } from '../constants/theme';
import { storeData, getData } from '../utils/storage'; // Import storage utils
import { API_BASE_URL } from '../config/api';
import { LocationService } from '../utils/locationService';
// const API_BASE_URL = 'http://192.168.101.2:3000/api'; // Ensure correct IP
const RECENT_SEARCHES_KEY = '@recent_searches';
const MAX_RECENT_SEARCHES = 20;

export const transformRouteData = (apiDetailData, fromStopId, toStopId, isMultiLeg = false, transferStop = null, secondLeg = null) => {
    const calculateDistance = (stops, fromId, toId) => {
        if (!stops || stops.length < 2) return 'N/A';

        try {
            const fromIndex = stops.findIndex(stop => stop.id == fromId);
            const toIndex = stops.findIndex(stop => stop.id == toId);

            if (fromIndex === -1 || toIndex === -1) return 'N/A';

            const segmentStops = stops.slice(
                Math.min(fromIndex, toIndex),
                Math.max(fromIndex, toIndex) + 1
            );

            if (segmentStops.length < 2) return 'N/A';

            const R = 6371; // Earth radius in km
            let totalDistance = 0;

            for (let i = 0; i < segmentStops.length - 1; i++) {
                const stop1 = segmentStops[i];
                const stop2 = segmentStops[i + 1];

                // Ensure stops have valid coordinates
                if (!stop1.stops_lat || !stop1.stops_lon || !stop2.stops_lat || !stop2.stops_lon) {
                    continue;
                }

                const lat1 = parseFloat(stop1.stops_lat) * Math.PI / 180;
                const lon1 = parseFloat(stop1.stops_lon) * Math.PI / 180;
                const lat2 = parseFloat(stop2.stops_lat) * Math.PI / 180;
                const lon2 = parseFloat(stop2.stops_lon) * Math.PI / 180;

                const dLat = lat2 - lat1;
                const dLon = lon2 - lon1;
                const a = Math.sin(dLat / 2) ** 2 +
                    Math.cos(lat1) * Math.cos(lat2) *
                    Math.sin(dLon / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                totalDistance += R * c;
            }

            return totalDistance > 0 ? totalDistance.toFixed(1) : 'N/A';
        } catch (e) {
            console.error("Error calculating distance:", e);
            return 'N/A';
        }
    };

    // Handle fare data safely
    // const fareData = apiDetailData.fare || {};
    // const fare = typeof fareData.fare === 'number' ? fareData.fare : 0;
    // const discountedFare = typeof fareData.discounted_fare === 'number' ? fareData.discounted_fare : null;
    // const yatayatName = apiDetailData.yatayatName || 'Unknown Yatayat';

    // Calculate distances
    const mainDistance = calculateDistance(apiDetailData.stops || [], fromStopId, toStopId);
    const leg1Distance = isMultiLeg ? calculateDistance(apiDetailData.stops, fromStopId, transferStop?.id) : 0;
    const leg2Distance = isMultiLeg && secondLeg ? calculateDistance(secondLeg.stops, transferStop?.id, toStopId) : 0;

    // Extract fare data from the vehicle object if available
    const vehicleData = apiDetailData.vehicleData || {};
    const vehicleType = apiDetailData.vehicleType || 'bus';
    const yatayatName = apiDetailData.yatayatName || 'Unknown Operator';
    const fareData = apiDetailData.fare || {};
    const fare = typeof fareData.fare === 'number' ? fareData.fare : 0;
    const discountedFare = typeof fareData.discounted_fare === 'number' ? fareData.discounted_fare : null;
    const vehicleTiming = apiDetailData.vehicle_timing || 'N/A';

    const transformedData = {
        id: apiDetailData.yatayat_id || `detail-${Math.random()}`,
        vehicle: {
            type: vehicleType,
            name: apiDetailData.route_name || `Route ${apiDetailData.route_no || ''}`,
            count: 'N/A',
        },
        fare,
        discountedFare,
        stops: apiDetailData.stops || [],
        distance: mainDistance,
        estimatedTime: vehicleTiming,
        vehicleType,
        routeNo: apiDetailData.route_no || 'Unknown',
        routeName: apiDetailData.route_name || 'Unknown Route Name',
        yatayatName,
        fromStopId,
        toStopId,
        isMultiLeg,
        transferStop,
        secondLeg,
        transferCount: isMultiLeg ? 1 : 0,
        combinedFare: isMultiLeg && secondLeg ?
            ((fare || 0) + (secondLeg.fare || 0)) :
            fare,
        combinedDistance: isMultiLeg ?
            (parseFloat(leg1Distance) || 0) + (parseFloat(leg2Distance) || 0) :
            parseFloat(mainDistance) || 0
    };

    console.log('Transformed data with vehicle info:', {
        yatayatName: transformedData.yatayatName,
        fare: transformedData.fare,
        vehicleType: transformedData.vehicleType,
        routeNo: transformedData.routeNo
    });

    return transformedData;
};

const SearchScreen = ({ navigation, route }) => {
    const [fromLocation, setFromLocation] = useState('');
    const [toLocation, setToLocation] = useState('');
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);
    const [useCurrentLocation, setUseCurrentLocation] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);

    // Google Places Autocomplete state
    const [googlePlaces, setGooglePlaces] = useState([]);
    const [placesLoading, setPlacesLoading] = useState(false);
    const searchDebounceTimerRef = useRef(null);

    // Store selected place info (display name + coordinates)
    const [fromPlaceInfo, setFromPlaceInfo] = useState(null); // { displayName, coordinates }
    const [toPlaceInfo, setToPlaceInfo] = useState(null); // { displayName, coordinates }

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // Fetch locations
                const res = await axios.get(`${API_BASE_URL}/stops`);
                const uniqueLocations = res.data.data.reduce((acc, current) => {
                    // Add null/undefined checks
                    if (current && current.stops_name && current.id && 
                        !acc.find(item => item.name === current.stops_name)) {
                        acc.push({
                            id: current.id,
                            name: current.stops_name,
                            lat: current.stops_lat,
                            lon: current.stops_lon,
                        });
                    }
                    return acc;
                }, []);
                
                console.log(`Loaded ${uniqueLocations.length} unique locations`);
                setLocations(uniqueLocations);

                // Load recent searches
                const storedSearches = await getData(RECENT_SEARCHES_KEY);
                if (storedSearches && Array.isArray(storedSearches)) {
                    setRecentSearches(storedSearches);
                }
            } catch (error) {
                console.error('Initial data load error:', error);
                // Handle error appropriately
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (route.params?.searchAgain) {
            setFromLocation(route.params.searchAgain.from);
            setToLocation(route.params.searchAgain.to);
        } else if (route.params?.preSelectedRoute) {
            const routeName = route.params.preSelectedRoute.name;
            const parts = routeName.split(' - ');
            if (parts.length >= 2) {
                setFromLocation(parts[0]);
                setToLocation(parts[parts.length - 1]);
            }
        } else if (route.params?.useCurrentLocation) {
            // Set up for location-based search
            setUseCurrentLocation(true);
            setFromLocation('My Location');
            if (route.params.userLocation) {
                setUserLocation(route.params.userLocation);
            }
        } else if (route.params?.fromLocation) {
            // Coming from nearby stop selection
            setFromLocation(route.params.fromLocation);
            if (route.params.nearbyStopInfo) {
                setUserLocation(route.params.nearbyStopInfo.userLocation);
            }
        }
    }, [route.params]);

    // Get current location when user toggles location-based search
    const handleLocationToggle = async () => {
        if (!useCurrentLocation) {
            try {
                setLocationLoading(true);
                const location = await LocationService.getCurrentLocation();
                setUserLocation(location);
                setFromLocation('My Location');
                setUseCurrentLocation(true);
            } catch (error) {
                Alert.alert('Location Error', error.message);
                setUseCurrentLocation(false);
            } finally {
                setLocationLoading(false);
            }
        } else {
            setUseCurrentLocation(false);
            setFromLocation('');
            setUserLocation(null);
        }
    };

    // Fetch Google Places suggestions when user types
    const fetchGooglePlaces = async (query) => {
        if (!query || query.length < 2) {
            setGooglePlaces([]);
            return;
        }

        // Don't search if it looks like coordinates
        if (LocationService.looksLikeCoordinates(query)) {
            setGooglePlaces([]);
            return;
        }

        try {
            setPlacesLoading(true);
            const response = await axios.get(`${API_BASE_URL}/places/autocomplete`, {
                params: { input: query }
            });

            if (response.data.places) {
                setGooglePlaces(response.data.places);
            }
        } catch (error) {
            console.error('Google Places fetch error:', error);
            setGooglePlaces([]);
        } finally {
            setPlacesLoading(false);
        }
    };

    // Debounced search for Google Places - using ref to avoid re-renders
    useEffect(() => {
        // Clear any existing timer
        if (searchDebounceTimerRef.current) {
            clearTimeout(searchDebounceTimerRef.current);
        }

        if (searchQuery && searchQuery.length >= 2) {
            searchDebounceTimerRef.current = setTimeout(() => {
                fetchGooglePlaces(searchQuery);
            }, 300); // 300ms debounce
        } else {
            setGooglePlaces([]);
        }

        return () => {
            if (searchDebounceTimerRef.current) {
                clearTimeout(searchDebounceTimerRef.current);
            }
        };
    }, [searchQuery]);

    // Get Place Details (coordinates) when user selects a Google Place
    const getPlaceCoordinates = async (placeId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/places/details`, {
                params: { placeId }
            });
            return response.data.coordinates;
        } catch (error) {
            console.error('Place details fetch error:', error);
            return null;
        }
    };

    // Memoize filtered bus stops to prevent recalculation on every render
    const filteredBusStops = useMemo(() => {
        return locations.filter(location =>
            location && location.name &&
            location.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [locations, searchQuery]);

    // Memoize the dropdown options list
    const dropdownOptions = useMemo(() => {
        const allOptions = [];

        // Add "My Location" option if GPS is available
        if (userLocation) {
            if (!searchQuery || LocationService.isCurrentLocationInput(searchQuery)) {
                allOptions.push({
                    id: 'my-location',
                    name: 'My Location',
                    isMyLocation: true,
                    coordinates: userLocation,
                    section: 'special'
                });
            }
        }

        // Check if the search query looks like coordinates
        if (searchQuery && searchQuery.trim()) {
            const coordinates = LocationService.parseCoordinateInput(searchQuery);
            if (coordinates && LocationService.looksLikeCoordinates(searchQuery)) {
                allOptions.push({
                    id: 'coordinates',
                    name: searchQuery.trim(),
                    isCoordinates: true,
                    coordinates,
                    section: 'special'
                });
            }
        }

        // Add Bus Stops section header if there are bus stops
        if (filteredBusStops && filteredBusStops.length > 0) {
            allOptions.push({
                id: 'header-bus-stops',
                isHeader: true,
                title: '🚌 Bus Stops',
                section: 'header'
            });
            // Add bus stops (limit to 10 for performance)
            filteredBusStops.slice(0, 10).forEach(stop => {
                allOptions.push({
                    ...stop,
                    isBusStop: true,
                    section: 'busStops'
                });
            });
        }

        // Add Google Places section header if there are places
        if (googlePlaces && googlePlaces.length > 0) {
            allOptions.push({
                id: 'header-google-places',
                isHeader: true,
                title: '📍 Places',
                section: 'header'
            });
            // Add Google Places
            googlePlaces.forEach(place => {
                allOptions.push({
                    id: `place-${place.placeId}`,
                    name: place.name,
                    fullAddress: place.fullAddress,
                    placeId: place.placeId,
                    isGooglePlace: true,
                    section: 'googlePlaces'
                });
            });
        }

        return allOptions;
    }, [searchQuery, userLocation, filteredBusStops, googlePlaces]);

    const handleSearch = async () => {
        if (!fromLocation || !toLocation || fromLocation === toLocation) {
            alert('Please select valid departure and destination points.');
            return;
        }

        setLoading(true);
        try {
            // Validate inputs before calling smart search
            if (!fromLocation || !toLocation) {
                alert('Please select valid departure and destination points.');
                setLoading(false);
                return;
            }

            // Determine actual search values - use stored coordinates for Google Places
            let searchFromLocation = fromLocation.trim();
            let searchToLocation = toLocation.trim();

            // If user selected a Google Place, use the stored coordinates for the actual search
            if (fromPlaceInfo && fromPlaceInfo.displayName === fromLocation) {
                searchFromLocation = fromPlaceInfo.coordString;
                console.log(`🔄 Using stored coordinates for FROM: ${fromLocation} → ${searchFromLocation}`);
            }
            if (toPlaceInfo && toPlaceInfo.displayName === toLocation) {
                searchToLocation = toPlaceInfo.coordString;
                console.log(`🔄 Using stored coordinates for TO: ${toLocation} → ${searchToLocation}`);
            }

            // Use the enhanced smart route search that handles all cases
            const routeData = await LocationService.smartRouteSearch(
                searchFromLocation,
                searchToLocation,
                userLocation,
                locations
            );

            if (routeData && routeData.data && routeData.data.length > 0) {
                // Transform results to match expected format
                const transformedResults = routeData.data.map(route => {
                    // Determine fromStopId and toStopId based on search type
                    let fromStopId = null;
                    let toStopId = null;

                    // For location-based search (coordinates or "My Location")
                    if (route.walkingToStop) {
                        // The route starts from the nearest stop found by backend
                        fromStopId = route.walkingToStop.stopId;

                        // Find destination stop ID
                        const toStop = locations.find(stop =>
                            (stop.stops_name || stop.name || '').toLowerCase() === toLocation.toLowerCase()
                        );
                        toStopId = toStop ? toStop.id : null;
                    } else {
                        // Traditional stop-to-stop search
                        const fromStop = locations.find(stop =>
                            (stop.stops_name || stop.name || '').toLowerCase() === fromLocation.toLowerCase()
                        );
                        const toStop = locations.find(stop =>
                            (stop.stops_name || stop.name || '').toLowerCase() === toLocation.toLowerCase()
                        );
                        fromStopId = fromStop ? fromStop.id : null;
                        toStopId = toStop ? toStop.id : null;
                    }

                    console.log('🔍 RAW ROUTE DATA FROM BACKEND:', {
                        hasStops: !!route.stops,
                        stopsCount: route.stops?.length,
                        stopsArray: route.stops,
                        routeKeys: Object.keys(route),
                        segments: route.segments,
                        walkingToStop: route.walkingToStop
                    });

                    // FIX: If route.stops is missing but segments exist, extract stops from segments
                    if ((!route.stops || route.stops.length === 0) && route.segments && route.segments.length > 0) {
                        console.log('⚠️ Stops missing at root level, extracting from segments...');

                        // For multi-leg journeys, combine stops from all segments
                        if (route.segments.length > 1) {
                            // Multi-leg: combine all segment stops
                            route.stops = route.segments.reduce((allStops, segment) => {
                                if (segment.stops && segment.stops.length > 0) {
                                    return [...allStops, ...segment.stops];
                                }
                                return allStops;
                            }, []);
                        } else {
                            // Single segment: use its stops
                            route.stops = route.segments[0]?.stops || [];
                        }

                        console.log('✅ Extracted stops from segments:', {
                            stopsCount: route.stops.length,
                            firstStop: route.stops[0]?.stops_name,
                            lastStop: route.stops[route.stops.length - 1]?.stops_name
                        });
                    }

                    console.log('Transform route with stops:', {
                        fromStopId,
                        toStopId,
                        hasWalking: !!route.walkingToStop,
                        walkingToStopId: route.walkingToStop?.stopId,
                        walkingToStopName: route.walkingToStop?.stopName,
                        routeStopsCount: route.stops?.length,
                        firstStop: route.stops?.[0]?.stops_name || route.stops?.[0]?.name,
                        lastStop: route.stops?.[route.stops.length - 1]?.stops_name || route.stops?.[route.stops.length - 1]?.name
                    });

                    const transformed = transformRouteData(
                        route,
                        fromStopId,
                        toStopId,
                        route.isMultiLeg || false,
                        route.transferStop || null,
                        route.secondLeg || null
                    );

                    console.log('Transformed result:', {
                        hasStops: !!transformed.stops,
                        transformedStopsCount: transformed.stops?.length,
                        fromStopId: transformed.fromStopId,
                        toStopId: transformed.toStopId,
                        hasFromLocation: !!transformed.fromLocation,
                        hasWalkingToStop: !!transformed.walkingToStop
                    });

                    // Add location-specific information
                    if (route.walkingToStop) {
                        transformed.walkingToStop = route.walkingToStop;
                        transformed.totalJourneyTime = route.totalJourneyTime;

                        // Add origin coordinates for map walking path
                        if (route.fromLocation) {
                            transformed.fromLocation = route.fromLocation;
                        }
                    }

                    // Handle walking from last bus stop to destination
                    if (route.walkingFromStop) {
                        transformed.walkingFromStop = route.walkingFromStop;
                        transformed.totalJourneyTime = route.totalJourneyTime;

                        // Add destination coordinates for map walking path
                        if (route.toLocation) {
                            transformed.toLocation = route.toLocation;
                        }
                    }

                    if (route.walkingInfo) {
                        transformed.walkingInfo = route.walkingInfo;
                        transformed.totalJourneyTime = route.totalJourneyTime;
                    }

                    // Check if origin is coordinates (for coordinates → bus stop/coordinates search)
                    const fromCoords = LocationService.parseCoordinateInput(fromLocation);
                    if (fromCoords && !transformed.fromLocation) {
                        transformed.fromLocation = {
                            latitude: fromCoords.latitude,
                            longitude: fromCoords.longitude
                        };
                        console.log('🎯 Added origin coordinates:', transformed.fromLocation);
                    }

                    // Check if destination is coordinates (for bus stop/coordinates → coordinates search)
                    const toCoords = LocationService.parseCoordinateInput(toLocation);
                    if (toCoords && !transformed.toLocation) {
                        transformed.toLocation = {
                            latitude: toCoords.latitude,
                            longitude: toCoords.longitude
                        };
                        console.log('📍 Added destination coordinates:', transformed.toLocation);
                    }

                    return transformed;
                });

                // Determine display names for the search
                let fromDisplayName = fromLocation;
                let toDisplayName = toLocation;
                let isLocationBased = false;

                // Check if we used coordinates or location
                if (LocationService.isCurrentLocationInput(fromLocation) || 
                    LocationService.parseCoordinateInput(fromLocation)) {
                    fromDisplayName = LocationService.parseCoordinateInput(fromLocation) ? 
                        'Coordinates' : 'My Location';
                    isLocationBased = true;
                }
                
                if (LocationService.parseCoordinateInput(toLocation)) {
                    toDisplayName = 'Coordinates';
                    isLocationBased = true;
                }

                // Save search to recent searches
                const newSearch = { 
                    from: fromDisplayName, 
                    to: toDisplayName, 
                    timestamp: Date.now(),
                    isLocationBased 
                };
                const updatedRecents = [newSearch, ...recentSearches.filter(s => 
                    !(s.from === newSearch.from && s.to === newSearch.to)
                )].slice(0, MAX_RECENT_SEARCHES);

                setRecentSearches(updatedRecents);
                await storeData(RECENT_SEARCHES_KEY, updatedRecents);

                // Navigate to results
                navigation.navigate('SearchResults', {
                    results: transformedResults,
                    fromLocation: fromDisplayName,
                    toLocation: toDisplayName,
                    isLocationBased,
                    userLocation: routeData.userLocation || userLocation,
                    nearbyStops: routeData.nearbyStops,
                    sourceStops: routeData.sourceStops,
                    destinationStops: routeData.destinationStops
                });
            } else {
                alert('No transport options found for the specified route.');
            }
            
        } catch (error) {
            console.error('Search error:', error);
            let errorMessage = 'Failed to find routes. ';
            
            if (error.message.includes('coordinates')) {
                errorMessage = 'Please check your coordinate format (e.g., "27.7172, 85.3240").';
            } else if (error.message.includes('not found')) {
                errorMessage = error.message;
            } else if (error.message.includes('Invalid search parameters')) {
                errorMessage = 'Please select valid locations and try again.';
            } else if (error.message.includes('Network')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else {
                errorMessage = 'Unable to find routes. Please verify your selections and try again.';
            }
            
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to process multi-leg journeys
    const processMultiLegJourney = (routeData, fromStopId, toStopId, allTransportOptions) => {
        try {
            const { segments, transfers, totalFare } = routeData;

            if (!segments || segments.length < 2 || !transfers || transfers.length === 0) {
                console.warn('Incomplete data for multi-leg journey');
                return;
            }

            transfers.forEach((transfer, index) => {
                const transferStop = transfer.transferStop;
                const fromSegment = segments[0];
                const toSegment = segments[1];

                if (!fromSegment.vehicles || !fromSegment.vehicles.length ||
                    !toSegment.vehicles || !toSegment.vehicles.length) {
                    console.warn('Missing vehicle information for segments');
                    return;
                }

                // Process each combination of vehicles from both segments
                fromSegment.vehicles.forEach(firstVehicle => {
                    toSegment.vehicles.forEach(secondVehicle => {
                        // Create first leg data with vehicle info
                        const firstLegData = {
                            ...fromSegment,
                            route_no: routeData.route_no || fromSegment.route_no,
                            route_name: routeData.route_name || fromSegment.route_name,
                            vehicleType: firstVehicle.vehicleType,
                            yatayatName: firstVehicle.yatayatName,
                            vehicle_timing: firstVehicle.vehicle_timing,
                            fare: firstVehicle.fare || totalFare?.segments[0]?.fare || { fare: 0 },
                            yatayat_id: firstVehicle.yatayat_id
                        };

                        // Create second leg data with vehicle info
                        const secondLegData = {
                            ...toSegment,
                            route_no: routeData.route_no || toSegment.route_no,
                            route_name: routeData.route_name || toSegment.route_name,
                            vehicleType: secondVehicle.vehicleType,
                            yatayatName: secondVehicle.yatayatName,
                            vehicle_timing: secondVehicle.vehicle_timing,
                            fare: secondVehicle.fare || totalFare?.segments[1]?.fare || { fare: 0 },
                            yatayat_id: secondVehicle.yatayat_id
                        };

                        // Transform both legs
                        const firstLeg = transformRouteData(
                            firstLegData,
                            fromStopId,
                            transferStop.id
                        );

                        const secondLeg = transformRouteData(
                            secondLegData,
                            transferStop.id,
                            toStopId
                        );

                        // Create combined option
                        const combinedOption = {
                            ...firstLeg,
                            isMultiLeg: true,
                            transferStop: transferStop,
                            secondLeg: secondLeg,
                            combinedFare: (firstLeg.fare || 0) + (secondLeg.fare || 0),
                            combinedDistance: (parseFloat(firstLeg.distance) || 0) +
                                (parseFloat(secondLeg.distance) || 0),
                            transferCount: routeData.transferCount || 1,
                            id: `${firstLeg.id}-${secondLeg.id}-${transferStop.id}`
                        };

                        allTransportOptions.push(combinedOption);
                    });
                });
            });
        } catch (error) {
            console.error('Error processing multi-leg journey:', error);
        }
    };

    const findBusHoppingOptions = async (fromStopId, toStopId) => {
        try {
            // Instead of separate calls for from and to routes, get all routes between these stops
            const routesResponse = await axios.get(
                `${API_BASE_URL}/routes/stops?stop1=${fromStopId}&stop2=${toStopId}`
            );

            const routesData = routesResponse.data?.data || [];
            const hoppingOptions = [];

            // Process the results similar to your main handleSearch function
            routesData.forEach(routeData => {
                if (routeData.transferCount > 0 && routeData.transfers && routeData.segments) {
                    // Process multi-leg journeys with transfers
                    routeData.transfers.forEach(transfer => {
                        const transferStop = transfer.transferStop;
                        const firstLeg = routeData.segments[0];
                        const secondLeg = routeData.segments[1];

                        if (firstLeg && secondLeg) {
                            // Transform first leg
                            const firstLegTransformed = transformRouteData(
                                firstLegDetail,
                                fromStop.id,
                                transferStop.id
                            );

                            // Transform second leg
                            const secondLegTransformed = transformRouteData(
                                secondLegDetail,
                                transferStop.id,
                                toStop.id
                            );

                            // Create combined route option
                            const combinedOption = {
                                ...firstLegTransformed,
                                isMultiLeg: true,
                                transferStop: transferStop,
                                secondLeg: secondLegTransformed,
                                combinedFare: (firstLegTransformed.fare || 0) + (secondLegTransformed.fare || 0),
                                combinedDistance: (parseFloat(firstLegTransformed.distance) || 0) +
                                    (parseFloat(secondLegTransformed.distance) || 0),
                                transferCount: routeData.transferCount || 1,
                                id: `${firstLegTransformed.id}-${secondLegTransformed.id}-${transferStop.id}`
                            };

                            hoppingOptions.push(combinedOption);
                        }
                    });
                }
            });

            return hoppingOptions;
        } catch (error) {
            console.error('Error finding bus hopping options:', error);
            return [];
        }
    };


    // Handle selection of a Google Place (fetch coordinates and store both name + coordinates)
    const handleGooglePlaceSelect = useCallback(async (place, onSelect, onClose, isFromLocation = true) => {
        try {
            setPlacesLoading(true);
            const coordinates = await getPlaceCoordinates(place.placeId);
            if (coordinates) {
                // Store the place info (display name + coordinates) for later use in search
                const placeInfo = {
                    displayName: place.name,
                    coordinates: coordinates,
                    coordString: `${coordinates.latitude},${coordinates.longitude}`
                };

                // Store in the appropriate state based on which dropdown
                if (isFromLocation) {
                    setFromPlaceInfo(placeInfo);
                } else {
                    setToPlaceInfo(placeInfo);
                }

                // Show the friendly place name to the user (not coordinates)
                onSelect(place.name);
                console.log(`📍 Selected Google Place: ${place.name} → ${placeInfo.coordString}`);
            } else {
                // Fallback to place name if coordinates fetch fails
                onSelect(place.name);
            }
        } catch (error) {
            console.error('Error getting place coordinates:', error);
            onSelect(place.name);
        } finally {
            setPlacesLoading(false);
            setSearchQuery('');
            setGooglePlaces([]);
            onClose();
        }
    }, []);

    // Memoized render item function to prevent re-renders
    const renderDropdownItem = useCallback(({ item: location, onSelect, onClose, currentValue, isFromDropdown }) => {
        // Render section header
        if (location.isHeader) {
            return (
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>{location.title}</Text>
                </View>
            );
        }

        // Render Google Place item
        if (location.isGooglePlace) {
            return (
                <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleGooglePlaceSelect(location, onSelect, onClose, isFromDropdown)}
                >
                    <View style={styles.locationInfo}>
                        <View style={[styles.locationIconContainer, { backgroundColor: '#E8F5E9' }]}>
                            <Ionicons name="location" size={16} color="#4CAF50" />
                        </View>
                        <View style={styles.locationTextContainer}>
                            <Text style={styles.locationName}>{location.name}</Text>
                            <Text style={styles.placeAddress} numberOfLines={1}>
                                {location.fullAddress}
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.secondaryText} />
                </TouchableOpacity>
            );
        }

        // Render regular item (My Location, Coordinates, Bus Stop)
        return (
            <TouchableOpacity
                key={location.id}
                style={[styles.dropdownItem, currentValue === location.name && styles.selectedItem]}
                onPress={() => {
                    onSelect(location.name);
                    setSearchQuery('');
                    setGooglePlaces([]);
                    // Clear place info when selecting a bus stop (not a Google Place)
                    if (isFromDropdown) {
                        setFromPlaceInfo(null);
                    } else {
                        setToPlaceInfo(null);
                    }
                    onClose();
                }}
            >
                <View style={styles.locationInfo}>
                    <View style={[
                        styles.locationIconContainer,
                        location.isBusStop && { backgroundColor: '#E3F2FD' }
                    ]}>
                        <Ionicons
                            name={
                                location.isMyLocation ? "navigate-circle" :
                                location.isCoordinates ? "navigate" :
                                location.isBusStop ? "bus" : "location-sharp"
                            }
                            size={16}
                            color={
                                currentValue === location.name ? colors.background :
                                location.isBusStop ? '#2196F3' : colors.primary
                            }
                        />
                    </View>
                    <View style={styles.locationTextContainer}>
                        <Text style={[styles.locationName, currentValue === location.name && styles.selectedText]}>
                            {location.isMyLocation ? 'My Location' :
                             location.isCoordinates ? 'Use Coordinates' : location.name}
                        </Text>
                        {(location.isCoordinates || location.isMyLocation) && location.coordinates && (
                            <Text style={styles.coordinateSubtext}>
                                {location.coordinates.latitude.toFixed(4)}, {location.coordinates.longitude.toFixed(4)}
                            </Text>
                        )}
                        {location.isBusStop && (
                            <Text style={styles.busStopLabel}>Bus Stop</Text>
                        )}
                    </View>
                </View>
                {currentValue === location.name && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
            </TouchableOpacity>
        );
    }, [handleGooglePlaceSelect]);

    // Memoized empty component
    const ListEmptyComponent = useMemo(() => (
        <View style={styles.noResultsContainer}>
            {placesLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>Searching places...</Text>
                </View>
            ) : (
                <>
                    <Text style={styles.noResultsText}>No locations found</Text>
                    <Text style={styles.noResultsHint}>
                        Try searching for a place name or paste coordinates
                    </Text>
                </>
            )}
            {LocationService.looksLikeCoordinates(searchQuery) && (
                <Text style={styles.noResultsHint}>
                    Tip: Make sure coordinates are in format "latitude, longitude"
                </Text>
            )}
        </View>
    ), [placesLoading, searchQuery]);

    const LocationDropdown = ({ visible, onClose, onSelect, currentValue, isFromDropdown = true }) => (
        <Modal visible={visible} transparent={true} animationType="none" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                    <View style={styles.dropdownContainer} onStartShouldSetResponder={() => true}>
                        <View style={styles.dropdownHeader}>
                            <Text style={styles.dropdownTitle}>Select Location</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <Ionicons name="close" size={24} color={colors.primaryText} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color={colors.secondaryText} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search any place"
                                placeholderTextColor={colors.secondaryText}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus={true}
                            />
                            {placesLoading && (
                                <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                            )}
                        </View>

                        {/* Section Headers and Combined List */}
                        <FlatList
                            data={dropdownOptions}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => renderDropdownItem({
                                item,
                                onSelect,
                                onClose,
                                currentValue,
                                isFromDropdown
                            })}
                            style={styles.dropdownList}
                            ListEmptyComponent={ListEmptyComponent}
                            removeClippedSubviews={true}
                            maxToRenderPerBatch={10}
                            windowSize={5}
                        />
                    </View>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Plan Your Trip</Text>
            </View>

            <ScrollView contentContainerStyle={styles.contentContainer}>
                <View style={styles.searchCard}>
                    <View style={styles.inputsContainer}>
                        {/* From Location */}
                        <View style={styles.inputLabelContainer}>
                            <View style={styles.labelWithToggle}>
                                <Text style={styles.inputLabel}>From</Text>
                                <TouchableOpacity 
                                    style={[styles.locationToggle, useCurrentLocation && styles.locationToggleActive]}
                                    onPress={handleLocationToggle}
                                    disabled={locationLoading}
                                >
                                    {locationLoading ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <MaterialCommunityIcons 
                                            name={useCurrentLocation ? "crosshairs-gps" : "crosshairs"} 
                                            size={14} 
                                            color={useCurrentLocation ? colors.primary : colors.secondaryText}
                                        />
                                    )}
                                    <Text style={[styles.toggleText, useCurrentLocation && styles.toggleTextActive]}>
                                        Use GPS
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity 
                                style={[
                                    styles.locationInput, 
                                    fromLocation ? styles.locationInputFilled : null,
                                    useCurrentLocation && styles.locationInputDisabled
                                ]} 
                                onPress={() => {
                                    if (!useCurrentLocation) {
                                        setSearchQuery(''); 
                                        setShowFromDropdown(true);
                                    }
                                }}
                                disabled={useCurrentLocation}
                            >
                                <View style={[
                                    styles.locationIconWrapper, 
                                    fromLocation ? styles.locationIconWrapperActive : null
                                ]}>
                                    <Ionicons 
                                        name={useCurrentLocation ? "location" : "location-sharp"} 
                                        size={16} 
                                        color={fromLocation ? colors.background : colors.secondaryText} 
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[
                                        styles.inputText, 
                                        !fromLocation && styles.placeholderText,
                                        useCurrentLocation && styles.locationText
                                    ]} numberOfLines={1}>
                                        {fromLocation || 'Select departure point or paste coordinates (27.7172, 85.3240)'}
                                    </Text>
                                    {useCurrentLocation && userLocation && (
                                        <Text style={styles.coordinatesText} numberOfLines={1}>
                                            {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Swap Button */}
                        <View style={styles.swapButtonContainer}>
                            <TouchableOpacity style={styles.swapButton} onPress={() => {
                                // Swap locations
                                const tempLoc = fromLocation;
                                setFromLocation(toLocation);
                                setToLocation(tempLoc);
                                // Also swap place info
                                const tempInfo = fromPlaceInfo;
                                setFromPlaceInfo(toPlaceInfo);
                                setToPlaceInfo(tempInfo);
                            }}>
                                <MaterialCommunityIcons name="swap-vertical" size={18} color={colors.background} />
                            </TouchableOpacity>
                        </View>

                        {/* To Location */}
                        <View style={styles.inputLabelContainer}>
                            <Text style={styles.inputLabel}>To</Text>
                            <TouchableOpacity style={[styles.locationInput, toLocation ? styles.locationInputFilled : null]} onPress={() => { setSearchQuery(''); setShowToDropdown(true); }}>
                                <View style={[styles.locationIconWrapper, toLocation ? styles.locationIconWrapperActive : null]}>
                                    <Ionicons name="location" size={16} color={toLocation ? colors.background : colors.secondaryText} />
                                </View>
                                <Text style={[styles.inputText, !toLocation && styles.placeholderText]} numberOfLines={1}>
                                    {toLocation || 'Select destination or paste coordinates (27.6710, 85.4298)'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    {/* Coordinate Info Text */}
                    <View style={styles.infoContainer}>
                        <MaterialCommunityIcons 
                            name="information-outline" 
                            size={14} 
                            color={colors.secondaryText} 
                            style={styles.infoIcon}
                        />
                        <Text style={styles.infoText}>
                            Tip: You can paste coordinates like "27.7172, 85.3240" for precise location search
                        </Text>
                    </View>
                    
                    {/* Search Button */}
                    <TouchableOpacity
                        style={[styles.searchButton, (!fromLocation || !toLocation || loading) && styles.searchButtonDisabled]}
                        disabled={!fromLocation || !toLocation || loading}
                        onPress={handleSearch}
                    >
                        {loading ? <ActivityIndicator color={colors.background} size="small" /> : <>
                            <Text style={styles.searchButtonText}>Find Transport</Text>
                            <MaterialCommunityIcons name="magnify" size={20} color={colors.background} />
                        </>}
                    </TouchableOpacity>
                </View>

                {/* Recent Searches Section */}
                {recentSearches.length > 0 && (
                    <View style={styles.recentSearchesContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Searches</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('RecentSearchesScreen')}>
                                <Text style={styles.clearText}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        {recentSearches.slice(0, 5).map((search, index) => (
                            <TouchableOpacity
                                key={`${search.from}-${search.to}-${index}`}
                                style={styles.recentSearchItem}
                                onPress={() => { setFromLocation(search.from); setToLocation(search.to); }}
                            >
                                <View style={styles.recentSearchIcon}>
                                    <Ionicons name="time-outline" size={18} color={colors.background} />
                                </View>
                                <View style={styles.recentSearchText}>
                                    <Text style={styles.recentSearchRoute} numberOfLines={1}>
                                        {search.from} <Text style={styles.arrowText}> → </Text> {search.to}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.secondaryText} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                <View style={{ height: 20 }} />
            </ScrollView>

            <LocationDropdown
                visible={showFromDropdown}
                onClose={() => setShowFromDropdown(false)}
                onSelect={setFromLocation}
                currentValue={fromLocation}
                isFromDropdown={true}
            />
            <LocationDropdown
                visible={showToDropdown}
                onClose={() => setShowToDropdown(false)}
                onSelect={setToLocation}
                currentValue={toLocation}
                isFromDropdown={false}
            />
        </SafeAreaView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.md,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + spacing.sm : spacing.lg,
        paddingBottom: spacing.md,
    },
    headerTitle: {
        fontSize: fontSizes.xxl,
        fontWeight: 'bold',
        color: colors.primaryText,
        textAlign: 'left',
        marginLeft: spacing.sm,
    },
    contentContainer: {
        flexGrow: 1,
        padding: spacing.md,
    },
    searchCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
        elevation: 2,
    },
    inputsContainer: {
        marginBottom: spacing.lg,
        position: 'relative',
    },
    inputLabelContainer: {
        marginBottom: spacing.md,
    },
    inputLabel: {
        fontSize: fontSizes.sm,
        fontWeight: '600',
        color: colors.primaryText,
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    locationInput: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        height: 54,
    },
    locationInputFilled: {
        borderColor: colors.primary,
    },
    locationIconWrapper: {
        width: 30,
        height: 30,
        borderRadius: borderRadius.circle,
        backgroundColor: colors.highlight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    locationIconWrapperActive: {
        backgroundColor: colors.primary,
    },
    inputText: {
        flex: 1,
        fontSize: fontSizes.md,
        fontWeight: '500',
        color: colors.primaryText,
    },
    placeholderText: {
        color: colors.secondaryText,
        fontWeight: '400',
    },
    swapButtonContainer: {
        position: 'absolute',
        right: spacing.sm,
        top: '50%',
        transform: [{ translateY: -18 }],
        zIndex: 10,
    },
    swapButton: {
        backgroundColor: colors.primary,
        width: 36,
        height: 36,
        borderRadius: borderRadius.circle,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    searchButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginTop: spacing.sm,
    },
    searchButtonDisabled: {
        backgroundColor: '#EF9651',
        shadowOpacity: 0.1,
        elevation: 1,
    },
    searchButtonText: {
        color: colors.background,
        fontSize: fontSizes.md,
        fontWeight: '600',
        marginRight: spacing.sm,
    },
    modalContainer: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    dropdownContainer: {
        backgroundColor: colors.background,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '80%',
        paddingBottom: spacing.xl,
        overflow: 'hidden',
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    closeButton: {
        padding: spacing.sm,
    },
    dropdownTitle: {
        fontSize: fontSizes.lg,
        fontWeight: '700',
        color: colors.primaryText,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        marginHorizontal: spacing.lg,
        marginVertical: spacing.md,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: fontSizes.md,
        color: colors.primaryText,
        paddingVertical: spacing.md,
    },
    dropdownList: {
        paddingHorizontal: spacing.lg,
        maxHeight: Dimensions.get('window').height * 0.5,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    selectedItem: {
        backgroundColor: `${colors.primary}10`,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: spacing.sm,
    },
    locationIconContainer: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.circle,
        backgroundColor: `${colors.primary}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    locationName: {
        fontSize: fontSizes.md,
        color: colors.primaryText,
        flexShrink: 1,
    },
    selectedText: {
        color: colors.primary,
        fontWeight: '600',
    },
    noResultsText: {
        textAlign: 'center',
        marginTop: spacing.lg,
        color: colors.secondaryText,
        fontSize: fontSizes.md,
    },
    recentSearchesContainer: {
        marginTop: spacing.lg,
        backgroundColor: colors.cardBackground,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.xs,
    },
    sectionTitle: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.primaryText,
    },
    clearText: {
        fontSize: fontSizes.sm,
        fontWeight: '500',
        color: colors.primary,
    },
    recentSearchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    recentSearchIcon: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.circle,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    recentSearchText: {
        flex: 1,
    },
    recentSearchRoute: {
        fontSize: fontSizes.md,
        fontWeight: '500',
        color: colors.primaryText,
    },
    arrowText: {
        color: colors.secondaryText,
        fontWeight: 'bold',
    },
    labelWithToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    locationToggleActive: {
        backgroundColor: `${colors.primary}10`,
        borderColor: colors.primary,
    },
    toggleText: {
        marginLeft: spacing.xs,
        fontSize: fontSizes.xs,
        color: colors.secondaryText,
        fontWeight: '500',
    },
    toggleTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    locationInputDisabled: {
        backgroundColor: colors.highlight,
        opacity: 0.8,
    },
    locationText: {
        color: colors.primary,
        fontWeight: '600',
    },
    coordinatesText: {
        fontSize: fontSizes.xs,
        color: colors.secondaryText,
        marginTop: 2,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        marginBottom: spacing.sm,
        backgroundColor: `${colors.primary}05`,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: `${colors.primary}20`,
    },
    infoIcon: {
        marginRight: spacing.xs,
    },
    infoText: {
        flex: 1,
        fontSize: fontSizes.xs,
        color: colors.secondaryText,
        lineHeight: 16,
    },
    locationTextContainer: {
        flex: 1,
    },
    coordinateSubtext: {
        fontSize: fontSizes.xs,
        color: colors.secondaryText,
        marginTop: 2,
    },
    noResultsContainer: {
        padding: spacing.md,
        alignItems: 'center',
    },
    noResultsHint: {
        fontSize: fontSizes.xs,
        color: colors.secondaryText,
        textAlign: 'center',
        marginTop: spacing.xs,
        fontStyle: 'italic',
    },
    // New styles for Google Places integration
    sectionHeaderText: {
        fontSize: fontSizes.sm,
        fontWeight: '700',
        color: colors.secondaryText,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        backgroundColor: colors.background,
    },
    placeAddress: {
        fontSize: fontSizes.xs,
        color: colors.secondaryText,
        marginTop: 2,
    },
    busStopLabel: {
        fontSize: fontSizes.xs,
        color: '#2196F3',
        marginTop: 2,
        fontWeight: '500',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
    },
    loadingText: {
        marginLeft: spacing.sm,
        fontSize: fontSizes.sm,
        color: colors.secondaryText,
    },
});

export default SearchScreen;