
import { useQuery } from '@tanstack/react-query'
import { apiInvoices } from '@/services/apiInvoices'
import { apiSettings } from '@/services/apiSettings'
import { generateInvoicePDF } from '@/services/pdfService'
import { Card } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Plus, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'

export default function InvoicesList() {
    const navigate = useNavigate()
    const { data: invoices, isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: apiInvoices.getAll
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-luxury-gold">Invoices</h2>
                    <p className="text-muted-foreground">Manage payments and billing.</p>
                </div>
                <Button
                    className="bg-luxury-gold text-black hover:bg-luxury-gold-dark"
                    onClick={() => navigate('/dashboard/invoices/new')}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                </Button>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div>Loading invoices...</div>
                ) : invoices?.length === 0 ? (
                    <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                        No invoices found.
                    </div>
                ) : (
                    invoices?.map(invoice => (
                        <Card key={invoice.id} className="flex items-center justify-between p-4 bg-card hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-luxury-gold/20 rounded text-luxury-gold">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-medium font-serif">{invoice.project?.title || 'Unknown Project'}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Client: {invoice.project?.client?.full_name || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="font-bold text-lg">${invoice.amount.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Due {invoice.due_date || 'N/A'}</p>
                                </div>
                                <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className={
                                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                }>
                                    {invoice.status.toUpperCase()}
                                </Badge>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const settings = apiSettings.get();
                                        generateInvoicePDF(invoice, settings);
                                    }}>
                                        Print PDF
                                    </Button>
                                    {invoice.status !== 'paid' && (
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => {
                                                if (invoice.stripe_payment_link) {
                                                    window.open(invoice.stripe_payment_link, '_blank');
                                                } else {
                                                    if (confirm("Simulate online payment via Stripe?")) {
                                                        // Mock payment
                                                        alert("Payment processed successfully! Mock mode.");
                                                    }
                                                }
                                            }}
                                        >
                                            Pay Now
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
