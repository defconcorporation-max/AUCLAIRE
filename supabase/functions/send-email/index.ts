import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const GMAIL_USER = Deno.env.get('GMAIL_USER')
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
            throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD secrets.");
        }

        const { to, subject, html } = await req.json();

        if (!to || !subject || !html) {
            throw new Error("Missing required fields: to, subject, html");
        }

        const client = new SMTPClient({
            connection: {
                hostname: "smtp.gmail.com",
                port: 465,
                tls: true,
                auth: {
                    username: GMAIL_USER,
                    password: GMAIL_APP_PASSWORD,
                },
            },
        });

        await client.send({
            from: GMAIL_USER,
            to: to,
            subject: subject,
            content: "auto",
            html: html,
        });

        await client.close();

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        })
    }
})
