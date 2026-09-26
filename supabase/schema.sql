-- ==============================================================================
-- JERUSALEM MINISTRY OF GOSPEL - MPANGO WA USHIRIKA NA UTOAJI
-- Supabase Database Schema & Row Level Security (RLS)
-- Zaburi 50:5 | Ufunuo wa Yohana 21:1-6
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Wasifu wa Washirika)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    fellowship_center TEXT DEFAULT 'Makao Makuu',
    partner_category TEXT DEFAULT 'Mshirika wa Kawaida',
    role TEXT NOT NULL DEFAULT 'partner' CHECK (role IN ('partner', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Helper function to check if the current user is an admin without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Automatic Profile Creation Trigger on Supabase Auth SignUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_first_user BOOLEAN;
BEGIN
    -- If this is the very first user, automatically make them admin!
    SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

    INSERT INTO public.profiles (
        id, 
        full_name, 
        phone_number, 
        fellowship_center, 
        partner_category, 
        role
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
        COALESCE(NEW.raw_user_meta_data->>'fellowship_center', 'Makao Makuu'),
        COALESCE(NEW.raw_user_meta_data->>'partner_category', 'Mshirika wa Kawaida'),
        CASE WHEN is_first_user THEN 'admin' ELSE 'partner' END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Pledges Table (Ahadi za Ushirika)
CREATE TABLE IF NOT EXISTS public.pledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pledge_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Sadaka ya Ushirika wa Kila Mwezi',
    target_amount BIGINT NOT NULL CHECK (target_amount > 0),
    pledge_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_pledges_user_id ON public.pledges(user_id);
CREATE INDEX IF NOT EXISTS idx_pledges_status ON public.pledges(status);
CREATE INDEX IF NOT EXISTS idx_pledges_due_date ON public.pledges(due_date);

-- 5. Contributions Table (Michango na Utoaji)
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pledge_id UUID REFERENCES public.pledges(id) ON DELETE SET NULL,
    receipt_number TEXT NOT NULL UNIQUE,
    amount BIGINT NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL,
    transaction_reference TEXT,
    contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL DEFAULT 'Sadaka ya Ushirika',
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON public.contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_pledge_id ON public.contributions(pledge_id);
CREATE INDEX IF NOT EXISTS idx_contributions_date ON public.contributions(contribution_date);

-- 6. Expenses Table (Gharama na Matumizi ya Huduma - Jopo la Utawala)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_ref TEXT,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);

-- 7. Ministry News Table (Habari na Matangazo ya Huduma)
CREATE TABLE IF NOT EXISTS public.ministry_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Matangazo ya Huduma',
    is_urgent BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Testimonials Table (Shuhuda za Washirika)
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    fellowship_center TEXT DEFAULT 'Makao Makuu',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Utoaji na Miujiza ya Kifedha',
    is_approved BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON public.testimonials(is_approved);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enforce strict data isolation: partners see only their own data, admins see all.
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles are readable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles are readable by owner or admin"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert or delete profiles" ON public.profiles;
CREATE POLICY "Admins can insert or delete profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- PLEDGES POLICIES
DROP POLICY IF EXISTS "Users view their own pledges, admins view all" ON public.pledges;
CREATE POLICY "Users view their own pledges, admins view all"
    ON public.pledges FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can create their own pledge or admin can create" ON public.pledges;
CREATE POLICY "Users can create their own pledge or admin can create"
    ON public.pledges FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users or admins can update pledge" ON public.pledges;
CREATE POLICY "Users or admins can update pledge"
    ON public.pledges FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can delete pledges" ON public.pledges;
CREATE POLICY "Admins can delete pledges"
    ON public.pledges FOR DELETE
    USING (public.is_admin());

-- CONTRIBUTIONS POLICIES
DROP POLICY IF EXISTS "Users view own contributions, admins view all" ON public.contributions;
CREATE POLICY "Users view own contributions, admins view all"
    ON public.contributions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can record own contribution, admins can record for anyone" ON public.contributions;
CREATE POLICY "Users can record own contribution, admins can record for anyone"
    ON public.contributions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update or delete contributions" ON public.contributions;
CREATE POLICY "Admins can update or delete contributions"
    ON public.contributions FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete contributions"
    ON public.contributions FOR DELETE
    USING (public.is_admin());

-- EXPENSES POLICIES (Only accessible to Admins)
DROP POLICY IF EXISTS "Only admins can view expenses" ON public.expenses;
CREATE POLICY "Only admins can view expenses"
    ON public.expenses FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage expenses" ON public.expenses;
CREATE POLICY "Only admins can manage expenses"
    ON public.expenses FOR ALL
    USING (public.is_admin());

-- MINISTRY NEWS POLICIES
DROP POLICY IF EXISTS "Anyone can view active news" ON public.ministry_news;
CREATE POLICY "Anyone can view active news"
    ON public.ministry_news FOR SELECT
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage news" ON public.ministry_news;
CREATE POLICY "Admins manage news"
    ON public.ministry_news FOR ALL
    USING (public.is_admin());

-- TESTIMONIALS POLICIES
DROP POLICY IF EXISTS "Anyone can view approved testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view approved testimonials"
    ON public.testimonials FOR SELECT
    USING (is_approved = true OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can submit testimonials" ON public.testimonials;
CREATE POLICY "Users can submit testimonials"
    ON public.testimonials FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage all testimonials" ON public.testimonials;
CREATE POLICY "Admins manage all testimonials"
    ON public.testimonials FOR ALL
    USING (public.is_admin());

-- ==============================================================================
-- REALTIME CONFIGURATION
-- Enable Supabase Realtime synchronization across all core tables
-- ==============================================================================
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pledges;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ministry_news;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonials;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

