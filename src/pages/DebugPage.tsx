import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPage() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const runTests = async () => {
        setLogs([]);
        addLog(t('debugPage.starting'));

        // Test 1: Simple Profile Fetch
        const t1 = performance.now();
        const { data: profiles, error: pError } = await supabase.from('profiles').select('id, role, full_name').limit(5);
        const t1_end = performance.now();
        addLog(t('debugPage.fetchProfiles', {
            result: pError ? t('debugPage.error') : t('debugPage.ok'),
            ms: (t1_end - t1).toFixed(0),
        }));
        if (profiles) console.log("Profiles sample:", profiles);
        if (pError) addLog(`${t('debugPage.errPrefix')} ${pError.message}`);

        // Test 2: Fetch Projects
        const t2 = performance.now();
        const { data: projects, error: pjError } = await supabase.from('projects').select('id, status').limit(5);
        const t2_end = performance.now();
        addLog(t('debugPage.fetchProjects', {
            result: pjError ? t('debugPage.error') : t('debugPage.ok'),
            ms: (t2_end - t2).toFixed(0),
        }));
        if (projects) console.log("Projects sample:", projects);

        // Test 3: Join Test (The suspect)
        const t3 = performance.now();
        const { data: joinData, error: jError } = await supabase
            .from('profiles')
            .select('id, projects(id)')
            .limit(2);
        const t3_end = performance.now();
        addLog(t('debugPage.joinProfiles', {
            result: jError ? t('debugPage.error') : t('debugPage.ok'),
            ms: (t3_end - t3).toFixed(0),
        }));
        if (joinData) console.log("Join Data sample:", joinData);
        if (jError) addLog(`${t('debugPage.errPrefix')} ${jError.message}`);

        // Test 4: Expenses Join
        const t4 = performance.now();
        const { data: expData, error: eError } = await supabase
            .from('profiles')
            .select('id, expenses(id)')
            .limit(2);
        const t4_end = performance.now();
        addLog(t('debugPage.joinExpenses', {
            result: eError ? t('debugPage.error') : t('debugPage.ok'),
            ms: (t4_end - t4).toFixed(0),
        }));
        if (expData) console.log("Expense Data sample:", expData);
        if (eError) addLog(`${t('debugPage.errPrefix')} ${eError.message}`);
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>{t('debugPage.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <button
                        type="button"
                        onClick={runTests}
                        className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
                    >
                        {t('debugPage.runTest')}
                    </button>
                    <div className="bg-slate-950 text-green-400 p-4 rounded font-mono text-sm min-h-[300px]">
                        {logs.map((L, i) => <div key={i}>{L}</div>)}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
