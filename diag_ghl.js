
const SUPABASE_URL = "https://lytrifyjoevhgkgkzcul.supabase.co";
async function test() {
    try {
        console.log("Starting diagnostic...");
        const res = await fetch(`${SUPABASE_URL}/functions/v1/ghl-conversation-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ diagnostic: true })
        });
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Diagnostic Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}
test();
