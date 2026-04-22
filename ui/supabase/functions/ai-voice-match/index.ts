import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Ensure Methods are listed
}

serve(async (req: Request) => {
  // 1. Handle Preflight (The browser asks: "Can I talk to you?")
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, // Explicitly set 200 OK
      headers: corsHeaders 
    })
  }

  try {
    // 2. Wrap the rest of your logic in a Try-Catch to prevent crashes
    const { transcript, questions } = await req.json()
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")

    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY secret")
    }

    // ... Your Gemini fetch logic ...

    return new Response(JSON.stringify({ matchedId: null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // 3. Return CORS headers even on error!
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})