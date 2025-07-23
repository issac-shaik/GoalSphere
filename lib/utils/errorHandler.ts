export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export class ErrorHandler {
  static handleSupabaseError(error: any): AppError {
    // Handle specific Supabase error codes
    if (error?.code) {
      switch (error.code) {
        case 'PGRST116':
          return {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found',
            details: error,
          };
        case '23505':
          return {
            code: 'DUPLICATE_ENTRY',
            message: 'This entry already exists',
            details: error,
          };
        case '23503':
          return {
            code: 'FOREIGN_KEY_VIOLATION',
            message: 'Referenced resource does not exist',
            details: error,
          };
        case '42501':
          return {
            code: 'INSUFFICIENT_PRIVILEGE',
            message: 'You do not have permission to perform this action',
            details: error,
          };
        case 'P0001': // PostgreSQL raise_exception
          // Check if it's a goal limit error
          if (error.message?.includes('Cannot create more than 3')) {
            return {
              code: 'GOAL_LIMIT_REACHED',
              message: error.message,
              details: error,
            };
          }
          return {
            code: 'DATABASE_ERROR',
            message: error.message || 'A database error occurred',
            details: error,
          };
        default:
          // Check for goal limit error in message regardless of error code
          if (error.message?.includes('Cannot create more than 3')) {
            return {
              code: 'GOAL_LIMIT_REACHED',
              message: error.message,
              details: error,
            };
          }
          return {
            code: 'DATABASE_ERROR',
            message: error.message || 'A database error occurred',
            details: error,
          };
      }
    }

    // Handle authentication errors
    if (error?.message?.includes('JWT')) {
      return {
        code: 'AUTH_ERROR',
        message: 'Authentication failed. Please log in again.',
        details: error,
      };
    }

    // Handle network errors
    if (error?.message?.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection.',
        details: error,
      };
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'An unexpected error occurred',
      details: error,
    };
  }

  static getUserFriendlyMessage(error: AppError): string {
    switch (error.code) {
      case 'NOT_FOUND':
        return 'The item you\'re looking for could not be found.';
      case 'DUPLICATE_ENTRY':
        return 'This item already exists.';
      case 'FOREIGN_KEY_VIOLATION':
        return 'Cannot complete this action due to missing dependencies.';
      case 'INSUFFICIENT_PRIVILEGE':
        return 'You don\'t have permission to perform this action.';
      case 'AUTH_ERROR':
        return 'Please log in to continue.';
      case 'NETWORK_ERROR':
        return 'Please check your internet connection and try again.';
      case 'GOAL_LIMIT_REACHED':
        return error.message.replace('Cannot create more than 3', 'Cannot create more than 3') + ' in the free tier. Upgrade to premium for unlimited goals!';
      case 'DATABASE_ERROR':
        return 'A server error occurred. Please try again later.';
      default:
        return error.message || 'Something went wrong. Please try again.';
    }
  }
}

export const handleError = (error: any): string => {
  const appError = ErrorHandler.handleSupabaseError(error);
  return ErrorHandler.getUserFriendlyMessage(appError);
};