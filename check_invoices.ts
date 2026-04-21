import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data: invoices, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(5);
    console.log("Error:", error);
    if (invoices) {
        for (const i of invoices) {
            console.log(`ID: ${i.id}, Created: ${i.created_at}, Status: ${i.status}, Amount: ${i.amount}, Paid: ${i.amount_paid}, PaidAt: ${i.paid_at}`);
            console.log(`Payment History:`, i.payment_history);
        }
    }
}
run();
