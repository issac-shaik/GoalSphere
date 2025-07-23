export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class Validator {
  static validateGoal(goalData: {
    title?: string;
    description?: string;
    duration_type?: string;
    icon?: string;
  }): ValidationResult {
    const errors: string[] = [];

    if (!goalData.title || goalData.title.trim().length === 0) {
      errors.push('Goal title is required');
    } else if (goalData.title.length > 100) {
      errors.push('Goal title must be less than 100 characters');
    }

    if (goalData.description && goalData.description.length > 500) {
      errors.push('Goal description must be less than 500 characters');
    }

    if (goalData.duration_type && !['daily', 'weekly', 'monthly', 'yearly'].includes(goalData.duration_type)) {
      errors.push('Invalid duration type');
    }

    if (!goalData.icon || goalData.icon.trim().length === 0) {
      errors.push('Goal icon is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateUser(userData: {
    username?: string;
    name?: string;
    bio?: string;
  }): ValidationResult {
    const errors: string[] = [];

    if (userData.username !== undefined) {
      if (!userData.username || userData.username.trim().length === 0) {
        errors.push('Username is required');
      } else if (userData.username.length < 3) {
        errors.push('Username must be at least 3 characters');
      } else if (userData.username.length > 30) {
        errors.push('Username must be less than 30 characters');
      } else if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
        errors.push('Username can only contain letters, numbers, and underscores');
      }
    }

    if (userData.name && userData.name.length > 50) {
      errors.push('Name must be less than 50 characters');
    }

    if (userData.bio && userData.bio.length > 200) {
      errors.push('Bio must be less than 200 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const validateGoal = Validator.validateGoal;
export const validateUser = Validator.validateUser;
export const validateEmail = Validator.validateEmail;
export const validatePassword = Validator.validatePassword;