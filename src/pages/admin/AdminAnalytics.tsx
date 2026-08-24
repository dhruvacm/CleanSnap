import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileWarning,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAdminReports } from "@/services/reports";
import { toast } from "sonner";

function getCount(
  reports: any[],
  key: string,
  value: string,
) {
  return reports.filter(
    (report) => report[key] === value,
  ).length;
}

function getSeverityClass(
  severity: string,
) {
  switch (severity.toLowerCase()) {
    case "critical":
    case "extreme":
      return "bg-red-500";

    case "high":
    case "large":
      return "bg-orange-500";

    case "medium":
      return "bg-yellow-500";

    default:
      return "bg-green-500";
  }
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

export default function AdminAnalytics() {
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
          "Could not load analytics.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const analytics = useMemo(() => {
    const total = reports.length;

    const resolved = reports.filter(
      (r) => r.status === "resolved",
    ).length;

    const active = reports.filter(
      (r) => r.status !== "resolved",
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

    const points = reports.reduce(
      (sum, report) =>
        sum + Number(report.points_earned || 0),
      0,
    );

    const resolutionRate =
      total > 0
        ? Math.round(
            (resolved / total) * 100,
          )
        : 0;

    const types = reports.reduce(
      (
        result: Record<string, number>,
        report,
      ) => {
        const type =
          report.garbage_type ||
          "Unknown";

        result[type] =
          (result[type] || 0) + 1;

        return result;
      },
      {},
    );

    const severity = reports.reduce(
      (
        result: Record<string, number>,
        report,
      ) => {
        const value =
          report.severity || "Unknown";

        result[value] =
          (result[value] || 0) + 1;

        return result;
      },
      {},
    );

    const statuses = reports.reduce(
      (
        result: Record<string, number>,
        report,
      ) => {
        const value =
          report.status || "submitted";

        result[value] =
          (result[value] || 0) + 1;

        return result;
      },
      {},
    );

    return {
      total,
      resolved,
      active,
      critical,
      high,
      points,
      resolutionRate,
      types,
      severity,
      statuses,
    };
  }, [reports]);

  const topTypes = Object.entries(
    analytics.types,
  )
    .sort(
      ([, a], [, b]) =>
        (b as number) - (a as number),
    )
    .slice(0, 8);

  const maxTypeCount =
    Math.max(
      1,
      ...topTypes.map(
        ([, value]) => value as number,
      ),
    );

  const statusOrder = [
    "submitted",
    "ai_verified",
    "assigned",
    "in_progress",
    "resolved",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <BarChart3 size={16} />
            Operations intelligence
          </div>

          <h1 className="mt-1 text-3xl font-black">
            Analytics
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Understand waste patterns,
            severity and resolution
            performance.
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

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-5">
          <FileWarning
            size={20}
            className="text-primary"
          />

          <p className="mt-4 text-3xl font-black">
            {analytics.total}
          </p>

          <p className="text-xs text-muted-foreground">
            Total reports
          </p>
        </div>

        <div className="glass-card p-5">
          <CheckCircle2
            size={20}
            className="text-green-600"
          />

          <p className="mt-4 text-3xl font-black">
            {analytics.resolutionRate}%
          </p>

          <p className="text-xs text-muted-foreground">
            Resolution rate
          </p>
        </div>

        <div className="glass-card p-5">
          <Clock3
            size={20}
            className="text-orange-500"
          />

          <p className="mt-4 text-3xl font-black">
            {analytics.active}
          </p>

          <p className="text-xs text-muted-foreground">
            Active issues
          </p>
        </div>

        <div className="glass-card p-5">
          <AlertTriangle
            size={20}
            className="text-red-600"
          />

          <p className="mt-4 text-3xl font-black">
            {analytics.critical}
          </p>

          <p className="text-xs text-muted-foreground">
            Critical issues
          </p>
        </div>
      </div>

      {/* Resolution overview */}
      <div className="glass-card-elevated p-5">
        <div className="flex items-center gap-2">
          <TrendingUp
            size={19}
            className="text-primary"
          />

          <div>
            <h2 className="font-black">
              Resolution performance
            </h2>

            <p className="text-xs text-muted-foreground">
              Overall cleanup progress.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-secondary p-5">
            <p className="text-xs text-muted-foreground">
              Resolved
            </p>

            <p className="mt-2 text-3xl font-black">
              {analytics.resolved}
            </p>
          </div>

          <div className="rounded-2xl bg-secondary p-5">
            <p className="text-xs text-muted-foreground">
              Active
            </p>

            <p className="mt-2 text-3xl font-black">
              {analytics.active}
            </p>
          </div>

          <div className="rounded-2xl bg-secondary p-5">
            <p className="text-xs text-muted-foreground">
              Points distributed
            </p>

            <p className="mt-2 text-3xl font-black">
              {analytics.points}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-xs">
            <span className="font-semibold">
              Resolution progress
            </span>

            <span className="font-bold text-primary">
              {analytics.resolutionRate}%
            </span>
          </div>

          <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${analytics.resolutionRate}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="glass-card-elevated p-5">
        <h2 className="font-black">
          Workflow distribution
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          Reports currently in each stage.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {statusOrder.map((status) => {
            const count =
              analytics.statuses[
                status
              ] || 0;

            const percentage =
              analytics.total > 0
                ? Math.round(
                    (count /
                      analytics.total) *
                      100,
                  )
                : 0;

            return (
              <div
                key={status}
                className="rounded-2xl bg-secondary p-4"
              >
                <p className="text-xs text-muted-foreground">
                  {formatLabel(status)}
                </p>

                <p className="mt-2 text-2xl font-black">
                  {count}
                </p>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  {percentage}% of reports
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category + Severity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Waste categories */}
        <div className="glass-card-elevated p-5">
          <div className="flex items-center gap-2">
            <BarChart3
              size={18}
              className="text-primary"
            />

            <h2 className="font-black">
              Waste categories
            </h2>
          </div>

          {topTypes.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No category data yet.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {topTypes.map(
                ([type, value]) => {
                  const count =
                    value as number;

                  const percentage =
                    Math.round(
                      (count /
                        Math.max(
                          1,
                          analytics.total,
                        )) *
                        100,
                    );

                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold capitalize">
                          {type}
                        </span>

                        <span className="text-muted-foreground">
                          {count} ·{" "}
                          {percentage}%
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${
                              (count /
                                maxTypeCount) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>

        {/* Severity */}
        <div className="glass-card-elevated p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle
              size={18}
              className="text-primary"
            />

            <h2 className="font-black">
              Severity distribution
            </h2>
          </div>

          {Object.keys(
            analytics.severity,
          ).length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No severity data yet.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {Object.entries(
                analytics.severity,
              )
                .sort(
                  ([, a], [, b]) =>
                    (b as number) -
                    (a as number),
                )
                .map(
                  ([severity, value]) => {
                    const count =
                      value as number;

                    const percentage =
                      analytics.total >
                      0
                        ? Math.round(
                            (count /
                              analytics.total) *
                              100,
                          )
                        : 0;

                    return (
                      <div
                        key={severity}
                        className="rounded-xl bg-secondary p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${getSeverityClass(
                                severity,
                              )}`}
                            />

                            <span className="font-semibold capitalize">
                              {severity}
                            </span>
                          </div>

                          <strong>
                            {count}
                          </strong>
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                          <div
                            className={`h-full rounded-full ${getSeverityClass(
                              severity,
                            )}`}
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
            </div>
          )}
        </div>
      </div>

      {/* Priority summary */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground">
            High-priority reports
          </p>

          <p className="mt-2 text-3xl font-black">
            {analytics.high}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            High, large, critical and
            extreme issues require closer
            attention.
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground">
            Total community points
          </p>

          <p className="mt-2 text-3xl font-black text-primary">
            {analytics.points}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Points awarded through reported
            cleanliness issues.
          </p>
        </div>
      </div>
    </div>
  );
}