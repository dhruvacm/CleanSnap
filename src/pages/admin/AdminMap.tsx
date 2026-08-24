import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Loader2,
  Navigation,
  RefreshCw,
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

import { getAdminReports } from "@/services/reports";
import { Button } from "@/components/ui/button";

const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

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

function FitMapToReports({
  reports,
}: {
  reports: Report[];
}) {
  const map = useMap();

  useEffect(() => {
    if (reports.length === 0) return;

    if (reports.length === 1) {
      map.setView(
        [
          reports[0].latitude!,
          reports[0].longitude!,
        ],
        15,
      );

      return;
    }

    const bounds = L.latLngBounds(
      reports.map((report) => [
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

function getSeverityStyle(
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

function formatStatus(status?: string | null) {
  if (!status) return "Submitted";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

export default function AdminMap() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminReports();

      setReports(data || []);
    } catch (err: any) {
      console.error("Admin map error:", err);

      setError(
        err?.message ||
          "Could not load reports.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const points = useMemo(
    () =>
      reports.filter(
        (report) =>
            report.status !== "resolved" &&
          report.latitude !== null &&
          report.longitude !== null &&
          Number.isFinite(
            Number(report.latitude),
          ) &&
          Number.isFinite(
            Number(report.longitude),
          ),
      ),
    [reports],
  );

  const defaultCenter: [
    number,
    number,
  ] = [12.9716, 77.5946];

  const unresolved = reports.filter(
    (report) =>
      report.status !== "resolved",
  ).length;

  const resolved = reports.filter(
    (report) =>
      report.status === "resolved",
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Navigation size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-black">
                Operations map
              </h1>

              <p className="text-sm text-muted-foreground">
                Location-tagged reports for
                municipal teams.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={loadReports}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <RefreshCw size={16} />
          )}

          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
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
            Active issues
          </p>

          <p className="mt-1 text-2xl font-black">
            {unresolved}
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">
            Resolved
          </p>

          <p className="mt-1 text-2xl font-black">
            {resolved}
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="glass-card-elevated overflow-hidden">
        {loading ? (
          <div className="grid h-[520px] place-items-center">
            <div className="text-center">
              <Loader2 className="mx-auto animate-spin text-primary" />

              <p className="mt-3 text-sm text-muted-foreground">
                Loading operations map...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="grid h-[520px] place-items-center p-6 text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-600">
                <MapPin />
              </div>

              <h2 className="mt-4 font-bold">
                Couldn't load reports
              </h2>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {error}
              </p>

              <Button
                onClick={loadReports}
                className="mt-4"
              >
                Try again
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <MapContainer
              center={defaultCenter}
              zoom={11}
              scrollWheelZoom
              className="h-[520px] w-full"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FitMapToReports
                reports={points}
              />

              {points.map((report) => (
                <Marker
                  key={report.id}
                  position={[
                    report.latitude!,
                    report.longitude!,
                  ]}
                  icon={markerIcon}
                >
                  <Popup>
                    <div className="min-w-[240px] space-y-3">
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
                          className={`rounded-full border px-2 py-1 text-[10px] font-bold ${getSeverityStyle(
                            report.severity,
                          )}`}
                        >
                          {report.severity ||
                            "low"}
                        </span>

                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-700">
                          {formatStatus(
                            report.status,
                          )}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500">
                        <p>
                          Latitude:{" "}
                          {report.latitude}
                        </p>

                        <p>
                          Longitude:{" "}
                          {report.longitude}
                        </p>
                      </div>

                      {report.created_at && (
                        <p className="text-[10px] text-gray-400">
                          Reported{" "}
                          {new Date(
                            report.created_at,
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Map overlay */}
            <div className="absolute left-4 top-4 z-[1000] rounded-2xl border bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
              <p className="text-xs font-bold">
                Operations Map
              </p>

              <p className="mt-1 text-[11px] text-gray-500">
                {points.length} mapped reports
              </p>
            </div>

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
          </div>
        )}
      </div>

      {/* Report list */}
      <div>
        <h2 className="font-black">
          Location-tagged reports
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          Click a marker on the map to inspect a
          report.
        </p>

        {points.length > 0 ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {points
              .slice(0, 10)
              .map((report) => (
                <div
                  key={report.id}
                  className="glass-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold capitalize">
                        {report.garbage_type ||
                          "Waste"}
                      </p>

                      <p className="mt-1 flex gap-1 text-xs text-muted-foreground">
                        <MapPin
                          size={13}
                          className="mt-0.5 shrink-0"
                        />

                        {report.location_text ||
                          "Location"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-bold ${getSeverityStyle(
                        report.severity,
                      )}`}
                    >
                      {report.severity ||
                        "low"}
                    </span>
                  </div>

                  <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
                    <span>
                      {formatStatus(
                        report.status,
                      )}
                    </span>

                    {report.created_at && (
                      <span>
                        {new Date(
                          report.created_at,
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="glass-card mt-3 p-8 text-center">
            <MapPin className="mx-auto text-muted-foreground" />

            <p className="mt-2 text-sm font-semibold">
              No location-tagged reports
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Reports with GPS or map locations
              will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}