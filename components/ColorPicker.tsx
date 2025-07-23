import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorSelect,
}) => {
  // Popular colors for goals - arranged for horizontal scrolling
  const colors = [
    '#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6', 
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A78BFA', '#C084FC',
    '#E879F9', '#F472B6', '#FB7185', '#F87171', '#BE123C', '#DC2626', '#EA580C',
    '#F59E0B', '#65A30D', '#A21CAF', '#7C3AED', '#5B21B6', '#6B21A8', '#86198F',
    '#BE185D', '#9F1239', '#7F1D1D', '#374151'
  ];

  const colorNames = [
    'Red', 'Orange', 'Yellow', 'Lime', 'Green', 'Emerald', 'Teal', 
    'Cyan', 'Sky Blue', 'Blue', 'Indigo', 'Violet', 'Purple', 'Light Purple',
    'Fuchsia', 'Pink', 'Rose', 'Light Red', 'Crimson', 'Dark Red', 'Dark Orange',
    'Amber', 'Dark Lime', 'Magenta', 'Deep Purple', 'Dark Purple', 'Purple Pink', 'Dark Pink',
    'Deep Pink', 'Dark Crimson', 'Maroon', 'Gray'
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Goal Color</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.colorScrollView}
        contentContainerStyle={styles.colorScrollContent}
      >
        {colors.map((color, index) => {
          const isSelected = selectedColor === color;
          return (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorCircle,
                { backgroundColor: color },
                isSelected && styles.selectedColor,
              ]}
              onPress={() => onColorSelect(color)}
              activeOpacity={0.8}
            >
              {isSelected && (
                <Ionicons 
                  name="checkmark" 
                  size={16} 
                  color="#FFFFFF" 
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={styles.selectedColorText}>
        Selected: {colorNames[colors.indexOf(selectedColor)] || 'Custom'}
      </Text>
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
  colorScrollView: {
    flexGrow: 0,
  },
  colorScrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginHorizontal: 2,
  },
  selectedColor: {
    borderColor: '#374151',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  selectedColorText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
});