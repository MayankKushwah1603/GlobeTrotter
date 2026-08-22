import type { TripDetail } from "./types";

export interface AIGeneratedActivity {
  dayDate: string;
  startTime: string;
  title: string;
  description: string;
  category:
    "Sightseeing" | "Food" | "Culture" | "Nature" | "Adventure" | "Entertainment" | "Shopping";
  durationMinutes: number;
  costUsd: number;
}

export interface AIGeneratedStop {
  cityName: string;
  country: string;
  startDate: string;
  endDate: string;
  notes: string;
  activities: AIGeneratedActivity[];
}

export interface AIGeneratedTrip {
  name: string;
  description: string;
  estimatedTotalCost: number;
  stops: AIGeneratedStop[];
}

export interface GenerateTripParams {
  destination: string;
  startDate: string;
  endDate: string;
  budget?: number | undefined;
  travelStyle?: string | undefined;
  pacing?: string | undefined;
  additionalNotes?: string | undefined;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export function getGeminiApiKey(): string {
  // Check localStorage first (user-configured in UI), fallback to Vite env
  const localKey =
    typeof window !== "undefined" ? localStorage.getItem("globetrotter_gemini_key") : null;
  if (localKey && localKey.trim()) return localKey.trim();
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  return envKey ? String(envKey).trim() : "";
}

export function setGeminiApiKey(key: string) {
  if (typeof window !== "undefined") {
    if (key) {
      localStorage.setItem("globetrotter_gemini_key", key.trim());
    } else {
      localStorage.removeItem("globetrotter_gemini_key");
    }
  }
}

async function callGeminiRest(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env or configure it in the AI settings.",
    );
  }

  // Primary model is gemini-3.6-flash with modern fallback support
  const models = ["gemini-3.6-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload: any = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        const message =
          errorJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(message);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response returned by Gemini AI.");
      return text;
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || "").toLowerCase();
      // If model not found, deprecated, or no longer available, loop to fallback model
      if (
        errMsg.includes("not found") ||
        errMsg.includes("404") ||
        errMsg.includes("no longer available") ||
        errMsg.includes("deprecated") ||
        errMsg.includes("not supported")
      ) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Failed to call Gemini AI API.");
}

/**
 * Clean and parse JSON returned from Gemini (handles markdown code fences)
 */
function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```[a-zA-Z]*\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
  }
  return cleaned;
}

/**
 * Generate a complete multi-stop or single-stop itinerary with structured day schedules and activities
 */
export async function generateAITripItinerary(
  params: GenerateTripParams,
): Promise<AIGeneratedTrip> {
  const systemInstruction = `You are a world-class travel planner and local concierge. You output strictly valid, RFC8259-compliant JSON matching the schema without any conversational preamble or markdown backticks outside of JSON. All monetary values and costs should be in Indian Rupees (INR / ₹).`;

  const prompt = `
Create an itinerary for the following trip request:
- Destination/Region: ${params.destination}
- Dates: from ${params.startDate} to ${params.endDate}
- Target Budget (INR ₹): ${params.budget ? `₹${params.budget}` : "Flexible / Moderate"}
- Travel Style: ${params.travelStyle || "Balanced (Culture, Food & Sights)"}
- Pacing: ${params.pacing || "Moderate (2-3 curated activities per day)"}
${params.additionalNotes ? `- Specific requests: ${params.additionalNotes}` : ""}

Return a JSON object with this exact structure:
{
  "name": "Catchy Trip Title (e.g. 5-Day Tokyo Food & Culture Quest)",
  "description": "2-3 sentences exciting summary of this itinerary.",
  "estimatedTotalCost": 50000,
  "stops": [
    {
      "cityName": "City Name (e.g. Tokyo)",
      "country": "Country Name (e.g. Japan)",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "notes": "Short neighborhood recommendation or travel tip",
      "activities": [
        {
          "dayDate": "YYYY-MM-DD",
          "startTime": "09:30",
          "title": "Activity Name",
          "description": "1-2 sentence description with tips",
          "category": "Sightseeing", // One of: "Sightseeing", "Food", "Culture", "Nature", "Adventure", "Entertainment", "Shopping"
          "durationMinutes": 120,
          "costUsd": 1500
        }
      ]
    }
  ]
}

Important Rules:
1. Ensure the dates in the stops and dayDate match the requested date range between ${params.startDate} and ${params.endDate}.
2. Provide 2-4 well-paced activities for each day that fit logically in geographical proximity.
3. Keep costs realistic in Indian Rupees (INR / ₹) for each activity (assigned to costUsd property).
4. Output raw JSON only.
`;

  const raw = await callGeminiRest(prompt, systemInstruction);
  try {
    const cleaned = cleanJsonText(raw);
    const parsed = JSON.parse(cleaned) as AIGeneratedTrip;
    return parsed;
  } catch (err: any) {
    throw new Error(
      `Failed to parse AI itinerary output: ${err.message}. Raw output: ${raw.slice(0, 200)}...`,
    );
  }
}

/**
 * Contextual Travel Co-Pilot chat assistant for trip details page
 */
export async function askAITravelAssistant(
  trip: TripDetail,
  userMessage: string,
  history: ChatMessage[] = [],
): Promise<string> {
  const stopSummary = trip.trip_stops
    .map(
      (s) =>
        `- ${s.city.name}, ${s.city.country} (${s.start_date} to ${s.end_date}): ${s.trip_activities.length} activities planned`,
    )
    .join("\n");

  const activityList = trip.trip_stops
    .flatMap((s) =>
      s.trip_activities.map(
        (a) => `[${a.day_date}] ${a.title} in ${s.city.name} (₹${a.cost_usd}, ${a.category})`,
      ),
    )
    .slice(0, 30)
    .join("\n");

  const systemInstruction = `You are "GlobeTrotter AI", a brilliant, knowledgeable, and concise personal travel assistant and co-pilot.
You have full context about the user's current trip:
- Trip Name: "${trip.name}"
- Dates: ${trip.start_date} to ${trip.end_date}
- Target Budget: ${trip.budget_limit ? `₹${trip.budget_limit}` : "Not set"}
- Stops:
${stopSummary || "No stops added yet."}
- Planned Activities:
${activityList || "No activities scheduled yet."}

Your job:
1. Answer the traveler's question with local tips, packing recommendations, rainy day options, food recommendations, transport navigation, or cultural etiquette.
2. Keep answers concise, actionable, friendly, and formatted nicely in markdown with bullet points and emojis.
3. If recommending new activities, suggest realistic times and approximate costs in Indian Rupees (₹).`;

  const conversation = history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Traveler" : "GlobeTrotter AI"}: ${m.content}`)
    .join("\n\n");

  const fullPrompt = `${conversation ? `${conversation}\n\n` : ""}Traveler: ${userMessage}\n\nGlobeTrotter AI:`;

  return await callGeminiRest(fullPrompt, systemInstruction);
}

/**
 * Suggest 3-5 smart activities for a specific city and theme
 */
export async function suggestCityActivities(
  cityName: string,
  country: string,
  travelStyle: string = "Must-see & local food",
): Promise<
  Array<{
    title: string;
    description: string;
    category:
      "Sightseeing" | "Food" | "Culture" | "Nature" | "Adventure" | "Entertainment" | "Shopping";
    durationMinutes: number;
    costUsd: number;
  }>
> {
  const prompt = `
Suggest 4 standout, high-quality activities to do in ${cityName}, ${country} focused on "${travelStyle}".
Include a mix of iconic highlights, local food spots, and hidden gems with realistic costs in Indian Rupees (INR / ₹).

Return strictly a JSON array of objects with this structure:
[
  {
    "title": "Short catchy title",
    "description": "1-2 sentences with insider tip",
    "category": "Food", // One of: "Sightseeing", "Food", "Culture", "Nature", "Adventure", "Entertainment", "Shopping"
    "durationMinutes": 90,
    "costUsd": 1200
  }
]
`;

  const systemInstruction = `You are a travel concierge who outputs strictly valid JSON arrays without markdown wrappers. Costs must be in Indian Rupees (INR / ₹).`;
  const raw = await callGeminiRest(prompt, systemInstruction);
  const cleaned = cleanJsonText(raw);
  return JSON.parse(cleaned);
}
