-- Byt från hourly_cost (kr) till markup_percent (%)
ALTER TABLE salary_types 
  RENAME COLUMN hourly_cost TO markup_percent;

-- Lägg till kommentar för dokumentation
COMMENT ON COLUMN salary_types.markup_percent IS 'Personalkostnadspåslag i procent';