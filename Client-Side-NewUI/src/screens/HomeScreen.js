import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { colors, spacing, fontSizes, borderRadius } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LocationService } from '../utils/locationService';

const HomeScreen = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [nearbyStopsLoading, setNearbyStopsLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const popularRoutes = [
    { name: 'Kavresthali - RNAC', id: 1, icon: 'bus-articulated-front' },
    { name: 'Basnettar - RNAC', id: 2, icon: 'bus' },
    { name: 'Jutpur Fedi - RNAC', id: 3, icon: 'bus-stop' },
    { name: 'Goldhunga - RNAC', id: 4, icon: 'bus-clock' },
  ];

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const hasPermission = await LocationService.hasLocationPermission();
      setHasLocationPermission(hasPermission);
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const getCurrentLocationAndNearbyStops = async () => {
    try {
      setLocationLoading(true);
      
      // Get current location
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
      setHasLocationPermission(true);
      
      // Get nearby stops
      setNearbyStopsLoading(true);
      const nearbyData = await LocationService.getNearbyStops(
        location.latitude, 
        location.longitude,
        2 // 2km radius
      );
      setNearbyStops(nearbyData.data.slice(0, 5)); // Show only first 5
      
    } catch (error) {
      console.error('Error getting location and nearby stops:', error);
      Alert.alert(
        'Location Error',
        error.message,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Try Again', 
            onPress: getCurrentLocationAndNearbyStops 
          }
        ]
      );
    } finally {
      setLocationLoading(false);
      setNearbyStopsLoading(false);
    }
  };

  const searchFromNearbyStop = (stop) => {
    navigation.navigate('SearchTab', { 
      fromLocation: stop.stops_name,
      searchType: 'fromNearbyStop',
      nearbyStopInfo: {
        ...stop,
        userLocation
      }
    });
  };

  const quickActions = [
    { 
      name: 'View Map', 
      icon: 'map-outline', 
      color: colors.primary,
      backgroundColor: colors.highlight,
      onPress: () => navigation.navigate('MapTab') 
    },
    { 
      name: 'Recent Trips', 
      icon: 'clock-outline', 
      color: colors.accent,
      backgroundColor: '#EBF5FF',
      onPress: () => navigation.navigate('RecentSearchesScreen') 
    },
    { 
      name: 'Favorites', 
      icon: 'heart-outline', 
      color: colors.danger,
      backgroundColor: '#FFF0F3',
      onPress: () => navigation.navigate('FavoritesScreen') 
    },
    { 
      name: 'Notice', 
      icon: 'bell-outline',  // Updated from 'notification' to 'bell-outline' for consistency
      color: colors.success,
      backgroundColor: '#ECFCFF',
      onPress: () => navigation.navigate('NoticesTab') 
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        {/* Hero Section with Gradient Overlay */}
        <ImageBackground
          source={require('../../assets/transport-hero.jpg')}
          style={styles.heroImage}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>SawariSathi</Text>
              <Text style={styles.heroSubtitle}>
                Find the best public transport routes in your city
              </Text>

              {/* Search buttons */}
              <View style={styles.searchButtonsContainer}>
                <TouchableOpacity
                  style={[styles.searchButton, { flex: 1, marginRight: spacing.sm }]}
                  onPress={() => navigation.navigate('SearchTab')}
                >
                  <MaterialCommunityIcons
                    name="magnify"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.searchButtonText}>Search Routes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.locationButton, locationLoading && styles.locationButtonDisabled]}
                  onPress={getCurrentLocationAndNearbyStops}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <MaterialCommunityIcons
                      name="crosshairs-gps"
                      size={20}
                      color={colors.background}
                    />
                  )}
                  <Text style={styles.locationButtonText}>
                    {locationLoading ? 'Finding...' : 'Near Me'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* Nearby Stops Section */}
        {nearbyStops.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Bus Stops</Text>
              {userLocation && (
                <TouchableOpacity 
                  onPress={() => navigation.navigate('SearchTab', { 
                    useCurrentLocation: true, 
                    userLocation 
                  })}
                >
                  <Text style={styles.viewAllText}>Search from here</Text>
                </TouchableOpacity>
              )}
            </View>
            {nearbyStopsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Finding nearby stops...</Text>
              </View>
            ) : (
              <FlatList
                data={nearbyStops}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.horizontalScrollContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.nearbyStopCard}
                    onPress={() => searchFromNearbyStop(item)}
                  >
                    <View style={styles.nearbyStopHeader}>
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={20}
                        color={colors.primary}
                      />
                      <View style={styles.distanceChip}>
                        <Text style={styles.distanceText}>
                          {LocationService.formatDistance(item.distance)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.nearbyStopName} numberOfLines={2}>
                      {item.stops_name}
                    </Text>
                    <Text style={styles.nearbyStopWalk}>
                      {LocationService.formatWalkingTime(
                        LocationService.calculateWalkingTime(item.distance)
                      )}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, { backgroundColor: action.backgroundColor }]}
                onPress={action.onPress}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${action.color}20` }]}>
                  <MaterialCommunityIcons
                    name={action.icon}
                    size={24}
                    color={action.color}
                  />
                </View>
                <Text style={styles.actionText}>{action.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Routes */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Routes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SearchTab')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {popularRoutes.map((route) => (
              <TouchableOpacity
                key={route.id}
                style={styles.routeCard}
                onPress={() =>
                  navigation.navigate('SearchTab', { preSelectedRoute: route })
                }
              >
                <View style={styles.routeIconContainer}>
                  <MaterialCommunityIcons
                    name={route.icon}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.routeName} numberOfLines={1}>
                  {route.name}
                </Text>
                <View style={styles.routeArrow}>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.secondaryText}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Travel Tips Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Travel Tips</Text>
          <View style={styles.tipCard}>
            <View style={styles.tipIconContainer}>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={28}
                color={colors.warning}
              />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Plan Ahead</Text>
              <Text style={styles.tipText}>
                Check schedules and routes before starting your journey to avoid delays.
              </Text>
            </View>
          </View>
        </View>

        {/* Extra space at bottom */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroImage: {
    height: 280,
    width: '100%',
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    height: '100%',
    width: '100%',
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: spacing.lg,
  },
  heroTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: colors.background,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: fontSizes.md,
    color: colors.background,
    opacity: 0.9,
    marginBottom: spacing.lg,
  },
  searchButtonsContainer: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonText: {
    marginLeft: spacing.xs,
    color: colors.primaryText,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    minWidth: 100,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  locationButtonDisabled: {
    backgroundColor: `${colors.primary}80`,
  },
  locationButtonText: {
    marginLeft: spacing.xs,
    color: colors.background,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  sectionContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: spacing.md,
  },
  viewAllText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  horizontalScrollContent: {
    paddingRight: spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'column',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.circle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    color: colors.primaryText,
    fontWeight: '600',
    fontSize: fontSizes.md,
  },
  routeCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginLeft: spacing.md,
    width: 240,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  routeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.circle,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  routeName: {
    flex: 1,
    color: colors.primaryText,
    fontWeight: '500',
    fontSize: fontSizes.md,
  },
  routeArrow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  tipIconContainer: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.circle,
    backgroundColor: `${colors.warning}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
    lineHeight: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: colors.secondaryText,
    fontSize: fontSizes.sm,
  },
  nearbyStopCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginLeft: spacing.md,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  nearbyStopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  distanceChip: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  distanceText: {
    fontSize: fontSizes.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  nearbyStopName: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: spacing.xs,
    lineHeight: 16,
  },
  nearbyStopWalk: {
    fontSize: fontSizes.xs,
    color: colors.secondaryText,
  },
});

export default HomeScreen;