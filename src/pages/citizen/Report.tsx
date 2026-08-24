import { useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  Upload,
  Sparkles,
  Map,
  Navigation,
  Pencil,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  analyzeImage,
  createReport,
  uploadReportImage,
} from "@/services/reports";
import { toast } from "sonner";

/* Fix Leaflet marker icons */
const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/* Location returned by reverse geocoding */
interface LocationResult {
  displayName: string;
  latitude: number;
  longitude: number;
}

/* Map click handler */
function MapLocationPicker({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

/* Reverse geocode coordinates into a human-readable location */
async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    );

    if (!response.ok) {
      throw new Error("Could not find location name");
    }

    const data = await response.json();

    const parts = [
      data.city,
      data.locality,
      data.principalSubdivision,
      data.countryName,
    ].filter(Boolean);

    const uniqueParts = [...new Set(parts)];

    if (uniqueParts.length > 0) {
      return uniqueParts.join(", ");
    }

    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function Report() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);

  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);

  const [locationMode, setLocationMode] = useState<
    "none" | "current" | "map" | "manual"
  >("none");

  const [locationLoading, setLocationLoading] = useState(false);

  function selectFile(f?: File) {
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setAnalysis(null);
    setStep(1);
  }

  async function analyze() {
    if (!file) return;

    setBusy(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;

        reader.readAsDataURL(file);
      });

      const result = await analyzeImage(base64);

      if (!result?.detected) {
        toast.error(
          "No clear garbage was detected. Please use a clearer photo.",
        );
        return;
      }

      setAnalysis(result);
      setStep(2);

      toast.success("AI verification complete");
    } catch (error: any) {
      toast.error(error.message || "AI analysis failed");
    } finally {
      setBusy(false);
    }
  }

  /*
   * Use the browser's current location.
   */
  function locateCurrent() {
    if (!navigator.geolocation) {
      toast.error("Location is not supported by this browser.");
      setLocationMode("manual");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = Number(
            position.coords.latitude.toFixed(6),
          );

          const lng = Number(
            position.coords.longitude.toFixed(6),
          );

          setCoords({
            lat,
            lng,
          });

          const locationName = await reverseGeocode(lat, lng);

          setLocation(locationName);
          setLocationMode("current");

          toast.success(`Location detected: ${locationName}`);
        } catch {
          toast.error(
            "Could not convert your coordinates into a location name.",
          );
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);

        setLocationLoading(false);
        setLocationMode("manual");

        if (error.code === error.PERMISSION_DENIED) {
          toast.error(
            "Location permission was denied. You can select a location on the map or enter it manually.",
          );
        } else if (error.code === error.TIMEOUT) {
          toast.error(
            "Location request timed out. Try again or select the location on the map.",
          );
        } else {
          toast.error(
            "Unable to detect your location. You can select it on the map.",
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  /*
   * User selects a location on the map.
   */
  async function selectMapLocation(
    lat: number,
    lng: number,
  ) {
    setLocationLoading(true);

    try {
      const roundedLat = Number(lat.toFixed(6));
      const roundedLng = Number(lng.toFixed(6));

      setCoords({
        lat: roundedLat,
        lng: roundedLng,
      });

      const locationName = await reverseGeocode(
        roundedLat,
        roundedLng,
      );

      setLocation(locationName);
      setLocationMode("map");

      toast.success(`Location selected: ${locationName}`);
    } catch {
      toast.error("Could not identify this location.");
    } finally {
      setLocationLoading(false);
    }
  }

  /*
   * Manual location.
   */
  function useManualLocation() {
    setLocationMode("manual");
    setCoords(null);
    setLocation("");
  }

  async function submit() {
    if (
      !user ||
      !file ||
      !analysis ||
      !location.trim()
    ) {
      toast.error("Please complete all required fields.");
      return;
    }

    setBusy(true);

    try {
      const imageUrl = await uploadReportImage(
        user.id,
        file,
      );

      const id = await createReport({
        image_url: imageUrl,
        location_text: location,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        garbage_type: analysis.garbage_type,
        severity: analysis.severity,
        ai_analysis: analysis.description,
        ai_confidence:
          analysis.confidence ?? null,
      });

      setStep(5);

      toast.success(
        "Report submitted successfully",
      );

      setTimeout(() => {
        navigate(`/reports/${id}`);
      }, 900);
    } catch (error: any) {
      toast.error(
        error.message ||
          "Could not submit report",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard">
          <Button
            variant="ghost"
            size="icon"
          >
            <ArrowLeft />
          </Button>
        </Link>

        <div>
          <h1 className="text-2xl font-black">
            Report an issue
          </h1>

          <p className="text-sm text-muted-foreground">
            AI verifies the image before submission.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[
          "Photo",
          "AI check",
          "Location",
          "Review",
          "Submit",
        ].map((label, index) => (
          <div
            key={label}
            className="flex flex-1 items-center gap-2"
          >
            <div
              className={`h-2 flex-1 rounded-full ${
                step > index
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />

            <span className="hidden text-[10px] text-muted-foreground sm:block">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1 — PHOTO */}
      {step === 1 && (
        <div className="glass-card-elevated p-6">
          <div
            className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center"
            onClick={() =>
              inputRef.current?.click()
            }
          >
            {preview ? (
              <img
                src={preview}
                className="mb-4 max-h-72 rounded-2xl object-contain"
                alt="Selected report"
              />
            ) : (
              <>
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Upload />
                </div>

                <h2 className="mt-4 font-bold">
                  Upload a cleanliness photo
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Take a photo or choose one from
                  your gallery.
                </p>
              </>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) =>
                selectFile(
                  event.target.files?.[0],
                )
              }
            />
          </div>

          {file && (
            <Button
              disabled={busy}
              onClick={analyze}
              className="mt-4 w-full gradient-hero border-0 gap-2"
            >
              {busy ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles size={17} />
              )}

              Analyze with AI
            </Button>
          )}
        </div>
      )}

      {/* STEP 2 — AI */}
      {step === 2 && analysis && (
        <div className="glass-card-elevated p-6">
          <img
            src={preview}
            className="h-56 w-full rounded-2xl object-cover"
            alt="Report"
          />

          <div className="mt-5 flex items-center gap-2 text-primary">
            <CheckCircle2 />

            <span className="font-bold">
              Garbage detected and verified
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground">
                Type
              </p>

              <p className="mt-1 font-bold capitalize">
                {analysis.garbage_type}
              </p>
            </div>

            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground">
                Severity
              </p>

              <p className="mt-1 font-bold capitalize">
                {analysis.severity}
              </p>
            </div>

            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground">
                Confidence
              </p>

              <p className="mt-1 font-bold">
                {analysis.confidence != null
                  ? `${Math.round(
                      analysis.confidence *
                        100,
                    )}%`
                  : "AI verified"}
              </p>
            </div>

            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground">
                Points
              </p>

              <p className="mt-1 font-bold text-primary">
                {analysis.points ?? "Earned"} points
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {analysis.description}
          </p>

          {analysis.environmental_impact && (
            <div className="mt-4 rounded-2xl bg-primary/5 p-4">
              <p className="text-xs font-semibold text-primary">
                Environmental impact
              </p>

              <p className="mt-1 text-sm">
                {analysis.environmental_impact}
              </p>
            </div>
          )}

          {analysis.recommended_action && (
            <div className="mt-3 rounded-2xl bg-secondary p-4">
              <p className="text-xs font-semibold">
                Recommended action
              </p>

              <p className="mt-1 text-sm">
                {analysis.recommended_action}
              </p>
            </div>
          )}

          <Button
            onClick={() => {
              setStep(3);
              setLocationMode("none");
            }}
            className="mt-5 w-full gradient-hero border-0 gap-2"
          >
            <MapPin size={17} />
            Add location
          </Button>
        </div>
      )}

      {/* STEP 3 — LOCATION */}
      {step === 3 && (
        <div className="glass-card-elevated p-6">
          <div className="flex items-center gap-2 font-bold">
            <MapPin className="text-primary" />
            Where is the issue?
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Choose the location using GPS, a map, or
            enter it manually.
          </p>

          {/* Location options */}
          {locationMode === "none" && (
            <div className="mt-5 grid gap-3">
              <Button
                onClick={locateCurrent}
                disabled={locationLoading}
                variant="outline"
                className="h-auto justify-start gap-4 p-4"
              >
                {locationLoading ? (
                  <Loader2 className="animate-spin text-primary" />
                ) : (
                  <Navigation className="text-primary" />
                )}

                <span className="text-left">
                  <span className="block font-bold">
                    Use current location
                  </span>

                  <span className="text-xs text-muted-foreground">
                    Detect your location using GPS
                  </span>
                </span>
              </Button>

              <Button
                onClick={() =>
                  setLocationMode("map")
                }
                variant="outline"
                className="h-auto justify-start gap-4 p-4"
              >
                <Map className="text-primary" />

                <span className="text-left">
                  <span className="block font-bold">
                    Select on map
                  </span>

                  <span className="text-xs text-muted-foreground">
                    Pick the exact location manually
                  </span>
                </span>
              </Button>

              <Button
                onClick={useManualLocation}
                variant="outline"
                className="h-auto justify-start gap-4 p-4"
              >
                <Pencil className="text-primary" />

                <span className="text-left">
                  <span className="block font-bold">
                    Enter manually
                  </span>

                  <span className="text-xs text-muted-foreground">
                    Enter a landmark or location name
                  </span>
                </span>
              </Button>
            </div>
          )}

          {/* CURRENT LOCATION */}
          {locationMode === "current" && (
            <div className="mt-5">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <MapPin size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Current location
                    </p>

                    <p className="mt-1 font-bold">
                      {location}
                    </p>

                    {coords && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        GPS: {coords.lat},{" "}
                        {coords.lng}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={locateCurrent}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <Loader2 className="mr-2 animate-spin" />
                  ) : (
                    <Navigation className="mr-2" />
                  )}
                  Try Again
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    setLocationMode("map")
                  }
                >
                  <Map className="mr-2" />
                  Change
                </Button>
              </div>

              <Button
                onClick={() => setStep(4)}
                className="mt-3 w-full gradient-hero border-0"
              >
                Confirm Location
              </Button>
            </div>
          )}

          {/* MAP */}
          {locationMode === "map" && (
            <div className="mt-5">
              <div className="overflow-hidden rounded-2xl border">
                <MapContainer
                  center={
                    coords
                      ? [
                          coords.lat,
                          coords.lng,
                        ]
                      : [
                          12.9716,
                          77.5946,
                        ]
                  }
                  zoom={coords ? 15 : 7}
                  scrollWheelZoom={true}
                  className="h-[380px] w-full"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapLocationPicker
                    onSelect={
                      selectMapLocation
                    }
                  />

                  {coords && (
                    <Marker
                      position={[
                        coords.lat,
                        coords.lng,
                      ]}
                      icon={markerIcon}
                    />
                  )}
                </MapContainer>
              </div>

              <div className="mt-3 rounded-2xl bg-secondary p-4">
                <p className="text-xs text-muted-foreground">
                  {coords
                    ? "Selected location"
                    : "Tap anywhere on the map to select the issue location."}
                </p>

                {location && (
                  <p className="mt-1 font-bold">
                    📍 {location}
                  </p>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    setLocationMode("none")
                  }
                >
                  Back
                </Button>

                <Button
                  disabled={
                    !coords ||
                    !location ||
                    locationLoading
                  }
                  onClick={() => setStep(4)}
                  className="gradient-hero border-0"
                >
                  {locationLoading ? (
                    <Loader2 className="mr-2 animate-spin" />
                  ) : null}
                  Confirm Location
                </Button>
              </div>
            </div>
          )}

          {/* MANUAL */}
          {locationMode === "manual" && (
            <div className="mt-5">
              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-sm font-semibold">
                  Enter the location
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Example: PES College of Engineering,
                  Mandya
                </p>
              </div>

              <Input
                className="mt-3"
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value,
                  )
                }
                placeholder="Location, landmark, street..."
              />

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    setLocationMode("none")
                  }
                >
                  Back
                </Button>

                <Button
                  disabled={!location.trim()}
                  onClick={() => setStep(4)}
                  className="gradient-hero border-0"
                >
                  Confirm Location
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4 — REVIEW */}
      {step === 4 && analysis && (
        <div className="glass-card-elevated p-6">
          <h2 className="text-xl font-black">
            Review & submit
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
            <img
              src={preview}
              className="h-36 w-full rounded-2xl object-cover"
              alt="Report"
            />

            <div>
              <p className="font-bold capitalize">
                {analysis.garbage_type}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Severity:{" "}
                <span className="font-semibold capitalize text-foreground">
                  {analysis.severity}
                </span>
              </p>

              <p className="mt-2 text-sm">
                📍{" "}
                <span className="font-semibold">
                  {location}
                </span>
              </p>

              {coords && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Location coordinates saved for
                  community map.
                </p>
              )}

              <p className="mt-3 text-sm">
                {analysis.description}
              </p>
            </div>
          </div>

          <Button
            onClick={submit}
            disabled={busy}
            className="mt-5 w-full gradient-hero border-0"
          >
            {busy ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Submit report"
            )}
          </Button>
        </div>
      )}

      {/* STEP 5 — SUCCESS */}
      {step === 5 && (
        <div className="glass-card-elevated p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 size={34} />
          </div>

          <h2 className="mt-5 text-2xl font-black">
            Report submitted!
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Your report has been successfully added
            to CleanSnap.
          </p>

          <Loader2 className="mx-auto mt-5 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}