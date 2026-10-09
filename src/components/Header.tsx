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
  Layers,
  Bell,
  MessageSquare,
  RefreshCcw,
  Sparkles
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenPledgeModal: () => void;
  onOpenContributionModal: () => void;
  onOpenSupabaseConfig: () => void;
  onOpenNotifications?: () => void;
  onOpenMessages?: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenLogin,
  onOpenRegister,
  onOpenPledgeModal,
  onOpenContributionModal,
  onOpenSupabaseConfig,
  onOpenNotifications,
  onOpenMessages,
  onRefreshData,
  isRefreshing = false,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
}) => {
  const { user, profile, isAdmin, isConfigured, signOut } = useAuth();

  const handleTabChange = (tab: string) => {
    triggerHaptic('selection');
    setCurrentTab(tab);
  };

  const handleRefreshClick = () => {
    triggerHaptic('medium');
    if (onRefreshData) onRefreshData();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#130823]/95 backdrop-blur-md border-b border-purple-900/50 shadow-md text-slate-100 transition-colors duration-200 print:hidden">
      {/* Top Ministry Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-amber-200 py-1.5 px-3 sm:px-4 text-xs font-medium border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
            <span className="font-serif tracking-wide text-amber-300 font-bold truncate">
              JERUSALEM MINISTRY OF GOSPEL
            </span>
            <span className="hidden md:inline text-purple-300">|</span>
            <span className="hidden md:inline text-purple-200 italic truncate">
              "Nikusanyieni wacha Mungu wangu, Waliofanya agano nami kwa dhabihu" — Zaburi 50:5
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Refresh in top banner */}
            {onRefreshData && (
              <button
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-900/80 hover:bg-purple-800 text-amber-300 border border-purple-600/60 transition active:scale-95 disabled:opacity-50"
                title="Bofya kuleta data mpya zilizosasishwa"
              >
                <RefreshCcw className={`w-3 h-3 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Inasasisha...' : 'Onyesha Upya'}</span>
              </button>
            )}

            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenSupabaseConfig();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition active:scale-95 ${
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
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
          {/* Logo & Ministry Name */}
          <div 
            onClick={() => handleTabChange('overview')} 
            className="flex items-center cursor-pointer group transition shrink-0 active:scale-95"
          >
            <EmblemLogo size="md" showSubtitle={true} />
          </div>

          {/* Navigation Links for Authenticated Users */}
          {user && (
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => handleTabChange('overview')}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 active:scale-95 ${
                  currentTab === 'overview'
                    ? 'bg-purple-950/90 text-amber-300 font-bold border border-purple-800/60 shadow-xs'
                    : 'text-purple-200/80 hover:text-amber-300 hover:bg-purple-950/50'
                }`}
              >
                <Layers className="w-4 h-4 text-amber-400" />
                Dashibodi
              </button>

              <button
                onClick={() => handleTabChange('pledges')}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 active:scale-95 ${
                  currentTab === 'pledges'
                    ? 'bg-purple-950/90 text-amber-300 font-bold border border-purple-800/60 shadow-xs'
                    : 'text-purple-200/80 hover:text-amber-300 hover:bg-purple-950/50'
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-amber-400" />
                Ahadi Zangu
              </button>

              <button
                onClick={() => handleTabChange('contributions')}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 active:scale-95 ${
                  currentTab === 'contributions'
                    ? 'bg-purple-950/90 text-amber-300 font-bold border border-purple-800/60 shadow-xs'
                    : 'text-purple-200/80 hover:text-amber-300 hover:bg-purple-950/50'
                }`}
              >
                <Receipt className="w-4 h-4 text-emerald-400" />
                Utoaji & Stakabadhi
              </button>

              <button
                onClick={() => handleTabChange('reports')}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 active:scale-95 ${
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
                  onClick={() => handleTabChange('admin')}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 active:scale-95 ${
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

          {/* Action Buttons & Profile Area - Clean Non-Overlapping Group */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Fast Action Buttons - Hidden on very small screens, responsive */}
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      onOpenContributionModal();
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-purple-950 hover:from-amber-300 hover:to-amber-500 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Receipt className="w-3.5 h-3.5 text-purple-950" />
                    <span>Rekodi Sadaka</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      onOpenPledgeModal();
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1d0e33] text-amber-300 border border-purple-700/80 hover:bg-purple-900 transition-all flex items-center gap-1 shadow-xs active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Weka Ahadi</span>
                  </button>
                </div>

                {/* Communication & Refresh Button Group */}
                <div className="flex items-center gap-1.5 bg-[#170a2a] p-1 rounded-2xl border border-purple-800/60">
                  {onRefreshData && (
                    <button
                      onClick={handleRefreshClick}
                      disabled={isRefreshing}
                      className="p-2 rounded-xl hover:bg-purple-900/70 text-amber-300 hover:text-white transition active:scale-90"
                      title="Onyesha Upya (Refresh Data)"
                    >
                      <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                    </button>
                  )}

                  {onOpenMessages && (
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onOpenMessages();
                      }}
                      className="relative p-2 rounded-xl hover:bg-purple-900/70 text-purple-200 hover:text-white transition active:scale-90"
                      title="Mawasiliano na Ujumbe"
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      {unreadMessagesCount > 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-indigo-500 text-white shadow-xs">
                          {unreadMessagesCount}
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenNotifications && (
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onOpenNotifications();
                      }}
                      className="relative p-2 rounded-xl hover:bg-purple-900/70 text-purple-200 hover:text-white transition active:scale-90"
                      title="Arifa na Taarifa"
                    >
                      <Bell className="w-4 h-4 text-amber-400" />
                      {unreadNotificationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-xs animate-pulse">
                          {unreadNotificationsCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Profile Pill */}
                <div className="flex items-center gap-2 bg-[#1a0e30] border border-purple-800/60 rounded-full py-1 px-2.5 sm:px-3 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-purple-900 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/40 shrink-0">
                    {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'M'}
                  </div>
                  <div className="flex flex-col text-left hidden sm:block">
                    <span className="text-xs font-bold text-slate-100 leading-tight truncate max-w-[110px] block">
                      {profile?.full_name || user.email}
                    </span>
                    <span className="text-[10px] text-amber-400 font-medium block">
                      {profile?.role === 'admin' ? 'Msimamizi Mkuu' : (profile?.partner_category || 'Mshirika')}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic('warning');
                      signOut();
                    }}
                    className="p-1 rounded-full text-purple-300 hover:text-rose-400 hover:bg-rose-950/50 transition active:scale-90"
                    title="Ondoka (Logout)"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {onRefreshData && (
                  <button
                    onClick={handleRefreshClick}
                    disabled={isRefreshing}
                    className="p-2 rounded-xl bg-[#1a0e30] border border-purple-800/60 text-amber-300 hover:text-white transition active:scale-90"
                    title="Onyesha Upya (Refresh Data)"
                  >
                    <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                )}
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onOpenLogin();
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-amber-200 hover:bg-purple-950/60 transition flex items-center gap-1.5 active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Ingia</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onOpenRegister();
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-900 to-purple-800 text-amber-300 hover:from-purple-800 hover:to-purple-700 shadow-sm transition flex items-center gap-1.5 border border-amber-500/30 active:scale-95"
                >
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  <span>Kuwa Mshirika</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar - Fixed spacing and clean pill styling */}
        {user && (
          <div className="lg:hidden flex items-center justify-around py-2 border-t border-purple-900/60 text-xs bg-[#130823]">
            <button
              onClick={() => handleTabChange('overview')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition active:scale-95 ${
                currentTab === 'overview' ? 'text-amber-300 font-bold bg-purple-950 border border-purple-800/60' : 'text-purple-300'
              }`}
            >
              Dashibodi
            </button>
            <button
              onClick={() => handleTabChange('pledges')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition active:scale-95 ${
                currentTab === 'pledges' ? 'text-amber-300 font-bold bg-purple-950 border border-purple-800/60' : 'text-purple-300'
              }`}
            >
              Ahadi
            </button>
            <button
              onClick={() => handleTabChange('contributions')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition active:scale-95 ${
                currentTab === 'contributions' ? 'text-amber-300 font-bold bg-purple-950 border border-purple-800/60' : 'text-purple-300'
              }`}
            >
              Utoaji
            </button>
            <button
              onClick={() => handleTabChange('reports')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition active:scale-95 ${
                currentTab === 'reports' ? 'text-amber-300 font-bold bg-purple-950 border border-purple-800/60' : 'text-purple-300'
              }`}
            >
              Ripoti
            </button>
            {isAdmin && (
              <button
                onClick={() => handleTabChange('admin')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition active:scale-95 ${
                  currentTab === 'admin' ? 'text-purple-950 bg-amber-400 font-black' : 'text-amber-300 bg-amber-950/40 border border-amber-500/30'
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
