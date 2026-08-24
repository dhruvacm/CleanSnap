import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_REWARDS } from "@/lib/constants";

export async function getRewards() {
  const { data, error } = await supabase.from("rewards").select("*").eq("active", true).order("points_required", { ascending: true });
  if (error) return DEFAULT_REWARDS;
  return (data && data.length ? data.map((r: any) => ({ ...r, cost: r.points_required })) : DEFAULT_REWARDS) as any[];
}

export async function redeemReward(rewardName: string, cost: number) {
  const { data, error } = await supabase.rpc("redeem_reward", { p_reward_name: rewardName, p_points: cost });
  if (error) throw error;
  return data;
}

export async function getRedemptions(userId: string) {
  const { data, error } = await supabase.from("redemptions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
