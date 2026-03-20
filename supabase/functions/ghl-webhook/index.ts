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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload = await req.json();

    // Log the request for debugging
    console.log("GHL Webhook Payload:", JSON.stringify(payload, null, 2));

    const taskData = payload.task || payload;
    const ghlId = taskData.id || taskData.task_id;
    const title = taskData.title || taskData.text || "Nouvelle tâche GHL";
    const description = taskData.description || taskData.body || "";
    const status = (taskData.status === 'completed' || taskData.completed) ? 'completed' : 'pending';
    const dueDate = taskData.dueDate || taskData.due_date || null;
    const assignedToEmail = taskData.assigned_to_email || taskData.user_email || null;
    const ghlUserId = taskData.assigned_to || taskData.user_id || null;

    let profileId = null;

    // 1. Try to find profile by ghl_user_id
    if (ghlUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('ghl_user_id', ghlUserId)
        .single();
      if (profile) profileId = profile.id;
    }

    // 2. Try to find profile by email if not found by ID
    if (!profileId && assignedToEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', assignedToEmail)
        .single();
      if (profile) {
        profileId = profile.id;
        // Optionally update the profile with the ghl_user_id for future matches
        if (ghlUserId) {
          await supabase.from('profiles').update({ ghl_user_id: ghlUserId }).eq('id', profileId);
        }
      }
    }

    // 3. Upsert Task
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .upsert({
        ghl_id: ghlId,
        title: title,
        description: description,
        status: status,
        due_date: dueDate,
        assigned_to: profileId,
        metadata: payload
      }, { onConflict: 'ghl_id' })
      .select()
      .single();

    if (taskErr) throw taskErr;

    return new Response(JSON.stringify({ success: true, task_id: task.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("GHL Webhook Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
