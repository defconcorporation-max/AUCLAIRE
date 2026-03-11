import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const resendApiKey = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (!resendApiKey) {
            throw new Error("Missing RESEND_API_KEY inside Supabase Environment Variables.");
        }

        const { to, subject, html } = await req.json();

        if (!to || !subject || !html) {
            throw new Error("Missing required payload fields: 'to', 'subject', 'html'.");
        }

        // Call Resend API natively
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
                from: 'Auclaire CRM <notifications@your-domain.com>',
                to: [to],
                subject: subject,
                html: html,
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(JSON.stringify(data));
        }

        return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        })
    }
})
