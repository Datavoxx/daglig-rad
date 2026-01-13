-- Lägg till nya fält i project_estimates för inledning och avslut
ALTER TABLE project_estimates ADD COLUMN IF NOT EXISTS introduction_text TEXT;
ALTER TABLE project_estimates ADD COLUMN IF NOT EXISTS closing_text TEXT;

-- Ny tabell för tillval
CREATE TABLE IF NOT EXISTS estimate_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES project_estimates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  is_selected BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE estimate_addons ENABLE ROW LEVEL SECURITY;

-- RLS policy for estimate_addons (same as project_estimates - allow all for now)
CREATE POLICY "Allow all access to estimate_addons" ON estimate_addons
FOR ALL USING (true) WITH CHECK (true);

-- Ny tabell för textmallar
CREATE TABLE IF NOT EXISTS estimate_text_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('introduction', 'closing')),
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE estimate_text_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for estimate_text_templates
CREATE POLICY "Users can view own templates" ON estimate_text_templates
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates" ON estimate_text_templates
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON estimate_text_templates
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON estimate_text_templates
FOR DELETE USING (auth.uid() = user_id);