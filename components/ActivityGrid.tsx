import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ActivityGridDay } from '../types';
import { getLocalDateString, getTodayString } from '../lib/utils';

interface ActivityGridProps {
  data: ActivityGridDay[];
  title?: string;
  interactive?: boolean;
  onDayPress?: (date: string) => void;
  goalColor?: string;
}

export const ActivityGrid: React.FC<ActivityGridProps> = ({
  data,
  title,
  interactive = false,
  onDayPress,
  goalColor = '#10B981'
}) => {
  const getCircleStyle = (completed: boolean, isToday: boolean) => {
    if (isToday) {
      return {
        backgroundColor: completed ? goalColor : 'transparent',
        borderColor: '#6366F1',
        borderWidth: 2,
      };
    }
    return {
      backgroundColor: completed ? goalColor : 'transparent',
      borderColor: completed ? goalColor : '#E5E7EB',
      borderWidth: 1,
    };
  };

  const getTextColor = (completed: boolean, isToday: boolean) => {
    if (completed) {
      return '#FFFFFF';
    }
    if (isToday) {
      return '#6366F1'; // Blue text for today's outline
    }
    return '#374151';
  };

  // Create a calendar-like view for the current month
  const generateCalendarData = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first day of the month and how many days in the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Create a map of completed dates for quick lookup
    const completedDates = new Map<string, boolean>();
    data.forEach(day => {
      if (day.date) {
        completedDates.set(day.date, day.completed);
      }
    });
    
    // Generate calendar grid
    const calendarDays: Array<{
      date: string;
      day: number;
      completed: boolean;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthDay = new Date(currentYear, currentMonth, -(startDayOfWeek - 1 - i));
      const dateStr = getLocalDateString(prevMonthDay);
      calendarDays.push({
        date: dateStr,
        day: prevMonthDay.getDate(),
        completed: completedDates.get(dateStr) || false,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = getLocalDateString(date);
      const todayStr = getTodayString();
      
      calendarDays.push({
        date: dateStr,
        day: day,
        completed: completedDates.get(dateStr) || false,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }
    
    // Add days from next month to fill the grid (if needed)
    const remainingCells = 42 - calendarDays.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells && remainingCells < 14; day++) {
      const nextMonthDay = new Date(currentYear, currentMonth + 1, day);
      const dateStr = getLocalDateString(nextMonthDay);
      calendarDays.push({
        date: dateStr,
        day: day,
        completed: completedDates.get(dateStr) || false,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    return calendarDays;
  };

  const calendarData = generateCalendarData();
  
  // Group into weeks (7 days each)
  const weeks: Array<typeof calendarData> = [];
  for (let i = 0; i < calendarData.length; i += 7) {
    weeks.push(calendarData.slice(i, i + 7));
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentMonth = monthNames[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.monthHeader}>
        <Text style={styles.monthTitle}>{currentMonth} {currentYear}</Text>
      </View>
      
      <View style={styles.calendar}>
        {/* Day labels */}
        <View style={styles.dayLabelsRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Text key={index} style={styles.dayLabel}>
              {day}
            </Text>
          ))}
        </View>
        
        {/* Calendar grid */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((dayData, dayIndex) => {
              const DayComponent = interactive ? TouchableOpacity : View;
              return (
                <DayComponent
                  key={`${weekIndex}-${dayIndex}`}
                  style={[
                    styles.dayCircle,
                    getCircleStyle(dayData.completed, dayData.isToday),
                    !dayData.isCurrentMonth && styles.otherMonthDay,
                  ]}
                  onPress={interactive ? () => onDayPress?.(dayData.date) : undefined}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: getTextColor(dayData.completed, dayData.isToday) },
                      !dayData.isCurrentMonth && styles.otherMonthText,
                    ]}
                  >
                    {dayData.day}
                  </Text>
                </DayComponent>
              );
            })}
          </View>
        ))}
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: 'transparent', borderColor: '#E5E7EB' }]} />
          <Text style={styles.legendText}>Not completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: goalColor, borderColor: goalColor }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: 'transparent', borderColor: '#6366F1', borderWidth: 2 }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
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
  monthHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  calendar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    width: 40,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  otherMonthText: {
    color: '#9CA3AF',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
});