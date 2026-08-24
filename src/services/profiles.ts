import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;

  return data as Profile;
}

export async function updateProfile(
  userId: string,
  values: {
    display_name: string;
    bio: string;
  },
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(values)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;

  return data as Profile;
}

export async function getLeaderboard() {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "user_id, display_name, total_points, role",
    )
    .not(
      "role",
      "in",
      '("admin","municipality")',
    )
    .order("total_points", {
      ascending: false,
    })
    .limit(50);

  if (error) throw error;

  return data ?? [];
}

/* Admin: get citizens only */
export async function getCitizens() {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "user_id, display_name, bio, points, total_points, reports_count, role, created_at",
    )
    .eq("role", "citizen")
    .order("total_points", {
      ascending: false,
    });

  if (error) throw error;

  return data ?? [];
}