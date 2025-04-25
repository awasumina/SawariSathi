// src/components/SearchResults.js
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius } from '../constants/theme';

const getVehicleIconName = (type) => {
    switch (type?.toLowerCase()) {
      case 'microbus': return 'van-passenger';
      case 'sajha': return 'bus-articulated-front';
      case 'tempo': return 'car-estate';
      case 'bus': return 'bus';
      default: return 'bus';
    }
};

// Fixed TransportCard component
// Updated version of the TransportCard component with improved multi-leg display
const TransportCard = React.memo(({ item, navigation, fromLocation, toLocation }) => {
  const {
    vehicle = { type: 'Bus', name: 'Unknown Route' },
    fare = 0,
    discountedFare = 0,
    distance = 'N/A',
    estimatedTime = 'N/A',
    vehicleType = 'bus',
    routeNo = 'Unknown',
    routeName = 'Unknown Route',
    yatayatName = 'Unknown Operator',
    id,
    isMultiLeg = false,
    secondLeg = null,
    transferStop = null,
    combinedFare = 0,
    combinedDistance = 0,
  } = item;

  const handleViewDetails = () => {
    navigation.navigate('VehicleDetails', {
      transport: item,
      fromLocation,
      toLocation,
    });
  };

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={handleViewDetails}
      activeOpacity={0.7}
    >
      {isMultiLeg && (
        <View style={styles.busHoppingBadge}>
          <Text style={styles.busHoppingBadgeText}>
            {item.transferCount || 1} Transfer{item.transferCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <View style={styles.operatorSection}>
          <View style={styles.itemIconContainer}>
            <MaterialCommunityIcons
              name={getVehicleIconName(vehicleType)}
              size={24}
              color={colors.background}
            />
          </View>
          <View>
            <Text style={styles.operatorName} numberOfLines={1}>
              {isMultiLeg ? 
                `${yatayatName|| 'Multiple'} → ${secondLeg?.yatayatName|| 'Unknown'}` : 
                `${yatayatName || 'Unknown'}`}
            </Text>
            <Text style={styles.vehicleType}>
              {isMultiLeg ? 
                `${vehicleType?.toUpperCase() || 'BUS'} → ${secondLeg?.vehicleType?.toUpperCase() || 'BUS'}` : 
                vehicleType?.toUpperCase() || 'BUS'}
            </Text>
          </View>
        </View>
        <View style={styles.fareSection}>
          <Text style={styles.fareLabel}>Total Fare</Text>
          <Text style={styles.fareAmount}>
            Rs. {isMultiLeg ? 
              (combinedFare || (fare || 0) + (secondLeg?.fare || 0)) : 
              fare}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsContainer}>
        {isMultiLeg ? (
          <>
            <View style={styles.multiLegContainer}>
              {/* First Leg */}
              <View style={styles.legContainer}>
                <Text style={styles.legTitle}>First Transit:</Text>
                {/* <View style={styles.legDetailRow}>
                  <MaterialCommunityIcons name="routes" size={16} color={colors.secondaryText} />
                  <Text style={styles.legDetailText} numberOfLines={1}>
                    {routeNo || 'N/A'} | {routeName || 'Unknown Route'}
                  </Text>
                </View> */}
                <View style={styles.legDetailRow}>
                  <MaterialCommunityIcons name="map-marker-path" size={16} color={colors.secondaryText} />
                  <Text style={styles.legDetailText} numberOfLines={1}>
                    {fromLocation} → {transferStop?.stops_name || 'Transfer Point'}
                  </Text>
                </View>
                <View style={styles.legDetailRow}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.secondaryText} />
                  <Text style={styles.legDetailText}>
                    Time: {item.estimatedTime || 'N/A'}
                  </Text>
                </View>
                <View style={styles.legDetailRow}>
                  <MaterialCommunityIcons name="map-marker-distance" size={16} color={colors.secondaryText} />
                  <Text style={styles.legDetailText}>
                    Distance: {item.distance || 'N/A'} km
                  </Text>
                </View>
                <View style={styles.legDetailRow}>
                  <MaterialCommunityIcons name="cash" size={16} color={colors.secondaryText} />
                  <Text style={styles.legDetailText}>
                    Fare: Rs. {item.fare || 0}
                  </Text>
                </View>
              </View>

              {/* Transfer Information */}
              <View style={styles.transferInfo}>
                <MaterialCommunityIcons name="transfer" size={20} color={colors.primary} />
                <Text style={styles.transferText} numberOfLines={1}>
                  Change at {transferStop?.stops_name || 'Transfer Point'} to:
                </Text>
              </View>

              {/* Second Leg */}
              <View style={styles.legContainer}>
                <Text style={styles.legTitle}>Second Transit:</Text>
                {/* <View style={styles.legDetailRow}>
                  <MaterialCommunityIcons name="routes" size={16} color={colors.secondaryText} />
                  <Text style={styles.legDetailText} numberOfLines={1}>
                    {secondLeg?.routeNo || 'N/A'} | {secondLeg?.routeName || 'Unknown Route'}
                  </Text>
                </View> */}
                <View style={styles.legDetailRow}>
                  <MaterialCommunityIcons name="map-marker-path" size={16} color={colors.secondaryText} />
                  <Text style={styles.legDetailText} numberOfLines={1}>
                    {transferStop?.stops_name || 'Transfer Point'} → {toLocation}
                  </Text>
                </View>
                <View style={styles.legDetailRow}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.secondaryText} />
                  <Text style={styles.legDetailText}>
                    Time: {secondLeg?.estimatedTime || 'N/A'}
                  </Text>
                </View>
                <View style={styles.legDetailRow}>
                  <MaterialCommunityIcons name="map-marker-distance" size={16} color={colors.secondaryText} />
                  <Text style={styles.legDetailText}>
                    Distance: {secondLeg?.distance || 'N/A'} km
                  </Text>
                </View>
                <View style={styles.legDetailRow}>
                  <MaterialCommunityIcons name="cash" size={16} color={colors.secondaryText} />
                  <Text style={styles.legDetailText}>
                    Fare: Rs. {secondLeg?.fare || 0}
                  </Text>
                </View>
              </View>
            </View>

            {/* Combined Stats Summary */}
            <View style={styles.combinedStats}>
              <View style={styles.combinedStat}>
                <Text style={styles.combinedStatLabel}>Total Distance:</Text>
                <Text style={styles.combinedStatValue}>{combinedDistance || 'N/A'} km</Text>
              </View>
              <View style={styles.combinedStat}>
                <Text style={styles.combinedStatLabel}>Total Fare:</Text>
                <Text style={styles.combinedStatValue}>Rs. {combinedFare || 0}</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="routes" size={16} color={colors.secondaryText} />
              <Text style={styles.detailLabel}>Route:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {routeNo || 'Unknown'} | {routeName || 'Unknown Route'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={colors.secondaryText} />
              <Text style={styles.detailLabel}>Timing:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{estimatedTime || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker-distance" size={16} color={colors.secondaryText} />
              <Text style={styles.detailLabel}>Distance:</Text>
              <Text style={styles.detailValue}>{distance || 'N/A'} km</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>View Full Details</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
});

const SearchResults = ({ route, navigation }) => {
  const { results = [], fromLocation = 'Origin', toLocation = 'Destination', routeNo = 'N/A' } = route.params || {};

  const renderItem = useCallback(({ item }) => (
    <TransportCard
      item={item}
      navigation={navigation}
      fromLocation={fromLocation}
      toLocation={toLocation}
    />
  ), [fromLocation, toLocation, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
        <Text style={styles.headerSubTitle}>Available Transport</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {fromLocation} - {toLocation}
          </Text>

        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {results.length} option{results.length !== 1 ? 's' : ''} found
            </Text>
          }
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <MaterialCommunityIcons name="bus-alert" size={64} color={colors.secondaryText} style={{ marginBottom: spacing.md }}/>
          <Text style={styles.noResultsText}>No Transport Options Found</Text>
          <Text style={styles.noResultsSubtext}>
            We couldn't find specific transport options for this route.
          </Text>
          <TouchableOpacity style={styles.tryAgainButton} onPress={() => navigation.goBack()}>
            <Text style={styles.tryAgainText}>Search Again</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
    // borderRadius: borderRadius.sm,
    // backgroundColor: colors.highlight,
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.primaryText,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  listContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  resultsCount: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.secondaryText,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  cardContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  operatorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  operatorName: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.primaryText,
  },
  vehicleType: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
    marginTop: 2,
  },
  fareSection: {
    alignItems: 'flex-end',
  },
  fareLabel: {
    fontSize: fontSizes.xs,
    color: colors.secondaryText,
    marginBottom: 2,
  },
  fareAmount: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.primary,
  },
  discountedFare: {
    fontSize: fontSizes.xs,
    color: colors.accent,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  detailsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  detailIcon: {
    marginRight: spacing.sm,
    width: 16,
    textAlign: 'center',
  },
  detailLabel: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
    width: 60,
  },
  detailValue: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.primaryText,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: spacing.sm,
    paddingRight: spacing.md,
    backgroundColor: colors.highlight,
  },
  viewDetailsText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl * 2,
  },
  noResultsText: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: spacing.sm,
    textAlign: 'center',
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
    marginTop: spacing.md,
  },
  tryAgainText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: fontSizes.md,
  },
  busHoppingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
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
  multiLegContainer: {
    marginVertical: spacing.sm,
  },
  legContainer: {
    marginBottom: spacing.sm,
  },
  legTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: spacing.xs,
  },
  legDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xxs,
  },
  legDetailText: {
    fontSize: fontSizes.sm,
    color: colors.primaryText,
    marginLeft: spacing.sm,
  },
  transferInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.sm,
  },
  transferText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  combinedStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  combinedStat: {
    alignItems: 'center',
  },
  combinedStatLabel: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
  },
  combinedStatValue: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primaryText,
  },
  headerSubTitle: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
  },
});

export default SearchResults;