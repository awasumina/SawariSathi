// src/components/VehicleDetails.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius } from '../constants/theme';
import { vehicleImages } from '../constants/vehicleImages';
import { storeData, getData } from '../utils/storage';

const screenWidth = Dimensions.get('window').width;
const FAVORITES_KEY = '@favorites';

const VehicleDetails = ({ route, navigation }) => {
  const { transport, fromLocation = 'Origin', toLocation = 'Destination' } = route.params || {};

  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(true);

  // Enhanced safeTransport object to include multi-leg journey properties
  const safeTransport = React.useMemo(() => ({
    id: transport?.id || `vehicle-${Math.random()}`,
    vehicle: {
      type: transport?.vehicle?.type || transport?.vehicleType || 'Bus',
      name: transport?.vehicle?.name || transport?.routeName || 'Unknown Service',
      count: transport?.vehicle?.count || 'N/A',
    },
    stops: transport?.stops?.map(stop => ({
      name: stop.stops_name || 'Unknown Stop',
      lat: parseFloat(stop.stops_lat) || 0,
      lon: parseFloat(stop.stops_lon) || 0
    })) || [],
    fare: transport?.fare ?? 0,
    discountedFare: transport?.discountedFare ?? null,
    distance: transport?.distance || 'N/A',
    routeNo: transport?.routeNo || 'N/A',
    routeName: transport?.routeName || 'Unknown Route',
    routeNumber: transport?.routeNo || 'N/A',
    timing: transport?.estimatedTime || 'N/A',
    vehicleType: transport?.vehicleType || 'bus',
    yatayatName: transport?.yatayatName || 'Unknown Operator',
    // Multi-leg journey properties
    isMultiLeg: transport?.isMultiLeg || false,
    secondLeg: transport?.secondLeg || null,
    transferStop: transport?.transferStop || null,
    transferCount: transport?.transferCount || 1,
    combinedFare: transport?.combinedFare || 0,
    combinedDistance: transport?.combinedDistance || 0,
    // Include from/to in the saved object
    fromLocation: fromLocation,
    toLocation: toLocation,
  }), [transport, fromLocation, toLocation]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!safeTransport.id) {
        setIsLoadingFavorite(false);
        return;
      }
      setIsLoadingFavorite(true);
      const favorites = await getData(FAVORITES_KEY);
      if (favorites && Array.isArray(favorites)) {
        const found = favorites.some(fav => fav.id === safeTransport.id);
        setIsFavorite(found);
      } else {
        setIsFavorite(false);
      }
      setIsLoadingFavorite(false);
    };

    checkFavoriteStatus();
  }, [safeTransport.id]);

  const handleToggleFavorite = useCallback(async () => {
    if (!safeTransport.id) {
      alert("Cannot save favorite: Missing unique identifier.");
      return;
    }
    setIsLoadingFavorite(true);
    const currentFavorites = await getData(FAVORITES_KEY) || [];
    let updatedFavorites;

    if (isFavorite) {
      updatedFavorites = currentFavorites.filter(fav => fav.id !== safeTransport.id);
    } else {
      if (!currentFavorites.some(fav => fav.id === safeTransport.id)) {
        updatedFavorites = [...currentFavorites, safeTransport];
      } else {
        updatedFavorites = currentFavorites;
      }
    }

    await storeData(FAVORITES_KEY, updatedFavorites);
    setIsFavorite(!isFavorite);
    setIsLoadingFavorite(false);
  }, [isFavorite, safeTransport]);

  const handleViewMap = () => {
    if (!safeTransport.stops || safeTransport.stops.length === 0) {
      alert("No stop information available to display on the map.");
      return;
    }
  
    // Prepare navigation parameters
    const mapParams = {
      stops: safeTransport.stops,
      fromLocation,
      toLocation,
      routeInfo: {
        name: safeTransport.vehicle.name,
        type: safeTransport.vehicleType,
        number: safeTransport.routeNumber,
      }
    };
  
    // For multi-leg journeys, add additional parameters
    if (safeTransport.isMultiLeg && safeTransport.secondLeg) {
      mapParams.isMultiLeg = true;
      mapParams.transferStop = safeTransport.transferStop;
      mapParams.secondLegStops = safeTransport.secondLeg.stops || [];
    }
  
    navigation.navigate('MapScreen', mapParams);
  };

  const RouteStop = ({ stop, isFirst, isLast, isTransfer }) => (
    <View style={styles.stopContainer}>
      <View style={styles.stopIndicator}>
        {isFirst ? (
          <View style={[styles.dot, styles.startDot]}>
            <MaterialCommunityIcons name="flag-variant" size={16} color={colors.background} />
          </View>
        ) : isLast ? (
          <View style={[styles.dot, styles.endDot]}>
            <MaterialCommunityIcons name="flag-checkered" size={16} color={colors.background} />
          </View>
        ) : isTransfer ? (
          <View style={[styles.dot, styles.transferDot]}>
            <MaterialCommunityIcons name="transfer" size={16} color={colors.background} />
          </View>
        ) : (
          <View style={styles.dot} />
        )}
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={styles.stopDetails}>
        <Text style={[
          styles.stopText,
          (isFirst || isLast) && styles.terminalStopText,
          isTransfer && styles.transferStopText
        ]}>
          {stop.name || stop.stops_name}
        </Text>
        {isTransfer && (
          <Text style={styles.transferLabel}>Transfer Point</Text>
        )}
      </View>
    </View>
  );

  const imageSource = vehicleImages[safeTransport.vehicleType?.toLowerCase()] || vehicleImages.bus;

  const [filteredStops, setFilteredStops] = useState([]);
  const [firstLegStops, setFirstLegStops] = useState([]);
  const [secondLegStops, setSecondLegStops] = useState([]);

  useEffect(() => {
    if (safeTransport.isMultiLeg && safeTransport.secondLeg) {
      if (safeTransport.stops && safeTransport.stops.length > 0) {
        const transferStopName = safeTransport.transferStop?.stops_name || 'Transfer Point';
        const transferStopIndex = safeTransport.stops.findIndex(stop => stop.name === transferStopName);
        
        if (transferStopIndex !== -1) {
          const startIndex = safeTransport.stops.findIndex(stop => stop.name === fromLocation);
          const stopsToTransfer = safeTransport.stops.slice(
            startIndex !== -1 ? startIndex : 0,
            transferStopIndex + 1
          );
          setFirstLegStops(stopsToTransfer);
        } else {
          setFirstLegStops(safeTransport.stops);
        }
      }
      
      if (safeTransport.secondLeg && safeTransport.secondLeg.stops && safeTransport.secondLeg.stops.length > 0) {
        setSecondLegStops(safeTransport.secondLeg.stops);
      }
    } else {
      const fromIndex = safeTransport.stops.findIndex(stop => stop.name === fromLocation);
      const toIndex = safeTransport.stops.findIndex(stop => stop.name === toLocation);

      if (fromIndex === -1 || toIndex === -1) {
        console.warn("From or To location not found in stops list.");
        setFilteredStops(safeTransport.stops);
        return;
      }

      const startIndex = Math.min(fromIndex, toIndex);
      const endIndex = Math.max(fromIndex, toIndex);

      const slicedStops = safeTransport.stops.slice(startIndex, endIndex + 1);
      setFilteredStops(slicedStops);
    }
  }, [safeTransport, fromLocation, toLocation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {safeTransport.isMultiLeg ? 'Multi-Leg Journey' : `${safeTransport.vehicleType?.toUpperCase()} Details`}
        </Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleToggleFavorite} disabled={isLoadingFavorite}>
          {isLoadingFavorite ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={26}
              color={isFavorite ? colors.danger : colors.primaryText}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 80 }]}
      >
        <View style={styles.imageContainer}>
          <Image
            source={imageSource}
            style={styles.vehicleImage}
            resizeMode="cover"
          />
          {safeTransport.isMultiLeg && (
            <View style={styles.busHoppingBadge}>
              <Text style={styles.busHoppingBadgeText}>
                {safeTransport.transferCount || 1} Transfer{safeTransport.transferCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Route Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="information-outline" size={22} color={colors.primary} />
            <Text style={styles.cardTitle}>Route Summary</Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.primary} style={styles.statIcon}/>
              <View>
                <Text style={styles.statValue}>
                  Rs. {safeTransport.isMultiLeg ? safeTransport.combinedFare : safeTransport.fare}
                  {safeTransport.discountedFare && safeTransport.discountedFare !== safeTransport.fare && (
                    <Text style={styles.discountText}> (Rs. {safeTransport.discountedFare})</Text>
                  )}
                </Text>
                <Text style={styles.statLabel}>Fare</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="map-marker-distance" size={20} color={colors.primary} style={styles.statIcon}/>
              <View>
                <Text style={styles.statValue}>
                  {safeTransport.isMultiLeg ? safeTransport.combinedDistance : safeTransport.distance} km
                </Text>
                <Text style={styles.statLabel}>Est. Distance</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-time-eight-outline" size={20} color={colors.primary} style={styles.statIcon}/>
              <View>
                <Text style={styles.statValue} numberOfLines={1}>{safeTransport.timing}</Text>
                <Text style={styles.statLabel}>Operating Hours</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="sign-direction" size={20} color={colors.primary} style={styles.statIcon}/>
              <View>
                <Text style={styles.statValue}>
                  {safeTransport.isMultiLeg 
                    ? `Multiple Routes` 
                    : `#${safeTransport.routeNumber}`}
                </Text>
                <Text style={styles.statLabel}>Route Info</Text>
              </View>
            </View>
          </View>

          <View style={styles.routePathDisplay}>
            <MaterialCommunityIcons name="map-marker-path" size={18} color={colors.primary} />
            <Text style={styles.routePathText} numberOfLines={2}>
              {fromLocation} <Text style={{fontWeight: 'bold'}}>→</Text> {toLocation}
            </Text>
          </View>
        </View>

        {/* Multi-Leg Transfer Information */}
        {safeTransport.isMultiLeg && safeTransport.secondLeg && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="transfer" size={22} color={colors.primary} />
              <Text style={styles.cardTitle}>
                Transfer Information ({safeTransport.transferCount || 1} change{safeTransport.transferCount !== 1 ? 's' : ''})
              </Text>
            </View>

            <View style={styles.transferDetailsContainer}>
              <View style={styles.transferStep}>
                <Text style={styles.transferStepTitle}>1. First Vehicle</Text>
                <View style={styles.transferStepDetail}>
                  <MaterialCommunityIcons name="bus" size={16} color={colors.secondaryText} />
                  <Text style={styles.transferStepText}>
                    {safeTransport.vehicleType?.toUpperCase()} - {safeTransport.yatayatName}
                  </Text>
                </View>
                <View style={styles.transferStepDetail}>
                  <MaterialCommunityIcons name="routes" size={16} color={colors.secondaryText} />
                  <Text style={styles.transferStepText}>
                    {safeTransport.routeNo || 'N/A'} | {safeTransport.routeName || 'Unknown Route'}
                  </Text>
                </View>
                <View style={styles.transferStepDetail}>
                  <MaterialCommunityIcons name="map-marker-path" size={16} color={colors.secondaryText} />
                  <Text style={styles.transferStepText}>
                  {fromLocation} → {safeTransport.transferStop?.stops_name || 'Transfer Point'}
                  </Text>
                </View>
                <View style={styles.transferStepDetail}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.secondaryText} />
                  <Text style={styles.transferStepText}>
                    Time: {safeTransport.timing || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.transferInstruction}>
                <View style={styles.transferCircle}>
                  <MaterialCommunityIcons name="transfer" size={24} color={colors.background} />
                </View>
                <Text style={styles.transferInstructionText}>
                  Change to next vehicle at {safeTransport.transferStop?.stops_name || 'Transfer Point'}
                </Text>
              </View>

              <View style={styles.transferStep}>
                <Text style={styles.transferStepTitle}>2. Second Vehicle</Text>
                <View style={styles.transferStepDetail}>
                  <MaterialCommunityIcons name="bus" size={16} color={colors.secondaryText} />
                  <Text style={styles.transferStepText}>
                    {safeTransport.secondLeg.vehicleType?.toUpperCase()} - {safeTransport.secondLeg.yatayatName || 'Unknown Operator'}
                  </Text>
                </View>
                <View style={styles.transferStepDetail}>
                  <MaterialCommunityIcons name="routes" size={16} color={colors.secondaryText} />
                  <Text style={styles.transferStepText}>
                    {safeTransport.secondLeg.routeNo || 'N/A'} | {safeTransport.secondLeg.routeName || 'Unknown Route'}
                  </Text>
                </View>
                <View style={styles.transferStepDetail}>
                  <MaterialCommunityIcons name="map-marker-path" size={16} color={colors.secondaryText} />
                  <Text style={styles.transferStepText}>
                    {safeTransport.transferStop?.stops_name || 'Transfer Point'} → {toLocation}
                  </Text>
                </View>
                <View style={styles.transferStepDetail}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.secondaryText} />
                  <Text style={styles.transferStepText}>
                    Time: {safeTransport.secondLeg.estimatedTime || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.combinedStats}>
              <View style={styles.combinedStat}>
                <Text style={styles.combinedStatLabel}>Total Distance:</Text>
                <Text style={styles.combinedStatValue}>{safeTransport.combinedDistance || 'N/A'} km</Text>
              </View>
              <View style={styles.combinedStat}>
                <Text style={styles.combinedStatLabel}>Total Fare:</Text>
                <Text style={styles.combinedStatValue}>Rs. {safeTransport.combinedFare || 0}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Route Stops Section */}
        {filteredStops && filteredStops.length > 0 && !safeTransport.isMultiLeg && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="format-list-numbered" size={22} color={colors.primary} />
              <Text style={styles.cardTitle}>Route Stops</Text>
            </View>
            <View style={styles.stopsList}>
              {filteredStops.map((stop, index) => (
                <RouteStop
                  key={`${stop.lat}-${stop.lon}-${index}`}
                  stop={stop}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === filteredStops.length - 1}
                />
              ))}
            </View>
          </View>
        )}

        {/* For multi-leg journey */}
        {safeTransport.isMultiLeg && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="format-list-numbered" size={22} color={colors.primary} />
              <Text style={styles.cardTitle}>Complete Route Stops</Text>
            </View>
            <View style={styles.stopsList}>
              {firstLegStops && firstLegStops.length > 0 && (
                <>
                  <Text style={styles.legTitle}>First Leg:</Text>
                  {firstLegStops.map((stop, index) => (
                    <RouteStop
                      key={`first-leg-${index}`}
                      stop={stop}
                      index={index}
                      isFirst={index === 0}
                      isLast={index === firstLegStops.length - 1}
                      isTransfer={index === firstLegStops.length - 1 && index !== 0}
                    />
                  ))}
                </>
              )}
              
              {secondLegStops && secondLegStops.length > 0 && (
                <>
                  <Text style={styles.legTitle}>Second Leg:</Text>
                  {secondLegStops.map((stop, index) => (
                    <RouteStop
                      key={`second-leg-${index}`}
                      stop={stop}
                      index={index}
                      isFirst={index === 0}
                      isLast={index === secondLegStops.length - 1}
                      isTransfer={index === 0 && index !== secondLegStops.length - 1}
                    />
                  ))}
                </>
              )}
            </View>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <MaterialCommunityIcons name="information-outline" size={16} color={colors.secondaryText} />
          <Text style={styles.disclaimer}>
            Information may vary. Fares and schedules are subject to change.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Overlay Button */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.mapButton]}
          onPress={handleViewMap}
          disabled={!safeTransport.stops || safeTransport.stops.length === 0}
        >
          <MaterialCommunityIcons name="map-outline" size={20} color={colors.background} />
          <Text style={styles.actionButtonText}>View on Map</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.primaryText,
    marginHorizontal: spacing.xs,
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  imageContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.highlight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    position: 'relative',
  },
  vehicleImage: {
    width: '100%',
    height: screenWidth * 0.5,
    borderRadius: borderRadius.lg,
  },
  busHoppingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    zIndex: 1,
  },
  busHoppingBadgeText: {
    color: colors.background,
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
  },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.highlight,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primaryText,
    marginLeft: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingVertical: spacing.sm,
  },
  statIcon: {
    marginRight: spacing.sm,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: spacing.xxs,
  },
  statLabel: {
    color: colors.secondaryText,
    fontSize: fontSizes.sm,
  },
  discountText: {
    color: colors.secondaryText,
    fontSize: fontSizes.sm,
  },
  routePathDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: `${colors.primary}10`,
  },
  routePathText: {
    marginLeft: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.primaryText,
    fontWeight: '500',
    flexShrink: 1,
  },
  stopsList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stopContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  stopIndicator: {
    alignItems: 'center',
    width: 24,
    marginRight: spacing.md,
    marginTop: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.secondaryText,
    zIndex: 1,
  },
  startDot: {
    width: 20,
    height: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.circle,
  },
  endDot: {
    width: 20,
    height: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.circle,
  },
  transferDot: {
    width: 20,
    height: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.circle,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    position: 'absolute',
    top: 20,
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -1 }],
    zIndex: 0,
    height: 40,
  },
  stopDetails: {
    flex: 1,
  },
  stopText: {
    fontSize: fontSizes.md,
    color: colors.primaryText,
    lineHeight: fontSizes.md * 1.4,
  },
  terminalStopText: {
    fontWeight: '600',
    color: colors.primary,
  },
  actionsContainer: {
    padding: spacing.md,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.sm,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
  },
  disclaimer: {
    color: colors.secondaryText,
    fontSize: fontSizes.sm,
    marginLeft: spacing.xs,
    textAlign: 'center',
    flexShrink: 1,
  },
  // Styles for transfer information
  transferDetailsContainer: {
    padding: spacing.md,
  },
  transferStep: {
    marginBottom: spacing.md,
  },
  transferStepTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: spacing.sm,
  },
  transferStepDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  transferStepText: {
    fontSize: fontSizes.sm,
    color: colors.primaryText,
    marginLeft: spacing.sm,
  },
  transferInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
  },
  transferCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transferInstructionText: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.primary,
    fontWeight: '600',
  },
  combinedStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
    padding: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.highlight,
  },
  combinedStat: {
    alignItems: 'center',
  },
  combinedStatLabel: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
    marginBottom: spacing.xs,
  },
  combinedStatValue: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primaryText,
  },
  transferStopText: {
    fontWeight: '500',
    color: colors.accent,
  },
  transferLabel: {
    fontSize: fontSizes.xs,
    color: colors.accent,
    fontWeight: '500',
    marginTop: spacing.xxs,
  },
  
  // Leg titles for multi-leg journey
  legTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    zIndex: 10, // Ensure it's above other content
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mapButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
  },
  actionButtonText: {
    color: colors.background,
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

export default VehicleDetails;