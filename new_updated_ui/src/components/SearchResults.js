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
            <Text style={styles.operatorName}>{yatayatName} Yatayat</Text>
            <Text style={styles.vehicleType}>{vehicleType?.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.fareSection}>
          <Text style={styles.fareLabel}>Fare</Text>
          <Text style={styles.fareAmount}>Rs. {fare}</Text>
          {/* {discountedFare > 0 && discountedFare !== fare && (
            <Text style={styles.discountedFare}>Rs. {discountedFare} Discount</Text>
          )} */}
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.detailsContainer}>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons 
            name="routes" 
            size={16} 
            color={colors.secondaryText} 
            style={styles.detailIcon}
          />
          <Text style={styles.detailLabel}>Route:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {routeNo} | {routeName}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialCommunityIcons 
            name="clock-outline" 
            size={16} 
            color={colors.secondaryText} 
            style={styles.detailIcon}
          />
          <Text style={styles.detailLabel}>Timing:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{estimatedTime}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialCommunityIcons 
            name="map-marker-distance" 
            size={16} 
            color={colors.secondaryText} 
            style={styles.detailIcon}
          />
          <Text style={styles.detailLabel}>Distance:</Text>
          <Text style={styles.detailValue}>{distance} km</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons 
            name="cash-minus" 
            size={16} 
            color={colors.secondaryText} 
            style={styles.detailIcon}
          />
          <Text style={styles.detailLabel}>Discount:</Text>
          {discountedFare > 0 && discountedFare !== fare && (
            <Text style={styles.detailValue}>Rs. {discountedFare}</Text>
          )}
        </View>
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
});

export default SearchResults;