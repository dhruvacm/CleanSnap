import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileWarning,
  Map,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAdminReports } from "@/services/reports";
import { toast } from "sonner";

function formatStatus(status?: string | null) {
  if (!status) return "Submitted";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function getSeverityClass(
  severity?: string | null,
) {
  switch (severity?.toLowerCase()) {
    case "critical":
    case "extreme":
      return "bg-red-100 text-red-700";

    case "high":
    case "large":
      return "bg-orange-100 text-orange-700";

    case "medium":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-green-100 text-green-700";
  }
}

export default function AdminDashboard() {
  const [reports, setReports] = useState<any[]>(
    [],
  );

  const [loading, setLoading] =
    useState(true);

  async function loadReports() {
    try {
      setLoading(true);

      const data = await getAdminReports();

      setReports(data || []);
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Could not load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const stats = useMemo(() => {
    const total = reports.length;

    const submitted = reports.filter(
      (r) => r.status === "submitted",
    ).length;

    const aiVerified = reports.filter(
      (r) => r.status === "ai_verified",
    ).length;

    const assigned = reports.filter(
      (r) => r.status === "assigned",
    ).length;

    const inProgress = reports.filter(
      (r) => r.status === "in_progress",
    ).length;

    const resolved = reports.filter(
      (r) => r.status === "resolved",
    ).length;

    const critical = reports.filter(
      (r) =>
        r.severity === "critical" ||
        r.severity === "extreme",
    ).length;

    const high = reports.filter(
      (r) =>
        r.severity === "high" ||
        r.severity === "large",
    ).length;

    const active = reports.filter(
      (r) => r.status !== "resolved",
    ).length;

    const resolutionRate =
      total > 0
        ? Math.round(
            (resolved / total) * 100,
          )
        : 0;

    return {
      total,
      submitted,
      aiVerified,
      assigned,
      inProgress,
      resolved,
      critical,
      high,
      active,
      resolutionRate,
    };
  }, [reports]);

  const recentReports = useMemo(
    () =>
      [...reports]
        .sort(
          (a, b) =>
            new Date(
              b.created_at || 0,
            ).getTime() -
            new Date(
              a.created_at || 0,
            ).getTime(),
        )
        .slice(0, 6),
    [reports],
  );

  const statusData = [
    {
      label: "Submitted",
      value: stats.submitted,
      className: "bg-slate-400",
    },
    {
      label: "AI Verified",
      value: stats.aiVerified,
      className: "bg-blue-500",
    },
    {
      label: "Assigned",
      value: stats.assigned,
      className: "bg-purple-500",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      className: "bg-orange-500",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      className: "bg-green-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ShieldCheck size={16} />
            Municipality control center
          </div>

          <h1 className="mt-1 text-3xl font-black">
            Operations dashboard
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitor community issues and
            cleanup progress.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadReports}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw
            size={15}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />
          Refresh
        </Button>
      </div>

      {/* Main statistics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <FileWarning
              size={20}
              className="text-primary"
            />

            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
              All
            </span>
          </div>

          <p className="mt-4 text-3xl font-black">
            {stats.total}
          </p>

          <p className="text-xs text-muted-foreground">
            Total reports
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <Activity
              size={20}
              className="text-orange-500"
            />

            <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-700">
              Active
            </span>
          </div>

          <p className="mt-4 text-3xl font-black">
            {stats.active}
          </p>

          <p className="text-xs text-muted-foreground">
            Issues requiring action
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <CheckCircle2
              size={20}
              className="text-green-600"
            />

            <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
              {stats.resolutionRate}%
            </span>
          </div>

          <p className="mt-4 text-3xl font-black">
            {stats.resolved}
          </p>

          <p className="text-xs text-muted-foreground">
            Resolved reports
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <AlertTriangle
              size={20}
              className="text-red-600"
            />

            <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">
              Priority
            </span>
          </div>

          <p className="mt-4 text-3xl font-black">
            {stats.critical}
          </p>

          <p className="text-xs text-muted-foreground">
            Critical issues
          </p>
        </div>
      </div>

      {/* Workflow + Resolution */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Workflow */}
        <div className="glass-card-elevated p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black">
                Report workflow
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Current status distribution.
              </p>
            </div>

            <Link
              to="/admin/reports"
              className="text-xs font-bold text-primary hover:underline"
            >
              Manage
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {statusData.map((item) => {
              const percentage =
                stats.total > 0
                  ? Math.round(
                      (item.value /
                        stats.total) *
                        100,
                    )
                  : 0;

              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold">
                      {item.label}
                    </span>

                    <span className="text-muted-foreground">
                      {item.value} ·{" "}
                      {percentage}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${item.className}`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resolution */}
        <div className="glass-card-elevated p-5">
          <div className="flex items-center gap-2">
            <TrendingUp
              size={19}
              className="text-primary"
            />

            <h2 className="font-black">
              Resolution performance
            </h2>
          </div>

          <div className="mt-6 flex items-center gap-6">
            <div className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full border-[12px] border-primary/15">
              <div
                className="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-t-primary"
                style={{
                  transform: `rotate(${Math.min(
                    stats.resolutionRate *
                      3.6,
                    359,
                  )}deg)`,
                }}
              />

              <div className="text-center">
                <p className="text-2xl font-black">
                  {stats.resolutionRate}%
                </p>

                <p className="text-[10px] text-muted-foreground">
                  resolved
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-2xl font-black">
                  {stats.resolved}
                </p>

                <p className="text-xs text-muted-foreground">
                  Completed issues
                </p>
              </div>

              <div>
                <p className="text-2xl font-black">
                  {stats.active}
                </p>

                <p className="text-xs text-muted-foreground">
                  Still active
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground">
                High priority
              </p>

              <p className="mt-1 font-black">
                {stats.high}
              </p>
            </div>

            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground">
                Critical
              </p>

              <p className="mt-1 font-black">
                {stats.critical}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent reports */}
      <div className="glass-card-elevated p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black">
              Recent reports
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Latest issues submitted by the
              community.
            </p>
          </div>

          <Link
            to="/admin/reports"
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            View all
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="mt-4 divide-y">
          {recentReports.length === 0 ? (
            <div className="py-10 text-center">
              <FileWarning
                className="mx-auto text-muted-foreground"
                size={24}
              />

              <p className="mt-2 text-sm text-muted-foreground">
                No reports yet.
              </p>
            </div>
          ) : (
            recentReports.map((report) => (
              <Link
                key={report.id}
                to="/admin/reports"
                className="flex items-center gap-3 py-3 transition hover:bg-secondary/40"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-secondary">
                  {report.image_url ? (
                    <img
                      src={report.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <FileWarning
                        size={17}
                        className="text-muted-foreground"
                      />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold capitalize">
                    {report.garbage_type ||
                      "Waste report"}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {report.location_text ||
                      "No location"}
                  </p>
                </div>

                <div className="hidden items-end gap-1 sm:flex sm:flex-col">
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${getSeverityClass(
                      report.severity,
                    )}`}
                  >
                    {report.severity ||
                      "low"}
                  </span>

                  <span className="text-[10px] text-muted-foreground">
                    {formatStatus(
                      report.status,
                    )}
                  </span>
                </div>

                <ArrowRight
                  size={15}
                  className="text-muted-foreground"
                />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-black">
          Operations
        </h2>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Link
            to="/admin/reports"
            className="glass-card p-5 transition hover:-translate-y-0.5"
          >
            <FileWarning className="text-primary" />

            <h3 className="mt-4 font-bold">
              Manage reports
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Review, assign and resolve
              community issues.
            </p>
          </Link>

          <Link
            to="/admin/map"
            className="glass-card p-5 transition hover:-translate-y-0.5"
          >
            <Map className="text-primary" />

            <h3 className="mt-4 font-bold">
              Operations map
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              View reported issues across
              the community.
            </p>
          </Link>

          <Link
            to="/admin/analytics"
            className="glass-card p-5 transition hover:-translate-y-0.5"
          >
            <BarChart3 className="text-primary" />

            <h3 className="mt-4 font-bold">
              Analytics
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Understand waste patterns and
              resolution performance.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}