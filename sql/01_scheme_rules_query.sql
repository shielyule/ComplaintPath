-- ComplaintPath · Zetaris scheme clocks query
-- Run in Zetaris SQL editor (UI http://localhost:3000) after login.
-- The app issues the same shape of SELECT via DataRetrieverAgent
-- (src/lib/zetaris.ts → /api/proxy/query/sql/start).

-- Smoke check (platform healthy):
select 7 as seven;

-- Scheme catalog used for gate clocks (executed through Zetaris engine):
select *
from values
  ('FOS', 'Financial Ombudsman Service', 'financial', 6, 56, 'https://complaintsubmission.financial-ombudsman.org.uk/', 'FRL within 6 months OR 8+ weeks with no response'),
  ('ENERGY_OMBUDSMAN', 'Energy Ombudsman', 'energy', 12, 56, 'https://www.energyombudsman.org/submit-a-complaint', 'Deadlock within 12 months OR 8 weeks unresolved'),
  ('ICO', 'Information Commissioner''s Office', 'data_privacy', NULL, NULL, 'https://ico.org.uk/make-a-complaint/', 'Regulatory findings — not ombudsman money awards'),
  ('FSCS_REDIRECT', 'Financial Services Compensation Scheme', 'financial', NULL, NULL, 'https://app.fscs.org.uk/', 'Only if firm in default; else FOS'),
  ('POPLA', 'POPLA', 'parking', NULL, NULL, 'https://www.popla.co.uk/', 'Private BPA operator appeals')
as scheme_rules(
  scheme_id,
  name,
  sector,
  letter_window_months,
  wait_days_without_frl,
  portal_url,
  notes
);

-- Optional (if you register a durable table in your org):
-- select scheme_id, name, sector, letter_window_months, wait_days_without_frl, portal_url, notes
-- from complaintpath.scheme_rules
-- limit 50;
