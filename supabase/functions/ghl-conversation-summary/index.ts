import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { contactId, locationId } = await req.json();
    const ghlKey = Deno.env.get('GHL_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!ghlKey || !openaiKey) throw new Error("API Keys missing");

    console.log(`Summary Request: ${contactId} | Loc: ${locationId}`);

    // 1. Find Conversation
    let searchUrl = `https://services.leadconnectorhq.com/conversations/search?contactId=${contactId}`;
    if (locationId) searchUrl += `&locationId=${locationId}`;
    
    let searchRes = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${ghlKey}`, 'Version': '2021-04-15', 'Accept': 'application/json' }
    });

    if (!searchRes.ok) {
        searchRes = await fetch(`https://services.ghl.com/conversations/search?contactId=${contactId}${locationId ? `&locationId=${locationId}` : ''}`, {
           headers: { 'Authorization': `Bearer ${ghlKey}`, 'Version': '2021-04-15', 'Accept': 'application/json' }
        });
    }

    const searchData = await searchRes.json();
    const convId = searchData.conversations?.[0]?.id;
    
    if (!convId) {
      return new Response(JSON.stringify({ summary: "Conversation GHL non accessible.", images: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Fetch Large Batch (100 msgs)
    let msgRes = await fetch(`https://services.leadconnectorhq.com/conversations/${convId}/messages?limit=100`, {
      headers: { 'Authorization': `Bearer ${ghlKey}`, 'Version': '2021-04-15', 'Accept': 'application/json' }
    });

    if (!msgRes.ok) {
        msgRes = await fetch(`https://services.ghl.com/conversations/${convId}/messages?limit=100`, {
           headers: { 'Authorization': `Bearer ${ghlKey}`, 'Version': '2021-04-15', 'Accept': 'application/json' }
        });
    }

    const msgData = await msgRes.json();
    const messages = Array.isArray(msgData.messages) ? msgData.messages : [];
    console.log(`Fetched ${messages.length} messages from GHL.`);

    // 3. Robust Extraction
    let fullText = "";
    const images: string[] = [];
    const sorted = [...messages].reverse();

    for (const msg of sorted) {
      const role = msg.direction === 'inbound' ? 'CLIENT' : 'MAISON AUCLAIRE';
      const body = msg.body || "";
      if (body) fullText += `[${role}]: ${body}\n`;

      // Target EVERY possible attachment location
      const attSources = [
        msg.attachments, 
        msg.messageAttributes?.attachments,
        msg.messageAttributes?.mms_attachments,
        msg.metaData?.attachments
      ];

      for (const source of attSources) {
        if (Array.isArray(source)) {
          for (const item of source) {
            let url = "";
            if (typeof item === 'string') url = item;
            else if (item && typeof item === 'object') url = item.url || item.link || item.mediaUrl || item.media_url;

            if (url && url.startsWith('http')) {
               const isImg = url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|heic)/i) || 
                             (item.contentType?.includes('image')) ||
                             (item.type === 'image');
               if (isImg) images.push(url);
            }
          }
        }
      }
      
      // Inline Body Extraction
      const bodyMatches = body.match(/https?:\/\/[^\s]+?\.(jpg|jpeg|png|gif|webp|heic)(\?[^\s]*)?/gi);
      if (bodyMatches) images.push(...bodyMatches);
    }

    const finalImages = [...new Set(images)].slice(-15);
    console.log(`Found ${finalImages.length} images.`);

    // 4. Detailed AI Analysis (Fiche Technique)
    const prompt = `Tu es l'assistant IA de la Maison Auclaire, joaillerie de luxe. 
    Analyse la conversation ci-dessous et produis un rapport détaillé.
    SOIS PRÉCIS ET ÉLÉGANT. Si une information manque, écris "Non précisé".

    ### 💍 FICHE TECHNIQUE MÉTIER
    - **TYPE DE BIJOU** : [Ex: Bague de fiançailles, Solitaire, Alliance]
    - **MÉTAL PRÉCIEUX** : [Ex: Or Jaune 18k, Platine 950]
    - **PIERRES & GEMMES** : [Détail: Poids en carats, taille, type de pierre]
    - **STYLE & DESIGN** : [Résumé des envies esthétiques du client]
    - **MESURES** : [Taille de doigt, longueur chaine, etc]
    
    ### 📝 CONTEXTE CLIENT
    - **ÉVÉNEMENT** : [Pourquoi ce bijou ? Mariage, Cadeau, etc]
    - **BUDGET ÉVOQUÉ** : [Si mentionné]
    - **DÉLAIS SOUHAITÉS** : [Date limite si mentionnée]

    ### 🚀 ÉTAPE SUIVANTE
    - [Action concrète à réaliser par l'équipe]

    Conversation :
    ${fullText.slice(-9000)}`;

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });

    const aiData = await aiRes.json();
    const summary = aiData.choices?.[0]?.message?.content || "Erreur de génération.";

    return new Response(JSON.stringify({ summary, images: finalImages }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("Function Crash:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
