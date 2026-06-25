export type Role = "super_admin" | "admin" | "group_leader" | "warrior";

export type UserRecord = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  manager_id: string | null;
  organisation_id: string | null;
  system_id: string | null;
  is_approved: boolean;
  is_active: boolean;
  is_tracking_enabled: boolean;
  is_tracking_active: boolean;
  created_at: string;
  employee_id?: string | null;
  department?: string | null;
  manager_ids?: string[];
};

export type ReportResponse = {
  leader_id: string;
  leader_name: string;
  overall_total_calls: number;
  overall_incoming_calls_count: number;
  overall_outgoing_calls_count: number;
  overall_total_calling_hours: number;
  overall_average_call_seconds: number;
  warriors: Array<{
    warrior_id: string;
    full_name: string;
    is_tracking_enabled: boolean;
    total_calls: number;
    incoming_calls_count: number;
    outgoing_calls_count: number;
    total_calling_seconds: number;
    total_calling_hours: number;
    average_call_seconds: number;
    calls: Array<{
      phone_number: string;
      call_type: string;
      call_status?: string | null;
      duration_seconds: number;
      timestamp: string;
    }>;
    manager_id?: string | null;
    manager_name?: string | null;
  }>;
};

export type EmployeeRecord = {
  id: string;
  system_id: string;
  employee_id: string;
  email?: string | null;
  department?: string | null;
  is_tracking_needed: boolean;
  org_id: string;
  created_at: string;
};

export type DashboardState = {
  me: UserRecord | null;
  users: UserRecord[];
  report: ReportResponse | null;
  employees: EmployeeRecord[];
};
