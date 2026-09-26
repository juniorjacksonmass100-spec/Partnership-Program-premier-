import React from 'react';
import { EmblemLogo } from './EmblemLogo';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Database, 
  HeartHandshake, 
  PlusCircle, 
  Receipt, 
  BarChart3, 
  Layers
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenPledgeModal: () => void;
  onOpenContributionModal: () => void;
  onOpenSupabaseConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenLogin,
  onOpenRegister,
  onOpenPledgeModal,
  onOpenContributionModal,
  onOpenSupabaseConfig,
}) => {
  const { user, profile, isAdmin, isConfigured, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#130823]/95 backdrop-blur-md border-b border-purple-900/50 shadow-md text-slate-100 transition-colors duration-200 print:hidden">
      {/* Top Ministry Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-amber-200 py-1.5 px-4 text-xs font-medium border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-serif tracking-wide text-amber-300 font-semibold">
              JERUSALEM MINISTRY OF GOSPEL
            </span>
            <span className="hidden sm:inline text-purple-300">|</span>
            <span className="hidden sm:inline text-purple-200 italic">
              "Nikusanidieni wacha Mungu wangu, Waliofanya agano nami kwa dhabihu" — Zaburi 50:5
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenSupabaseConfig}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold transition ${
                isConfigured
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900'
                  : 'bg-amber-900/60 text-amber-300 border border-amber-500/40 hover:bg-amber-800'
              }`}
              title="Kagua hali ya mfumo wa Supabase"
            >
              <Database className="w-3 h-3" />
              <span className="hidden sm:inline">{isConfigured ? 'Supabase Imesanidiwa' : 'Sanidi Supabase'}</span>
              <span className="sm:hidden">{isConfigured ? 'Supabase' : 'Sanidi'}</span>
            </button>
            <span className="text-amber-400/80 hidden md:inline text-[11px]">Ufunuo 21:1-6</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Ministry Name */}
          <div 
            onClick={() => setCurrentTab('overview')} 
            className="flex items-center cursor-pointer group transition"
          >
            <EmblemLogo size="md" showSubtitle={true} />
          </div>

          {/* Navigation Links for Authenticated Users */}
          {user && (
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => setCurrentTab('overview')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                  currentTab === 'overview'
                    ? 'bg-purple-950/90 text-amber-300 font-bold border border-purple-800/60 shadow-xs'
                    : 'text-purple-200/80 hover:text-amber-300 hover:bg-purple-950/50'
                }`}
              >
                <Layers className="w-4 h-4 text-amber-400" />
                Dashibodi
              </button>

              <button
                onClick={() => setCurrentTab('pledges')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                  currentTab === 'pledges'
                    ? 'bg-purple-950/90 text-amber-300 font-bold border border-purple-800/60 shadow-xs'
                    : 'text-purple-200/80 hover:text-amber-300 hover:bg-purple-950/50'
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-amber-400" />
                Ahadi Zangu
              </button>

              <button
                onClick={() => setCurrentTab('contributions')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                  currentTab === 'contributions'
                    ? 'bg-purple-950/90 text-amber-300 font-bold border border-purple-800/60 shadow-xs'
                    : 'text-purple-200/80 hover:text-amber-300 hover:bg-purple-950/50'
                }`}
              >
                <Receipt className="w-4 h-4 text-emerald-400" />
                Utoaji & Stakabadhi
              </button>

              <button
                onClick={() => setCurrentTab('reports')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                  currentTab === 'reports'
                    ? 'bg-purple-950/90 text-amber-300 font-bold border border-purple-800/60 shadow-xs'
                    : 'text-purple-200/80 hover:text-amber-300 hover:bg-purple-950/50'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Ripoti za Utoaji
              </button>

              {isAdmin && (
                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5 ${
                    currentTab === 'admin'
                      ? 'bg-amber-400 text-purple-950 shadow-md'
                      : 'text-amber-300 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-500/40'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Jopo la Utawala (Admin)
                </button>
              )}
            </nav>
          )}

          {/* Action Buttons & Profile Area */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Fast Action Buttons */}
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={onOpenPledgeModal}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-950 text-amber-300 border border-purple-800 hover:bg-purple-900 transition flex items-center gap-1 shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    Weka Ahadi
                  </button>
                  <button
                    onClick={onOpenContributionModal}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-purple-950 hover:from-amber-400 hover:to-amber-500 transition flex items-center gap-1 shadow-sm"
                  >
                    <Receipt className="w-3.5 h-3.5 text-purple-950" />
                    Rekodi Sadaka
                  </button>
                </div>

                {/* Profile Pill */}
                <div className="flex items-center gap-2 bg-[#1a0e30] border border-purple-800/60 rounded-full py-1 px-3 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-purple-900 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/40">
                    {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'M'}
                  </div>
                  <div className="flex flex-col text-left hidden md:block">
                    <span className="text-xs font-bold text-slate-100 leading-tight truncate max-w-[120px]">
                      {profile?.full_name || user.email}
                    </span>
                    <span className="text-[10px] text-amber-400 font-medium">
                      {profile?.role === 'admin' ? 'Msimamizi Mkuu' : (profile?.partner_category || 'Mshirika')}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="p-1 rounded-full text-purple-300 hover:text-rose-400 hover:bg-rose-950/50 transition ml-1"
                    title="Ondoka (Logout)"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenLogin}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-amber-200 hover:bg-purple-950/60 transition flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Ingia
                </button>
                <button
                  onClick={onOpenRegister}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-purple-900 to-purple-800 text-amber-300 hover:from-purple-800 hover:to-purple-700 shadow-sm transition flex items-center gap-1.5 border border-amber-500/30"
                >
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  Kuwa Mshirika
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        {user && (
          <div className="lg:hidden flex items-center justify-around py-2 border-t border-purple-900/60 text-xs bg-[#130823]">
            <button
              onClick={() => setCurrentTab('overview')}
              className={`p-1.5 rounded font-semibold ${
                currentTab === 'overview' ? 'text-amber-300 font-bold bg-purple-950' : 'text-purple-300'
              }`}
            >
              Dashibodi
            </button>
            <button
              onClick={() => setCurrentTab('pledges')}
              className={`p-1.5 rounded font-semibold ${
                currentTab === 'pledges' ? 'text-amber-300 font-bold bg-purple-950' : 'text-purple-300'
              }`}
            >
              Ahadi
            </button>
            <button
              onClick={() => setCurrentTab('contributions')}
              className={`p-1.5 rounded font-semibold ${
                currentTab === 'contributions' ? 'text-amber-300 font-bold bg-purple-950' : 'text-purple-300'
              }`}
            >
              Utoaji
            </button>
            <button
              onClick={() => setCurrentTab('reports')}
              className={`p-1.5 rounded font-semibold ${
                currentTab === 'reports' ? 'text-amber-300 font-bold bg-purple-950' : 'text-purple-300'
              }`}
            >
              Ripoti
            </button>
            {isAdmin && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`p-1.5 rounded font-bold ${
                  currentTab === 'admin' ? 'text-purple-950 bg-amber-400' : 'text-amber-300'
                }`}
              >
                Admin
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
