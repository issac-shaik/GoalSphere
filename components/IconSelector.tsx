import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconSelectorProps {
  selectedIcon: string;
  onIconSelect: (icon: string) => void;
}

const AVAILABLE_ICONS = [
  { name: 'fitness', icon: 'fitness-outline' },
  { name: 'book', icon: 'book-outline' },
  { name: 'heart', icon: 'heart-outline' },
  { name: 'water', icon: 'water-outline' },
  { name: 'leaf', icon: 'leaf-outline' },
  { name: 'moon', icon: 'moon-outline' },
  { name: 'sunny', icon: 'sunny-outline' },
  { name: 'musical-notes', icon: 'musical-notes-outline' },
  { name: 'camera', icon: 'camera-outline' },
  { name: 'car', icon: 'car-outline' },
  { name: 'briefcase', icon: 'briefcase-outline' },
  { name: 'school', icon: 'school-outline' },
  { name: 'restaurant', icon: 'restaurant-outline' },
  { name: 'home', icon: 'home-outline' },
  { name: 'people', icon: 'people-outline' },
  { name: 'trophy', icon: 'trophy-outline' },
  { name: 'rocket', icon: 'rocket-outline' },
  { name: 'star', icon: 'star-outline' },
  { name: 'flash', icon: 'flash-outline' },
  { name: 'gamepad', icon: 'game-controller-outline' },
  { name: 'brush', icon: 'brush-outline' },
  { name: 'code', icon: 'code-slash-outline' },
  { name: 'calculator', icon: 'calculator-outline' },
  { name: 'bicycle', icon: 'bicycle-outline' },
];

export const IconSelector: React.FC<IconSelectorProps> = ({
  selectedIcon,
  onIconSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose an Icon</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.iconGrid}>
          {AVAILABLE_ICONS.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.iconButton,
                selectedIcon === item.name && styles.selectedIcon,
              ]}
              onPress={() => onIconSelect(item.name)}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={selectedIcon === item.name ? '#FFFFFF' : '#6B7280'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    maxWidth: 400,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIcon: {
    backgroundColor: '#6366F1',
    borderColor: '#4F46E5',
  },
});