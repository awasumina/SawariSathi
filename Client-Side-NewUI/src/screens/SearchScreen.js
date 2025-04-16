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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { colors, spacing, fontSizes, borderRadius } from '../constants/theme';

const API_BASE_URL = 'http://192.168.101.2:3000/api';

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
    const fetchLocations = async () => {
      try {
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
      } catch (error) {
        console.error('Locations fetch error:', error);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (route.params?.preSelectedRoute) {
      const routeName = route.params.preSelectedRoute.name;
      const parts = routeName.split(' - ');
      if (parts.length === 2) {
        setFromLocation(parts[0]);
        setToLocation(parts[1]);
      }
    }
  }, [route.params]);

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const transformRouteData = (apiData) => {
    return {
      id: apiData.fare?.route_yatayat_id || Math.random(),
      vehicle: {
        type: 'Bus',
        name: `Route ${apiData.fare?.route_yatayat_id || ''}`,
        count: 5,
      },
      fare: apiData.fare?.fare || 0,
      discountedFare: apiData.fare?.discounted_fare || 0,
      stops: apiData.stops,
      distance: calculateDistance(apiData.stops),
      estimatedTime: '06:00 AM - 08:00 PM'
    };
  };

  const calculateDistance = (stops) => {
    if (!stops || stops.length < 2) return '0';
    const latDiff = stops[stops.length-1].stops_lat - stops[0].stops_lat;
    const lonDiff = stops[stops.length-1].stops_lon - stops[0].stops_lon;
    return (Math.sqrt(latDiff*latDiff + lonDiff*lonDiff) * 111.32).toFixed(1);
  };

  const handleSearch = async () => {
    if (!fromLocation || !toLocation) return;
    if (fromLocation === toLocation) return;

    setLoading(true);
    try {
      const fromStop = locations.find(stop => stop.name === fromLocation);
      const toStop = locations.find(stop => stop.name === toLocation);

      const response = await axios.get(
        `${API_BASE_URL}/routes/stops?stop1=${fromStop.id}&stop2=${toStop.id}`
      );
      
      if (!response.data.data) {
        alert('No available routes found for selected stops');
        return;
      }

      // Add to recent searches
      const newSearch = { from: fromLocation, to: toLocation };
      setRecentSearches(prev => [newSearch, ...prev].slice(0, 5));

      const transformedData = transformRouteData(response.data.data);
      navigation.navigate('SearchResults', {
        results: [transformedData],
        fromLocation,
        toLocation
      });
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to fetch routes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const LocationDropdown = ({ visible, onClose, onSelect, currentValue }) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Location</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color={colors.primaryText} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={colors.secondaryText}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search locations..."
                placeholderTextColor={colors.secondaryText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
            </View>

            <ScrollView style={styles.dropdownList}>
              {filteredLocations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.dropdownItem,
                    currentValue === location.name && styles.selectedItem
                  ]}
                  onPress={() => {
                    onSelect(location.name);
                    setSearchQuery('');
                    onClose();
                  }}
                >
                  <View style={styles.locationInfo}>
                    <View style={styles.locationIconContainer}>
                      <Ionicons
                        name="location-sharp"
                        size={16}
                        color={currentValue === location.name ? colors.background : colors.primary}
                      />
                    </View>
                    <Text style={[
                      styles.locationName,
                      currentValue === location.name && styles.selectedText
                    ]}>
                      {location.name}
                    </Text>
                  </View>
                  {currentValue === location.name && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan Your Trip</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchCard}>
          <View style={styles.inputsContainer}>
            <View style={styles.inputLabelContainer}>
              <Text style={styles.inputLabel}>From</Text>
              <TouchableOpacity
                style={[styles.locationInput, fromLocation ? styles.locationInputFilled : null]}
                onPress={() => {
                  setSearchQuery('');
                  setShowFromDropdown(true);
                }}
              >
                <View style={[styles.locationIconWrapper, fromLocation ? styles.locationIconWrapperActive : null]}>
                  <Ionicons
                    name="location-sharp"
                    size={16}
                    color={fromLocation ? colors.background : colors.secondaryText}
                  />
                </View>
                <Text
                  style={[
                    styles.inputText,
                    !fromLocation && styles.placeholderText
                  ]}
                  numberOfLines={1}
                >
                  {fromLocation || 'Select departure point'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.swapButtonContainer}>
              <TouchableOpacity
                style={styles.swapButton}
                onPress={() => {
                  const temp = fromLocation;
                  setFromLocation(toLocation);
                  setToLocation(temp);
                }}
              >
                <MaterialCommunityIcons
                  name="swap-vertical"
                  size={18}
                  color={colors.background}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputLabelContainer}>
              <Text style={styles.inputLabel}>To</Text>
              <TouchableOpacity
                style={[styles.locationInput, toLocation ? styles.locationInputFilled : null]}
                onPress={() => {
                  setSearchQuery('');
                  setShowToDropdown(true);
                }}
              >
                <View style={[styles.locationIconWrapper, toLocation ? styles.locationIconWrapperActive : null]}>
                  <Ionicons
                    name="location"
                    size={16}
                    color={toLocation ? colors.background : colors.secondaryText}
                  />
                </View>
                <Text
                  style={[
                    styles.inputText,
                    !toLocation && styles.placeholderText
                  ]}
                  numberOfLines={1}
                >
                  {toLocation || 'Select destination'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.searchButton,
              (!fromLocation || !toLocation) && styles.searchButtonDisabled
            ]}
            disabled={!fromLocation || !toLocation || loading}
            onPress={handleSearch}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Text style={styles.searchButtonText}>Find Route</Text>
                <MaterialCommunityIcons 
                  name="arrow-right"
                  size={20}
                  color={colors.background}
                />
              </>
            )}
          </TouchableOpacity>
        </View>

        {recentSearches.length > 0 && (
          <View style={styles.recentSearchesContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={() => setRecentSearches([])}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            
            {recentSearches.map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentSearchItem}
                onPress={() => {
                  setFromLocation(search.from);
                  setToLocation(search.to);
                }}
              >
                <View style={styles.recentSearchIcon}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.background}
                  />
                </View>
                <View style={styles.recentSearchText}>
                  <Text style={styles.recentSearchRoute} numberOfLines={1}>
                    {search.from} 
                    <Text style={styles.arrowText}> → </Text> 
                    {search.to}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.secondaryText}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingVertical: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.circle,
    backgroundColor: colors.cardBackground,
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.primaryText,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  searchCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  inputsContainer: {
    marginBottom: spacing.lg,
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
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locationInputFilled: {
    borderColor: colors.primary,
    borderWidth: 1,
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
    right: spacing.md,
    top: '70%',
    zIndex: 10,
  },
  swapButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.circle,
    width: 36,
    height: 36,
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
  },
  searchButtonDisabled: {
    backgroundColor: colors.secondaryText,
    shadowOpacity: 0.1,
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
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.primaryText,
    paddingVertical: spacing.sm,
  },
  dropdownList: {
    paddingHorizontal: spacing.lg,
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
  },
  locationIconContainer: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.circle,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  locationName: {
    fontSize: fontSizes.md,
    color: colors.primaryText,
    flex: 1,
  },
  selectedText: {
    color: colors.primary,
    fontWeight: '600',
  },
  recentSearchesContainer: {
    marginTop: spacing.xl,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  },
});

export default SearchScreen;