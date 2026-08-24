import { supabase } from "@/integrations/supabase/client";
import type { Report } from "@/types";

export async function getMyReports(userId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Report[];
}

export async function getReport(id: string) {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as Report;
}

/*
 * Get ALL location-tagged community reports.
 *
 * Important:
 * We query `reports` directly instead of `community_reports`
 * so resolved reports remain visible on the community map.
 */
export async function getPublicReports() {
  const { data, error } = await supabase
    .from("community_reports")
    .select(
      "id, location_text, latitude, longitude, garbage_type, severity, status, created_at"
    )
    .order("created_at", {
      ascending: false,
    })
    .limit(200);

  if (error) throw error;

  return data ?? [];
}

export async function uploadReportImage(
  userId: string,
  file: File,
) {
  const ext =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() || "jpg";

  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("report-images")
    .upload(path, file, {
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("report-images")
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function analyzeImage(
  imageBase64: string,
) {
  const { data, error } =
    await supabase.functions.invoke(
      "analyze-garbage",
      {
        body: {
          imageBase64,
        },
      },
    );

  if (error) throw error;

  return data;
}

export async function createReport(input: {
  image_url: string | null;
  location_text: string;
  latitude: number | null;
  longitude: number | null;
  garbage_type: string;
  severity: string;
  ai_analysis: string;
  ai_confidence?: number | null;
}) {
  const { data, error } =
    await supabase.rpc("create_report", {
      p_image_url: input.image_url,
      p_location_text: input.location_text,
      p_latitude: input.latitude,
      p_longitude: input.longitude,
      p_garbage_type: input.garbage_type,
      p_severity: input.severity,
      p_ai_analysis: input.ai_analysis,
      p_ai_confidence:
        input.ai_confidence ?? null,
    });

  if (error) throw error;

  return data as string;
}

export async function getStatusHistory(
  reportId: string,
) {
  const { data, error } = await supabase
    .from("report_status_history")
    .select("*")
    .eq("report_id", reportId)
    .order("created_at", {
      ascending: true,
    });

  if (error) throw error;

  return data ?? [];
}

export async function getAdminReports() {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return (data ?? []) as Report[];
}

export async function updateReportStatus(
  id: string,
  status: string,
  comment = "",
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.rpc(
    "update_report_status",
    {
      p_report_id: id,
      p_status: status,
      p_comment: comment,
    },
  );

  if (error) throw error;
}