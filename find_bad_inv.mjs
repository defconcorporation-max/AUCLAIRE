import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://lytrifyjoevhgkgkzcul.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dHJpZnlqb2V2aGdrZ2t6Y3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDM3NDIsImV4cCI6MjA4NTAxOTc0Mn0.NxBhNpNl_Rziv022yPukbvPX304zQ3dEJS4jeCsCAIQ");

async function run() {
    const { data: projs, error } = await supabase.from("projects")
        .select("id, client_name, financials")
        .ilike("client_name", "%Alexandre%")
        .order("created_at", { ascending: false })
        .limit(5);
    
    const { data: projs2 } = await supabase.from("projects")
        .select("id, client_name, financials")
        .ilike("client_name", "%Jaremy%")
        .order("created_at", { ascending: false })
        .limit(5);

    console.log("Alex:", projs);
    console.log("Jaremy:", projs2);
}
run();
