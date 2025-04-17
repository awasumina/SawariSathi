// src/components/VehicleDetails.js
import React , { useState, useEffect, useCallback }from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image, // Import Image
  Dimensions,
  ActivityIndicator, // To get screen width
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius } from '../constants/theme';
import { vehicleImages } from '../constants/vehicleImages'; // Import vehicle images
import { storeData, getData } from '../utils/storage';

const screenWidth = Dimensions.get('window').width;
const FAVORITES_KEY = '@favorites'; // Key for storing favorites

const VehicleDetails = ({ route, navigation }) => {
  // Destructure props safely
  const { transport, fromLocation = 'Origin', toLocation = 'Destination' } = route.params || {};

   // --- ** State for Favorite Status ** ---
   const [isFavorite, setIsFavorite] = useState(false);
   const [isLoadingFavorite, setIsLoadingFavorite] = useState(true); // Loading state

  // Create a safe transport object with defaults, crucial: include vehicleType
   // ensure it has a stable ID
   const safeTransport = React.useMemo(() => ({
    id: transport?.id || `vehicle-${Math.random()}`, // Crucial: MUST have a stable ID
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
    routeNumber: transport?.routeNo || 'N/A',
    timing: transport?.estimatedTime || 'N/A',
    vehicleType: transport?.vehicleType || 'bus',
    // Include from/to in the saved object for context in FavoritesScreen
    fromLocation: fromLocation,
    toLocation: toLocation,
}), [transport, fromLocation, toLocation]);

 // --- ** Check Favorite Status on Load ** ---
 useEffect(() => {
  const checkFavoriteStatus = async () => {
    if (!safeTransport.id) { // Don't proceed if no ID
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
}, [safeTransport.id]); // Re-check if the ID changes (shouldn't often)

// --- ** Toggle Favorite Handler ** ---
const handleToggleFavorite = useCallback(async () => {
  if (!safeTransport.id) {
      alert("Cannot save favorite: Missing unique identifier.");
      return;
  }
  setIsLoadingFavorite(true); // Show indicator during save
  const currentFavorites = await getData(FAVORITES_KEY) || [];
  let updatedFavorites;

  if (isFavorite) {
    // Remove from favorites
    updatedFavorites = currentFavorites.filter(fav => fav.id !== safeTransport.id);
  } else {
    // Add to favorites (prevent duplicates just in case)
     if (!currentFavorites.some(fav => fav.id === safeTransport.id)) {
         updatedFavorites = [...currentFavorites, safeTransport];
     } else {
         updatedFavorites = currentFavorites; // Already exists, no change needed
     }
  }

  await storeData(FAVORITES_KEY, updatedFavorites);
  setIsFavorite(!isFavorite); // Update local state
  setIsLoadingFavorite(false);
}, [isFavorite, safeTransport]);

  // Handle navigation to MapScreen
  const handleViewMap = () => {
    if (!safeTransport.stops || safeTransport.stops.length === 0) {
        alert("No stop information available to display on the map.");
        return;
    }
    navigation.navigate('MapScreen', {
      stops: safeTransport.stops, // Pass the processed stops
      fromLocation,
      toLocation,
      routeInfo: { // Pass relevant info for the map header
        name: safeTransport.vehicle.name,
        type: safeTransport.vehicleType, // Pass the specific type
        number: safeTransport.routeNumber,
      }
    });
  };

  // Component to render each stop in the list
  const RouteStop = ({ stop, isFirst, isLast }) => (
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
        ) : (
          <View style={styles.dot} />
        )}
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={styles.stopDetails}>
        <Text style={[
          styles.stopText,
          (isFirst || isLast) && styles.terminalStopText // Style for first/last stops
        ]}>
          {stop.name}
        </Text>
        {/* Optional: Label for start/end */}
        {/* {(isFirst || isLast) && (
          <Text style={styles.stopLabel}>
            {isFirst ? 'Start' : 'End'}
          </Text>
        )} */}
      </View>
    </View>
  );

  // Determine the image source based on vehicleType
  const imageSource = vehicleImages[safeTransport.vehicleType?.toLowerCase()] || vehicleImages.bus; // Default to bus

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Custom Header */}
      <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{safeTransport.vehicleType?.toUpperCase()} Details</Text>
          {/* Favorite Toggle Button */}
          <TouchableOpacity style={styles.headerButton} onPress={handleToggleFavorite} disabled={isLoadingFavorite}>
              {isLoadingFavorite ? (
                  <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                  <Ionicons
                      name={isFavorite ? 'heart' : 'heart-outline'}
                      size={26} // Slightly larger
                      color={isFavorite ? colors.danger : colors.primaryText} // Red when favorite
                  />
              )}
          </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>

         {/* Vehicle Image Display */}
         <View style={styles.imageContainer}>
             <Image
                 source={imageSource}
                 style={styles.vehicleImage}
                 resizeMode="cover" // Or 'contain' depending on image aspect ratios
             />
         </View>

        {/* Route Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="information-outline" size={22} color={colors.primary} />
            <Text style={styles.cardTitle}>Route Summary</Text>
          </View>

          <View style={styles.statsContainer}>
            {/* Fare */}
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.primary} style={styles.statIcon}/>
              <View>
                  <Text style={styles.statValue}>
                    Rs. {safeTransport.fare}
                    {safeTransport.discountedFare && safeTransport.discountedFare !== safeTransport.fare && (
                      <Text style={styles.discountText}> (Rs. {safeTransport.discountedFare})</Text>
                    )}
                  </Text>
                  <Text style={styles.statLabel}>Fare</Text>
              </View>
            </View>
            {/* Distance */}
            <View style={styles.statItem}>
             <MaterialCommunityIcons name="map-marker-distance" size={20} color={colors.primary} style={styles.statIcon}/>
              <View>
                 <Text style={styles.statValue}>{safeTransport.distance} km</Text>
                 <Text style={styles.statLabel}>Est. Distance</Text>
              </View>
            </View>
            {/* Timing */}
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-time-eight-outline" size={20} color={colors.primary} style={styles.statIcon}/>
              <View>
                <Text style={styles.statValue} numberOfLines={1}>{safeTransport.timing}</Text>
                <Text style={styles.statLabel}>Operating Hours</Text>
              </View>
            </View>
             {/* Route Number */}
            <View style={styles.statItem}>
                <MaterialCommunityIcons name="sign-direction" size={20} color={colors.primary} style={styles.statIcon}/>
                <View>
                   <Text style={styles.statValue}>#{safeTransport.routeNumber}</Text>
                   <Text style={styles.statLabel}>Route No.</Text>
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

        {/* Route Stops Section */}
        {safeTransport.stops && safeTransport.stops.length > 0 && (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="format-list-numbered" size={22} color={colors.primary} />
                    <Text style={styles.cardTitle}>Route Stops</Text>
                </View>
                <View style={styles.stopsList}>
                  {safeTransport.stops.map((stop, index) => (
                    <RouteStop
                      key={`${stop.lat}-${stop.lon}-${index}`} // More robust key
                      stop={stop}
                      index={index}
                      isFirst={index === 0}
                      isLast={index === safeTransport.stops.length - 1}
                    />
                  ))}
                </View>
            </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.mapButton]}
            onPress={handleViewMap}
            disabled={!safeTransport.stops || safeTransport.stops.length === 0} // Disable if no stops
          >
            <MaterialCommunityIcons name="map-outline" size={20} color={colors.background} />
            <Text style={styles.actionButtonText}>View on Map</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity style={[styles.actionButton, styles.favoriteButton]}>
            <MaterialCommunityIcons name="heart-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, styles.favoriteText]}>Save Route</Text>
          </TouchableOpacity> */}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <MaterialCommunityIcons name="information-outline" size={16} color={colors.secondaryText} />
          <Text style={styles.disclaimer}>
            Information may vary. Fares and schedules are subject to change.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  // Custom Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Space items evenly
    paddingHorizontal: spacing.sm, // Reduced padding
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    padding: spacing.sm,
    minWidth: 44, // Ensure tap area
    minHeight: 44, // Ensure tap area
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.primaryText,
    marginHorizontal: spacing.xs, // Give title some breathing room
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  // Image Styles
  imageContainer: {
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      marginBottom: spacing.sm, // Space below image
      borderRadius: borderRadius.lg,
      overflow: 'hidden', // Clip image to rounded corners
      backgroundColor: colors.highlight, // Placeholder background
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 4,
  },
  vehicleImage: {
    width: '100%',
    height: screenWidth * 0.5, // Adjust aspect ratio as needed (e.g., 50% of screen width)
    borderRadius: borderRadius.lg, // Match container rounding
  },
  // Card Styles
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg, // Space between cards
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
    backgroundColor: colors.highlight, // Subtle header background
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primaryText,
    marginLeft: spacing.sm,
  },
  // Stats Styles
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow items to wrap on smaller screens
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%', // Two items per row
    paddingVertical: spacing.sm, // Vertical padding for each item
    // marginBottom: spacing.sm,
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
      backgroundColor: `${colors.primary}10`, // Light primary background
  },
  routePathText: {
      marginLeft: spacing.sm,
      fontSize: fontSizes.md,
      color: colors.primaryText,
      fontWeight: '500',
      flexShrink: 1, // Allow text to shrink
  },
  // Stops List Styles
  stopsList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, // Add vertical padding
  },
  stopContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align items to the top for multiline text
    paddingVertical: spacing.sm, // Add vertical padding to each stop item
  },
  stopIndicator: {
    alignItems: 'center',
    width: 24, // Increased width for bigger dots
    marginRight: spacing.md,
    marginTop: 2, // Align indicator slightly lower
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
  line: {
    width: 2,
    flex: 1, // Make line fill the space between dots
    backgroundColor: colors.border,
    position: 'absolute',
    top: 20, // Start below the start/end dot
    bottom: 0,
    left: '50%', // Center the line
    transform: [{ translateX: -1 }], // Adjust position based on line width
    zIndex: 0,
    // Need to calculate dynamic height if items vary greatly, or set a fixed large height
    height: 40, // Adjust based on typical item height
  },
  stopDetails: {
    flex: 1, // Allow text to take space
  },
  stopText: {
    fontSize: fontSizes.md,
    color: colors.primaryText,
    lineHeight: fontSizes.md * 1.4, // Improve readability
  },
  terminalStopText: { // Style for first and last stops
    fontWeight: '600',
    color: colors.primary,
  },
  stopLabel: { /* Optional Label */ },
  // Actions Styles
  actionsContainer: {
    padding: spacing.md,
    // flexDirection: 'row', // Keep as column for single button now
    // justifyContent: 'space-between',
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
    // flex: 1, // Make it full width if it's the only button
  },
  actionButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  mapButton: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      // If only one button, make it full width:
      // flex: 1,
  },
  actionButtonText: {
      color: colors.background, // Text color for primary button
      fontSize: fontSizes.md,
      fontWeight: '600',
      marginLeft: spacing.sm,
  },
  favoriteButton: { /* Styles if favorite button is added back */ },
  favoriteText: { /* Styles if favorite button is added back */ },
  // Disclaimer Styles
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md, // Space above disclaimer
    marginBottom: spacing.lg, // Space below disclaimer
    padding: spacing.sm,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
  },
  disclaimer: {
    color: colors.secondaryText,
    fontSize: fontSizes.sm,
    marginLeft: spacing.xs,
    textAlign: 'center',
    flexShrink: 1, // Allow text to wrap
  },
});


export default VehicleDetails;