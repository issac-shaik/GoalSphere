import { supabase } from '../supabase';
import { handleError } from '../utils';

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  loading?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number | null;
  error: string | null;
  hasMore: boolean;
}

export class BaseService {
  protected handleError(error: any): string {
    console.error('Service Error:', error);
    return handleError(error);
  }

  protected async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id || null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  protected createSuccessResponse<T>(data: T): ServiceResponse<T> {
    return {
      data,
      error: null,
    };
  }

  protected createErrorResponse<T>(error: any): ServiceResponse<T> {
    return {
      data: null,
      error: this.handleError(error),
    };
  }

  protected createPaginatedResponse<T>(
    data: T[],
    count: number | null,
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    const hasMore = count ? (page * limit) < count : false;
    
    return {
      data,
      count,
      error: null,
      hasMore,
    };
  }
}