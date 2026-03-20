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
    let searchUrl = `https://services.ghl.com/conversations/search?contactId=${contactId}`;
    if (locationId) searchUrl += `&locationId=${locationId}`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${ghlKey}`,
        'Version': '2021-04-15',
        'Accept': 'application/json'
      }
    });

    if (!searchRes.ok) {
      const err = await searchRes.text();
      console.error("GHL Search Error:", err);
      throw new Error(`GHL API Search Error: ${searchRes.statusText}`);
    }

    const searchData = await searchRes.json();
    const conversations = searchData.conversations || [];
    
    if (conversations.length === 0) {
      return new Response(JSON.stringify({ 
        summary: "Aucune conversation trouvée pour ce contact dans GoHighLevel.", 
        images: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const conversationId = conversations[0].id;
    console.log(`Found Conversation ID: ${conversationId}`);

    // 2. Fetch Messages
    const msgRes = await fetch(`https://services.ghl.com/conversations/${conversationId}/messages?limit=20`, {
      headers: {
        'Authorization': `Bearer ${ghlKey}`,
        'Version': '2021-04-15',
        'Accept': 'application/json'
      }
    });

    if (!msgRes.ok) throw new Error("Could not fetch messages from GHL");
    const msgData = await msgRes.json();
    const messages = msgData.messages || [];

    if (messages.length === 0) {
      return new Response(JSON.stringify({ 
        summary: "Conversation vide ou aucun message récent trouvé.", 
        images: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 3. Extract Text & Images
    let fullText = "";
    const images: string[] = [];
    
    // Process messages in chronological order (they are usually returned reverse chronologically)
    const sortedMessages = [...messages].reverse();

    for (const msg of sortedMessages) {
      const sender = msg.direction === 'inbound' ? 'Client' : 'Agent';
      const body = msg.body || "";
      if (body) fullText += `${sender}: ${body}\n`;

      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const attachment of msg.attachments) {
           if (attachment.url && (attachment.contentType?.includes('image') || attachment.url.match(/\.(jpg|jpeg|png|webp|gif)/i))) {
             images.push(attachment.url);
           }
        }
      }
    }

    // 4. Summarize with OpenAI
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu es un assistant expert en joaillerie de luxe. Résume la conversation suivante en 3-4 phrases courtes et élégantes. Concentre-toi sur les demandes du client et les prochaines étapes.' },
          { role: 'user', content: `Conversation :\n${fullText}` }
        ],
        temperature: 0.7,
      }),
    });

    const aiData = await aiRes.json();
    const summary = aiData.choices?.[0]?.message?.content || "Résumé non disponible.";

    return new Response(JSON.stringify({ 
      summary, 
      images: images.slice(-4) // Last 4 images
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
