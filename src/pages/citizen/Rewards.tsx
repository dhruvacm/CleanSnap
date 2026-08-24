import { useEffect, useState } from "react";
import {
  Award,
  CheckCircle2,
  Clock3,
  Coins,
  Gift,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile } from "@/services/profiles";
import {
  getRedemptions,
  getRewards,
  redeemReward,
} from "@/services/rewards";
import { toast } from "sonner";

function getCost(reward: any) {
  return Number(
    reward.cost ??
      reward.points_required ??
      0,
  );
}

export default function Rewards() {
  const { user } = useAuth();

  const [points, setPoints] =
    useState(0);

  const [rewards, setRewards] =
    useState<any[]>([]);

  const [history, setHistory] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState("");

  async function loadData() {
    if (!user) return;

    try {
      setLoading(true);

      const [
        profile,
        rewardData,
        redemptionData,
      ] = await Promise.all([
        getProfile(user.id),
        getRewards(),
        getRedemptions(user.id),
      ]);

      setPoints(profile.points || 0);
      setRewards(rewardData || []);
      setHistory(redemptionData || []);
    } catch (e: any) {
      toast.error(
        e.message ||
          "Could not load rewards",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  async function redeem(reward: any) {
    if (!user) return;

    const cost = getCost(reward);

    if (cost <= 0) {
      toast.error(
        "This reward has an invalid cost.",
      );
      return;
    }

    if (points < cost) {
      toast.error(
        "You don't have enough Clean Points.",
      );
      return;
    }

    setBusy(reward.name);

    try {
      await redeemReward(
        reward.name,
        cost,
      );

      /*
       * Reload the actual balance from
       * Supabase instead of trusting the
       * local calculation.
       */
      const profile =
        await getProfile(user.id);

      setPoints(profile.points || 0);

      const updatedHistory =
        await getRedemptions(user.id);

      setHistory(
        updatedHistory || [],
      );

      toast.success(
        `${reward.name} redeemed successfully!`,
      );
    } catch (e: any) {
      toast.error(
        e.message ||
          "Could not redeem reward",
      );
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[400px] place-items-center">
        <div className="text-center">
          <Loader2
            className="mx-auto animate-spin text-primary"
            size={28}
          />

          <p className="mt-3 text-sm text-muted-foreground">
            Loading rewards...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Balance */}
      <div className="rounded-3xl gradient-hero p-6 text-primary-foreground">

        <div className="flex items-center gap-2">
          <Coins size={20} />

          <p className="text-sm font-semibold opacity-90">
            Available Clean Points
          </p>
        </div>

        <p className="mt-2 text-5xl font-black">
          {points}
        </p>

        <p className="mt-2 text-sm opacity-80">
          These are the points currently
          available to redeem.
        </p>
      </div>

      {/* Rewards */}
      <section>

        <div className="mb-3 flex items-center gap-2">
          <Award
            className="text-primary"
            size={20}
          />

          <div>
            <h2 className="font-black">
              Rewards
            </h2>

            <p className="text-xs text-muted-foreground">
              Redeem your available Clean
              Points.
            </p>
          </div>
        </div>

        {rewards.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <Gift
              className="mx-auto text-muted-foreground"
              size={28}
            />

            <p className="mt-3 font-semibold">
              No rewards available
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Check back later for new
              community rewards.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">

            {rewards.map((reward) => {
              const cost =
                getCost(reward);

              const canRedeem =
                points >= cost &&
                cost > 0;

              const isBusy =
                busy === reward.name;

              return (
                <div
                  key={reward.name}
                  className="glass-card p-5"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <div className="text-3xl">
                        {reward.icon ||
                          "🎁"}
                      </div>

                      <h3 className="mt-3 font-bold">
                        {reward.name}
                      </h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {reward.description ||
                          "Community reward"}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                      {cost} pts
                    </span>

                  </div>

                  <div className="mt-4">

                    {canRedeem ? (
                      <div className="mb-2 flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 size={14} />
                        Available to redeem
                      </div>
                    ) : (
                      <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 size={14} />
                        Need{" "}
                        {Math.max(
                          0,
                          cost - points,
                        )}{" "}
                        more points
                      </div>
                    )}

                    <Button
                      disabled={
                        !canRedeem ||
                        isBusy
                      }
                      onClick={() =>
                        redeem(reward)
                      }
                      className="w-full"
                    >
                      {isBusy ? (
                        <Loader2 className="animate-spin" />
                      ) : canRedeem ? (
                        "Redeem reward"
                      ) : (
                        "Locked"
                      )}
                    </Button>

                  </div>
                </div>
              );
            })}

          </div>
        )}
      </section>

      {/* History */}
      <section>

        <div className="mb-3 flex items-center gap-2">
          <Gift
            className="text-primary"
            size={20}
          />

          <div>
            <h2 className="font-black">
              Redemption history
            </h2>

            <p className="text-xs text-muted-foreground">
              Rewards you have redeemed.
            </p>
          </div>
        </div>

        <div className="glass-card divide-y">

          {history.length === 0 ? (
            <div className="p-8 text-center">
              <Gift
                className="mx-auto text-muted-foreground"
                size={25}
              />

              <p className="mt-3 font-semibold">
                No rewards redeemed yet
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Your redemption history will
                appear here.
              </p>
            </div>
          ) : (
            history
              .slice(0, 10)
              .map((item, index) => (
                <div
                  key={
                    item.id || index
                  }
                  className="flex items-center justify-between gap-4 p-4"
                >

                  <div className="flex items-center gap-3">

                    <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2
                        size={17}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-bold">
                        {item.reward_name}
                      </p>

                      {item.created_at && (
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(
                            item.created_at,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                  </div>

                  <span className="font-black text-primary">
                    -{item.points_spent} pts
                  </span>

                </div>
              ))
          )}

        </div>
      </section>

      {/* Explanation */}
      <div className="glass-card p-5 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <Award
            size={20}
            className="mt-0.5 shrink-0 text-primary"
          />

          <div>
            <p className="font-bold text-foreground">
              How Clean Points work
            </p>

            <p className="mt-1">
              Your leaderboard score represents
              your total contribution. Redeeming
              a reward only reduces your available
              reward balance.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}