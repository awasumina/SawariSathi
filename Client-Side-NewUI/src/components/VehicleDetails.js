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
  ImageBackground,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius } from '../constants/theme';

const VehicleDetails = ({ route, navigation }) => {
  const { transport, fromLocation, toLocation } = route.params;
  
  const safeTransport = {
    ...transport,
    vehicle: {
      type: transport.vehicle?.type || 'Bus',
      name: transport.vehicle?.name || 'Unknown Service',
      count: transport.vehicle?.count || 'N/A',
    },
    stops: transport.stops?.map(stop => ({
      name: stop.stops_name || 'Unknown Stop',
      lat: parseFloat(stop.stops_lat) || 0,
      lon: parseFloat(stop.stops_lon) || 0
    })) || [],
    fare: transport.fare || 0,
    discountedFare: transport.discountedFare || null,
    distance: transport.distance || 'N/A',
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

  const RouteStop = ({ stop, isFirst, isLast, index }) => (
    <View style={styles.stopContainer}>
      <View style={styles.stopIndicator}>
        {isFirst ? (
          <View style={[styles.dot, styles.startDot]}>
            <MaterialCommunityIcons name="circle-slice-8" size={16} color={colors.background} />
          </View>
        ) : isLast ? (
          <View style={[styles.dot, styles.endDot]}>
            <MaterialCommunityIcons name="map-marker" size={16} color={colors.background} />
          </View>
        ) : (
          <View style={styles.dot} />
        )}
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={styles.stopDetails}>
        <Text style={[
          styles.stopText,
          isFirst && styles.startStopText,
          isLast && styles.endStopText
        ]}>
          {stop.name}
        </Text>
        {(isFirst || isLast) && (
          <Text style={styles.stopLabel}>
            {isFirst ? 'Starting Point' : 'Destination'}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Gradient Background */}
      <ImageBackground
        source={require('../../assets/transport-hero.jpg')}
        style={styles.headerBg}
      >
        <View style={styles.headerOverlay}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.background} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.vehicleIconContainer}>
              <MaterialCommunityIcons 
                name={safeTransport.vehicle.type.toLowerCase() === 'bus' ? 'bus' : 'car'} 
                size={28} 
                color={colors.background} 
              />
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={styles.routeName}>{safeTransport.vehicle.name}</Text>
              <Text style={styles.vehicleType}>
                {safeTransport.vehicle.type.toUpperCase()} SERVICE
              </Text>
              <View style={styles.routePathContainer}>
                <Text style={styles.routePath}>
                  {fromLocation} → {toLocation}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        {/* Route Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Route Summary</Text>
            <View style={styles.routeNumberContainer}>
              <Text style={styles.routeNumber}>Route #{safeTransport.routeNumber}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="cash" size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>
                Rs. {safeTransport.fare}
                {safeTransport.discountedFare && (
                  <Text style={styles.discountText}> (Rs. {safeTransport.discountedFare})</Text>
                )}
              </Text>
              <Text style={styles.statLabel}>Fare</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="map-marker-distance" size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{safeTransport.distance} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue} numberOfLines={1}>{safeTransport.timing}</Text>
              <Text style={styles.statLabel}>Timing</Text>
            </View>
          </View>
        </View>

        {/* Service Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
            <Text style={styles.infoTitle}>Service Information</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              This route is operated by {safeTransport.vehicle.count} vehicles throughout the day. 
              Peak hours may experience higher passenger volume.
            </Text>
            <View style={styles.operatorBadge}>
              <Text style={styles.operatorText}>Official City Service</Text>
            </View>
          </View>
        </View>

        {/* Route Details */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Route Stops</Text>
          <View style={styles.stopsList}>
            {safeTransport.stops.map((stop, index) => (
              <RouteStop 
                key={`${stop.name}-${index}`}
                stop={stop}
                index={index}
                isFirst={index === 0}
                isLast={index === safeTransport.stops.length - 1}
              />
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={handleViewMap}
          >
            <MaterialCommunityIcons name="map-outline" size={20} color={colors.background} />
            <Text style={styles.buttonText}>View on Map</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.favoriteButton}>
            <MaterialCommunityIcons name="heart-outline" size={20} color={colors.primary} />
            <Text style={styles.favoriteText}>Save Route</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <MaterialCommunityIcons name="information-outline" size={16} color={colors.secondaryText} />
          <Text style={styles.disclaimer}>
            Fares and schedules are subject to change without prior notice
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBg: {
    height: 180,
    width: '100%',
  },
  headerOverlay: {
    height: '100%',
    width: '100%',
    backgroundColor: `${colors.primary}E6`, // Slightly transparent
    padding: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.circle,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  vehicleIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 50,
    height: 50,
    borderRadius: borderRadius.circle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.background,
  },
  vehicleType: {
    color: colors.background,
    fontSize: fontSizes.sm,
    opacity: 0.8,
    marginBottom: spacing.sm,
  },
  routePathContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  routePath: {
    color: colors.background,
    fontSize: fontSizes.md,
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  summaryCard: {
    margin: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.highlight,
  },
  summaryTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primaryText,
  },
  routeNumberContainer: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  routeNumber: {
    color: colors.background,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.circle,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: spacing.xs,
  },
  statLabel: {
    color: colors.secondaryText,
    fontSize: fontSizes.sm,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  discountText: {
    color: colors.secondaryText,
    fontSize: fontSizes.sm,
    textDecorationLine: 'line-through',
  },
  infoCard: {
    margin: spacing.md,
    marginTop: 0,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primaryText,
    marginLeft: spacing.sm,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoText: {
    flex: 1,
    color: colors.secondaryText,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  operatorBadge: {
    backgroundColor: `${colors.success}20`,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginLeft: spacing.sm,
  },
  operatorText: {
    color: colors.success,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  sectionContainer: {
    margin: spacing.md,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: spacing.md,
  },
  stopsList: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stopContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  stopIndicator: {
    alignItems: 'center',
    width: 20,
    marginRight: spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.secondaryText,
    zIndex: 1,
  },
  startDot: {
    width: 24,
    height: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endDot: {
    width: 24,
    height: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    width: 2,
    height: 40,
    backgroundColor: colors.border,
    position: 'absolute',
    top: 12,
    zIndex: 0,
  },
  stopDetails: {
    flex: 1,
  },
  stopText: {
    fontSize: fontSizes.md,
    color: colors.primaryText,
  },
  startStopText: {
    fontWeight: '600',
    color: colors.primary,
  },
  endStopText: {
    fontWeight: '600',
    color: colors.primary,
  },
  stopLabel: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
    marginTop: spacing.xs,
  },
  actionsContainer: {
    flexDirection: 'row',
    margin: spacing.md,
    marginTop: spacing.lg,
  },
  mapButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: colors.background,
    fontSize: fontSizes.md,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  favoriteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}15`,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  favoriteText: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.lg,
    marginTop: spacing.xl,
  },
  disclaimer: {
    color: colors.secondaryText,
    fontSize: fontSizes.sm,
    marginLeft: spacing.xs,
  },
});

export default VehicleDetails;