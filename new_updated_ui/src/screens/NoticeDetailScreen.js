import React from 'react';
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

const NoticeDetailScreen = ({ route, navigation }) => {
  const { notice } = route.params || {
    id: 1,
    title: 'Schedule Change: Kavresthali Route',
    description: 'Starting from April 20, the morning bus from Kavresthali will depart at 7:30 AM instead of 7:00 AM due to road maintenance work.',
    fullContent: `Starting from April 20, 2025, the morning bus service from Kavresthali to RNAC will depart at 7:30 AM instead of the previously scheduled 7:00 AM.

This change is due to ongoing road maintenance work on the main route. The authorities are working on improving the road conditions, which will ultimately result in better travel experiences for all passengers.

The evening schedule remains unchanged. The last bus from RNAC to Kavresthali will continue to depart at 8:00 PM.

We apologize for any inconvenience this may cause and appreciate your understanding during this period of infrastructure improvement.

For more information or if you have any questions, please contact our customer service at 01-1234567.`,
    date: 'April 16, 2025',
    effectiveDate: 'April 20, 2025',
    type: 'Route Changes',
    icon: 'clock-alert-outline',
    isImportant: true,
    affectedRoutes: ['Kavresthali - RNAC', 'Kavresthali - Ratnapark']
  };

  // Get color based on notice type
  const getNoticeColor = (type) => {
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
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Notice Header */}
        <View style={styles.headerContainer}>
          <View 
            style={[
              styles.iconContainer, 
              { backgroundColor: `${getNoticeColor(notice.type)}15` }
            ]}
          >
            <MaterialCommunityIcons
              name={notice.icon}
              size={32}
              color={getNoticeColor(notice.type)}
            />
          </View>
          <Text style={styles.title}>{notice.title}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons 
                name="calendar" 
                size={18} 
                color={colors.secondaryText} 
              />
              <Text style={styles.metaText}>Posted: {notice.date}</Text>
            </View>
            
            {notice.effectiveDate && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons 
                  name="calendar-clock" 
                  size={18} 
                  color={colors.secondaryText} 
                />
                <Text style={styles.metaText}>Effective: {notice.effectiveDate}</Text>
              </View>
            )}
            
            <View style={[styles.tagContainer, { backgroundColor: `${getNoticeColor(notice.type)}15` }]}>
              <Text style={[styles.tagText, { color: getNoticeColor(notice.type) }]}>
                {notice.type}
              </Text>
            </View>
            
            {notice.isImportant && (
              <View style={[styles.tagContainer, { backgroundColor: `${colors.danger}15` }]}>
                <MaterialCommunityIcons 
                  name="alert-circle" 
                  size={14} 
                  color={colors.danger} 
                />
                <Text style={[styles.tagText, { color: colors.danger }]}>
                  Important
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Notice Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.contentText}>
            {notice.fullContent || notice.description}
          </Text>
          
          {/* Affected Routes Section */}
          {notice.affectedRoutes && notice.affectedRoutes.length > 0 && (
            <View style={styles.affectedRoutesContainer}>
              <Text style={styles.sectionTitle}>Affected Routes</Text>
              {notice.affectedRoutes.map((route, index) => (
                <View key={index} style={styles.routeItem}>
                  <MaterialCommunityIcons 
                    name="bus" 
                    size={18} 
                    color={colors.primary} 
                  />
                  <Text style={styles.routeText}>{route}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {/* <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('SearchTab')}
          >
            <MaterialCommunityIcons 
              name="magnify" 
              size={20} 
              color={colors.background} 
            />
            <Text style={styles.actionButtonText}>Find Alternative Routes</Text>
          </TouchableOpacity> */}
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: `${colors.primary}15` }]}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons 
              name="arrow-left" 
              size={20} 
              color={colors.primary} 
            />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Back to Notices</Text>
          </TouchableOpacity>
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
  scrollContainer: {
    padding: spacing.lg,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.circle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    marginBottom: spacing.sm,
  },
  metaText: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
    marginLeft: spacing.xs,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
  contentContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  contentText: {
    fontSize: fontSizes.md,
    lineHeight: 22,
    color: colors.primaryText,
    marginBottom: spacing.lg,
  },
  affectedRoutesContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: spacing.sm,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  routeText: {
    fontSize: fontSizes.sm,
    color: colors.primaryText,
    marginLeft: spacing.sm,
  },
  actionContainer: {
    marginBottom: spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  actionButtonText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: fontSizes.md,
    marginLeft: spacing.sm,
  },
});

export default NoticeDetailScreen;