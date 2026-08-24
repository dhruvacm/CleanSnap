import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  Trophy,
  FileText,
  Coins,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { getCitizens } from "@/services/profiles";
import { toast } from "sonner";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);

      const data = await getCitizens();

      setUsers(data);
    } catch (e: any) {
      toast.error(
        e.message || "Could not load citizens",
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      String(user.display_name || "")
        .toLowerCase()
        .includes(query),
    );
  }, [users, search]);

  const totalPoints = users.reduce(
    (sum, user) =>
      sum + Number(user.total_points || 0),
    0,
  );

  const totalReports = users.reduce(
    (sum, user) =>
      sum + Number(user.reports_count || 0),
    0,
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">
          Community management
        </p>

        <h1 className="text-3xl font-black">
          Citizens
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          View CleanSnap community contributors.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-3 sm:grid-cols-3">

        <div className="glass-card p-5">
          <Users
            size={20}
            className="text-primary"
          />

          <p className="mt-3 text-3xl font-black">
            {users.length}
          </p>

          <p className="text-xs text-muted-foreground">
            Total citizens
          </p>
        </div>

        <div className="glass-card p-5">
          <FileText
            size={20}
            className="text-primary"
          />

          <p className="mt-3 text-3xl font-black">
            {totalReports}
          </p>

          <p className="text-xs text-muted-foreground">
            Reports submitted
          </p>
        </div>

        <div className="glass-card p-5">
          <Trophy
            size={20}
            className="text-primary"
          />

          <p className="mt-3 text-3xl font-black">
            {totalPoints}
          </p>

          <p className="text-xs text-muted-foreground">
            Total points earned
          </p>
        </div>

      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={17}
          className="absolute left-3 top-2.5 text-muted-foreground"
        />

        <Input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search citizens..."
          className="pl-9"
        />
      </div>

      {/* Users */}
      <div className="glass-card overflow-hidden">

        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading citizens...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center">
            <Users
              className="mx-auto text-muted-foreground"
              size={28}
            />

            <p className="mt-3 font-semibold">
              No citizens found
            </p>
          </div>
        ) : (
          <div className="divide-y">

            {filteredUsers.map(
              (user, index) => (
                <div
                  key={user.user_id}
                  className="flex flex-wrap items-center gap-4 p-4"
                >

                  {/* Avatar */}
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 font-black text-primary">
                    {(user.display_name ||
                      "U")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  {/* User */}
                  <div className="min-w-[180px] flex-1">
                    <p className="font-bold">
                      {user.display_name ||
                        "Anonymous"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Citizen
                    </p>
                  </div>

                  {/* Reports */}
                  <div className="flex items-center gap-2 text-sm">
                    <FileText
                      size={15}
                      className="text-muted-foreground"
                    />

                    <div>
                      <p className="font-bold">
                        {user.reports_count || 0}
                      </p>

                      <p className="text-[10px] text-muted-foreground">
                        Reports
                      </p>
                    </div>
                  </div>

                  {/* Available points */}
                  <div className="flex items-center gap-2 text-sm">
                    <Coins
                      size={15}
                      className="text-muted-foreground"
                    />

                    <div>
                      <p className="font-bold">
                        {user.points || 0}
                      </p>

                      <p className="text-[10px] text-muted-foreground">
                        Available
                      </p>
                    </div>
                  </div>

                  {/* Lifetime points */}
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy
                      size={15}
                      className="text-primary"
                    />

                    <div>
                      <p className="font-black text-primary">
                        {user.total_points ||
                          0}
                      </p>

                      <p className="text-[10px] text-muted-foreground">
                        Total earned
                      </p>
                    </div>
                  </div>

                  {/* Rank */}
                  <div className="w-8 text-center text-xs font-black text-muted-foreground">
                    #{index + 1}
                  </div>

                </div>
              ),
            )}

          </div>
        )}

      </div>

    </div>
  );
}