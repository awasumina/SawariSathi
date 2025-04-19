// src/components/FavoritesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getData, storeData } from '../utils/storage';
import { colors, spacing, fontSizes, borderRadius } from '../constants/theme';
import axios from 'axios';
// If transformRouteData is defined in SearchScreen and exported:
// import { transformRouteData } from '../screens/SearchScreen';
import { API_BASE_URL } from '../config/api';

const FAVORITES_KEY = '@favorites';
// const API_BASE_URL = 'http://192.168.101.2:3000/api'; removed for single file imported above

const getVehicleIconName = (type) => {
    switch (type?.toLowerCase()) {
      case 'microbus': return 'van-passenger';
      case 'sajha': return 'bus-articulated-front';
      case 'tempo': return 'car-estate';
      case 'bus': return 'bus';
      default: return 'bus';
    }
};

const FavoriteItem = React.memo(({ item, onPressItem, onRemove, isLoading }) => {
    const {
        vehicleType = 'bus',
        fare = 0,
        fromLocation = 'Origin',
        toLocation = 'Destination',
        routeName = 'Unknown Route',
        routeNo = 'N/A',
        id,
    } = item;

    const handlePress = () => {
        if (!isLoading) {
            onPressItem(item);
        }
    };

    const handleRemovePress = (e) => {
        e.stopPropagation();
        Alert.alert(
            "Remove Favorite",
            `Remove route ${routeNo}?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: () => onRemove(id) }
            ]
        );
    };

    return (
        <TouchableOpacity style={styles.itemContainer} onPress={handlePress} activeOpacity={0.8} disabled={isLoading}>
            <View style={styles.itemIconContainer}>
                {isLoading ? (
                    <ActivityIndicator size="small" color={colors.background} />
                ) : (
                    <MaterialCommunityIcons name={getVehicleIconName(vehicleType)} size={24} color={colors.background} />
                )}
            </View>
            <View style={styles.itemContent}>
                <Text style={styles.itemRouteName} numberOfLines={1}>{routeName} (#{routeNo})</Text>
                <Text style={styles.itemPath} numberOfLines={1}>{fromLocation} → {toLocation}</Text>
                <Text style={styles.itemFare}>Fare: Rs. {fare}</Text>
            </View>
            <TouchableOpacity onPress={handleRemovePress} style={styles.removeButton} disabled={isLoading}>
                <Ionicons name="trash-bin-outline" size={22} color={isLoading ? colors.disabled : colors.danger} />
            </TouchableOpacity>
        </TouchableOpacity>
    );
});

const FavoritesScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingItemId, setLoadingItemId] = useState(null); // State for item-specific loading
  const isFocused = useIsFocused();

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    const storedFavorites = await getData(FAVORITES_KEY);
    setFavorites(storedFavorites && Array.isArray(storedFavorites) ? storedFavorites : []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadFavorites();
    }
  }, [isFocused, loadFavorites]);

  const handleRemoveFavorite = useCallback(async (idToRemove) => {
    setIsLoading(true);
    const currentFavorites = await getData(FAVORITES_KEY) || [];
    const updatedFavorites = currentFavorites.filter(fav => fav.id !== idToRemove);
    await storeData(FAVORITES_KEY, updatedFavorites);
    setFavorites(updatedFavorites);
    setIsLoading(false);
  }, []);

  const handleFavoritePress = useCallback(async (favoriteItem) => {
    if (!favoriteItem.fromStopId || !favoriteItem.toStopId || !favoriteItem.id) {
        Alert.alert("Error", "Missing required information for this favorite.");
        return;
    }

    setLoadingItemId(favoriteItem.id); // Set loading state for the clicked item

    try {
      const response = await axios.get(
        `${API_BASE_URL}/routes/stops?stop1=${favoriteItem.fromStopId}&stop2=${favoriteItem.toStopId}`
      );

      if (response.data?.data?.[0]?.details?.length > 0) {
        const details = response.data.data[0].details;
        const freshDetailData = details.find(detail => detail.yatayat_id === favoriteItem.id);

        if (freshDetailData) {
           // Prepare data for VehicleDetails, prioritizing fresh data
           const transportDataForDetails = {
               ...favoriteItem, // Start with potentially stale saved data for display consistency
               id: freshDetailData.yatayat_id, // Ensure fresh ID is used if it differs (shouldn't)
               stops: freshDetailData.stops, // *Use FRESH stops*
               fare: freshDetailData.fare?.fare ?? favoriteItem.fare, // Prefer fresh fare
               discountedFare: freshDetailData.fare?.discounted_fare ?? favoriteItem.discountedFare,
               vehicleType: freshDetailData.vehicleType || favoriteItem.vehicleType, // Prefer fresh type
               // Keep original saved names unless API provides better ones
               fromLocation: favoriteItem.fromLocation,
               toLocation: favoriteItem.toLocation,
               routeName: freshDetailData.route_name || favoriteItem.routeName,
               routeNo: freshDetailData.route_no || favoriteItem.routeNo,
               // Pass stop IDs again, although VehicleDetails might not need them if stops are present
               fromStopId: favoriteItem.fromStopId,
               toStopId: favoriteItem.toStopId,
               // Add any other essential fields from freshDetailData
           };

           navigation.navigate('VehicleDetails', {
                transport: transportDataForDetails,
                fromLocation: favoriteItem.fromLocation, // Pass original names for consistency
                toLocation: favoriteItem.toLocation,
            });
        } else {
          Alert.alert("Route Changed", "This specific transport option might no longer be available on this route.");
        }
      } else {
        Alert.alert("Route Not Found", "Could not find route details. It might have been removed.");
      }
    } catch (error) {
      console.error("Error fetching favorite details:", error);
      Alert.alert("Error", "Could not fetch route details. Please check connection.");
    } finally {
      setLoadingItemId(null); // Clear loading state for this item
    }
  }, [navigation]);

  const renderFavoriteItem = useCallback(({ item }) => (
       <FavoriteItem
            item={item}
            onRemove={handleRemoveFavorite}
            onPressItem={handleFavoritePress} // Use the API fetch handler
            isLoading={loadingItemId === item.id} // Pass item-specific loading state
        />
   ), [handleRemoveFavorite, handleFavoritePress, loadingItemId]); // Add dependencies

  return (
    <SafeAreaView style={styles.container}>
       <StatusBar barStyle="dark-content" />
       <View style={styles.header}>
           <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
               <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
           </TouchableOpacity>
           <Text style={styles.headerTitle}>Favorite Routes</Text>
           <View style={styles.headerButton} />
       </View>

      {isLoading && favorites.length === 0 ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : favorites.length === 0 ? (
          <View style={styles.centered}>
               <MaterialCommunityIcons name="heart-off-outline" size={60} color={colors.secondaryText} />
               <Text style={styles.emptyText}>You haven't saved any favorite routes yet.</Text>
               <Text style={styles.emptySubText}>Tap the ♡ icon on a route's detail page to save it.</Text>
          </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          extraData={loadingItemId} // Crucial for re-render on loading state change
        />
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
        justifyContent: 'space-between',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.cardBackground,
    },
    headerButton: {
        padding: spacing.sm,
        minWidth: 40,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.primaryText,
        textAlign: 'center',
        flex: 1,
    },
    listContent: {
        padding: spacing.md,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    itemIconContainer: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.circle,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    itemContent: {
        flex: 1,
        marginRight: spacing.sm,
    },
    itemRouteName: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.primaryText,
        marginBottom: spacing.xxs,
    },
    itemPath: {
        fontSize: fontSizes.sm,
        color: colors.secondaryText,
        marginBottom: spacing.xs,
    },
    itemFare: {
        fontSize: fontSizes.sm,
        fontWeight: '500',
        color: colors.primaryText,
    },
    removeButton: {
        padding: spacing.sm,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyText: {
        marginTop: spacing.md,
        fontSize: fontSizes.md,
        color: colors.secondaryText,
        textAlign: 'center',
    },
    emptySubText: {
        marginTop: spacing.sm,
        fontSize: fontSizes.sm,
        color: colors.secondaryText,
        textAlign: 'center',
    },
});

export default FavoritesScreen;