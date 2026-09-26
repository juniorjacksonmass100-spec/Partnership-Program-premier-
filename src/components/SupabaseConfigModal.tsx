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
  Code2, 
  Terminal, 
  ExternalLink 
} from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'steps'>('config');

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

-- 5. Ministry News Table (Habari za Huduma)
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

-- 6. Testimonials Table (Shuhuda za Washirika)
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

-- 7. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Admins can update or delete contributions" ON public.contributions FOR UPDATE USING (public.is_admin());

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

-- 8. Enable Realtime Publications
DO $$
BEGIN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pledges; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ministry_news; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonials; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-purple-200 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif font-bold text-xl text-white">
              Mipangilio ya Supabase PostgreSQL & Auth
            </h2>
          </div>
          <p className="text-xs text-purple-200">
            Jukwaa hili linatumia Supabase kama Chanzo Kikuu cha Ukweli (Single Source of Truth)
          </p>

          {/* Navigation Tabs */}
          <div className="flex p-1 bg-purple-900/60 rounded-xl mt-4 border border-purple-700/50">
            <button
              onClick={() => setActiveTab('config')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'config'
                  ? 'bg-amber-400 text-purple-950 shadow-xs'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              Vigezo vya Muunganisho (URL & Key)
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'sql'
                  ? 'bg-amber-400 text-purple-950 shadow-xs'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              SQL Script ya Majedwali
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'steps'
                  ? 'bg-amber-400 text-purple-950 shadow-xs'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              Mwongozo wa Hatua
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800">
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs">
                <span className="font-bold block mb-1">Chanzo cha Vigezo:</span>
                <p>
                  {currentConfig.isFromEnv ? (
                    <span className="text-emerald-700 font-semibold">
                      ✓ Vigezo vimesomwa kutoka kwenye faili la mazingira (.env au Vercel environment variables).
                    </span>
                  ) : currentConfig.url ? (
                    <span className="text-amber-700 font-semibold">
                      ⚡ Vigezo vimehifadhiwa kwenye kumbukumbu ya kikao (session runtime). Unaweza pia kuviweka kwenye .env.
                    </span>
                  ) : (
                    <span className="text-rose-700 font-semibold">
                      ✗ Vigezo havijawekwa bado. Ingiza URL na Anon Key hapa chini au weka kwenye .env.
                    </span>
                  )}
                </p>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    VITE_SUPABASE_URL *
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      required
                      placeholder="https://xyzproject.supabase.co"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    VITE_SUPABASE_ANON_KEY (Public / Anon Key) *
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <textarea
                      rows={3}
                      required
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={anonKey}
                      onChange={(e) => setAnonKey(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-900 text-amber-300 rounded-xl text-xs font-bold hover:bg-purple-800 transition shadow-xs"
                  >
                    Hifadhi Vigezo vya Supabase
                  </button>
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing}
                    className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition flex items-center gap-1.5 shadow-xs disabled:opacity-60"
                  >
                    {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Jaribu Muunganisho (Test)</span>
                  </button>
                  {!currentConfig.isFromEnv && currentConfig.url && (
                    <button
                      type="button"
                      onClick={clearRuntimeConfig}
                      className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold hover:bg-rose-100 transition"
                    >
                      Futa Vigezo vya Kikao
                    </button>
                  )}
                </div>
              </form>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-50 text-rose-900 border border-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {testResult.success ? 'Muunganisho Umethibitishwa' : 'Hitilafu ya Muunganisho'}
                    </span>
                    <p>{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    SQL Schema ya Kanzidata ya Supabase
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nakili script hii na uibandike kwenye Supabase SQL Editor ili kuunda majedwali, RLS, na Realtime.
                  </p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Imenakiliwa!' : 'Nakili SQL Script'}</span>
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 max-h-80 overflow-y-auto">
                <pre>{sqlScript}</pre>
              </div>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-purple-950">
                Mwongozo wa Haraka wa Kusanidi Supabase kwa Dakika 3:
              </h3>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-900 text-amber-300 flex items-center justify-center text-xs">1</span>
                    Fungua Akaunti na Mradi Mpya Supabase
                  </div>
                  <p className="text-slate-600 mt-1 pl-6">
                    Tembelea{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-700 font-semibold underline inline-flex items-center gap-0.5"
                    >
                      supabase.com <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    na uunde mradi mpya (New Project) unaoitwa mfano <code>jerusalem-ministry</code>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-900 text-amber-300 flex items-center justify-center text-xs">2</span>
                    Tekeleza SQL Script
                  </div>
                  <p className="text-slate-600 mt-1 pl-6">
                    Kwenye dashibodi ya Supabase, bofya <strong>SQL Editor</strong>, kisha tengeneza query mpya, 
                    bandika script kutoka kwenye kichupo cha "SQL Script ya Majedwali" hapo juu, na ubofye <strong>Run</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-900 text-amber-300 flex items-center justify-center text-xs">3</span>
                    Weka Vigezo vya Mazingira (.env)
                  </div>
                  <p className="text-slate-600 mt-1 pl-6">
                    Nenda kwenye <strong>Project Settings → API</strong>. Nakili <code>Project URL</code> na <code>anon public key</code>, 
                    kisha weka kwenye faili la <code>.env</code> kama <code>VITE_SUPABASE_URL</code> na <code>VITE_SUPABASE_ANON_KEY</code>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Uongozi wa Kwanza (First Admin Setup):
                  </div>
                  <p className="mt-1">
                    Mtumiaji wa kwanza kabisa atakayejisajili kwenye mfumo hupewa hadhi ya <strong>Msimamizi Mkuu (Admin)</strong> kiotomatiki 
                    kupitia trigger ya database! Watumiaji wengine watakuwa Washirika wa kawaida isipokuwa Msimamizi awapandishe hadhi.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
