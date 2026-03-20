import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { contactId, locationId } = await req.json();
    const ghlKey = Deno.env.get('GHL_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!ghlKey) throw new Error("GHL_API_KEY is not configured");
    if (!openaiKey) throw new Error("OPENAI_API_KEY is not configured");

    console.log(`Analyzing conversation for Contact: ${contactId}, Location: ${locationId}`);

    // 1. Search for conversation
    let searchUrl = `https://services.leadconnectorhq.com/conversations/search?contactId=${contactId}`;
    if (locationId) searchUrl += `&locationId=${locationId}`;

    let searchRes = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${ghlKey}`, 'Version': '2021-04-15', 'Accept': 'application/json' }
    });

    if (!searchRes.ok) {
        console.warn(`LeadConnector Search failed (${searchRes.status}). Trying fallback...`);
        searchUrl = `https://services.ghl.com/conversations/search?contactId=${contactId}`;
        if (locationId) searchUrl += `&locationId=${locationId}`;
        searchRes = await fetch(searchUrl, {
           headers: { 'Authorization': `Bearer ${ghlKey}`, 'Version': '2021-04-15', 'Accept': 'application/json' }
        });
    }

    if (!searchRes.ok) {
      const errTxt = await searchRes.text();
      throw new Error(`GHL Search Error (${searchRes.status}): ${errTxt}`);
    }

    const searchData = await searchRes.json();
    const conversations = searchData.conversations || [];
    
    if (conversations.length === 0) {
      return new Response(JSON.stringify({ summary: "Aucune conversation trouvée.", images: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const conversationId = conversations[0].id;

    // 2. Fetch Messages
    let msgUrl = `https://services.leadconnectorhq.com/conversations/${conversationId}/messages?limit=100`;
    let msgRes = await fetch(msgUrl, {
      headers: { 'Authorization': `Bearer ${ghlKey}`, 'Version': '2021-04-15', 'Accept': 'application/json' }
    });

    if (!msgRes.ok) {
        msgUrl = `https://services.ghl.com/conversations/${conversationId}/messages?limit=100`;
        msgRes = await fetch(msgUrl, {
           headers: { 'Authorization': `Bearer ${ghlKey}`, 'Version': '2021-04-15', 'Accept': 'application/json' }
        });
    }

    const msgData = await msgRes.json();
    const messages = Array.isArray(msgData.messages) ? msgData.messages : [];

    // 3. Extract Text & Images
    let fullText = "";
    const images: string[] = [];
    const sortedMessages = [...messages].reverse();

    for (const msg of sortedMessages) {
      const sender = msg.direction === 'inbound' ? 'Client' : 'Agent';
      const body = msg.body || "";
      if (body) fullText += `${sender}: ${body}\n`;

      const atts = msg.attachments || msg.messageAttributes?.attachments || [];
      if (Array.isArray(atts)) {
        for (const attachment of atts) {
           const url = attachment.url || attachment.link;
           if (url) {
             const isImage = (attachment.contentType?.includes('image')) || 
                             (url.match(/\.(jpg|jpeg|png|webp|gif|heic)/i)) ||
                             (attachment.type === 'image');
             if (isImage) images.push(url);
           }
        }
      }
      const matches = body.match(/https?:\/\/[^\s]+?\.(jpg|jpeg|png|gif|webp|heic)(\?[^\s]*)?/gi);
      if (matches) images.push(...matches);
    }

    const uniqueImages = [...new Set(images)].slice(-20);

    // 4. Summarize with OpenAI
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Assistant Joaillerie Auclaire. Génère une FICHE TECHNIQUE.' },
          { role: 'user', content: `Conversation :\n${fullText.slice(-8000)}` }
        ],
        temperature: 0.2,
      }),
    });

    const aiData = await aiRes.json();
    return new Response(JSON.stringify({ 
      summary: aiData.choices?.[0]?.message?.content || "Résumé indisponible.", 
      images: uniqueImages 
    }), {
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
