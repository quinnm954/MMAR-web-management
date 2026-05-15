import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const tool = {
  type: "function",
  function: {
    name: "extract_quote",
    description: "Extract structured quote/estimate data from the PDF.",
    parameters: {
      type: "object",
      properties: {
        customer_name: { type: "string" },
        customer_email: { type: "string" },
        customer_phone: { type: "string" },
        vehicle_year: { type: "number" },
        vehicle_make: { type: "string" },
        vehicle_model: { type: "string" },
        vehicle_vin: { type: "string" },
        notes: { type: "string" },
        line_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string", description: "What this line item is for. For labor lines, include the operation/job name (e.g. 'Replace front brake pads')." },
              quantity: { type: "number", description: "For parts: number of units. For labor: ALWAYS the number of billable LABOR HOURS (e.g. 1.5)." },
              unit_price: { type: "number", description: "For parts: price per unit. For labor: the hourly LABOR RATE (price per hour). Never put the line total here for labor lines." },
              labor_hours: { type: "number", description: "For labor lines, the billable labor hours. Should equal `quantity` when kind = 'labor'. Use 0 for parts/fees." },
              line_total: { type: "number", description: "Optional. The line subtotal as printed on the document (quantity × unit_price)." },
              kind: { type: "string", enum: ["part", "labor", "fee"], description: "Classify each line. Use 'labor' for any line that represents technician time, hours, labor charges, diagnostic time, or 'shop labor'. Use 'part' for parts/materials. Use 'fee' for shop supplies, hazmat, environmental, taxes, or other charges." },
            },
            required: ["description", "quantity", "unit_price", "kind"],
          },
        },
        labor_rate: { type: "number", description: "The default labor rate ($/hr) printed on the quote, if shown anywhere." },
      },
      required: ["line_items"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const { pdf_base64, mime_type } = await req.json();
    if (!pdf_base64) throw new Error("pdf_base64 required");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You extract auto-repair quote/estimate data from PDF documents. Return clean line items (parts, LABOR, fees), customer info, and vehicle info.\n\nCRITICAL labor rules:\n- Identify EVERY labor/time line on the quote — keywords: 'labor', 'hours', 'hrs', 'time', 'tech time', 'shop labor', 'diagnostic'.\n- For labor lines: set kind='labor', set quantity = labor hours, set unit_price = hourly labor rate, set labor_hours = same value as quantity.\n- Never collapse labor into a single dollar amount — always express it as hours × rate.\n- If only the labor TOTAL is shown and you can detect the shop's labor rate, derive hours = total / rate.\n- If a line clearly represents work performed but no hours are shown, still mark kind='labor' and set labor_hours / quantity to the best estimate (0 if truly unknown).\n\nUse numeric values (no $ signs). If a field is missing, omit it.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the quote details from this PDF." },
              {
                type: "image_url",
                image_url: { url: `data:${mime_type || "application/pdf"};base64,${pdf_base64}` },
              },
            ],
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "extract_quote" } },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway ${res.status}: ${txt}`);
    }

    const data = await res.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;
    if (!args) throw new Error("No structured output returned");

    // Log AI usage (estimated cost). Gemini 2.5 Flash ≈ $0.30/M input, $2.50/M output tokens.
    try {
      const usage = data?.usage || {};
      const pt = Number(usage.prompt_tokens || 0);
      const ct = Number(usage.completion_tokens || 0);
      const cost = (pt / 1_000_000) * 0.30 + (ct / 1_000_000) * 2.50;
      const SB_URL = Deno.env.get("SUPABASE_URL");
      const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (SB_URL && SB_KEY) {
        await fetch(`${SB_URL}/rest/v1/ai_usage_log`, {
          method: "POST",
          headers: {
            apikey: SB_KEY,
            Authorization: `Bearer ${SB_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            function_name: "parse-quote-pdf",
            model: "google/gemini-2.5-flash",
            cost_usd: Number(cost.toFixed(6)),
            prompt_tokens: pt,
            completion_tokens: ct,
          }),
        });
      }
    } catch (logErr) {
      console.warn("ai usage log failed", logErr);
    }

    return new Response(JSON.stringify({ extracted: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-quote-pdf error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
