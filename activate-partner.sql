-- Activate the partner account that was just created
UPDATE business_partners 
SET status = 'active',
    approved_at = NOW()
WHERE user_id = (
  SELECT id FROM users WHERE email = 'rogergrubb123@att.net'
);

-- Show the updated partner account
SELECT 
  id,
  business_name,
  business_type,
  custom_domain,
  status,
  created_at,
  approved_at
FROM business_partners
WHERE user_id = (
  SELECT id FROM users WHERE email = 'rogergrubb123@att.net'
);
