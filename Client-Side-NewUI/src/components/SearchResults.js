import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius } from '../constants/theme';

const TransportCard = ({ route, navigation, fromLocation, toLocation }) => {
  const { vehicle, fare, distance, estimatedTime } = route;
  
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() =>
        navigation.navigate('VehicleDetails', {
          transport: route,
          fromLocation,
          toLocation,
        })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.vehicleIconContainer}>
          <MaterialCommunityIcons
            name={vehicle.type === 'Bus' ? 'bus' : 'car'}
            size={24}
            color={colors.background}
          />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName} numberOfLines={1}>
            {vehicle.name}
          </Text>
          <Text style={styles.vehicleCount}>
            {vehicle.count} vehicles operating
          </Text>
        </View>
        <View style={styles.chevronContainer}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.secondaryText}
          />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <MaterialCommunityIcons
              name="cash"
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Fare</Text>
            <Text style={styles.detailValue}>Rs. {fare}</Text>
          </View>
        </View>
        
        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>{distance} km</Text>
          </View>
        </View>
        
        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Timing</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {estimatedTime}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.routePathContainer}>
          <MaterialCommunityIcons
            name="swap-horizontal-bold"
            size={16}
            color={colors.primary}
            style={styles.routeIcon}
          />
          <Text style={styles.routePath}>
            {fromLocation} → {toLocation}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const SearchResults = ({ route, navigation }) => {
  const { results, fromLocation, toLocation } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('../../assets/map-bg.jpg')}
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay}>
          {/* <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.background} />
          </TouchableOpacity> */}
          <Text style={styles.headerTitle}>Available Routes</Text>
          <View style={styles.routeInfoContainer}>
            <MaterialCommunityIcons
              name="map-marker-path"
              size={18}
              color={colors.background}
              style={styles.routeIcon}
            />
            <Text style={styles.routeSubtitle} numberOfLines={1}>
              {fromLocation} → {toLocation}
            </Text>
          </View>
        </View>
      </ImageBackground>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {results.length} route{results.length !== 1 ? 's' : ''} found
            </Text>
            <TouchableOpacity style={styles.filterButton}>
              <MaterialCommunityIcons
                name="filter-variant"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.filterText}>Filter</Text>
            </TouchableOpacity>
          </View>

          {results.length > 0 ? (
            results.map((route, index) => (
              <TransportCard
                key={`route-${index}`}
                route={route}
                navigation={navigation}
                fromLocation={fromLocation}
                toLocation={toLocation}
              />
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <View style={styles.noResultsIconContainer}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={48}
                  color={colors.secondaryText}
                />
              </View>
              <Text style={styles.noResultsText}>No routes found</Text>
              <Text style={styles.noResultsSubtext}>
                Try different locations or check back later
              </Text>
              <TouchableOpacity 
                style={styles.tryAgainButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.tryAgainText}>Try Different Locations</Text>
              </TouchableOpacity>
            </View>
          )}
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
  headerBackground: {
    width: '100%',
    height: 180,
    justifyContent: 'flex-end',
  },
  headerOverlay: {
    backgroundColor: `${colors.primary}E6`, // slightly transparent
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: borderRadius.circle,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: colors.background,
    marginBottom: spacing.xs,
  },
  routeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIcon: {
    marginRight: spacing.xs,
  },
  routeSubtitle: {
    fontSize: fontSizes.md,
    color: colors.background,
    opacity: 0.9,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  resultsContainer: {
    padding: spacing.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resultsCount: {
    fontSize: fontSizes.md,
    color: colors.secondaryText,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.lg,
  },
  filterText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  cardContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  vehicleIconContainer: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: borderRadius.circle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.primaryText,
  },
  vehicleCount: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
  },
  chevronContainer: {
    padding: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  cardBody: {
    padding: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.circle,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  detailTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: fontSizes.md,
    color: colors.secondaryText,
  },
  detailValue: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.primaryText,
  },
  cardFooter: {
    backgroundColor: colors.highlight,
    padding: spacing.md,
  },
  routePathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routePath: {
    fontSize: fontSizes.md,
    color: colors.primary,
    fontWeight: '500',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  noResultsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  noResultsText: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: spacing.md,
  },
  noResultsSubtext: {
    fontSize: fontSizes.md,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  tryAgainButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  tryAgainText: {
    color: colors.background,
    fontWeight: '600',
  },
});

export default SearchResults;