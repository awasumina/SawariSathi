import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, fontSizes, borderRadius } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const NoticeScreen = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  
  const noticeFilters = ['All', 'Important', 'Route Changes', 'Delays'];
  
  const notices = [
    {
      id: 1,
      title: 'Schedule Change: Kavresthali Route',
      description: 'Starting from April 20, the morning bus from Kavresthali will depart at 7:30 AM instead of 7:00 AM due to road maintenance work.',
      date: 'April 16, 2025',
      type: 'Route Changes',
      icon: 'clock-alert-outline',
      isImportant: true,
    },
    {
      id: 2,
      title: 'Temporary Closure: Basnettar Bridge',
      description: 'Due to ongoing repairs, Basnettar Bridge will be closed from April 18-25. All buses will be rerouted via Sitapaila during this period.',
      date: 'April 15, 2025',
      type: 'Important',
      icon: 'alert-circle-outline',
      isImportant: true,
    },
    {
      id: 3,
      title: 'New Express Service',
      description: 'A new express service connecting Goldhunga to city center with fewer stops will start operating from April 22. Check routes for timings.',
      date: 'April 14, 2025',
      type: 'Route Changes',
      icon: 'bus-fast',
      isImportant: false,
    },
    {
      id: 4,
      title: 'Expected Delays: Jutpur Fedi Route',
      description: 'Due to heavy traffic congestion, expect 15-20 minute delays on all buses operating on the Jutpur Fedi route during evening hours (4-7 PM).',
      date: 'April 10, 2025',
      type: 'Delays',
      icon: 'timer-sand',
      isImportant: false,
    },
    {
      id: 5,
      title: 'Fare Adjustment Notice',
      description: 'Starting May 1, there will be a small adjustment to fares on all city routes. The updated fare structure will be available in the app soon.',
      date: 'April 9, 2025',
      type: 'Important',
      icon: 'cash',
      isImportant: true,
    },
  ];

  const filteredNotices = activeFilter === 'All' 
    ? notices 
    : notices.filter(notice => 
        activeFilter === 'Important' 
          ? notice.isImportant 
          : notice.type === activeFilter
      );

  // Get background color based on notice type
  const getNoticeColor = (type) => {
    switch (type) {
      case 'Important':
        return `${colors.danger}15`;
      case 'Route Changes':
        return `${colors.primary}15`;
      case 'Delays':
        return `${colors.warning}15`;
      default:
        return `${colors.accent}15`;
    }
  };

  // Get icon color based on notice type
  const getIconColor = (type) => {
    switch (type) {
      case 'Important':
        return colors.danger;
      case 'Route Changes':
        return colors.primary;
      case 'Delays':
        return colors.warning;
      default:
        return colors.accent;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notices & Updates</Text>
        <Text style={styles.headerSubtitle}>
          Stay informed about transport changes and updates
        </Text>
      </View>
      
      {/* Filters - Fixed container */}
      <View style={styles.filtersOuterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filtersContainer}
        >
          {noticeFilters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text 
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.activeFilterText
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Notices List */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.noticesContainer}
      >
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <TouchableOpacity
              key={notice.id}
              style={styles.noticeCard}
              onPress={() => navigation.navigate('NoticeDetail', { notice })}
            >
              <View 
                style={[
                  styles.noticeIconContainer, 
                  { backgroundColor: getNoticeColor(notice.type) }
                ]}
              >
                <MaterialCommunityIcons
                  name={notice.icon}
                  size={28}
                  color={getIconColor(notice.type)}
                />
              </View>
              <View style={styles.noticeContent}>
                <View style={styles.noticeHeader}>
                  <Text style={styles.noticeTitle} numberOfLines={1}>
                    {notice.title}
                  </Text>
                  {notice.isImportant && (
                    <View style={styles.importantBadge}>
                      <Text style={styles.importantText}>Important</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.noticeDescription} numberOfLines={2}>
                  {notice.description}
                </Text>
                <View style={styles.noticeFooter}>
                  <Text style={styles.noticeDate}>
                    <MaterialCommunityIcons 
                      name="calendar-outline" 
                      size={14} 
                      color={colors.secondaryText} 
                    /> {notice.date}
                  </Text>
                  <Text style={styles.noticeType}>
                    {notice.type}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="bell-off-outline" 
              size={60} 
              color={`${colors.secondaryText}50`} 
            />
            <Text style={styles.emptyText}>No notices found</Text>
            <Text style={styles.emptySubtext}>
              There are no notices matching your selected filter
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
    marginBottom: spacing.sm,
  },
  // New container to fix height issue
  filtersOuterContainer: {
    height: 48, // Fixed height for the filter section
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    height: 48, // Match parent height
    alignItems: 'center', // Center items vertically
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, // Reduced vertical padding
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardBackground,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    height: 32, // Fixed height for all buttons
    justifyContent: 'center', // Center text vertically
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    color: colors.primaryText,
  },
  activeFilterText: {
    color: colors.background,
  },
  noticesContainer: {
    padding: spacing.lg,
    paddingTop: spacing.md, // Slightly increased top padding
  },
  noticeCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  noticeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.circle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  noticeContent: {
    flex: 1,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  noticeTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primaryText,
    flex: 1,
  },
  importantBadge: {
    backgroundColor: `${colors.danger}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  importantText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.danger,
  },
  noticeDescription: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noticeDate: {
    fontSize: fontSizes.xs,
    color: colors.secondaryText,
  },
  noticeType: {
    fontSize: fontSizes.xs,
    fontWeight: '500',
    color: colors.accent,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default NoticeScreen;