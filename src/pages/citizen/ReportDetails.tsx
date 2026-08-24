import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  getReport,
  getStatusHistory,
} from "@/services/reports";

import type { Report } from "@/types";

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

export default function ReportDetails() {
  const { id } = useParams();

  const [report, setReport] =
    useState<Report | null>(null);

  const [history, setHistory] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    Promise.all([
      getReport(id),
      getStatusHistory(id),
    ])
      .then(([reportData, historyData]) => {
        setReport(reportData);
        setHistory(historyData || []);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const currentIndex = useMemo(() => {
    if (!report?.status) return 0;

    const index = statuses.indexOf(
      report.status,
    );

    return index >= 0 ? index : 0;
  }, [report?.status]);

  const progress =
    ((currentIndex + 1) / statuses.length) *
    100;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="glass-card p-10 text-center text-sm text-muted-foreground">
          Loading report...
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link to="/my-reports">
          <Button
            variant="ghost"
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back to my reports
          </Button>
        </Link>

        <div className="glass-card p-10 text-center">
          <FileText
            className="mx-auto text-muted-foreground"
            size={28}
          />

          <h2 className="mt-3 font-bold">
            Report not found
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            This report may have been removed or
            you may not have access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">

      {/* Back */}
      <Link to="/my-reports">
        <Button
          variant="ghost"
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to my reports
        </Button>
      </Link>

      {/* Main report */}
      <div className="glass-card-elevated overflow-hidden">
        <div className="grid md:grid-cols-2">

          {/* Image */}
          <div className="min-h-72 bg-secondary">
            {report.image_url ? (
              <img
                src={report.image_url}
                alt="Reported issue"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full min-h-72 place-items-center text-muted-foreground">
                <FileText size={32} />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6">

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                {formatStatus(
                  report.status,
                )}
              </span>

              {report.severity && (
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${getSeverityClass(
                    report.severity,
                  )}`}
                >
                  {report.severity}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-black capitalize">
              {report.garbage_type ||
                "Waste report"}
            </h1>

            <div className="mt-4 space-y-3">

              <div className="flex gap-2 text-sm">
                <MapPin
                  size={17}
                  className="mt-0.5 shrink-0 text-primary"
                />

                <span>
                  {report.location_text ||
                    "Location unavailable"}
                </span>
              </div>

              {report.created_at && (
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <Calendar
                    size={17}
                    className="mt-0.5 shrink-0"
                  />

                  <span>
                    Submitted{" "}
                    {new Date(
                      report.created_at,
                    ).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex gap-2 text-sm">
                <span>⭐</span>

                <span>
                  <strong>
                    +{report.points_earned || 0}
                  </strong>{" "}
                  Clean Points
                </span>
              </div>
            </div>

            {/* AI analysis */}
            <div className="mt-5 rounded-2xl bg-secondary p-4">
              <div className="flex items-center gap-2">
                <Sparkles
                  size={17}
                  className="text-primary"
                />

                <p className="font-bold">
                  AI Analysis
                </p>
              </div>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {report.ai_analysis ||
                  "No AI analysis available."}
              </p>

              {report.ai_confidence !=
                null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  AI confidence:{" "}
                  <strong className="text-foreground">
                    {report.ai_confidence}%
                  </strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="glass-card-elevated p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black">
              Report progress
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Track your report from submission
              to resolution.
            </p>
          </div>

          <span className="text-sm font-black text-primary">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="glass-card-elevated p-6">
        <h2 className="font-black">
          Report timeline
        </h2>

        <div className="relative mt-6 space-y-6">

          {statuses.map((status, index) => {
            const done =
              index <= currentIndex;

            const active =
              index === currentIndex;

            const found =
              history.find(
                (item) =>
                  item.status === status,
              );

            return (
              <div
                key={status}
                className="relative flex gap-4"
              >
                {/* Connecting line */}
                {index <
                  statuses.length - 1 && (
                  <div
                    className={`absolute left-[15px] top-8 h-[calc(100%+8px)] w-0.5 ${
                      index <
                      currentIndex
                        ? "bg-primary"
                        : "bg-secondary"
                    }`}
                  />
                )}

                {/* Icon */}
                <div
                  className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  } ${
                    active
                      ? "ring-4 ring-primary/10"
                      : ""
                  }`}
                >
                  {done ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Clock3 size={16} />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                      className={`font-bold ${
                        done
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatStatus(
                        status,
                      )}
                    </p>

                    {found?.created_at && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(
                          found.created_at,
                        ).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {found?.comment && (
                    <div className="mt-2 flex gap-2 rounded-xl bg-secondary p-3">
                      <MessageSquare
                        size={15}
                        className="mt-0.5 shrink-0 text-primary"
                      />

                      <p className="text-xs leading-5 text-muted-foreground">
                        {found.comment}
                      </p>
                    </div>
                  )}

                  {active &&
                    !found?.comment && (
                      <p className="mt-1 text-xs text-primary">
                        Current report status
                      </p>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin comment */}
      {report.admin_comment && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2">
            <MessageSquare
              size={18}
              className="text-primary"
            />

            <h2 className="font-black">
              Admin update
            </h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {report.admin_comment}
          </p>
        </div>
      )}

      {/* Location */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2">
          <MapPin
            size={18}
            className="text-primary"
          />

          <h2 className="font-black">
            Report location
          </h2>
        </div>

        <p className="mt-3 text-sm">
          {report.location_text ||
            "Location unavailable"}
        </p>

        {report.latitude != null &&
          report.longitude != null && (
            <p className="mt-2 text-xs text-muted-foreground">
              Coordinates:{" "}
              {report.latitude},{" "}
              {report.longitude}
            </p>
          )}
      </div>

      {/* Resolved message */}
      {report.status === "resolved" && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 size={19} />
            Issue resolved
          </div>

          <p className="mt-2 text-sm">
            Thank you for helping your community
            identify this issue.
          </p>

          {report.resolved_at && (
            <p className="mt-2 text-xs">
              Resolved on{" "}
              {new Date(
                report.resolved_at,
              ).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}