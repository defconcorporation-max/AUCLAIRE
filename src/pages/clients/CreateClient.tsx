
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { ClientForm } from '@/components/forms/ClientForm';

export default function CreateClient() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-luxury-gold">{t('createClientPage.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('createClientPage.subtitle')}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('createClientPage.cardTitle')}</CardTitle>
                    <CardDescription>{t('createClientPage.cardDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ClientForm
                        onSuccess={() => {
                            // Delay slightly for UX then generic go back
                            setTimeout(() => navigate(-1), 500);
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
