import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FacebookWebhookBody {
  object: string;
  entry: {
    messaging: {
      sender: { id: string };
      message: { text?: string; mid: string };
    }[];
  }[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { method } = req
  const url = new URL(req.url)

  // 1. HANDLE META WEBHOOK VERIFICATION (GET)
  if (method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    // You will set this same token in Meta Developer Portal
    const VERIFY_TOKEN = Deno.env.get('FB_VERIFY_TOKEN') || 'auclaire_secret_2026'

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED')
        return new Response(challenge, { status: 200 })
      } else {
        return new Response('Verification failed', { status: 403 })
      }
    }
  }

  // 2. HANDLE INCOMING MESSAGES (POST)
  if (method === 'POST') {
    try {
      const body = (await req.json()) as FacebookWebhookBody
      console.log('Incoming Webhook:', JSON.stringify(body, null, 2))

      if (body.object === 'page') {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        for (const entry of body.entry) {
          const messaging = entry.messaging[0]
          if (messaging && messaging.message) {
            const psid = messaging.sender.id
            const text = messaging.message.text
            const mid = messaging.message.mid

            if (!text) continue; // Ignore attachments for now to keep it simple

            // A. Find or Create Lead
            const { data: existingLead, error: leadError } = await supabase
              .from('leads')
              .select('id')
              .eq('fb_psid', psid)
              .single()

            let lead = existingLead

            if (!lead && !leadError) {
              // Create a new lead if not found
              const { data: newLead, error: createError } = await supabase
                .from('leads')
                .insert({
                  name: `Prospect Messenger ${psid.slice(-4)}`,
                  fb_psid: psid,
                  source: 'facebook',
                  status: 'new'
                })
                .select()
                .single()

              if (createError) throw createError
              lead = newLead
            }

            // B. Insert Message
            if (lead) {
              const { error: msgError } = await supabase
                .from('messages')
                .insert({
                  lead_id: lead.id,
                  content: text,
                  sender_type: 'lead',
                  platform: 'facebook',
                  fb_message_id: mid
                })

              if (msgError) console.error('Error inserting message:', msgError)
            }
          }
        }
        return new Response('EVENT_RECEIVED', { status: 200 })
      } else {
        return new Response('Not a page object', { status: 404 })
      }
    } catch (error) {
      console.error('Error processing webhook:', error)
      return new Response('Error', { status: 500 })
    }
  }

  return new Response('Not found', { status: 404 })
})
