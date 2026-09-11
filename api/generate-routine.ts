import type { VercelRequest, VercelResponse } from '@vercel/node';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

const SYSTEM_INSTRUCTION = `You are a professional personal trainer and fitness coach with expertise in strength training, muscle building, fat loss, mobility, and workout programming.

Create a personalized, realistic, balanced, and sustainable gym schedule from the user's profile. Avoid unnecessarily complicated exercises and include brief form cues. Ensure each muscle group receives appropriate recovery.

Return only valid JSON matching this shape:
{
  "title": "string",
  "description": "string",
  "days": [
    {
      "day": "monday",
      "focus": "string",
      "exercises": [
        {
          "name": "string",
          "sets": 1,
          "reps": "8-12",
          "restSeconds": 90,
          "formCues": ["string"]
        }
      ]
    }
  ]
}

Use only the requested number of available days. Keep each day to 4-8 exercises.`;

function parseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI routine generation is not configured' });

  const profile = req.body?.profile;
  if (!profile || !Array.isArray(profile.availableDays) || profile.availableDays.length < 1) {
    return res.status(400).json({ error: 'A training profile with available days is required' });
  }

  const prompt = `${SYSTEM_INSTRUCTION}\n\nUser profile:\n${JSON.stringify(profile)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ role: 'user', parts: [{ text: `Create the routine from this profile:\n${JSON.stringify(profile)}` }] }],
          generationConfig: {
            temperature: 0.35,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const message = await response.text();
      return res.status(response.status).json({ error: `Gemini request failed: ${message.slice(0, 300)}` });
    }

    const payload = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    const routine = parseJson(text);

    if (!routine || typeof routine !== 'object' || !Array.isArray((routine as { days?: unknown }).days)) {
      return res.status(502).json({ error: 'Gemini returned an invalid routine' });
    }

    return res.status(200).json({ routine, model: MODEL });
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : 'Could not generate routine',
    });
  }
}
