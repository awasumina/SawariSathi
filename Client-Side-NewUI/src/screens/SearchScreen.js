// src/screens/SearchScreen.js
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { colors, spacing, fontSizes, borderRadius } from '../constants/theme';
import { storeData, getData } from '../utils/storage'; // Import storage utils
import { API_BASE_URL } from '../config/api';
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

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // Fetch locations
                const res = await axios.get(`${API_BASE_URL}/stops`);
                const uniqueLocations = res.data.data.reduce((acc, current) => {
                    if (!acc.find(item => item.name === current.stops_name)) {
                        acc.push({
                            id: current.id,
                            name: current.stops_name,
                            lat: current.stops_lat,
                            lon: current.stops_lon,
                        });
                    }
                    return acc;
                }, []);
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
        }
    }, [route.params]);

    const filteredLocations = locations.filter(location =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = async () => {
        if (!fromLocation || !toLocation || fromLocation === toLocation) {
            alert('Please select valid departure and destination points.');
            return;
        }

        setLoading(true);
        try {
            const fromStop = locations.find(stop => stop.name === fromLocation);
            const toStop = locations.find(stop => stop.name === toLocation);

            if (!fromStop || !toStop) {
                alert('One or both locations not found in our database.');
                setLoading(false);
                return;
            }

            let allTransportOptions = [];

            try {
                const response = await axios.get(
                    `${API_BASE_URL}/routes/stops?stop1=${fromStop.id}&stop2=${toStop.id}`
                );

                if (response.data?.data) {
                    response.data.data.forEach(routeData => {
                        // Process both direct routes and multi-leg journeys
                        if (routeData.transferCount > 0 && routeData.segments) {
                            // This is a multi-leg journey - use processMultiLegJourney
                            processMultiLegJourney(routeData, fromStop.id, toStop.id, allTransportOptions);
                        } else if (routeData.segments && routeData.segments.length > 0) {
                            // This is a direct route
                            const firstSegment = routeData.segments[0];

                            if (firstSegment.vehicles && firstSegment.vehicles.length > 0) {
                                firstSegment.vehicles.forEach(vehicle => {
                                    const routeDetail = {
                                        ...firstSegment,
                                        route_no: routeData.route_no || firstSegment.route_no,
                                        route_name: routeData.route_name || firstSegment.route_name,
                                        vehicleType: vehicle.vehicleType,
                                        yatayatName: vehicle.yatayatName,
                                        vehicle_timing: vehicle.vehicle_timing,
                                        fare: vehicle.fare,
                                        yatayat_id: vehicle.yatayat_id
                                    };

                                    allTransportOptions.push(transformRouteData(
                                        routeDetail,
                                        fromStop.id,
                                        toStop.id
                                    ));
                                });
                            } else {
                                allTransportOptions.push(transformRouteData(
                                    firstSegment,
                                    fromStop.id,
                                    toStop.id
                                ));
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching routes:', error);
            }

            if (allTransportOptions.length === 0) {
                alert('No transport options found for this route.');
            } else {
                // Sort options
                allTransportOptions.sort((a, b) => {
                    if (!a.isMultiLeg && b.isMultiLeg) return -1;
                    if (a.isMultiLeg && !b.isMultiLeg) return 1;
                    if (a.combinedFare < b.combinedFare) return -1;
                    if (a.combinedFare > b.combinedFare) return 1;
                    return parseFloat(a.combinedDistance) - parseFloat(b.combinedDistance);
                });

                // Save search and navigate
                const newSearch = { from: fromLocation, to: toLocation, timestamp: Date.now() };
                const updatedRecents = [newSearch, ...recentSearches.filter(s => !(s.from === newSearch.from && s.to === newSearch.to))].slice(0, MAX_RECENT_SEARCHES);

                setRecentSearches(updatedRecents);
                await storeData(RECENT_SEARCHES_KEY, updatedRecents);

                navigation.navigate('SearchResults', {
                    results: allTransportOptions,
                    fromLocation,
                    toLocation
                });
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('An error occurred during the search. Please try again.');
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


    const LocationDropdown = ({ visible, onClose, onSelect, currentValue }) => (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
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
                                placeholder="Search locations..."
                                placeholderTextColor={colors.secondaryText}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus={true}
                            />
                        </View>
                        <FlatList
                            data={filteredLocations}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item: location }) => (
                                <TouchableOpacity
                                    key={location.id}
                                    style={[styles.dropdownItem, currentValue === location.name && styles.selectedItem]}
                                    onPress={() => { onSelect(location.name); setSearchQuery(''); onClose(); }}
                                >
                                    <View style={styles.locationInfo}>
                                        <View style={styles.locationIconContainer}>
                                            <Ionicons name="location-sharp" size={16} color={currentValue === location.name ? colors.background : colors.primary} />
                                        </View>
                                        <Text style={[styles.locationName, currentValue === location.name && styles.selectedText]}>
                                            {location.name}
                                        </Text>
                                    </View>
                                    {currentValue === location.name && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            )}
                            style={styles.dropdownList}
                            ListEmptyComponent={<Text style={styles.noResultsText}>No locations found</Text>}
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
                            <Text style={styles.inputLabel}>From</Text>
                            <TouchableOpacity style={[styles.locationInput, fromLocation ? styles.locationInputFilled : null]} onPress={() => { setSearchQuery(''); setShowFromDropdown(true); }}>
                                <View style={[styles.locationIconWrapper, fromLocation ? styles.locationIconWrapperActive : null]}>
                                    <Ionicons name="location-sharp" size={16} color={fromLocation ? colors.background : colors.secondaryText} />
                                </View>
                                <Text style={[styles.inputText, !fromLocation && styles.placeholderText]} numberOfLines={1}>
                                    {fromLocation || 'Select departure point'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Swap Button */}
                        <View style={styles.swapButtonContainer}>
                            <TouchableOpacity style={styles.swapButton} onPress={() => { const temp = fromLocation; setFromLocation(toLocation); setToLocation(temp); }}>
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
                                    {toLocation || 'Select destination'}
                                </Text>
                            </TouchableOpacity>
                        </View>
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
            />
            <LocationDropdown
                visible={showToDropdown}
                onClose={() => setShowToDropdown(false)}
                onSelect={setToLocation}
                currentValue={toLocation}
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
});

export default SearchScreen;