import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { GraduationCap, BarChart2, AlertCircle, Search, CheckCircle2, ChevronDown, ChevronRight, BookOpen, Diamond } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { qcmProcessus, qcmExpertise } from '../../data/qcmData';

type FormationResult = {
    id: string;
    salesperson_name: string;
    score_processus: number;
    score_expertise: number;
    total_score: number;
    answers_processus: Record<number, number>;
    answers_expertise: Record<number, number>;
    created_at: string;
};

export default function AdminQcmResults() {
    const { t, i18n } = useTranslation();
    const localeTag = i18n.language?.startsWith('fr') ? 'fr-CA' : 'en-CA';
    const [results, setResults] = useState<FormationResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const getWrongAnswersProcessus = (answers: Record<number, number>) => {
        return qcmProcessus.filter(q => answers[q.id] !== q.correctAnswer).map(q => ({
            question: q.question,
            expected: q.options[q.correctAnswer],
            given: q.options[answers[q.id]] ?? t('adminQcmPage.notAnswered')
        }));
    };

    const getWrongAnswersExpertise = (answers: Record<number, number>) => {
        return qcmExpertise.filter(q => answers[q.id] !== q.correctAnswer).map(q => ({
            question: q.question,
            expected: q.options[q.correctAnswer],
            given: q.options[answers[q.id]] ?? t('adminQcmPage.notAnswered')
        }));
    };

    const fetchResults = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('formation_results')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setResults(data || []);
        } catch (error) {
            console.error('Error fetching QCM results:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResults();
    }, []);

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredResults = results.filter(r =>
        r.salesperson_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-serif text-luxury-gold tracking-widest uppercase mb-2">{t('adminQcmPage.title')}</h1>
                    <p className="text-gray-400">{t('adminQcmPage.subtitle')}</p>
                </div>
                <Button onClick={fetchResults} variant="outline" className="border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold hover:text-black">
                    {t('adminQcmPage.refresh')}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-luxury-gold" /> {t('adminQcmPage.statTotal')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-white">{results.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-luxury-gold" /> {t('adminQcmPage.statAvgProcess')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-white">
                            {results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.score_processus, 0) / results.length) : 0}
                            <span className="text-lg text-gray-500 ml-2">/ 100</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Diamond className="w-4 h-4 text-luxury-gold" /> {t('adminQcmPage.statAvgExpertise')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-white">
                            {results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.score_expertise, 0) / results.length) : 0}
                            <span className="text-lg text-gray-500 ml-2">/ 100</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
                <div className="p-4 border-b border-white/10 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder={t('adminQcmPage.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-black/40 border-white/10 focus:border-luxury-gold text-white"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-400">{t('adminQcmPage.loading')}</div>
                ) : filteredResults.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                        <p>{t('adminQcmPage.empty')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/10">
                        {filteredResults.map((result) => {
                            const wrongProc = getWrongAnswersProcessus(result.answers_processus);
                            const wrongExp = getWrongAnswersExpertise(result.answers_expertise);
                            const totalErrors = wrongProc.length + wrongExp.length;
                            const isExpanded = expandedRows[result.id];

                            return (
                                <div key={result.id} className="group">
                                    <div
                                        className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
                                        onClick={() => toggleRow(result.id)}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-10 flex justify-center">
                                                {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white text-lg">{result.salesperson_name}</p>
                                                <p className="text-xs text-gray-500">{new Date(result.created_at).toLocaleString(localeTag)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{t('adminQcmPage.colProcess')}</p>
                                                <Badge variant={result.score_processus >= 80 ? 'default' : result.score_processus >= 50 ? 'secondary' : 'destructive'}
                                                    className={result.score_processus >= 80 ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}>
                                                    {result.score_processus}/100
                                                </Badge>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{t('adminQcmPage.colExpertise')}</p>
                                                <Badge variant={result.score_expertise >= 80 ? 'default' : result.score_expertise >= 50 ? 'secondary' : 'destructive'}
                                                    className={result.score_expertise >= 80 ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}>
                                                    {result.score_expertise}/100
                                                </Badge>
                                            </div>
                                            <div className="text-center w-24">
                                                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{t('adminQcmPage.colTotal')}</p>
                                                <div className="font-serif text-xl border-l border-white/10 pl-4">
                                                    <span className={result.total_score >= 160 ? 'text-luxury-gold' : 'text-white'}>{result.total_score}</span>
                                                    <span className="text-xs text-gray-500">/200</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="bg-black/40 p-6 border-t border-white/5 animate-in slide-in-from-top-2">
                                            <h4 className="text-luxury-gold font-serif mb-6 text-xl flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5" /> {t('adminQcmPage.gapTitle', { count: totalErrors })}
                                            </h4>

                                            {totalErrors === 0 ? (
                                                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-3">
                                                    <CheckCircle2 className="text-green-500 w-5 h-5" />
                                                    <span className="text-green-100">{t('adminQcmPage.perfectTitle')}</span>
                                                </div>
                                            ) : (
                                                <div className="grid md:grid-cols-2 gap-8">
                                                    {wrongProc.length > 0 && (
                                                        <div className="space-y-4">
                                                            <h5 className="text-sm font-medium text-gray-300 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2"><BookOpen className="w-4 h-4" /> {t('adminQcmPage.gapsProcess')}</h5>
                                                            {wrongProc.map((err, i) => (
                                                                <div key={i} className="bg-white/5 p-4 rounded-lg border border-red-500/20">
                                                                    <p className="text-sm text-white mb-3">"{err.question}"</p>
                                                                    <div className="space-y-1 text-xs">
                                                                        <p className="text-red-400 break-words"><span className="text-gray-500 uppercase tracking-widest text-[10px] mr-2">{t('adminQcmPage.answered')}</span> {err.given}</p>
                                                                        <p className="text-green-400 break-words"><span className="text-gray-500 uppercase tracking-widest text-[10px] mr-2">{t('adminQcmPage.expected')}</span> {err.expected}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {wrongExp.length > 0 && (
                                                        <div className="space-y-4">
                                                            <h5 className="text-sm font-medium text-gray-300 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2"><Diamond className="w-4 h-4" /> {t('adminQcmPage.gapsExpertise')}</h5>
                                                            {wrongExp.map((err, i) => (
                                                                <div key={i} className="bg-white/5 p-4 rounded-lg border border-red-500/20">
                                                                    <p className="text-sm text-white mb-3">"{err.question}"</p>
                                                                    <div className="space-y-1 text-xs">
                                                                        <p className="text-red-400 break-words"><span className="text-gray-500 uppercase tracking-widest text-[10px] mr-2">{t('adminQcmPage.answered')}</span> {err.given}</p>
                                                                        <p className="text-green-400 break-words"><span className="text-gray-500 uppercase tracking-widest text-[10px] mr-2">{t('adminQcmPage.expected')}</span> {err.expected}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
