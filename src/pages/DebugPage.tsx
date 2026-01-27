import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Trash2, RefreshCw } from "lucide-react";

export default function DebugPage() {
    const [counts, setCounts] = useState({ clients: 0, projects: 0, invoices: 0 });
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]}: ${msg}`]);

    const fetchCounts = async () => {
        const { count: cCount } = await supabase.from('clients').select('*', { count: 'exact', head: true });
        const { count: pCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        const { count: iCount } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
        setCounts({
            clients: cCount || 0,
            projects: pCount || 0,
            invoices: iCount || 0
        });
        addLog(`Counts: ${cCount} clients, ${pCount} projects, ${iCount} invoices`);
    };

    useEffect(() => { fetchCounts(); }, []);

    const handleClearDatabase = async () => {
        if (!confirm("DANGER: This will delete ALL clients, projects, and invoices from the database. Are you sure?")) return;
        setLoading(true);
        addLog("Attempting to clear database...");

        try {
            // Delete in order due to constraints (if CASCADE is missing, this will show it)
            // If CASCADE is present, deleting clients is enough, but being explicit helps debug
            const { error: iErr } = await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (iErr) throw new Error(`Invoices Delete Failed: ${iErr.message}`);
            addLog("Invoices deleted.");

            const { error: pErr } = await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (pErr) throw new Error(`Projects Delete Failed: ${pErr.message}`);
            addLog("Projects deleted.");

            const { error: cErr } = await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (cErr) throw new Error(`Clients Delete Failed: ${cErr.message}`);
            addLog("Clients deleted.");

            addLog("SUCCESS: Database Cleared.");
            fetchCounts();
            alert("Database Cleared Successfully!");
        } catch (e: any) {
            addLog(`ERROR: ${e.message}`);
            console.error(e);
            alert(`Failed to clear DB: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestDeleteOne = async () => {
        setLoading(true);
        addLog("Testing single deletion...");
        try {
            // Find a random client to try deleting
            const { data, error } = await supabase.from('clients').select('id, full_name').limit(1).maybeSingle();
            if (error) throw new Error(`Fetch Error: ${error.message}`);
            if (!data) {
                addLog("No clients found to test delete.");
                setLoading(false);
                return;
            }

            if (!confirm(`Test deleting client '${data.full_name}'?`)) {
                setLoading(false);
                return;
            }

            const { error: delErr } = await supabase.from('clients').delete().eq('id', data.id);
            if (delErr) throw new Error(`Delete Error: ${delErr.message} (Code: ${delErr.code}) \nHint: ${delErr.hint}`);

            addLog(`SUCCESS: Deleted client '${data.full_name}'. Permissions seem OK.`);
            fetchCounts();

        } catch (e: any) {
            addLog(`DELETE FAILED: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-red-600 flex items-center gap-2">
                <AlertCircle /> Database Debugger
            </h1>

            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardHeader><CardTitle>Clients</CardTitle></CardHeader>
                    <CardContent className="text-4xl font-bold">{counts.clients}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
                    <CardContent className="text-4xl font-bold">{counts.projects}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
                    <CardContent className="text-4xl font-bold">{counts.invoices}</CardContent>
                </Card>
            </div>

            <Card className="border-red-200 bg-red-50">
                <CardHeader>
                    <CardTitle className="text-red-800">Dangerous Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <Button
                        variant="destructive"
                        onClick={handleClearDatabase}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Force clear ALL Data (Reset)
                    </Button>

                    <Button
                        variant="outline"
                        onClick={handleTestDeleteOne}
                        disabled={loading}
                    >
                        Test Delete One Client
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={fetchCounts}
                        disabled={loading}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Counts
                    </Button>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900 text-green-400 font-mono text-sm max-h-[300px] overflow-y-auto">
                <CardContent className="p-4 space-y-1">
                    {logs.length === 0 && <span className="opacity-50">Log output will appear here...</span>}
                    {logs.map((L, i) => <div key={i}>{L}</div>)}
                </CardContent>
            </Card>
        </div>
    );
}
