import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { chatText, clientName, createProject } = await req.json();

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openaiKey) throw new Error("Missing OPENAI_API_KEY");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing Supabase configuration");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const prompt = `Extrais les détails d'un projet de joaillerie à partir de cette conversation entre un agent et un client.
Retourne UNIQUEMENT un objet JSON avec ces clés :
- client_name (string, utilise "${clientName}" si non trouvé)
- jewel_type (string, ex: "Bague", "Collier", etc.)
- metal (string, ex: "Or Jaune 18k", "Platine", etc.)
- budget (nombre ou null)
- notes (string, détails spécifiques comme "saphir ovale", "style vintage")

Chat :
${chatText}`;

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu es un expert en joaillerie de luxe.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      }),
    });

    const aiData = await aiRes.json();
    if (aiData.error) throw new Error(aiRes.statusText || aiData.error.message);
    const extraction = JSON.parse(aiData.choices[0].message.content);

    if (createProject) {
      // 1. Find or Create Client
      let clientId;
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .ilike('full_name', extraction.client_name)
        .single();
      
      if (client) {
        clientId = client.id;
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert({ full_name: extraction.client_name, notes: 'Créé via Sales Sniper GHL' })
          .select()
          .single();
        if (clientErr) throw clientErr;
        clientId = newClient.id;
      }

      // 2. Create Project
      const { data: project, error: projErr } = await supabase
        .from('projects')
        .insert({
          title: `${extraction.client_name} - ${extraction.jewel_type}`,
          description: `Métal: ${extraction.metal}. Notes: ${extraction.notes}`,
          budget: extraction.budget,
          client_id: clientId,
          status: 'designing'
        })
        .select()
        .single();
      
      if (projErr) throw projErr;

      return new Response(JSON.stringify({ success: true, project_id: project.id, ...extraction }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify(extraction), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
