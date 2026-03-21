import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User, Mail, Phone, StickyNote } from 'lucide-react';
import { apiClients, Client } from '@/services/apiClients';
import { useQueryClient } from '@tanstack/react-query';

interface ClientFormProps {
    onSuccess?: (client: Client) => void;
    className?: string;
}

export function ClientForm({ onSuccess, className }: ClientFormProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        notes: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const newClient = await apiClients.create(formData);

            // Invalidate query to refresh list globally
            await queryClient.invalidateQueries({ queryKey: ['clients'] });

            // Call success callback with new client data
            if (onSuccess && newClient) {
                onSuccess(newClient as Client);
            }

            // Allow parent to handle navigation or closing
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleCreate} className={`space-y-4 ${className}`}>
            <div className="space-y-2">
                <label className="text-sm font-medium">{t('clientForm.fullName')}</label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        name="full_name"
                        placeholder={t('clientForm.placeholderName')}
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('clientForm.email')}</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            type="email"
                            name="email"
                            placeholder={t('clientForm.placeholderEmail')}
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('clientForm.phone')}</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            name="phone"
                            placeholder={t('clientForm.placeholderPhone')}
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">{t('clientForm.notes')}</label>
                <div className="relative">
                    <StickyNote className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        name="notes"
                        placeholder={t('clientForm.placeholderNotes')}
                        value={formData.notes}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <Button type="submit" className="w-full bg-luxury-gold text-black hover:bg-luxury-gold-dark" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('clientForm.submitCreate')}
            </Button>
        </form>
    );
}
