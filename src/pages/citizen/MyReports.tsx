import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { getMyReports } from "@/services/reports";
import type { Report } from "@/types";
import { Input } from "@/components/ui/input";

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

function getProgress(status?: string | null) {
  switch (status) {
    case "resolved":
      return 100;
    case "in_progress":
      return 75;
    case "assigned":
      return 60;
    case "ai_verified":
      return 40;
    default:
      return 20;
  }
}

export default function MyReports() {
  const { user } = useAuth();

  const [reports, setReports] =
    useState<Report[]>([]);

  const [filter, setFilter] =
    useState("all");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    getMyReports(user.id)
      .then(setReports)
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const stats = useMemo(() => {
    const resolved = reports.filter(
      (report) =>
        report.status === "resolved",
    ).length;

    return {
      total: reports.length,
      resolved,
      active: reports.length - resolved,
    };
  }, [reports]);

  const resolutionRate =
    stats.total > 0
      ? Math.round(
          (stats.resolved /
            stats.total) *
            100,
        )
      : 0;

  const visible = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "resolved"
          ? report.status === "resolved"
          : report.status !== "resolved");

      const matchesSearch =
        !query ||
        String(
          report.garbage_type || "",
        )
          .toLowerCase()
          .includes(query) ||
        String(
          report.location_text || "",
        )
          .toLowerCase()
          .includes(query) ||
        String(report.status || "")
          .toLowerCase()
          .includes(query);

      return (
        matchesFilter &&
        matchesSearch
      );
    });
  }, [reports, filter, search]);

  return (
    <div className="space-y-6 pb-4">

      {/* Header */}
      <section className="relative overflow-hidden rounded-[28px] border bg-card p-6 shadow-sm sm:p-7">

        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
              <FileText size={13} />
              Your activity
            </div>

            <h1 className="text-3xl font-black tracking-tight">
              My reports
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Track every issue you've
              reported and follow its journey
              from verification to resolution.
            </p>
          </div>

          <Link
            to="/report"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl gradient-hero px-4 py-3 text-xs font-bold text-primary-foreground shadow-md transition hover:-translate-y-0.5"
          >
            <Sparkles size={15} />
            New report
            <ArrowUpRight size={14} />
          </Link>

        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-3">

        <div className="glass-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <FileText size={18} />
          </div>

          <p className="mt-4 text-3xl font-black">
            {stats.total}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Total reports
          </p>
        </div>

        <div className="glass-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-orange-600">
            <Clock3 size={18} />
          </div>

          <p className="mt-4 text-3xl font-black">
            {stats.active}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Active reports
          </p>
        </div>

        <div className="glass-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={18} />
          </div>

          <p className="mt-4 text-3xl font-black">
            {stats.resolved}
          </p>

          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Resolved
            </p>

            <span className="text-[10px] font-black text-emerald-600">
              {resolutionRate}%
            </span>
          </div>
        </div>

      </section>

      {/* Search + Filters */}
      <section className="space-y-3">

        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-3 text-muted-foreground"
          />

          <Input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search reports, locations or status..."
            className="h-11 rounded-xl border-border/60 bg-card pl-9 shadow-sm"
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 rounded-lg px-2 py-1 text-xs font-bold text-muted-foreground hover:bg-secondary"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">

          {[
            ["all", "All", stats.total],
            ["active", "Active", stats.active],
            ["resolved", "Resolved", stats.resolved],
          ].map(
  ([value, label, count]: [
    string,
    string,
    number,
  ]) => (
              <button
                key={value}
                onClick={() =>
                  setFilter(value)
                }
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  filter === value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}

                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                    filter === value
                      ? "bg-white/15"
                      : "bg-background"
                  }`}
                >
                  {count}
                </span>
              </button>
            ),
          )}

        </div>
      </section>

      {/* Results header */}
      {!loading && reports.length > 0 && (
        <div className="flex items-center justify-between">

          <div>
            <h2 className="font-black">
              {filter === "all"
                ? "All reports"
                : filter === "resolved"
                  ? "Resolved reports"
                  : "Active reports"}
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              {visible.length}{" "}
              {visible.length === 1
                ? "report"
                : "reports"}{" "}
              found
            </p>
          </div>

          {resolutionRate > 0 && (
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-2 w-20 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full gradient-hero"
                  style={{
                    width: `${resolutionRate}%`,
                  }}
                />
              </div>

              <span className="text-[10px] font-bold text-muted-foreground">
                {resolutionRate}% resolved
              </span>
            </div>
          )}

        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">

          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="glass-card animate-pulse p-4"
              >
                <div className="flex gap-4">

                  <div className="h-24 w-24 shrink-0 rounded-2xl bg-secondary" />

                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-2/3 rounded bg-secondary" />
                    <div className="h-3 w-full rounded bg-secondary" />
                    <div className="h-5 w-24 rounded-full bg-secondary" />
                    <div className="h-1.5 w-full rounded bg-secondary" />
                  </div>

                </div>
              </div>
            ),
          )}

        </div>
      ) : visible.length === 0 ? (
        <div className="relative overflow-hidden rounded-[28px] border border-dashed p-10 text-center">

          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            {search ? (
              <Search size={23} />
            ) : (
              <FileText size={23} />
            )}
          </div>

          <h3 className="mt-4 font-black">
            {search
              ? "No matching reports"
              : "Nothing here yet"}
          </h3>

          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {search
              ? "Try a different search term or clear your search."
              : filter === "resolved"
                ? "Your resolved reports will appear here."
                : "Your submitted reports will appear here."}
          </p>

          {!search &&
            filter !== "resolved" && (
              <Link to="/report">
                <button className="mt-5 inline-flex items-center gap-2 rounded-xl gradient-hero px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm">
                  <Sparkles size={15} />
                  Submit your first report
                </button>
              </Link>
            )}

        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">

          {visible.map((report) => {
            const progress =
              getProgress(
                report.status,
              );

            return (
              <Link
                key={report.id}
                to={`/reports/${report.id}`}
                className="group glass-card overflow-hidden rounded-[22px] p-4 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >

                <div className="flex gap-4">

                  {/* Image */}
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-secondary">

                    {report.image_url ? (
                      <img
                        src={report.image_url}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-primary">
                        <MapPin size={22} />
                      </div>
                    )}

                    {report.status ===
                      "resolved" && (
                      <div className="absolute bottom-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white shadow-md">
                        <CheckCircle2
                          size={14}
                        />
                      </div>
                    )}

                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-2">

                      <div className="min-w-0">
                        <p className="truncate font-black capitalize">
                          {report.garbage_type ||
                            "Waste report"}
                        </p>

                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin
                            size={11}
                            className="shrink-0"
                          />
                          {report.location_text ||
                            "Location unavailable"}
                        </p>
                      </div>

                      <ChevronRight
                        size={17}
                        className="mt-1 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary"
                      />

                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">

                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${getStatusClass(
                          report.status,
                        )}`}
                      >
                        {formatStatus(
                          report.status,
                        )}
                      </span>

                      {report.severity && (
                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-bold capitalize ${getSeverityClass(
                            report.severity,
                          )}`}
                        >
                          {report.severity}
                        </span>
                      )}

                      {report.points_earned !=
                        null && (
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-black text-primary">
                          +{report.points_earned}
                        </span>
                      )}

                    </div>

                    <div className="mt-3 flex items-center gap-2">

                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            report.status ===
                            "resolved"
                              ? "bg-emerald-500"
                              : "gradient-hero"
                          }`}
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      <span className="text-[9px] font-bold text-muted-foreground">
                        {progress}%
                      </span>

                    </div>

                    <div className="mt-2 flex items-center justify-between">

                      <span className="text-[10px] text-muted-foreground">
                        {report.created_at
                          ? new Date(
                              report.created_at,
                            ).toLocaleDateString(
                              undefined,
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : ""}
                      </span>

                      <span className="text-[10px] font-bold text-primary opacity-0 transition group-hover:opacity-100">
                        View details →
                      </span>

                    </div>

                  </div>

                </div>

              </Link>
            );
          })}

        </div>
      )}

    </div>
  );
}