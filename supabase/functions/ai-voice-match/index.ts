import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { transcript, questions } = await req.json()
    const apiKey = Deno.env.get("GEMINI_API_KEY")

    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY is not set!")
      return new Response(JSON.stringify({ error: "Missing API Key" }), { status: 500, headers: corsHeaders })
    }

    // System Prompt for Semantic Ranking
    const prompt = `
      You are an AI moderator for a live Q&A session.
      TRANSCRIPT OF SPEAKER: "${transcript}"
      PENDING QUESTIONS: ${JSON.stringify(questions)}

      TASK:
      1. Compare the transcript with the list of questions.
      2. Identify which questions the speaker is currently answering.
      3. Assign a confidence score from 0 to 10 (10 being an exact match/direct answer).
      4. Return the TOP 2 matches as an array.
      5. If the speaker is not answering any question or the transcript is too short/irrelevant, return an empty array [].

      OUTPUT FORMAT:
      Return ONLY a JSON object with the key "matches":
      {"matches": [{"id": "UUID", "score": 8}, {"id": "UUID", "score": 3}]}
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    })

    const result = await response.json()
    
    if (result.error) throw new Error(result.error.message);

    // Extract the AI text response
    const aiText = result.candidates[0].content.parts[0].text;
    
    return new Response(aiText, {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (err) {
    console.error("Function Error:", err.message)
    return new Response(JSON.stringify({ matches: [], error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    })
  }
})