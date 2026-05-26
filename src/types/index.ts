// src/types/index.ts
// ============================================================
// All shared TypeScript types for WM Client Portal
// ============================================================

export type UserRole = 'manager' | 'account_manager' | 'client';
export type ClientStatus = 'active' | 'inactive' | 'suspended';
export type ReportType = 'seo' | 'website_update' | 'analytics' | 'audit' | 'other';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

// ---- User ----
export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Client ----
export interface Client {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  assigned_account_manager?: string | null;
  assignedManager?: User | null;
  created_by: string;
  status: ClientStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Report ----
export interface Report {
  id: string;
  client_id: string;
  client?: Client;
  uploaded_by: string;
  uploader?: User;
  report_type: ReportType;
  title: string;
  description?: string | null;
  file_url: string;
  file_name: string;
  file_size?: number | null;
  mime_type?: string | null;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
}

// ---- Comment ----
export interface Comment {
  id: string;
  report_id: string;
  user_id: string;
  user?: User;
  comment: string;
  created_at: string;
}

// ---- Message ----
export interface Message {
  id: string;
  sender_id: string;
  sender?: User;
  receiver_id: string;
  receiver?: User;
  message: string;
  attachment?: string | null;
  is_read: boolean;
  created_at: string;
}

// Chat thread (grouped by participant)
export interface ChatThread {
  participant: User;
  last_message: Message;
  unread_count: number;
}

// ---- Delete Request ----
export interface DeleteRequest {
  id: string;
  client_id: string;
  client?: Client;
  requested_by: string;
  requester?: User;
  reason?: string | null;
  status: RequestStatus;
  approved_by?: string | null;
  approver?: User | null;
  reviewed_at?: string | null;
  created_at: string;
}

// ---- Notification ----
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

// ---- Activity Log ----
export interface ActivityLog {
  id: string;
  user_id?: string | null;
  user?: User | null;
  action: string;
  entity?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}

// ---- Dashboard Analytics ----
export interface ManagerDashboardStats {
  total_clients: number;
  total_account_managers: number;
  pending_approvals: number;
  total_reports: number;
  active_clients: number;
}

export interface AMDashboardStats {
  assigned_clients: number;
  total_reports_uploaded: number;
  unread_messages: number;
  pending_delete_requests: number;
}

export interface ClientDashboardStats {
  total_reports: number;
  unread_messages: number;
  latest_report?: Report | null;
}

// ---- API Response wrappers ----
export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

// ---- Forms (Zod-inferred, also typed here for convenience) ----
export interface LoginFormValues {
  email: string;
  password: string;
}

export interface CreateUserFormValues {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateClientFormValues {
  company_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  website?: string;
  assigned_account_manager?: string;
  notes?: string;
}

export interface UploadReportFormValues {
  client_id: string;
  report_type: ReportType;
  title: string;
  description?: string;
  file: File;
}