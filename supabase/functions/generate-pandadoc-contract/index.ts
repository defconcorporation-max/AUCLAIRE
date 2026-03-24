import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { projectId } = await req.json();

        if (!projectId) {
            throw new Error('projectId est requis');
        }

        // Initialize Supabase admin client to bypass RLS if needed, or use user's token
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Fetch project and client info
        const { data: project, error: projectError } = await supabaseClient
            .from('projects')
            .select('*, client:clients(full_name, email, phone)')
            .eq('id', projectId)
            .single();

        if (projectError || !project) {
            throw new Error('Projet introuvable');
        }

        const pandaDocApiKey = Deno.env.get('PANDADOC_API_KEY');

        if (!pandaDocApiKey) {
            throw new Error('Clé API PandaDoc manquante dans Supabase Secrets. Ajoutez PANDADOC_API_KEY pour procéder.');
        }

        // --- CONTRAT HTML GENERATION ---
        const clientName = project.client?.full_name || "Client";
        const clientEmail = project.client?.email || "client@example.com";
        const clientPhone = project.client?.phone || "";
        const projectTitle = project.title || "Bijou sur mesure";
        const price = `${project.financials?.selling_price || 0}$`;
        const dateStr = project.created_at ? new Date(project.created_at).toLocaleDateString('fr-CA') : new Date().toLocaleDateString('fr-CA');

        const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
        h1 { color: #6a5100; text-align: center; border-bottom: 2px solid #6a5100; padding-bottom: 20px; font-variant: small-caps; }
        h2 { color: #6a5100; border-bottom: 1px solid #eee; margin-top: 30px; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .detail-item { margin-bottom: 10px; }
        .label { font-weight: bold; color: #6a5100; }
        .footer { margin-top: 50px; border-top: 1px solid #6a5100; padding-top: 20px; font-size: 0.9em; text-align: center; color: #777; }
        .signature-sections { display: flex; justify-content: space-between; margin-top: 60px; gap: 40px; }
        .signature-box { flex: 1; border-top: 1px solid #333; padding-top: 10px; min-height: 120px; }
    </style>
</head>
<body>
    <h1>Contrat de Création de Bijou sur Mesure</h1>
    <p style="text-align: center;"><strong>Maison Auclaire</strong></p>

    <h2>1. IDENTIFICATION DES PARTIES</h2>
    <div class="details-grid">
        <div class="detail-item"><span class="label">Client :</span> ${clientName}</div>
        <div class="detail-item"><span class="label">Email :</span> ${clientEmail}</div>
        <div class="detail-item"><span class="label">Téléphone :</span> ${clientPhone}</div>
        <div class="detail-item"><span class="label">Entreprise :</span> Maison Auclaire</div>
    </div>

    <h2>2. DESCRIPTION DU PROJET</h2>
    <div class="detail-item"><span class="label">Projet :</span> ${projectTitle}</div>
    <div class="detail-item"><span class="label">Type de bijou :</span> ${project.jewelry_type || 'Sur mesure'}</div>
    <p><span class="label">Description :</span> ${project.description || 'Aucune description fournie'}</p>

    <h2>3. PRIX ET MODALITÉS DE PAIEMENT</h2>
    <p><span class="label">Prix total :</span> ${price}</p>
    <p>Le dépôt est requis pour lancer la production. Le dépôt est non remboursable. Étant donné qu’il s’agit d’un produit sur mesure, aucun remboursement n’est possible après le début de la production.</p>

    <h2>4. DÉLAIS DE PRODUCTION</h2>
    <p><span class="label">Date souhaitée :</span> ${project.deadline || 'Dès que possible'}</p>
    <p>Le client reconnaît que le délai de production est fourni à titre indicatif et peut varier en raison de la nature artisanale de la fabrication.</p>

    <h2>5. GARANTIE MAISON AUCLAIRE</h2>
    <p>Maison Auclaire s’engage à réparer sans frais toute défectuosité résultant d’une erreur de fabrication. Une garantie à vie est offerte sur les diamants contre les bris.</p>

    <h2>6. ACCEPTATION</h2>
    <p>En signant ce document, le client confirme avoir lu et compris les termes, accepte les conditions et valide les détails de la commande.</p>

    <div class="signature-sections">
        <div class="signature-box">
            <p><strong>Signature du Client</strong></p>
            <p>{signature:Client____________________}</p>
            <p>Date : ${dateStr}</p>
        </div>
        <div class="signature-box">
            <p><strong>Signature Maison Auclaire</strong></p>
            <p>{signature:Admin____________________}</p>
            <p>Date : ${dateStr}</p>
        </div>
    </div>

    <div class="footer">
        Maison Auclaire - Joaillerie d'Exception
    </div>
</body>
</html>
        `;

        // Create multipart body
        const formData = new FormData();
        const blob = new Blob([htmlContent], { type: 'text/html' });
        formData.append('file', blob, 'contrat.html');
        
        const dataJson = JSON.stringify({
            name: `Contrat Maison Auclaire - ${project.title}`,
            recipients: [
                {
                    email: clientEmail,
                    first_name: clientName,
                    role: "Client"
                }
            ],
            parse_form_fields: true
        });
        formData.append('data', dataJson);

        const response = await fetch('https://api.pandadoc.com/public/v1/documents', {
            method: 'POST',
            headers: {
                'Authorization': `API-Key ${pandaDocApiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Erreur PandaDoc: ${errBody}`);
        }

        const documentData = await response.json();

        // Update project with document ID
        await supabaseClient
            .from('projects')
            .update({ 
                pandadoc_contract_id: documentData.id,
                pandadoc_contract_status: documentData.status
            })
            .eq('id', projectId);

        return new Response(JSON.stringify({ success: true, documentId: documentData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
