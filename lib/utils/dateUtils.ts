/**
 * Date utility functions for consistent date handling across the app
 */

/**
 * Get local date string in YYYY-MM-DD format
 * This ensures we get the user's local date, not UTC
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date in local timezone as YYYY-MM-DD string
 */
export const getTodayString = (): string => {
  return getLocalDateString(new Date());
};

/**
 * Check if a date string matches today's date
 */
export const isToday = (dateString: string): boolean => {
  return dateString === getTodayString();
};

/**
 * Convert a date string to a Date object
 */
export const parseDate = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00');
};