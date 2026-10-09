import React, { useState } from 'react';
import { 
  getSupabaseConfig, 
  saveRuntimeConfig, 
  clearRuntimeConfig, 
  testSupabaseConnection 
} from '../lib/supabase';
import { 
  X, 
  Database, 
  Key, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Loader2, 
  ExternalLink,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'steps' | 'why_data_issue'>('config');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tablesFound?: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      alert('Tafadhali jaza Project URL na Anon Key.');
      return;
    }
    saveRuntimeConfig(url.trim(), anonKey.trim());
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Hitilafu ya mtandao.',
      });
    } finally {
      setTesting(false);
    }
  };

  const sqlScript = `-- ==============================================================================
-- JERUSALEM MINISTRY OF GOSPEL - SUPABASE DATABASE SETUP
-- Zaburi 50:5 | Ufunuo wa Yohana 21:1-6
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
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

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automatic Profile Creation Trigger on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_first_user BOOLEAN;
BEGIN
    SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;
    INSERT INTO public.profiles (id, full_name, phone_number, fellowship_center, partner_category, role)
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

-- 2. Pledges Table
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

-- 3. Contributions Table
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

-- Foreign Key Constraints for PostgREST profiles embedding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_pledges_profiles'
    ) THEN
        ALTER TABLE public.pledges 
        ADD CONSTRAINT fk_pledges_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_contributions_profiles'
    ) THEN
        ALTER TABLE public.contributions 
        ADD CONSTRAINT fk_contributions_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Expenses Table
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

-- 5. Ministry News Table
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

-- 6. Testimonials Table
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

-- 7. Direct Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'partner',
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles are readable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles are readable by owner or admin" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert or delete profiles" ON public.profiles;
CREATE POLICY "Admins can insert or delete profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Pledges Policies
DROP POLICY IF EXISTS "Users view their own pledges, admins view all" ON public.pledges;
CREATE POLICY "Users view their own pledges, admins view all" ON public.pledges FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can create their own pledge or admin can create" ON public.pledges;
CREATE POLICY "Users can create their own pledge or admin can create" ON public.pledges FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users or admins can update pledge" ON public.pledges;
CREATE POLICY "Users or admins can update pledge" ON public.pledges FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can delete pledges" ON public.pledges;
CREATE POLICY "Admins can delete pledges" ON public.pledges FOR DELETE USING (public.is_admin());

-- Contributions Policies
DROP POLICY IF EXISTS "Users view own contributions, admins view all" ON public.contributions;
CREATE POLICY "Users view own contributions, admins view all" ON public.contributions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can record own contribution, admins can record for anyone" ON public.contributions;
CREATE POLICY "Users can record own contribution, admins can record for anyone" ON public.contributions FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update or delete contributions" ON public.contributions;
DROP POLICY IF EXISTS "Admins can update contributions" ON public.contributions;
CREATE POLICY "Admins can update contributions" ON public.contributions FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete contributions" ON public.contributions;
CREATE POLICY "Admins can delete contributions" ON public.contributions FOR DELETE USING (public.is_admin());

-- Expenses Policies
DROP POLICY IF EXISTS "Only admins can view expenses" ON public.expenses;
CREATE POLICY "Only admins can view expenses" ON public.expenses FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage expenses" ON public.expenses;
CREATE POLICY "Only admins can manage expenses" ON public.expenses FOR ALL USING (public.is_admin());

-- Ministry News Policies
DROP POLICY IF EXISTS "Anyone can view active news" ON public.ministry_news;
CREATE POLICY "Anyone can view active news" ON public.ministry_news FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage news" ON public.ministry_news;
CREATE POLICY "Admins manage news" ON public.ministry_news FOR ALL USING (public.is_admin());

-- Testimonials Policies
DROP POLICY IF EXISTS "Anyone can view approved testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view approved testimonials" ON public.testimonials FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can submit testimonials" ON public.testimonials;
CREATE POLICY "Users can submit testimonials" ON public.testimonials FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage all testimonials" ON public.testimonials;
CREATE POLICY "Admins manage all testimonials" ON public.testimonials FOR ALL USING (public.is_admin());

-- Messages Policies
DROP POLICY IF EXISTS "Users can view own messages or admins view all" ON public.messages;
CREATE POLICY "Users can view own messages or admins view all" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());

DROP POLICY IF EXISTS "Users and admins can send messages" ON public.messages;
CREATE POLICY "Users and admins can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id OR public.is_admin());

DROP POLICY IF EXISTS "Users and admins can update messages" ON public.messages;
CREATE POLICY "Users and admins can update messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can delete messages" ON public.messages;
CREATE POLICY "Admins can delete messages" ON public.messages FOR DELETE USING (public.is_admin());

-- Notifications Policies
DROP POLICY IF EXISTS "Users view own or broadcast notifications" ON public.notifications;
CREATE POLICY "Users view own or broadcast notifications" ON public.notifications FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can mark own notifications as read" ON public.notifications;
CREATE POLICY "Users can mark own notifications as read" ON public.notifications FOR UPDATE USING (user_id IS NULL OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
CREATE POLICY "Admins can delete notifications" ON public.notifications FOR DELETE USING (public.is_admin());

-- Realtime publication
DO $$
BEGIN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pledges; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ministry_news; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonials; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080312]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#140827] text-slate-100 rounded-3xl shadow-2xl border border-purple-800/60 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white text-left relative border-b border-purple-800/50 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-white/10 transition"
            title="Funga"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif font-bold text-xl text-white">
              Kusanidi Supabase (Database & Realtime)
            </h2>
          </div>
          <p className="text-xs text-purple-200/90">
            Unganisha na database ya Supabase ili kuhifadhi ahadi, sadaka, na washirika moja kwa moja.
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap p-1 bg-[#120722] rounded-xl mt-4 border border-purple-800/50 gap-1">
            <button
              onClick={() => setActiveTab('config')}
              className={`flex-1 min-w-[120px] py-1.5 px-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'config'
                  ? 'bg-amber-400 text-purple-950 shadow-xs'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              Vigezo (URL & Key)
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`flex-1 min-w-[120px] py-1.5 px-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'sql'
                  ? 'bg-amber-400 text-purple-950 shadow-xs'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              SQL Script ya Majedwali
            </button>
            <button
              onClick={() => setActiveTab('why_data_issue')}
              className={`flex-1 min-w-[140px] py-1.5 px-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'why_data_issue'
                  ? 'bg-amber-400 text-purple-950 shadow-xs'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              Kuhusu Ahadi & Michango
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`flex-1 min-w-[120px] py-1.5 px-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'steps'
                  ? 'bg-amber-400 text-purple-950 shadow-xs'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              Hatua za Kufuata
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#1b0e32] border border-purple-700/60 text-xs">
                <span className="font-bold text-amber-300 block mb-1">Chanzo cha Vigezo:</span>
                <p>
                  {currentConfig.isFromEnv ? (
                    <span className="text-emerald-400 font-semibold">
                      ✓ Vigezo vimesomwa moja kwa moja kutoka faili la mazingira (.env au Vercel environment variables).
                    </span>
                  ) : currentConfig.url ? (
                    <span className="text-amber-300 font-semibold">
                      ⚡ Vigezo vimehifadhiwa kwenye kumbukumbu ya kikao cha kivinjari (session storage).
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold">
                      ✗ Vigezo havijawekwa bado. Ingiza URL na Anon Key hapa chini ili kuanza kuhifadhi taarifa kwenye Supabase.
                    </span>
                  )}
                </p>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1.5">
                    VITE_SUPABASE_URL *
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="url"
                      required
                      placeholder="https://xyzproject.supabase.co"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1.5">
                    VITE_SUPABASE_ANON_KEY (Public / Anon Key) *
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
                    <textarea
                      rows={3}
                      required
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={anonKey}
                      onChange={(e) => setAnonKey(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-purple-950 font-bold text-xs rounded-xl hover:from-amber-400 hover:to-amber-500 transition shadow-md"
                  >
                    Hifadhi Vigezo vya Supabase
                  </button>
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition flex items-center gap-1.5 shadow-md disabled:opacity-60"
                  >
                    {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Jaribu Muunganisho (Test)</span>
                  </button>
                  {!currentConfig.isFromEnv && currentConfig.url && (
                    <button
                      type="button"
                      onClick={clearRuntimeConfig}
                      className="px-3 py-2 bg-rose-950/70 text-rose-300 border border-rose-700/60 rounded-xl text-xs font-semibold hover:bg-rose-900 transition"
                    >
                      Futa Vigezo
                    </button>
                  )}
                </div>
              </form>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                    testResult.success
                      ? 'bg-emerald-950/80 text-emerald-200 border-emerald-600/60'
                      : 'bg-rose-950/80 text-rose-200 border-rose-600/60'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {testResult.success ? 'Muunganisho Umefanikiwa!' : 'Hitilafu ya Muunganisho'}
                    </span>
                    <p className="mt-0.5 leading-relaxed">{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'why_data_issue' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-600/50 text-amber-200">
                <h3 className="text-sm font-bold flex items-center gap-2 text-amber-300 mb-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  Kwanini Ahadi na Michango "Haikubadilika" Baada ya Kuongezwa?
                </h3>
                <p className="leading-relaxed mb-3">
                  Kuna sababu 2 kuu zinazoweza kusababisha ahadi au mchango kuonekana kuwa umeongezwa lakini usionekane kwenye orodha:
                </p>
                <div className="space-y-2.5 pl-2">
                  <div className="p-2.5 rounded-xl bg-[#140827] border border-amber-700/40">
                    <span className="font-bold text-white block mb-0.5">1. Majedwali ya Supabase (Tables & Foreign Keys) hayajaendeshwa:</span>
                    <p className="text-amber-100/90 leading-relaxed">
                      Wakati mfumo unapojaribu kusoma ahadi pamoja na majina ya washirika (profiles), kama jedwali la <code>pledges</code> au <code>contributions</code> halijaundwa kwenye Supabase au halina kiungo na <code>profiles</code>, Supabase inarejesha kosa na kuzuia data kuonekana.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#140827] border border-amber-700/40">
                    <span className="font-bold text-white block mb-0.5">2. Muunganisho wa Papo Hapo (Instant UI Update umeboreshwa sasa!):</span>
                    <p className="text-amber-100/90 leading-relaxed">
                      Sasa tumeweka <strong>sasisho la papo hapo (Instant Optimistic Update)</strong> — mtu anapobofya kuweka ahadi au kurekodi mchango, mfumo unauongeza kwenye skrini mara moja bila kuchelewa, kisha unaiweka salama kwenye Supabase!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1b0e32] border border-purple-700/60 text-purple-200">
                <h4 className="font-bold text-amber-300 text-xs uppercase mb-1">
                  Suluhisho la Uhakika:
                </h4>
                <p className="leading-relaxed">
                  Fungua kichupo cha <strong>"SQL Script ya Majedwali"</strong> hapo juu, bofya kitufe cha <strong>"Nakili SQL Script"</strong>, 
                  kisha uende kwenye <strong>Supabase Dashboard → SQL Editor</strong>, bandika na ubofye <strong>Run</strong>. Hii itaunda majedwali yote mara moja!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    SQL Schema ya Kanzidata ya Supabase
                  </h3>
                  <p className="text-xs text-purple-300/80">
                    Nakili script hii na uibandike kwenye Supabase SQL Editor ili kuunda majedwali yote na RLS.
                  </p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Imenakiliwa!' : 'Nakili SQL Script'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-purple-700/60 bg-[#0d0517] p-4 font-mono text-[11px] text-emerald-400 max-h-80 overflow-y-auto">
                <pre>{sqlScript}</pre>
              </div>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-3 text-xs">
              <h3 className="text-sm font-bold text-amber-300 mb-2">
                Mwongozo wa Haraka wa Kusanidi Supabase kwa Dakika 3:
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#1b0e32] border border-purple-700/60">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-purple-950 flex items-center justify-center text-xs font-black">1</span>
                    Fungua Mradi Kwenye Supabase
                  </div>
                  <p className="text-purple-200/80 mt-1 pl-7 leading-relaxed">
                    Tembelea{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-300 font-semibold underline inline-flex items-center gap-0.5"
                    >
                      supabase.com <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    kisha uunde mradi mpya bila malipo.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#1b0e32] border border-purple-700/60">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-purple-950 flex items-center justify-center text-xs font-black">2</span>
                    Tekeleza SQL Script Kwenye SQL Editor
                  </div>
                  <p className="text-purple-200/80 mt-1 pl-7 leading-relaxed">
                    Kwenye menyu ya kushoto ya Supabase, bofya <strong>SQL Editor</strong>, tengeneza query mpya, 
                    bandika script kutoka kwenye kichupo cha "SQL Script ya Majedwali" hapo juu, kisha ubofye <strong>Run</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#1b0e32] border border-purple-700/60">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-purple-950 flex items-center justify-center text-xs font-black">3</span>
                    Weka URL na Anon Key
                  </div>
                  <p className="text-purple-200/80 mt-1 pl-7 leading-relaxed">
                    Nenda <strong>Project Settings → API</strong>. Nakili <code>Project URL</code> na <code>anon public key</code>, 
                    kisha weka kwenye kichupo cha "Vigezo (URL & Key)" au kwenye Vercel/faili la <code>.env</code>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-600/50 text-emerald-200">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Msimamizi wa Kwanza (First Admin Setup):
                  </div>
                  <p className="mt-1 pl-5 text-[11px] leading-relaxed">
                    Mtumiaji wa kwanza atakayejisajili anapewa hadhi ya <strong>Msimamizi Mkuu (Admin)</strong> kiotomatiki 
                    na anaweza kuona taarifa za washirika wote na rekodi za hazina!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#120722] border-t border-purple-800/40 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 font-semibold text-xs border border-purple-700/50 transition"
          >
            Funga
          </button>
        </div>
      </div>
    </div>
  );
};
