import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher({ className }: { className?: string }) {
    const { i18n, t } = useTranslation();
    const code = (i18n.resolvedLanguage || i18n.language || 'fr').slice(0, 2).toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={className ?? 'gap-2 border-luxury-gold/30 hover:bg-luxury-gold/10 text-luxury-gold'}
                    title={t('language.label')}
                >
                    <Languages className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline font-mono text-xs">{code}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => void i18n.changeLanguage('fr')}>
                    {t('language.fr')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void i18n.changeLanguage('en')}>
                    {t('language.en')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
