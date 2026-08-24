import { useEffect, useState } from "react";
import { Crown, Medal, Trophy } from "lucide-react";
import { getLeaderboard } from "@/services/profiles";
import { useAuth } from "@/contexts/AuthContext";

export default function Leaderboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const data = await getLeaderboard();
        setUsers(data || []);
      } catch (error) {
        console.error("Leaderboard error:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black">
          Community champions
        </h1>

        <p className="text-sm text-muted-foreground">
          People turning reports into real-world impact.
        </p>
      </div>

      <div className="glass-card-elevated p-5">
        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Loading leaderboard...
          </p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No leaderboard data yet.
          </p>
        ) : (
          users.slice(0, 20).map((u, i) => (
            <div
              key={u.user_id}
              className={`flex items-center gap-3 border-b py-3 last:border-0 ${
                u.user_id === user?.id
                  ? "bg-primary/5"
                  : ""
              }`}
            >
              <div className="w-7 text-center font-black text-muted-foreground">
                {i < 3 ? (
                  i === 0 ? (
                    <Crown
                      className="mx-auto text-yellow-500"
                      size={18}
                    />
                  ) : (
                    <Medal
                      className={`mx-auto ${
                        i === 1
                          ? "text-slate-400"
                          : "text-amber-600"
                      }`}
                      size={18}
                    />
                  )
                ) : (
                  i + 1
                )}
              </div>

              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 font-bold text-primary">
                {(u.display_name || "U")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div className="flex-1">
                <p className="font-semibold">
                  {u.display_name || "Anonymous"}
                  {u.user_id === user?.id
                    ? " · You"
                    : ""}
                </p>

                <p className="text-xs text-muted-foreground">
                  Community contributor
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 font-black text-primary">
                  <Trophy size={15} />
                  {u.total_points || 0}
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Total earned
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}