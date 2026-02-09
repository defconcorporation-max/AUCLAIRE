import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPage() {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const runTests = async () => {
        setLogs([]);
        addLog("Starting Network Tests...");

        // Test 1: Simple Profile Fetch
        const t1 = performance.now();
        const { data: profiles, error: pError } = await supabase.from('profiles').select('id, role, full_name').limit(5);
        const t1_end = performance.now();
        addLog(`1. Fetch 5 Profiles: ${pError ? 'ERROR' : 'OK'} (${(t1_end - t1).toFixed(0)}ms)`);
        if (profiles) console.log("Profiles sample:", profiles);
        if (pError) addLog(`Error: ${pError.message}`);

        // Test 2: Fetch Projects
        const t2 = performance.now();
        const { data: projects, error: pjError } = await supabase.from('projects').select('id, status').limit(5);
        const t2_end = performance.now();
        addLog(`2. Fetch 5 Projects: ${pjError ? 'ERROR' : 'OK'} (${(t2_end - t2).toFixed(0)}ms)`);
        if (projects) console.log("Projects sample:", projects);

        // Test 3: Join Test (The suspect)
        const t3 = performance.now();
        const { data: joinData, error: jError } = await supabase
            .from('profiles')
            .select('id, projects(id)')
            .limit(2);
        const t3_end = performance.now();
        addLog(`3. Join Profiles->Projects (Limit 2): ${jError ? 'ERROR' : 'OK'} (${(t3_end - t3).toFixed(0)}ms)`);
        if (joinData) console.log("Join Data sample:", joinData);
        if (jError) addLog(`Error: ${jError.message}`);

        // Test 4: Expenses Join
        const t4 = performance.now();
        const { data: expData, error: eError } = await supabase
            .from('profiles')
            .select('id, expenses(id)')
            .limit(2);
        const t4_end = performance.now();
        addLog(`4. Join Profiles->Expenses (Limit 2): ${eError ? 'ERROR' : 'OK'} (${(t4_end - t4).toFixed(0)}ms)`);
        if (expData) console.log("Expense Data sample:", expData);
        if (eError) addLog(`Error: ${eError.message}`);
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>System Diagnostics</CardTitle>
                </CardHeader>
                <CardContent>
                    <button
                        onClick={runTests}
                        className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
                    >
                        Run Speed Test
                    </button>
                    <div className="bg-slate-950 text-green-400 p-4 rounded font-mono text-sm min-h-[300px]">
                        {logs.map((L, i) => <div key={i}>{L}</div>)}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
