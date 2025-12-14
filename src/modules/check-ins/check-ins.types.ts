// Check-ins module types

/**
 * Database schema for check_in_logs table
 */
export interface CheckInLog {
  id: string;
  user_id: string;
  job_id: string;
  check_in_time: Date;
  check_out_time: Date | null;
  duration_hours: number | null;
  hourly_rate: number | null;
  billable_amount: number | null;
  notes: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Request body for checking in
 */
export interface CheckInRequest {
  job_id: string;
  notes?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Request body for checking out
 */
export interface CheckOutRequest {
  notes?: string;
}

/**
 * Response with check-in log details
 */
export interface CheckInLogResponse {
  id: string;
  user_id: string;
  job_id: string;
  job_name?: string;
  job_number?: string;
  check_in_time: Date;
  check_out_time: Date | null;
  duration_hours: number | null;
  hourly_rate: number | null;
  billable_amount: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Query parameters for listing check-in logs
 */
export interface CheckInLogsQuery {
  user_id?: string;
  job_id?: string;
  start_date?: string;
  end_date?: string;
  active_only?: boolean;
  page?: number;
  limit?: number;
}
