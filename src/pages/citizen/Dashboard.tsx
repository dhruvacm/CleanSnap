import {
  ArrowUpRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Leaf,
  MapPin,
  Sparkles,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile } from "@/services/profiles";
import { getMyReports } from "@/services/reports";
import { useEffect, useMemo, useState } from "react";
import type { Profile, Report } from "@/types";

function formatStatus(status?: string | null) {
  if (!status) return "Submitted";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "resolved":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

    case "in_progress":
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-200";

    case "assigned":
      return "bg-purple-50 text-purple-700 ring-1 ring-purple-200";

    case "ai_verified":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";

    default:
      return "bg-secondary text-muted-foreground";
  }
}

function getSeverityClass(severity?: string | null) {
  switch (severity?.toLowerCase()) {
    case "critical":
    case "extreme":
      return "bg-red-50 text-red-700 ring-1 ring-red-200";

    case "high":
    case "large":
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-200";

    case "medium":
      return "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200";

    default:
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }
}

export default function Dashboard() {
  const { user } = useAuth();

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [reports, setReports] =
    useState<Report[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    Promise.all([
      getProfile(user.id),
      getMyReports(user.id),
    ])
      .then(([profileData, reportData]) => {
        setProfile(profileData);
        setReports(reportData);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const name =
    profile?.display_name ||
    user?.email?.split("@")[0] ||
    "there";

  const stats = useMemo(() => {
    const resolved = reports.filter(
      (r) => r.status === "resolved",
    ).length;

    const active = reports.filter(
      (r) => r.status !== "resolved",
    ).length;

    const inProgress = reports.filter(
      (r) => r.status === "in_progress",
    ).length;

    const verified = reports.filter(
      (r) =>
        r.status === "ai_verified" ||
        r.status === "assigned" ||
        r.status === "in_progress" ||
        r.status === "resolved",
    ).length;

    return {
      resolved,
      active,
      inProgress,
      verified,
    };
  }, [reports]);

  const resolutionRate =
    reports.length > 0
      ? Math.round(
          (stats.resolved / reports.length) *
            100,
        )
      : 0;

  const totalPoints =
    profile?.total_points ?? 0;

  const availablePoints =
    profile?.points ?? 0;

  return (
    <div className="space-y-6 pb-4">

      {/* Premium Welcome Hero */}
      <section className="relative overflow-hidden rounded-[28px] border bg-card p-6 shadow-sm sm:p-8">

        {/* Decorative background */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">

          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
              <Leaf size={13} />
              Clean city community
            </div>

            <p className="text-sm font-medium text-muted-foreground">
              Good to see you back 👋
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              Hi, {name}
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Every report you submit helps your
              community identify problems faster
              and create real-world impact.
            </p>
          </div>

          <Link
            to="/report"
            className="shrink-0"
          >
            <Button
              size="lg"
              className="h-12 gap-2 rounded-2xl gradient-hero border-0 px-6 shadow-lg transition hover:-translate-y-0.5"
            >
              <Camera size={18} />
              Report an issue
              <ArrowUpRight size={16} />
            </Button>
          </Link>

        </div>
      </section>

      {/* Points card + Stats */}
      <section className="grid gap-3 lg:grid-cols-[1.35fr_2fr]">

        {/* Points */}
        <div className="relative overflow-hidden rounded-[24px] gradient-hero p-6 text-primary-foreground shadow-lg">

          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

          <div className="relative">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-75">
                  Available Clean Points
                </p>

                <div className="mt-2 flex items-end gap-2">
                  <p className="text-4xl font-black">
                    {availablePoints}
                  </p>

                  <span className="pb-1 text-sm opacity-75">
                    points
                  </span>
                </div>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
                <TrendingUp size={21} />
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white/10 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="opacity-75">
                  Lifetime earned
                </span>

                <span className="font-bold">
                  {totalPoints}
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-white/80"
                  style={{
                    width: `${
                      totalPoints > 0
                        ? Math.min(
                            100,
                            (availablePoints /
                              totalPoints) *
                              100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>

              <Link
                to="/rewards"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold opacity-90 hover:opacity-100"
              >
                Explore rewards
                <ChevronRight size={13} />
              </Link>
            </div>

          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">

          <div className="glass-card group p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <MapPin size={18} />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Reports
              </span>
            </div>

            <p className="mt-4 text-3xl font-black">
              {reports.length}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Total submitted
            </p>
          </div>

          <div className="glass-card group p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Success
              </span>
            </div>

            <p className="mt-4 text-3xl font-black">
              {stats.resolved}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Reports resolved
            </p>
          </div>

          <div className="glass-card group p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-orange-600">
                <Clock3 size={18} />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Active
              </span>
            </div>

            <p className="mt-4 text-3xl font-black">
              {stats.active}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Being handled
            </p>
          </div>

          <div className="glass-card group p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-50 text-purple-600">
                <Trophy size={18} />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Verified
              </span>
            </div>

            <p className="mt-4 text-3xl font-black">
              {stats.verified}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Verified reports
            </p>
          </div>

        </div>
      </section>

      {/* Impact section */}
      <section className="relative overflow-hidden rounded-[28px] bg-foreground p-6 text-background sm:p-7">

        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative">

          <div className="flex items-center gap-2 text-sm font-bold">
            <Sparkles
              size={17}
              className="text-primary"
            />
            Your impact
          </div>

          <div className="mt-2 flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>
              <h2 className="max-w-xl text-2xl font-black tracking-tight">
                You're helping make your city
                cleaner, one report at a time.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 opacity-65">
                AI verifies your reports and
                your location helps teams act
                faster.
              </p>
            </div>

            <Link
              to="/leaderboard"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-background/10 px-4 py-2.5 text-xs font-bold transition hover:bg-background/15"
            >
              <Trophy size={15} />
              View leaderboard
              <ChevronRight size={14} />
            </Link>

          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">

            <div className="rounded-2xl border border-background/10 bg-background/5 p-4">
              <p className="text-2xl font-black">
                {stats.verified}
              </p>

              <p className="mt-1 text-xs opacity-60">
                Verified reports
              </p>
            </div>

            <div className="rounded-2xl border border-background/10 bg-background/5 p-4">
              <p className="text-2xl font-black">
                {resolutionRate}%
              </p>

              <p className="mt-1 text-xs opacity-60">
                Resolution rate
              </p>
            </div>

            <div className="rounded-2xl border border-background/10 bg-background/5 p-4">
              <p className="text-2xl font-black">
                {stats.inProgress}
              </p>

              <p className="mt-1 text-xs opacity-60">
                Currently being handled
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Cleanup progress */}
      {reports.length > 0 && (
        <section className="glass-card-elevated rounded-[24px] p-5 sm:p-6">

          <div className="flex items-start justify-between gap-4">

            <div>
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <CheckCircle2 size={16} />
                </div>

                <h2 className="font-black">
                  Cleanup progress
                </h2>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                {stats.resolved} of {reports.length}{" "}
                reports have been resolved.
              </p>
            </div>

            <span className="text-xl font-black text-primary">
              {resolutionRate}%
            </span>

          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full gradient-hero transition-all duration-700"
              style={{
                width: `${resolutionRate}%`,
              }}
            />
          </div>

          <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
            <span>
              {stats.resolved} resolved
            </span>

            <span>
              {reports.length} total
            </span>
          </div>

        </section>
      )}

      {/* Recent reports */}
      <section>

        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-black">
              Recent reports
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Keep an eye on your community
              contributions.
            </p>
          </div>

          <Link
            to="/my-reports"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary"
          >
            View all
            <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="glass-card h-28 animate-pulse p-4"
              >
                <div className="flex gap-4">
                  <div className="h-20 w-20 rounded-xl bg-secondary" />

                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-2/3 rounded bg-secondary" />
                    <div className="h-3 w-full rounded bg-secondary" />
                    <div className="h-5 w-20 rounded-full bg-secondary" />
                  </div>
                </div>
              </div>
            ))}

          </div>
        ) : reports.length === 0 ? (
          <div className="relative overflow-hidden rounded-[24px] border border-dashed p-10 text-center">

            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MapPin size={24} />
            </div>

            <h3 className="mt-4 font-black">
              Start your CleanSnap journey
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Spot a cleanliness issue? Report
              it and help your community take
              action.
            </p>

            <Link to="/report">
              <Button className="mt-5 gap-2 rounded-xl gradient-hero border-0">
                <Camera size={16} />
                Report an issue
              </Button>
            </Link>

          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">

            {reports
              .slice(0, 4)
              .map((report) => (
                <Link
                  to={`/reports/${report.id}`}
                  key={report.id}
                  className="group glass-card overflow-hidden p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >

                  <div className="flex gap-4">

                    {/* Image */}
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-secondary">

                      {report.image_url ? (
                        <img
                          src={report.image_url}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-primary">
                          <MapPin size={21} />
                        </div>
                      )}

                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-2">

                        <p className="truncate font-bold capitalize">
                          {report.garbage_type ||
                            "Waste report"}
                        </p>

                        {report.severity && (
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold capitalize ${getSeverityClass(
                              report.severity,
                            )}`}
                          >
                            {report.severity}
                          </span>
                        )}

                      </div>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {report.location_text ||
                          "Location unavailable"}
                      </p>

                      <div className="mt-3 flex items-center gap-2">

                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-bold ${getStatusClass(
                            report.status,
                          )}`}
                        >
                          {formatStatus(
                            report.status,
                          )}
                        </span>

                        {report.points_earned !=
                          null && (
                          <span className="text-[10px] font-black text-primary">
                            +{report.points_earned}
                          </span>
                        )}

                      </div>

                    </div>

                    <ChevronRight
                      size={17}
                      className="mt-1 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary"
                    />

                  </div>
                </Link>
              ))}

          </div>
        )}

      </section>

      {/* Quick actions */}
      <section>

        <h2 className="mb-3 text-lg font-black">
          Explore CleanSnap
        </h2>

        <div className="grid gap-3 sm:grid-cols-3">

          <Link
            to="/my-reports"
            className="group glass-card rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <MapPin size={19} />
              </div>

              <ArrowUpRight
                size={17}
                className="text-muted-foreground transition group-hover:text-primary"
              />
            </div>

            <p className="mt-4 font-black">
              My reports
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Track every issue you've
              submitted.
            </p>
          </Link>

          <Link
            to="/leaderboard"
            className="group glass-card rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <Trophy size={19} />
              </div>

              <ArrowUpRight
                size={17}
                className="text-muted-foreground transition group-hover:text-primary"
              />
            </div>

            <p className="mt-4 font-black">
              Leaderboard
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              See your community ranking.
            </p>
          </Link>

          <Link
            to="/rewards"
            className="group glass-card rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <Sparkles size={19} />
              </div>

              <ArrowUpRight
                size={17}
                className="text-muted-foreground transition group-hover:text-primary"
              />
            </div>

            <p className="mt-4 font-black">
              Rewards
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Turn your Clean Points into
              rewards.
            </p>
          </Link>

        </div>

      </section>

    </div>
  );
}