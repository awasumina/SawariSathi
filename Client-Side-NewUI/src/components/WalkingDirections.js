// src/components/WalkingDirections.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius } from '../constants/theme';
import { LocationService } from '../utils/locationService';

export const WalkingDirections = ({ walkingInfo, style }) => {
  if (!walkingInfo) return null;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="walk" 
          size={16} 
          color={colors.primary} 
        />
        <Text style={styles.title}>Walking Directions</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.walkingStep}>
          <View style={styles.stepIndicator}>
            <MaterialCommunityIcons 
              name="human-handsup" 
              size={12} 
              color={colors.background} 
            />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Walk to bus stop</Text>
            <Text style={styles.stepDescription}>
              {walkingInfo.stopName}
            </Text>
            <Text style={styles.stepDetails}>
              {LocationService.formatDistance(walkingInfo.distance)} • {' '}
              {LocationService.formatWalkingTime(walkingInfo.estimatedTime)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export const MultiWalkingDirections = ({ walkingInfo, style }) => {
  if (!walkingInfo?.toSourceStop && !walkingInfo?.fromDestStop) return null;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="walk" 
          size={16} 
          color={colors.primary} 
        />
        <Text style={styles.title}>Walking Directions</Text>
      </View>
      
      <View style={styles.content}>
        {walkingInfo.toSourceStop && (
          <View style={styles.walkingStep}>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Walk to departure stop</Text>
              <Text style={styles.stepDescription}>
                {walkingInfo.toSourceStop.stopName}
              </Text>
              <Text style={styles.stepDetails}>
                {LocationService.formatDistance(walkingInfo.toSourceStop.distance)} • {' '}
                {LocationService.formatWalkingTime(walkingInfo.toSourceStop.estimatedTime)}
              </Text>
            </View>
          </View>
        )}
        
        {walkingInfo.fromDestStop && (
          <View style={styles.walkingStep}>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepNumber}>
                {walkingInfo.toSourceStop ? '2' : '1'}
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Walk from arrival stop</Text>
              <Text style={styles.stepDescription}>
                From {walkingInfo.fromDestStop.stopName}
              </Text>
              <Text style={styles.stepDetails}>
                {LocationService.formatDistance(walkingInfo.fromDestStop.distance)} • {' '}
                {LocationService.formatWalkingTime(walkingInfo.fromDestStop.estimatedTime)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primaryText,
    marginLeft: spacing.xs,
  },
  content: {
    paddingLeft: spacing.sm,
  },
  walkingStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  stepNumber: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.background,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: fontSizes.sm,
    color: colors.secondaryText,
    marginBottom: spacing.xs,
  },
  stepDetails: {
    fontSize: fontSizes.xs,
    color: colors.accent,
    fontWeight: '500',
  },
});

export default WalkingDirections;