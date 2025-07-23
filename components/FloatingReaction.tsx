import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface FloatingReactionProps {
  emoji: string;
  startX: number;
  startY: number;
  onComplete: () => void;
}

export default function FloatingReaction({ 
  emoji, 
  startX, 
  startY, 
  onComplete 
}: FloatingReactionProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create a complex animation sequence similar to Facebook
    const randomXOffset = (Math.random() - 0.5) * 100; // Random horizontal drift
    const randomRotation = (Math.random() - 0.5) * 360; // Random rotation

    Animated.parallel([
      // Scale up briefly then down
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      
      // Float upward with slight curve
      Animated.timing(translateY, {
        toValue: -150,
        duration: 1000,
        useNativeDriver: true,
      }),
      
      // Drift horizontally
      Animated.timing(translateX, {
        toValue: randomXOffset,
        duration: 1000,
        useNativeDriver: true,
      }),
      
      // Fade out in the last portion
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      
      // Gentle rotation
      Animated.timing(rotate, {
        toValue: randomRotation,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: startX,
          top: startY,
          transform: [
            { translateX },
            { translateY },
            { scale },
            { 
              rotate: rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.emoji}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  emoji: {
    fontSize: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});