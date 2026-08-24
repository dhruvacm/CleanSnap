import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Loader2,
  Map as MapIcon,
  Navigation,
} from "lucide-react";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { getPublicReports } from "@/services/reports";

/* --------------------------------------------------
 * Leaflet marker icon
 * -------------------------------------------------- */

const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

/* --------------------------------------------------
 * Report type
 * -------------------------------------------------- */

interface Report {
  id: string;
  latitude: number | null;
  longitude: number | null;
  garbage_type?: string | null;
  severity?: string | null;
  status?: string | null;
  location_text?: string | null;
  created_at?: string;
}

/* --------------------------------------------------
 * Automatically fit map to reports
 * -------------------------------------------------- */

function FitMapToReports({
  reports,
}: {
  reports: Report[];
}) {
  const map = useMap();

  useEffect(() => {
    const validReports = reports.filter(
      (report) =>
        report.latitude !== null &&
        report.longitude !== null &&
        Number.isFinite(Number(report.latitude)) &&
        Number.isFinite(Number(report.longitude)),
    );

    if (validReports.length === 0) {
      return;
    }

    if (validReports.length === 1) {
      map.setView(
        [
          validReports[0].latitude!,
          validReports[0].longitude!,
        ],
        14,
      );

      return;
    }

    const bounds = L.latLngBounds(
      validReports.map((report) => [
        report.latitude!,
        report.longitude!,
      ]),
    );

    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 15,
    });
  }, [map, reports]);

  return null;
}

/* --------------------------------------------------
 * Severity
 * -------------------------------------------------- */

function getSeverityLabel(
  severity?: string | null,
) {
  switch (severity?.toLowerCase()) {
    case "critical":
    case "extreme":
      return {
        label: "Critical",
        className:
          "bg-red-100 text-red-700 border-red-200",
      };

    case "high":
    case "large":
      return {
        label: "High",
        className:
          "bg-orange-100 text-orange-700 border-orange-200",
      };

    case "medium":
      return {
        label: "Medium",
        className:
          "bg-yellow-100 text-yellow-700 border-yellow-200",
      };

    case "low":
    case "small":
    default:
      return {
        label: "Low",
        className:
          "bg-green-100 text-green-700 border-green-200",
      };
  }
}

/* --------------------------------------------------
 * Status formatting
 * -------------------------------------------------- */

function formatStatus(
  status?: string | null,
) {
  if (!status) {
    return "Submitted";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

/* --------------------------------------------------
 * Status color
 * -------------------------------------------------- */

function getStatusClass(
  status?: string | null,
) {
  switch (status) {
    case "resolved":
      return "bg-green-100 text-green-700";

    case "in_progress":
      return "bg-orange-100 text-orange-700";

    case "assigned":
      return "bg-purple-100 text-purple-700";

    case "ai_verified":
      return "bg-blue-100 text-blue-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

/* --------------------------------------------------
 * Community Map
 * -------------------------------------------------- */

export default function CommunityMap() {
  const [reports, setReports] =
    useState<Report[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ------------------------------------------------
   * Load reports
   * ------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getPublicReports();
console.log("MAP REPORTS:", data);
console.log(
  "RESOLVED:",
  data.filter((r: any) => r.status === "resolved")
);
        if (mounted) {
          setReports(data || []);
        }
      } catch (err: any) {
        console.error(
          "Community map error:",
          err,
        );

        if (mounted) {
          setError(
            err?.message ||
              "Could not load community reports.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReports();

    /* Refresh when returning to tab */
    const handleFocus = () => {
      loadReports();
    };

    window.addEventListener(
      "focus",
      handleFocus,
    );

    /* Refresh when page becomes visible */
    const handleVisibility = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        loadReports();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility,
    );

    /* Refresh every 10 seconds */
    const interval =
      window.setInterval(
        loadReports,
        10000,
      );

    return () => {
      mounted = false;

      window.removeEventListener(
        "focus",
        handleFocus,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility,
      );

      window.clearInterval(interval);
    };
  }, []);

  /* ------------------------------------------------
   * Only reports with coordinates appear on map
   * ------------------------------------------------ */

  const points = useMemo(
  () =>
    reports.filter(
      (report) =>
        report.status !== "resolved" &&
        report.latitude !== null &&
        report.longitude !== null &&
        Number.isFinite(Number(report.latitude)) &&
        Number.isFinite(Number(report.longitude)),
    ),
  [reports],
);

  /* ------------------------------------------------
   * Statistics
   * ------------------------------------------------ */

  const activeReports = reports.filter(
    (report) =>
      report.status !== "resolved",
  ).length;

  const resolvedReports = reports.filter(
    (report) =>
      report.status === "resolved",
  ).length;

  /* ------------------------------------------------
   * Default map center
   * ------------------------------------------------ */

  const defaultCenter: [
    number,
    number,
  ] = [12.9716, 77.5946];

  /* ------------------------------------------------
   * UI
   * ------------------------------------------------ */

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">

          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <MapIcon size={20} />
          </div>

          <div>
            <h1 className="text-2xl font-black">
              Community map
            </h1>

            <p className="text-sm text-muted-foreground">
              Explore cleanliness issues
              reported by the community.
            </p>
          </div>

        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">

        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">
            Total reports
          </p>

          <p className="mt-1 text-2xl font-black">
            {reports.length}
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">
            Mapped reports
          </p>

          <p className="mt-1 text-2xl font-black">
            {points.length}
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">
            Active issues
          </p>

          <p className="mt-1 text-2xl font-black">
            {activeReports}
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">
            Resolved
          </p>

          <p className="mt-1 text-2xl font-black text-green-600">
            {resolvedReports}
          </p>
        </div>

      </div>

      {/* Map */}
      <div className="glass-card-elevated overflow-hidden">

        {loading ? (
          <div className="grid h-[500px] place-items-center">
            <div className="text-center">

              <Loader2
                className="mx-auto animate-spin text-primary"
              />

              <p className="mt-3 text-sm text-muted-foreground">
                Loading community reports...
              </p>

            </div>
          </div>
        ) : error ? (
          <div className="grid h-[500px] place-items-center p-6 text-center">
            <div>

              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-600">
                <MapPin />
              </div>

              <h2 className="mt-4 font-bold">
                Couldn't load the map
              </h2>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {error}
              </p>

            </div>
          </div>
        ) : (
          <div className="relative">

            <MapContainer
              center={defaultCenter}
              zoom={11}
              scrollWheelZoom={true}
              className="h-[500px] w-full"
            >

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FitMapToReports
                reports={points}
              />

              {/* ALL mapped reports,
                  including resolved */}
              {points.map((report) => {
                const severity =
                  getSeverityLabel(
                    report.severity,
                  );

                return (
                  <Marker
                    key={report.id}
                    position={[
                      report.latitude!,
                      report.longitude!,
                    ]}
                    icon={markerIcon}
                  >

                    <Popup>

                      <div className="min-w-[230px] space-y-3">

                        <div>
                          <p className="font-bold capitalize">
                            {report.garbage_type ||
                              "Waste report"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {report.location_text ||
                              "Location unavailable"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">

                          <span
                            className={`rounded-full border px-2 py-1 text-[11px] font-bold ${severity.className}`}
                          >
                            {severity.label}
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusClass(
                              report.status,
                            )}`}
                          >
                            {formatStatus(
                              report.status,
                            )}
                          </span>

                        </div>

                        {report.status ===
                          "resolved" && (
                          <div className="rounded-lg bg-green-50 p-2 text-xs font-semibold text-green-700">
                            ✓ This issue has
                            been resolved.
                          </div>
                        )}

                        <p className="text-xs text-gray-500">
                          Reported by the CleanSnap
                          community.
                        </p>

                      </div>

                    </Popup>

                  </Marker>
                );
              })}

            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-[1000] rounded-2xl border bg-white/95 p-3 shadow-lg backdrop-blur">

              <p className="mb-2 text-xs font-bold">
                Severity
              </p>

              <div className="space-y-1.5 text-[11px]">

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  Low
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  Medium
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  High
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Critical
                </div>

              </div>

            </div>

            {/* Map count */}
            <div className="absolute right-4 top-4 z-[1000] rounded-full border bg-white/95 px-3 py-2 text-xs font-bold shadow-lg backdrop-blur">

              <Navigation
                size={13}
                className="mr-1 inline text-primary"
              />

              {points.length} mapped

            </div>

          </div>
        )}

      </div>

      {/* Reports list */}
      <div>

        <div className="mb-3 flex items-center justify-between">

          <div>
            <h2 className="font-black">
              Reported issues
            </h2>

            <p className="text-xs text-muted-foreground">
              Recent community reports with
              locations.
            </p>
          </div>

          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">
            {points.length}
          </span>

        </div>

        {points.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">

            {points
              .slice(0, 8)
              .map((report) => {
                const severity =
                  getSeverityLabel(
                    report.severity,
                  );

                return (
                  <div
                    key={report.id}
                    className="glass-card p-4 transition hover:-translate-y-0.5"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <p className="font-bold capitalize">
                          {report.garbage_type ||
                            "Waste"}
                        </p>

                        <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">

                          <MapPin
                            size={13}
                            className="mt-0.5 shrink-0"
                          />

                          <span>
                            {report.location_text ||
                              "Location"}
                          </span>

                        </p>

                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${severity.className}`}
                      >
                        {severity.label}
                      </span>

                    </div>

                    <div className="mt-3 flex items-center justify-between">

                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusClass(
                          report.status,
                        )}`}
                      >
                        {formatStatus(
                          report.status,
                        )}
                      </span>

                      {report.created_at && (
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(
                            report.created_at,
                          ).toLocaleDateString()}
                        </span>
                      )}

                    </div>

                  </div>
                );
              })}

          </div>
        ) : (
          <div className="glass-card p-8 text-center">

            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <MapPin />
            </div>

            <h3 className="mt-3 font-bold">
              No mapped reports yet
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Reports with a GPS or map
              location will appear here.
            </p>

          </div>
        )}

      </div>

    </div>
  );
}