// src/components/SearchResults.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  FlatList,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const getVehicleIconName = (type) => {
    switch (type?.toLowerCase()) {
      case 'microbus': return 'van-passenger';
      case 'sajha': return 'bus-articulated-front';
      case 'tempo': return 'car-estate';
      case 'bus': return 'bus';
      default: return 'bus';
    }
};

const ExpandableTransportItem = React.memo(({ item, onExpandToggle, isExpanded, navigation, fromLocation, toLocation }) => {
  const {
    vehicle = { type: 'Bus', name: 'Unknown Route' },
    fare = 0,
    discountedFare = 0,
    distance = 'N/A',
    estimatedTime = 'N/A',
    vehicleType = 'bus',
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
    <View style={styles.itemOuterContainer}>
      <TouchableOpacity
        style={styles.itemHeader}
        onPress={() => onExpandToggle(id)}
        activeOpacity={0.7}
      >
        <View style={styles.itemIconContainer}>
           <MaterialCommunityIcons
             name={getVehicleIconName(vehicleType)}
             size={24}
             color={colors.background}
           />
        </View>
        <View style={styles.itemHeaderText}>
           <Text style={styles.itemVehicleType}>{vehicleType?.toUpperCase() || 'TRANSPORT'}</Text>
           <Text style={styles.itemFare}>Rs. {fare}</Text>
        </View>
        <MaterialCommunityIcons
           name={isExpanded ? 'chevron-up' : 'chevron-down'}
           size={28}
           color={colors.primary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker-distance" size={18} color={colors.secondaryText} style={styles.detailIcon}/>
            <Text style={styles.detailLabel}>Distance:</Text>
            <Text style={styles.detailValue}>{distance} km</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={colors.secondaryText} style={styles.detailIcon}/>
            <Text style={styles.detailLabel}>Timing:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{estimatedTime}</Text>
          </View>
          {discountedFare > 0 && discountedFare !== fare && (
              <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="tag-outline" size={18} color={colors.secondaryText} style={styles.detailIcon}/>
                  <Text style={styles.detailLabel}>Discount:</Text>
                  <Text style={styles.detailValue}>Rs. {discountedFare}</Text>
              </View>
          )}
          <View style={styles.detailRow}>
              <MaterialCommunityIcons name="information-outline" size={18} color={colors.secondaryText} style={styles.detailIcon}/>
              <Text style={styles.detailLabel}>Route:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{vehicle.name}</Text>
          </View>

          <TouchableOpacity style={styles.viewDetailsButton} onPress={handleViewDetails}>
            <Text style={styles.viewDetailsButtonText}>View Full Details</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={colors.background} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const SearchResults = ({ route, navigation }) => {
  const { results = [], fromLocation = 'Origin', toLocation = 'Destination', routeNo = 'N/A' } = route.params || {};
  const [expandedItems, setExpandedItems] = useState({});

  const handleExpandToggle = useCallback((id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const renderItem = useCallback(({ item }) => (
     <ExpandableTransportItem
         item={item}
         onExpandToggle={handleExpandToggle}
         isExpanded={!!expandedItems[item.id]}
         navigation={navigation}
         fromLocation={fromLocation}
         toLocation={toLocation}
     />
  ), [expandedItems, fromLocation, toLocation, navigation, handleExpandToggle]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
       <View style={styles.header}>
           <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
               <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
           </TouchableOpacity>
           <View style={styles.headerTitleContainer}>
               <Text style={styles.headerTitle}>Available Transport</Text>
               <Text style={styles.headerSubtitle} numberOfLines={1}>
                   {fromLocation} → {toLocation}
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
                 {results.length} option{results.length !== 1 ? 's' : ''} found for Route #{routeNo}
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
    itemOuterContainer: {
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
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.cardBackground,
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
    itemHeaderText: {
        flex: 1,
        marginRight: spacing.sm,
    },
    itemVehicleType: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.primaryText,
    },
    itemFare: {
        fontSize: fontSizes.md,
        fontWeight: '500',
        color: colors.secondaryText,
        marginTop: spacing.xxs,
    },
    expandedContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    detailIcon: {
        marginRight: spacing.sm,
        width: 20,
        textAlign: 'center',
    },
    detailLabel: {
        fontSize: fontSizes.sm,
        color: colors.secondaryText,
        width: 80,
    },
    detailValue: {
        flex: 1,
        fontSize: fontSizes.sm,
        fontWeight: '500',
        color: colors.primaryText,
    },
    viewDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginTop: spacing.md,
        alignSelf: 'flex-end',
    },
    viewDetailsButtonText: {
        color: colors.background,
        fontSize: fontSizes.sm,
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