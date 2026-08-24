import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
}

interface AnalysisResult {
  detected: boolean;
  garbage_type: string;
  severity: "low" | "medium" | "high" | "critical";
  points: number;
  confidence: number;
  description: string;
  environmental_impact: string;
  recommended_action: string;
}

const getPoints = (severity: string): number => {
  switch (severity.toLowerCase()) {
    case "low":
      return 20;
    case "medium":
      return 50;
    case "high":
      return 100;
    case "critical":
      return 200;
    default:
      return 0;
  }
};

const normalizeSeverity = (
  severity: string,
): "low" | "medium" | "high" | "critical" => {
  const value = severity.toLowerCase().trim();

  if (value === "small" || value === "low") {
    return "low";
  }

  if (value === "medium") {
    return "medium";
  }

  if (value === "large" || value === "high") {
    return "high";
  }

  if (value === "extreme" || value === "critical") {
    return "critical";
  }

  return "low";
};

const extractJson = (text: string): string => {
  let cleaned = text.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.substring(start, end + 1);
  }

  return cleaned;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    const body = await req.json();
    const imageBase64 = body?.imageBase64;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(
        JSON.stringify({
          error: "No image provided",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY is not configured");

      return new Response(
        JSON.stringify({
          error: "AI service is not configured",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    let mimeType = "image/jpeg";
    let base64Data = imageBase64;

    const dataUrlMatch = imageBase64.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s,
    );

    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1];
      base64Data = dataUrlMatch[2];
    }

    const prompt = `
You are CleanSnap AI, an environmental waste detection system.

Analyze the provided image carefully.

Determine whether visible garbage or waste is present.

If garbage is present, identify:
- Type of garbage
- Severity
- Confidence
- Brief description
- Environmental impact
- Recommended action

Severity definitions:

LOW:
A few small items or minor littering.

MEDIUM:
Noticeable litter or a moderate amount of waste.

HIGH:
Large dumping, significant waste accumulation, or a large area affected.

CRITICAL:
Massive dumping, dangerous waste, hazardous material, or a serious environmental/public-health concern.

Return ONLY valid JSON.

Use exactly this structure:

{
  "detected": true,
  "garbage_type": "plastic waste",
  "severity": "low",
  "confidence": 0.95,
  "description": "Brief description",
  "environmental_impact": "Brief environmental impact",
  "recommended_action": "Recommended action"
}

If garbage is NOT visible:

{
  "detected": false,
  "garbage_type": "none",
  "severity": "low",
  "confidence": 0.95,
  "description": "No visible garbage detected.",
  "environmental_impact": "No significant waste impact detected.",
  "recommended_action": "No cleanup action required."
}

Confidence must be a number between 0 and 1.
`;

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();

      console.error(
        "Gemini API error:",
        geminiResponse.status,
        errorText,
      );

      if (geminiResponse.status === 429) {
        return new Response(
          JSON.stringify({
            error: "AI rate limit reached. Please try again later.",
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

      return new Response(
        JSON.stringify({
          error: "AI analysis failed",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const data: GeminiResponse = await geminiResponse.json();

    const generatedText =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    if (!generatedText) {
      throw new Error("Gemini returned an empty response");
    }

    const parsed = JSON.parse(extractJson(generatedText));

    const severity = normalizeSeverity(
      parsed.severity || "low",
    );

    const detected = Boolean(parsed.detected);

    const confidence = Math.min(
      1,
      Math.max(
        0,
        Number(parsed.confidence ?? 0),
      ),
    );

    const result: AnalysisResult = {
      detected,
      garbage_type: detected
        ? String(parsed.garbage_type || "Unknown waste")
        : "none",
      severity: detected ? severity : "low",
      points: detected ? getPoints(severity) : 0,
      confidence,
      description: String(
        parsed.description ||
          "Unable to generate a detailed description.",
      ),
      environmental_impact: String(
        parsed.environmental_impact ||
          "No environmental impact information available.",
      ),
      recommended_action: String(
        parsed.recommended_action ||
          "Follow appropriate waste disposal procedures.",
      ),
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("analyze-garbage error:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Unknown AI analysis error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});