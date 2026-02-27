import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const FB_VERIFY_TOKEN = Deno.env.get('FB_VERIFY_TOKEN')
const FB_PAGE_ACCESS_TOKEN = Deno.env.get('FB_PAGE_ACCESS_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

console.log("Edge Function 'facebook-webhook' initialized")

serve(async (req) => {
  const url = new URL(req.url)
  console.log(`>>> Incoming Request: ${req.method} ${url.pathname}`)

  // 1. Webhook Verification (GET request during setup)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    console.log(`Verification request: mode=${mode}, token=${token}`)

    if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED')
      return new Response(challenge, { status: 200 })
    } else {
      console.error('Forbidden: Verify token mismatch or missing')
      return new Response('Forbidden', { status: 403 })
    }
  }

  // 2. Lead Generation Webhook (POST request)
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      console.log("RAW WEBHOOK BODY:", JSON.stringify(body, null, 2))

      if (body.object === 'page') {
        for (const entry of body.entry) {
          if (!entry.changes) continue;

          for (const change of entry.changes) {
            console.log(`Processing change field: ${change.field}`)

            if (change.field === 'leadgen') {
              const leadgenId = change.value.leadgen_id
              const formId = change.value.form_id

              console.log(`New Lead detected: leadgen_id=${leadgenId}, form_id=${formId}`)

              let email = "test@example.com"
              let phone = "+123456789"
              let fullName = "Test Lead (Facebook)"

              // If it's a real numeric ID, try to fetch from Facebook
              if (/^\d+$/.test(leadgenId)) {
                console.log(`Fetching lead details for ID ${leadgenId}...`)
                try {
                  const fbResponse = await fetch(`https://graph.facebook.com/v18.0/${leadgenId}?access_token=${FB_PAGE_ACCESS_TOKEN}`)
                  const leadData = await fbResponse.json()
                  console.log("FB GRAPH API RESPONSE:", JSON.stringify(leadData, null, 2))

                  if (!leadData.error && leadData.field_data) {
                    leadData.field_data.forEach((field: any) => {
                      if (field.name === 'email') email = field.values[0]
                      if (field.name === 'phone_number') phone = field.values[0]
                      if (field.name === 'full_name') fullName = field.values[0]
                      if (field.name === 'first_name' && !fullName) fullName = field.values[0]
                      if (field.name === 'last_name' && fullName && !fullName.includes(field.values[0])) fullName += " " + field.values[0]
                    })
                  } else {
                    console.warn("FB API Error or no data, using placeholder for visibility.")
                    fullName = `FB Error Lead (${leadgenId})`
                  }
                } catch (err) {
                  console.error("Fetch failed:", err)
                  fullName = `Fetch Error Lead (${leadgenId})`
                }
              } else {
                console.log("Test/Manual ID detected, using placeholder data.")
                fullName = `Manual Test (${leadgenId})`
              }

              fullName = fullName.trim() || 'Facebook Lead'
              console.log(`Final Mapping -> Name: ${fullName}, Email: ${email}`)

              // Insert into database
              const { data, error } = await supabase
                .from('leads')
                .insert([{
                  name: fullName,
                  email: email,
                  phone: phone,
                  source: 'facebook',
                  status: 'new',
                  fb_leadgen_id: leadgenId,
                  notes: `Form ID: ${formId} (Log: ${new Date().toISOString()})`
                }])
                .select()

              if (error) {
                if (error.code === '23505') {
                  console.log(`Lead ${leadgenId} already exists.`)
                } else {
                  console.error("Supabase Error:", JSON.stringify(error))
                }
              } else {
                console.log(`✅ SUCCESS: Lead inserted.`, JSON.stringify(data))
              }
            }
          }
        }
        return new Response('EVENT_RECEIVED', { status: 200 })
      } else {
        return new Response('Handled', { status: 200 })
      }
    } catch (e: any) {
      console.error("CRITICAL ERROR:", e.message)
      return new Response('Error', { status: 500 })
    }
  }

  return new Response('Method Not Allowed', { status: 405 })
})
