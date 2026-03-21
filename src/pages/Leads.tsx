import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function Leads() {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-serif font-bold tracking-tight text-luxury-gold">{t('leadsPage.title')}</h2>
            <Card>
                <CardHeader>
                    <CardTitle>{t('leadsPage.cardTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{t('leadsPage.placeholder')}</p>
                </CardContent>
            </Card>
        </div>
    )
}
