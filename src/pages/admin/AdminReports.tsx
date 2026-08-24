import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  FileText,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  getAdminReports,
  updateReportStatus,
} from "@/services/reports";

import { toast } from "sonner";

const statuses = [
  "submitted",
  "ai_verified",
  "assigned",
  "in_progress",
  "resolved",
];

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  ai_verified: "AI Verified",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
};

function formatStatus(status?: string | null) {
  if (!status) return "Submitted";

  return (
    statusLabels[status] ||
    status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      )
  );
}

function getSeverityClass(
  severity?: string | null,
) {
  switch (severity?.toLowerCase()) {
    case "critical":
    case "extreme":
      return "bg-red-100 text-red-700 border-red-200";

    case "high":
    case "large":
      return "bg-orange-100 text-orange-700 border-orange-200";

    case "medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";

    default:
      return "bg-green-100 text-green-700 border-green-200";
  }
}

export default function AdminReports() {
  const [reports, setReports] = useState<any[]>(
    [],
  );

  const [busy, setBusy] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [severityFilter, setSeverityFilter] =
    useState("all");

  const [expanded, setExpanded] =
    useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const data = await getAdminReports();

      setReports(data || []);
    } catch (e: any) {
      toast.error(
        e?.message ||
          "Could not load reports.",
      );
    }
  }

  async function change(
    id: string,
    status: string,
  ) {
    setBusy(id);

    try {
      await updateReportStatus(
        id,
        status,
      );

      setReports((current) =>
        current.map((report) =>
          report.id === id
            ? {
                ...report,
                status,
              }
            : report,
        ),
      );

      toast.success(
        `Report marked ${formatStatus(
          status,
        )}`,
      );
    } catch (e: any) {
      toast.error(
        e?.message ||
          "Could not update report.",
      );
    } finally {
      setBusy("");
    }
  }

  const filteredReports = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return reports.filter((report) => {
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
        String(
          report.status || "",
        )
          .toLowerCase()
          .includes(query) ||
        String(
          report.ai_analysis || "",
        )
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        report.status === statusFilter;

      const matchesSeverity =
        severityFilter === "all" ||
        report.severity === severityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSeverity
      );
    });
  }, [
    reports,
    search,
    statusFilter,
    severityFilter,
  ]);

  const counts = useMemo(() => {
    return {
      total: reports.length,
      active: reports.filter(
        (r) => r.status !== "resolved",
      ).length,
      resolved: reports.filter(
        (r) => r.status === "resolved",
      ).length,
      critical: reports.filter(
        (r) =>
          r.severity === "critical" ||
          r.severity === "extreme",
      ).length,
    };
  }, [reports]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h1 className="text-2xl font-black">
              Report management
            </h1>

            <p className="text-sm text-muted-foreground">
              Review, verify and manage
              community reports.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">
            Total reports
          </p>

          <p className="mt-1 text-2xl font-black">
            {counts.total}
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">
            Active
          </p>

          <p className="mt-1 text-2xl font-black">
            {counts.active}
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">
            Resolved
          </p>

          <p className="mt-1 text-2xl font-black">
            {counts.resolved}
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">
            Critical
          </p>

          <p className="mt-1 text-2xl font-black">
            {counts.critical}
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="glass-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_200px_200px]">
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
              placeholder="Search reports, locations, types..."
              className="pl-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value,
              )
            }
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">
              All statuses
            </option>

            {statuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {formatStatus(status)}
              </option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) =>
              setSeverityFilter(
                e.target.value,
              )
            }
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">
              All severity
            </option>

            <option value="critical">
              Critical
            </option>

            <option value="high">
              High
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="low">
              Low
            </option>
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing{" "}
            <strong className="text-foreground">
              {filteredReports.length}
            </strong>{" "}
            of {reports.length} reports
          </span>

          {(search ||
            statusFilter !== "all" ||
            severityFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setSeverityFilter("all");
              }}
              className="font-semibold text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Reports */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <FileText className="mx-auto text-muted-foreground" />

            <h3 className="mt-3 font-bold">
              No reports found
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your search or
              filters.
            </p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isExpanded =
              expanded === report.id;

            const severityClass =
              getSeverityClass(
                report.severity,
              );

            return (
              <div
                key={report.id}
                className="glass-card overflow-hidden"
              >
                {/* Main row */}
                <div className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {/* Image */}
                    <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-24 sm:w-28">
                      {report.image_url ? (
                        <img
                          src={report.image_url}
                          alt="Reported issue"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-muted-foreground">
                          <FileText size={22} />
                        </div>
                      )}
                    </div>

                    {/* Information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold capitalize">
                            {report.garbage_type ||
                              "Waste report"}
                          </p>

                          <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                            <MapPin
                              size={13}
                              className="mt-0.5 shrink-0"
                            />

                            <span>
                              {report.location_text ||
                                "No location provided"}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-1 text-[10px] font-bold capitalize ${severityClass}`}
                          >
                            {report.severity ||
                              "low"}
                          </span>

                          <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                            {formatStatus(
                              report.status,
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        {report.created_at && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />

                            {new Date(
                              report.created_at,
                            ).toLocaleString()}
                          </span>
                        )}

                        {report.points_earned !=
                          null && (
                          <span className="font-bold text-primary">
                            +{report.points_earned}{" "}
                            points
                          </span>
                        )}
                      </div>

                      {/* Expand */}
                      <button
                        onClick={() =>
                          setExpanded(
                            isExpanded
                              ? null
                              : report.id,
                          )
                        }
                        className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        {isExpanded
                          ? "Hide details"
                          : "Review details"}

                        <ChevronDown
                          size={14}
                          className={`transition-transform ${
                            isExpanded
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Status controls */}
                  <div className="mt-4 border-t pt-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Update workflow status
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {statuses.map(
                        (status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={
                              report.status ===
                              status
                                ? "default"
                                : "outline"
                            }
                            disabled={
                              busy ===
                              report.id
                            }
                            onClick={() =>
                              change(
                                report.id,
                                status,
                              )
                            }
                            className="text-[10px]"
                          >
                            {report.status ===
                              status && (
                              <CheckCircle2
                                size={13}
                              />
                            )}

                            {formatStatus(
                              status,
                            )}
                          </Button>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t bg-secondary/30 p-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      {/* AI Analysis */}
                      <div className="rounded-xl border bg-background p-4">
                        <div className="flex items-center gap-2">
                          <Sparkles
                            size={17}
                            className="text-primary"
                          />

                          <h3 className="font-bold">
                            AI analysis
                          </h3>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {report.ai_analysis ||
                            "No AI analysis available."}
                        </p>

                        {report.ai_confidence !=
                          null && (
                          <div className="mt-3 text-xs">
                            <span className="text-muted-foreground">
                              AI confidence:
                            </span>{" "}
                            <strong>
                              {
                                report.ai_confidence
                              }
                              %
                            </strong>
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      <div className="rounded-xl border bg-background p-4">
                        <div className="flex items-center gap-2">
                          <MapPin
                            size={17}
                            className="text-primary"
                          />

                          <h3 className="font-bold">
                            Location
                          </h3>
                        </div>

                        <p className="mt-3 text-sm">
                          {report.location_text ||
                            "No location provided"}
                        </p>

                        {report.latitude !=
                            null &&
                          report.longitude !=
                            null && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Coordinates:{" "}
                              {
                                report.latitude
                              }
                              ,{" "}
                              {
                                report.longitude
                              }
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}