-- ============================================================================
-- Add RPC: update_payment_from_paytrail_callback
-- ============================================================================
-- Created: 2026-03-17

CREATE OR REPLACE FUNCTION public.update_payment_from_paytrail_callback(
  payment_id UUID,
  new_status TEXT,
  paytrail_transaction_id TEXT,
  raw_response TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_record payments%ROWTYPE;
BEGIN
  SELECT * INTO payment_record
  FROM payments
  WHERE id = payment_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Payment not found',
      'payment_id', payment_id
    );
  END IF;

  -- Update the payment. Keep existing transaction id if callback doesn't include it.
  UPDATE payments
  SET
    status = new_status,
    paytrail_transaction_id = COALESCE(update_payment_from_paytrail_callback.paytrail_transaction_id, payments.paytrail_transaction_id),
    raw_response = jsonb_build_object(
      'raw', raw_response,
      'received_at', NOW()
    ),
    processed_at = CASE
      WHEN new_status = 'paid' THEN COALESCE(payments.processed_at, NOW())
      ELSE payments.processed_at
    END,
    updated_at = NOW()
  WHERE id = payment_id;

  IF new_status = 'paid' THEN
    PERFORM process_payment_with_3_percent_fee(payment_id, FALSE);
  END IF;

  RETURN json_build_object(
    'success', true,
    'payment_id', payment_id,
    'task_id', payment_record.task_id,
    'new_status', new_status
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE,
      'payment_id', payment_id
    );
END;
$$;

COMMENT ON FUNCTION public.update_payment_from_paytrail_callback(UUID, TEXT, TEXT, TEXT)
IS 'Updates payment from Paytrail callback and triggers 3% fee processing.';

-- Allow calling via Supabase API if needed (service role can call regardless, but this helps tooling).
GRANT EXECUTE ON FUNCTION public.update_payment_from_paytrail_callback(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_from_paytrail_callback(UUID, TEXT, TEXT, TEXT) TO anon;

