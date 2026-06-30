-- Expand allowed payment methods list in the check constraint
ALTER TABLE public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_method_check;
ALTER TABLE public.payment_requests ADD CONSTRAINT payment_requests_method_check CHECK (
  payment_method IN (
    'bkash', 'nagad', 'rocket', 'upay',
    'visa', 'mastercard', 'amex',
    'dutch_bangla', 'islami_bank', 'brac_bank', 'city_bank', 'ebl', 'prime_bank',
    'bank_asia', 'mtb', 'southeast_bank', 'pubali_bank', 'sonali_bank',
    'janata_bank', 'agrani_bank', 'rupali_bank',
    'nexus', 'qcash', 'sslcommerz'
  )
);
