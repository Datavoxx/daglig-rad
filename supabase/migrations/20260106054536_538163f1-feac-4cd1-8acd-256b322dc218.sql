-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

-- Create projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    client_name TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create daily_reports table
CREATE TABLE public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Crew info
    headcount INTEGER,
    roles TEXT[] DEFAULT '{}',
    hours_per_person DECIMAL(5,2),
    total_hours DECIMAL(8,2),
    
    -- Work content (JSONB for flexibility)
    work_items TEXT[] DEFAULT '{}',
    deviations JSONB DEFAULT '[]',
    extra_work TEXT[] DEFAULT '{}',
    
    -- Materials
    materials_delivered TEXT[] DEFAULT '{}',
    materials_missing TEXT[] DEFAULT '{}',
    
    -- Notes and metadata
    notes TEXT,
    original_transcript TEXT,
    confidence_overall DECIMAL(3,2),
    low_confidence_fields TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, report_date)
);

-- Create report_pdfs table
CREATE TABLE public.report_pdfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES public.daily_reports(id) ON DELETE CASCADE NOT NULL,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create share_links table
CREATE TABLE public.share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES public.daily_reports(id) ON DELETE CASCADE NOT NULL,
    pdf_id UUID REFERENCES public.report_pdfs(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_daily_reports_project_id ON public.daily_reports(project_id);
CREATE INDEX idx_daily_reports_user_id ON public.daily_reports(user_id);
CREATE INDEX idx_daily_reports_date ON public.daily_reports(report_date DESC);
CREATE INDEX idx_share_links_token ON public.share_links(token);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Users can view own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for daily_reports
CREATE POLICY "Users can view own reports"
    ON public.daily_reports FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reports"
    ON public.daily_reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
    ON public.daily_reports FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
    ON public.daily_reports FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for report_pdfs
CREATE POLICY "Users can view own pdfs"
    ON public.report_pdfs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.daily_reports dr
            WHERE dr.id = daily_report_id AND dr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own pdfs"
    ON public.report_pdfs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.daily_reports dr
            WHERE dr.id = daily_report_id AND dr.user_id = auth.uid()
        )
    );

-- RLS Policies for share_links
CREATE POLICY "Users can view own share links"
    ON public.share_links FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.daily_reports dr
            WHERE dr.id = daily_report_id AND dr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create share links for own reports"
    ON public.share_links FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.daily_reports dr
            WHERE dr.id = daily_report_id AND dr.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view share links by token"
    ON public.share_links FOR SELECT
    USING (true);

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at
    BEFORE UPDATE ON public.daily_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('report-pdfs', 'report-pdfs', true);

-- Storage policies
CREATE POLICY "Users can upload pdfs"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'report-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view pdfs"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'report-pdfs');

CREATE POLICY "Users can delete own pdfs"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'report-pdfs' AND auth.role() = 'authenticated');