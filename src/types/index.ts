export type Role = "citizen" | "admin" | "municipality";
export type ReportStatus = "submitted" | "ai_verified" | "assigned" | "in_progress" | "resolved";

export interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  points: number;
  reports_count: number;
  role?: Role;
  total_points: number;
}

export interface Report {
  id: string;
  user_id: string;
  image_url: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  garbage_type: string | null;
  severity: string | null;
  points_earned: number;
  ai_analysis: string | null;
  ai_confidence?: number | null;
  status?: ReportStatus | null;
  assigned_to?: string | null;
  admin_comment?: string | null;
  created_at: string;
  updated_at?: string;
  resolved_at?: string | null;
}

export interface Reward {
  id?: string;
  name: string;
  description?: string | null;
  points_required?: number;
  cost?: number;
  active?: boolean;
  stock?: number | null;
}
