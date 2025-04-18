// src/components/RecentSearchesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getData, removeData } from '../utils/storage';
import { colors, spacing, fontSizes, borderRadius } from '../constants/theme';
import axios from 'axios';
import { transformRouteData } from '../screens/SearchScreen'; // Import the transform function

const RECENT_SEARCHES_KEY = '@recent_searches';
const API_BASE_URL = 'http://192.168.1.69:3000/api'; // Make sure this matches your API URL

const RecentSearchesScreen = ({ navigation }) => {
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [locations, setLocations] = useState([]); // To store location data
  const isFocused = useIsFocused(); // Hook to check if screen is focused

  const loadSearches = useCallback(async () => {
    setIsLoading(true);
    const storedSearches = await getData(RECENT_SEARCHES_KEY);
    if (storedSearches && Array.isArray(storedSearches)) {
      // Sort by timestamp descending (newest first)
      setRecentSearches(storedSearches.sort((a, b) => b.timestamp - a.timestamp));
    } else {
      setRecentSearches([]);
    }
    setIsLoading(false);
  }, []);

  // Load locations once when component mounts
  useEffect(() => {
    const loadLocations = async () => {
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
        console.error('Failed to load locations:', error);
      }
    };
    
    loadLocations();
  }, []);

  // Load searches when the screen comes into focus
  useEffect(() => {
    if (isFocused) {
      loadSearches();
    }
  }, [isFocused, loadSearches]);

  const handleClearAll = () => {
    Alert.alert(
      'Clear Recent Searches',
      'Are you sure you want to clear all recent searches?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await removeData(RECENT_SEARCHES_KEY);
            setRecentSearches([]); // Update state immediately
          },
        },
      ]
    );
  };

  const handleSelectSearch = async (search) => {
    // Instead of just navigating to SearchScreen, perform the search here
    if (!search.from || !search.to || search.from === search.to) {
      Alert.alert('Invalid Search', 'Please select valid departure and destination points.');
      return;
    }

    setSearchLoading(true);
    try {
      const fromStop = locations.find(stop => stop.name === search.from);
      const toStop = locations.find(stop => stop.name === search.to);

      if (!fromStop || !toStop) {
        Alert.alert('Location Not Found', 'One or both locations not found in our database.');
        setSearchLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/routes/stops?stop1=${fromStop.id}&stop2=${toStop.id}`
      );

      if (response.data?.data?.[0]?.details?.length > 0) {
        const routeData = response.data.data[0];
        const details = routeData.details;

        // Transform API data to the format expected by SearchResults
        const transformedResults = details.map(detail =>
          transformRouteData(detail, fromStop.id, toStop.id)
        );

        // Navigate directly to search results with the data
        navigation.navigate('SearchResults', {
          results: transformedResults,
          fromLocation: search.from,
          toLocation: search.to,
          routeNo: routeData.route_no || 'Unknown'
        });
      } else {
        Alert.alert('No Routes Found', 'No direct transport options found for this route.');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'An error occurred during the search. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleSelectSearch(item)}
      disabled={searchLoading}
    >
      <View style={styles.itemIcon}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTextFrom}>{item.from}</Text>
        <MaterialCommunityIcons name="arrow-right-thin" size={18} color={colors.secondaryText} style={styles.itemArrow} />
        <Text style={styles.itemTextTo}>{item.to}</Text>
      </View>
      {searchLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.secondaryText} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recent Searches</Text>
          {recentSearches.length > 0 ? (
              <TouchableOpacity style={styles.headerButton} onPress={handleClearAll}>
                  <Ionicons name="trash-outline" size={22} color={colors.danger} />
              </TouchableOpacity>
          ) : (
              <View style={styles.headerButton} /> // Placeholder for balance
          )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : recentSearches.length === 0 ? (
        <View style={styles.centered}>
            <MaterialCommunityIcons name="history" size={60} color={colors.secondaryText} />
            <Text style={styles.emptyText}>No recent searches found.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SearchTab')} style={styles.goSearchButton}>
                <Text style={styles.goSearchButtonText}>Start Searching</Text>
            </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recentSearches}
          renderItem={renderSearchItem}
          keyExtractor={(item, index) => `${item.timestamp}-${index}`} // More robust key
          contentContainerStyle={styles.listContent}
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
    paddingHorizontal: spacing.sm, // Reduced horizontal padding
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
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemIcon: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.circle,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
    flexWrap: 'wrap', // Allow text to wrap if very long
  },
  itemTextFrom: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.primaryText,
  },
  itemArrow: {
      marginHorizontal: spacing.xs,
  },
  itemTextTo: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.primaryText,
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
  goSearchButton: {
      marginTop: spacing.lg,
      backgroundColor: colors.primary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.lg,
  },
  goSearchButtonText: {
      color: colors.background,
      fontWeight: '600',
      fontSize: fontSizes.md,
  }
});

export default RecentSearchesScreen;