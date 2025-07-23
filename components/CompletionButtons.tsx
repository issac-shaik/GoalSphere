import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CompletionButtonsProps {
  targetCount: number;
  completedCount: number;
  goalColor?: string;
  onToggleCompletion: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const CompletionButtons: React.FC<CompletionButtonsProps> = ({
  targetCount,
  completedCount,
  goalColor = '#10B981',
  onToggleCompletion,
  size = 'medium'
}) => {
  // For single target, show traditional single button
  if (targetCount === 1) {
    return (
      <TouchableOpacity
        style={styles.singleButton}
        onPress={onToggleCompletion}
      >
        <Ionicons
          name={completedCount >= 1 ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={size === 'small' ? 20 : size === 'large' ? 28 : 24}
          color={completedCount >= 1 ? goalColor : '#9CA3AF'}
        />
      </TouchableOpacity>
    );
  }

  // For multiple targets, show individual completion buttons
  const buttons = [];
  const maxButtonsPerRow = Math.min(targetCount, 6); // Max 6 buttons per row
  const buttonSize = size === 'small' ? 18 : size === 'large' ? 26 : 22;
  
  for (let i = 0; i < targetCount; i++) {
    const isCompleted = i < completedCount;
    const isNext = i === completedCount; // Next button to be completed
    
    buttons.push(
      <TouchableOpacity
        key={i}
        style={[
          styles.multiButton,
          { 
            backgroundColor: isCompleted ? goalColor : 'transparent',
            borderColor: isNext ? goalColor : (isCompleted ? goalColor : '#D1D5DB'),
            borderWidth: isNext ? 2.5 : 2,
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            opacity: isCompleted || isNext ? 1 : 0.4,
          }
        ]}
        onPress={onToggleCompletion}
        activeOpacity={0.6}
      >
        {isCompleted && (
          <Ionicons
            name="checkmark"
            size={buttonSize * 0.65}
            color="white"
          />
        )}
      </TouchableOpacity>
    );
  }

  // Arrange buttons in rows
  const rows = [];
  for (let i = 0; i < buttons.length; i += maxButtonsPerRow) {
    const rowButtons = buttons.slice(i, i + maxButtonsPerRow);
    rows.push(
      <View key={`row-${i}`} style={styles.buttonRow}>
        {rowButtons}
      </View>
    );
  }

  return (
    <View style={styles.multiButtonContainer}>
      {rows}
    </View>
  );
};

const styles = StyleSheet.create({
  singleButton: {
    padding: 4,
  },
  multiButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 2,
  },
  multiButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
});