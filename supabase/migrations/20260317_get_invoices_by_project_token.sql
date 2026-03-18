-- RPC to fetch invoices for a project by share token (public, no auth)
-- Returns only safe fields for client-facing payment CTA
CREATE OR REPLACE FUNCTION get_invoices_by_project_token(token_uuid uuid)
RETURNS TABLE (
    id uuid,
    amount numeric,
    amount_paid numeric,
    status text,
    stripe_payment_link text,
    due_date date
) AS $$
BEGIN
    RETURN QUERY
    SELECT i.id, i.amount, i.amount_paid, i.status, i.stripe_payment_link, i.due_date
    FROM invoices i
    JOIN projects p ON p.id = i.project_id
    WHERE p.share_token = token_uuid
      AND i.status != 'void';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
