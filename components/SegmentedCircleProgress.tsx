import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

interface SegmentedCircleProgressProps {
  targetCount: number;
  completedCount: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  gapAngle?: number; // Gap between segments in degrees
}

export const SegmentedCircleProgress: React.FC<SegmentedCircleProgressProps> = ({
  targetCount,
  completedCount,
  size = 40,
  strokeWidth = 4,
  color = '#10B981',
  backgroundColor = '#E5E7EB',
  gapAngle = 4, // 4 degrees gap between segments
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate segment angle (360 degrees minus total gap divided by number of segments)
  const totalGapAngle = targetCount * gapAngle;
  const segmentAngle = (360 - totalGapAngle) / targetCount;

  // Create segments
  const segments = [];
  for (let i = 0; i < targetCount; i++) {
    const startAngle = i * (segmentAngle + gapAngle) - 90; // Start from top (-90 degrees)
    const endAngle = startAngle + segmentAngle;
    const isCompleted = i < completedCount;

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate arc path
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    // Large arc flag (1 if arc is greater than 180 degrees)
    const largeArcFlag = segmentAngle > 180 ? 1 : 0;

    // Create SVG arc path
    const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

    segments.push(
      <Path
        key={i}
        d={pathData}
        stroke={isCompleted ? color : backgroundColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {segments}
      </Svg>
      <View style={styles.centerIcon}>
        <Ionicons 
          name="add" 
          size={size * 0.4} 
          color={completedCount >= targetCount ? color : '#9CA3AF'} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  centerIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});