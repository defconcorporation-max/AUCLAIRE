import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Search, Briefcase, Users, FileText, Target, Loader2, type LucideIcon } from 'lucide-react';

interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    type: 'project' | 'client' | 'invoice' | 'lead';
    href: string;
}

type SearchProjectRow = { id: string; title: string; client?: { full_name: string } | null };
type SearchClientRow = { id: string; full_name: string; email: string | null };
type SearchLeadRow = { id: string; name: string; company?: string | null };
type SearchInvoiceRow = { id: string; amount: number; status: string; project?: { title: string } | null };

const TYPE_ICONS: Record<SearchResult['type'], LucideIcon> = {
    project: Briefcase,
    client: Users,
    invoice: FileText,
    lead: Target,
};

const TYPE_COLORS: Record<SearchResult['type'], string> = {
    project: 'text-blue-500',
    client: 'text-green-500',
    invoice: 'text-amber-500',
    lead: 'text-purple-500',
};

export function GlobalSearch() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    const typeLabels = useMemo(
        () => ({
            project: t('globalSearch.typeProject'),
            client: t('globalSearch.typeClient'),
            invoice: t('globalSearch.typeInvoice'),
            lead: t('globalSearch.typeLead'),
        }),
        [t]
    );

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(prev => !prev);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    useEffect(() => {
        if (open) {
            setQuery('');
            setResults([]);
            setSelectedIdx(0);
        }
    }, [open]);

    const search = useCallback(async (q: string) => {
        if (q.length < 2) { setResults([]); return; }
        setIsSearching(true);
        try {
            const pattern = `%${q}%`;
            const [projectsRes, clientsRes, leadsRes] = await Promise.all([
                supabase.from('projects').select('id, title, client:clients(full_name)').ilike('title', pattern).limit(5),
                supabase.from('clients').select('id, full_name, email').ilike('full_name', pattern).limit(5),
                supabase.from('leads').select('id, name, company').ilike('name', pattern).limit(5),
            ]);

            const projectRows = (projectsRes.data ?? []) as unknown as SearchProjectRow[];
            const projectIds = projectRows.map(p => p.id);
            let invoicesRes: { data: SearchInvoiceRow[] | null } = { data: [] };
            if (projectIds.length > 0) {
                const { data } = await supabase
                    .from('invoices')
                    .select('id, amount, status, project:projects(title)')
                    .in('project_id', projectIds)
                    .limit(5);
                invoicesRes = { data: data as unknown as SearchInvoiceRow[] };
            }

            const items: SearchResult[] = [];
            projectRows.forEach(p => items.push({
                id: p.id, title: p.title, subtitle: p.client?.full_name,
                type: 'project', href: `/dashboard/projects/${p.id}`
            }));
            (clientsRes.data as SearchClientRow[] | null)?.forEach(c => items.push({
                id: c.id, title: c.full_name, subtitle: c.email ?? undefined,
                type: 'client', href: `/dashboard/clients/${c.id}`
            }));
            invoicesRes.data?.forEach(i => items.push({
                id: i.id,
                title: i.project?.title || t('globalSearch.invoiceTitle', { id: i.id.slice(0, 8) }),
                subtitle: `${i.amount}$ — ${i.status}`,
                type: 'invoice', href: `/dashboard/invoices`
            }));
            (leadsRes.data as SearchLeadRow[] | null)?.forEach(l => items.push({
                id: l.id, title: l.name, subtitle: l.company ?? undefined,
                type: 'lead', href: `/dashboard/leads/${l.id}`
            }));

            setResults(items);
            setSelectedIdx(0);
        } catch (e) {
            console.error('Search error', e);
        } finally {
            setIsSearching(false);
        }
    }, [t]);

    useEffect(() => {
        const timer = setTimeout(() => search(query), 250);
        return () => clearTimeout(timer);
    }, [query, search]);

    const handleSelect = (result: SearchResult) => {
        setOpen(false);
        navigate(result.href);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter' && results[selectedIdx]) { handleSelect(results[selectedIdx]); }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('globalSearch.trigger')}</span>
                <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-1.5 text-[10px] font-mono">
                    ⌘K
                </kbd>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-luxury-gold/20">
                    <div className="flex items-center gap-3 px-4 border-b border-black/5 dark:border-white/5">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('globalSearch.inputPlaceholder')}
                            className="border-0 focus-visible:ring-0 bg-transparent text-base h-12 px-0"
                            autoFocus
                        />
                        {isSearching && <Loader2 className="w-4 h-4 animate-spin text-luxury-gold shrink-0" />}
                    </div>

                    <div className="max-h-[320px] overflow-y-auto">
                        {query.length < 2 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                {t('globalSearch.minChars')}
                            </div>
                        ) : results.length === 0 && !isSearching ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                {t('globalSearch.noResults', { query })}
                            </div>
                        ) : (
                            <div className="py-2">
                                {results.map((result, idx) => {
                                    const Icon = TYPE_ICONS[result.type];
                                    return (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            type="button"
                                            onClick={() => handleSelect(result)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                                idx === selectedIdx
                                                    ? 'bg-luxury-gold/10 text-foreground'
                                                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                                            }`}
                                            onMouseEnter={() => setSelectedIdx(idx)}
                                        >
                                            <div className={`w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center ${TYPE_COLORS[result.type]}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{result.title}</p>
                                                {result.subtitle && (
                                                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                                )}
                                            </div>
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium shrink-0">
                                                {typeLabels[result.type]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
