// ============================================================
// DSATracker — API Response Types
// ============================================================

/** Standard API success response */
export interface ApiResponse<T = unknown> {
  success: true;
  message?: string;
  data: T;
}

/** Standard API error response */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
  stack?: string;
}

/** Validation error detail */
export interface ValidationError {
  field: string;
  message: string;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/** Health check response */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected';
    redis?: 'connected' | 'disconnected';
  };
}
