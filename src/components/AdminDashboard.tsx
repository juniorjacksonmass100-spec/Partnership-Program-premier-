import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Profile, 
  Pledge, 
  Contribution, 
  Expense, 
  TimeFilter 
} from '../types/database.types';
import { 
  formatTZS, 
  formatDateSwahili, 
  exportToExcel 
} from '../utils/formatters';
import { 
  ShieldCheck, 
  Users, 
  HeartHandshake, 
  Receipt, 
  TrendingDown, 
  Wallet, 
  FileSpreadsheet, 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Printer, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter,
  Radio,
  Sparkles
} from 'lucide-react';

interface AdminDashboardProps {
  allPartners: Profile[];
  allPledges: Pledge[];
  allContributions: Contribution[];
  allExpenses: Expense[];
  onOpenPledgeModal: () => void;
  onOpenContributionModal: () => void;
  onOpenExpenseModal: () => void;
  onViewReceipt: (contribution: Contribution) => void;
  onOpenManageNews?: () => void;
  onOpenManageTestimonials?: () => void;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  allPartners,
  allPledges,
  allContributions,
  allExpenses,
  onOpenPledgeModal,
  onOpenContributionModal,
  onOpenExpenseModal,
  onViewReceipt,
  onOpenManageNews,
  onOpenManageTestimonials,
  onRefreshData,
}) => {
  const { profile } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<
    'overview' | 'partners' | 'pledges' | 'contributions' | 'expenses' | 'reports'
  >('overview');

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Time Filter Helper
  const filterByTime = (dateStr: string) => {
    if (timeFilter === 'all') return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (timeFilter === 'week') {
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= oneWeekAgo;
    }
    if (timeFilter === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (timeFilter === 'year') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // 2. Filtered Collections
  const filteredContributions = useMemo(() => {
    return allContributions.filter((c) => {
      const matchTime = filterByTime(c.contribution_date);
      if (!matchTime) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const pName = c.profiles?.full_name?.toLowerCase() || '';
      const rNum = c.receipt_number?.toLowerCase() || '';
      const cat = c.category?.toLowerCase() || '';
      return pName.includes(q) || rNum.includes(q) || cat.includes(q);
    });
  }, [allContributions, timeFilter, searchQuery]);

  const filteredPledges = useMemo(() => {
    return allPledges.filter((p) => {
      const matchTime = filterByTime(p.pledge_date);
      if (!matchTime) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const pName = p.profiles?.full_name?.toLowerCase() || '';
      const num = p.pledge_number?.toLowerCase() || '';
      const title = p.title?.toLowerCase() || '';
      return pName.includes(q) || num.includes(q) || title.includes(q);
    });
  }, [allPledges, timeFilter, searchQuery]);

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((e) => {
      const matchTime = filterByTime(e.expense_date);
      if (!matchTime) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.title?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        e.expense_number?.toLowerCase().includes(q)
      );
    });
  }, [allExpenses, timeFilter, searchQuery]);

  // 3. High Level Financial KPIs
  const totalPledged = useMemo(() => {
    return filteredPledges.reduce((sum, p) => sum + (p.target_amount || 0), 0);
  }, [filteredPledges]);

  const totalContributionsAmount = useMemo(() => {
    return filteredContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [filteredContributions]);

  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const netTreasury = totalContributionsAmount - totalExpensesAmount;

  // 4. Excel Exports
  const exportContributionsExcel = () => {
    const data = filteredContributions.map((c, i) => ({
      Na: i + 1,
      'Namba ya Stakabadhi': c.receipt_number,
      'Jina la Mshirika': c.profiles?.full_name || 'Mshirika',
      'Kituo cha Ibada': c.profiles?.fellowship_center || '-',
      'Kiasi (TZS)': c.amount,
      'Tarehe ya Sadaka': c.contribution_date,
      'Kategoria': c.category,
      'Njia ya Malipo': c.payment_method,
      'Kumbukumbu ya Muamala': c.transaction_reference || '-',
    }));
    exportToExcel(data, `Michango_Jerusalem_Ministry_${timeFilter}`, 'Michango');
  };

  const exportPledgesExcel = () => {
    const data = filteredPledges.map((p, i) => ({
      Na: i + 1,
      'Namba ya Ahadi': p.pledge_number,
      'Mshirika': p.profiles?.full_name || 'Mshirika',
      'Kusudi / Mradi': p.title,
      'Kiasi cha Ahadi (TZS)': p.target_amount,
      'Tarehe ya Kuweka': p.pledge_date,
      'Tarehe ya Kukamilisha': p.due_date,
      'Hali': p.status === 'completed' ? 'Imekamilika' : 'Inaendelea',
    }));
    exportToExcel(data, `Ahadi_Jerusalem_Ministry_${timeFilter}`, 'Ahadi za Ushirika');
  };

  const exportExpensesExcel = () => {
    const data = filteredExpenses.map((e, i) => ({
      Na: i + 1,
      'Namba ya Matumizi': e.expense_number,
      'Maelezo ya Matumizi': e.title,
      'Kategoria': e.category,
      'Kiasi (TZS)': e.amount,
      'Tarehe ya Matumizi': e.expense_date,
      'Namba ya Vocha': e.receipt_ref || '-',
    }));
    exportToExcel(data, `Matumizi_Jerusalem_Ministry_${timeFilter}`, 'Matumizi ya Huduma');
  };

  // Toggle user role (Partner <-> Admin)
  const handleToggleAdminRole = async (targetUserId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'partner' : 'admin';
    const confirmMsg = newRole === 'admin' 
      ? 'Je, una uhakika unataka kumpandisha mshirika huyu kuwa Msimamizi Mkuu (Admin)?'
      : 'Je, una uhakika unataka kubadilisha hadhi ya msimamizi huyu kuwa Mshirika wa kawaida?';

    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUserId);

      if (error) throw error;
      onRefreshData();
    } catch (err: any) {
      alert(`Hitilafu: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Jopo Salama la Utawala (Admin Management Area)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-wide">
              Usimamizi wa Ushirika & Hazina ya Huduma
            </h1>
            <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl">
              Tazama taarifa za washirika wote, ahadi, michango halisi, na rekodi matumizi ya huduma kwa uwazi na uaminifu kamili.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenManageNews && (
              <button
                onClick={onOpenManageNews}
                className="px-3.5 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-amber-300 font-bold text-xs border border-purple-700 transition flex items-center gap-1.5 shadow-sm"
                title="Dhibiti matangazo ya habari za huduma"
              >
                <Radio className="w-4 h-4 text-amber-400" />
                <span>Habari za Huduma</span>
              </button>
            )}
            {onOpenManageTestimonials && (
              <button
                onClick={onOpenManageTestimonials}
                className="px-3.5 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-amber-300 font-bold text-xs border border-purple-700 transition flex items-center gap-1.5 shadow-sm"
                title="Kagua na idhinisha shuhuda za washirika"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Shuhuda za Washirika</span>
              </button>
            )}
            <button
              onClick={onOpenContributionModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <Receipt className="w-4 h-4" />
              <span>Rekodi Mchango</span>
            </button>
            <button
              onClick={onOpenExpenseModal}
              className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <TrendingDown className="w-4 h-4" />
              <span>Rekodi Matumizi</span>
            </button>
          </div>
        </div>

        {/* Global Financial Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider block">
              Washirika Waliosajiliwa
            </span>
            <span className="text-xl sm:text-2xl font-serif font-black text-white mt-1 block">
              {allPartners.length}
            </span>
            <span className="text-[10px] text-purple-300 block">Kwenye Supabase</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider block">
              Jumla ya Ahadi
            </span>
            <span className="text-xl sm:text-2xl font-serif font-black text-amber-300 mt-1 block">
              {formatTZS(totalPledged)}
            </span>
            <span className="text-[10px] text-purple-300 block">{filteredPledges.length} Ahadi</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
              Michango / Mapato (+)
            </span>
            <span className="text-xl sm:text-2xl font-serif font-black text-emerald-300 mt-1 block">
              {formatTZS(totalContributionsAmount)}
            </span>
            <span className="text-[10px] text-emerald-400 block">{filteredContributions.length} Miamala</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-rose-200 uppercase tracking-wider block">
              Matumizi ya Huduma (-)
            </span>
            <span className="text-xl sm:text-2xl font-serif font-black text-rose-300 mt-1 block">
              {formatTZS(totalExpensesAmount)}
            </span>
            <span className="text-[10px] text-rose-400 block">{filteredExpenses.length} Matumizi</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-amber-400/30 backdrop-blur-xs col-span-2 lg:col-span-1">
            <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider block">
              Baki Halisi ya Hazina
            </span>
            <span className={`text-xl sm:text-2xl font-serif font-black mt-1 block ${netTreasury >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
              {formatTZS(netTreasury)}
            </span>
            <span className="text-[10px] text-amber-200/80 block">Mapato dhidi ya Matumizi</span>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-800/40 pb-3">
        <div className="flex flex-wrap gap-1 bg-[#1a0e2b] border border-purple-800/40 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`px-3 py-2 rounded-xl transition ${
              activeAdminTab === 'overview'
                ? 'bg-purple-900 text-amber-300 shadow-xs'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            Muhtasari wa Fedha
          </button>
          <button
            onClick={() => setActiveAdminTab('partners')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeAdminTab === 'partners'
                ? 'bg-purple-900 text-amber-300 shadow-xs'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Washirika ({allPartners.length})</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('pledges')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeAdminTab === 'pledges'
                ? 'bg-purple-900 text-amber-300 shadow-xs'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Ahadi Zote ({allPledges.length})</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('contributions')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeAdminTab === 'contributions'
                ? 'bg-purple-900 text-amber-300 shadow-xs'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Michango Yote ({allContributions.length})</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('expenses')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeAdminTab === 'expenses'
                ? 'bg-purple-900 text-amber-300 shadow-xs'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Matumizi ({allExpenses.length})</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('reports')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeAdminTab === 'reports'
                ? 'bg-purple-900 text-amber-300 shadow-xs'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ripoti & Hamisha Excel</span>
          </button>
        </div>

        {/* Global Filters: Time period and search */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#1a0e2b] border border-purple-800/40 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-2.5 py-1 rounded-lg ${timeFilter === 'all' ? 'bg-purple-900 text-amber-300 font-bold' : 'text-purple-300 hover:text-white'}`}
            >
              Kipindi Chote
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-2.5 py-1 rounded-lg ${timeFilter === 'week' ? 'bg-purple-900 text-amber-300 font-bold' : 'text-purple-300 hover:text-white'}`}
            >
              Wiki Hii
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-2.5 py-1 rounded-lg ${timeFilter === 'month' ? 'bg-purple-900 text-amber-300 font-bold' : 'text-purple-300 hover:text-white'}`}
            >
              Mwezi Huu
            </button>
            <button
              onClick={() => setTimeFilter('year')}
              className={`px-2.5 py-1 rounded-lg ${timeFilter === 'year' ? 'bg-purple-900 text-amber-300 font-bold' : 'text-purple-300 hover:text-white'}`}
            >
              Mwaka Huu
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tafuta jina la mshirika, namba ya stakabadhi, ahadi, au kategoria..."
          className="w-full pl-9 pr-3 py-2 text-xs border border-purple-800/60 rounded-xl bg-[#170b28] text-slate-100 placeholder-purple-300/50 focus:ring-2 focus:ring-purple-600 outline-hidden"
        />
      </div>

      {/* TAB 1: Financial Overview (Muhtasari wa Fedha) */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Giving vs Expenses Comparison Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <h3 className="font-serif font-bold text-base text-purple-950 mb-4 flex items-center justify-between">
                <span>Uwiano wa Michango dhidi ya Matumizi</span>
                <span className="text-xs font-sans text-slate-500 font-normal">Kipindi: {timeFilter}</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-700 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Michango Iliyopokelewa
                    </span>
                    <span className="font-serif text-sm text-slate-900">{formatTZS(totalContributionsAmount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-emerald-600 h-3 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-rose-700 flex items-center gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5" /> Gharama & Matumizi
                    </span>
                    <span className="font-serif text-sm text-slate-900">{formatTZS(totalExpensesAmount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-rose-600 h-3 rounded-full"
                      style={{
                        width: `${totalContributionsAmount > 0 ? Math.min(100, Math.round((totalExpensesAmount / totalContributionsAmount) * 100)) : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-purple-950">Hazina Halisi Inayobaki:</span>
                  <span className={`text-base font-serif font-black ${netTreasury >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatTZS(netTreasury)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action & Ministry Highlights */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-purple-950 mb-2">
                  Vitendo vya Haraka vya Utawala
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Tekeleza majukumu ya hazina na usimamizi wa washirika moja kwa moja kwenye Supabase.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={onOpenContributionModal}
                    className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left transition flex items-center gap-2.5"
                  >
                    <Receipt className="w-5 h-5 text-purple-900 shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-purple-950 block">Pokea Mchango</span>
                      <span className="text-[10px] text-purple-700">Tengeneza stakabadhi</span>
                    </div>
                  </button>

                  <button
                    onClick={onOpenExpenseModal}
                    className="p-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-left transition flex items-center gap-2.5"
                  >
                    <TrendingDown className="w-5 h-5 text-rose-800 shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-rose-950 block">Rekodi Gharama</span>
                      <span className="text-[10px] text-rose-700">Weka matumizi ya kanisa</span>
                    </div>
                  </button>

                  <button
                    onClick={onOpenPledgeModal}
                    className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition flex items-center gap-2.5"
                  >
                    <HeartHandshake className="w-5 h-5 text-amber-800 shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-amber-950 block">Sajili Ahadi Mpya</span>
                      <span className="text-[10px] text-amber-700">Weka ahadi ya mshirika</span>
                    </div>
                  </button>

                  <button
                    onClick={exportContributionsExcel}
                    className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition flex items-center gap-2.5"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-emerald-800 shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-emerald-950 block">Pakua Excel</span>
                      <span className="text-[10px] text-emerald-700">Hamisha ripoti rasmi</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 italic">
                * Data zote husasishwa moja kwa moja kupitia Supabase Realtime bila kuhitaji kurefresh kurasa.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Partners (Washirika) */}
      {activeAdminTab === 'partners' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-purple-950">
                Orodha ya Washirika Waliosajiliwa ({allPartners.length})
              </h3>
              <p className="text-xs text-slate-500">
                Washirika wote waliojisajili kupitia Supabase Auth na wasifu wao.
              </p>
            </div>
            <button
              onClick={() => {
                const data = allPartners.map((p, i) => ({
                  Na: i + 1,
                  'Jina Kamili': p.full_name,
                  'Namba ya Simu': p.phone_number || '-',
                  'Kituo cha Ibada': p.fellowship_center || '-',
                  'Kiwango cha Ushirika': p.partner_category || '-',
                  'Hadhi': p.role === 'admin' ? 'Msimamizi (Admin)' : 'Mshirika',
                  'Tarehe ya Usajili': p.created_at,
                }));
                exportToExcel(data, 'Washirika_Jerusalem_Ministry', 'Washirika');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Hamisha Washirika (Excel)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Mshirika</th>
                  <th className="py-3 px-3">Simu</th>
                  <th className="py-3 px-3">Tawi / Kituo</th>
                  <th className="py-3 px-3">Kategoria</th>
                  <th className="py-3 px-3 text-center">Hadhi / Jukumu</th>
                  <th className="py-3 px-3 text-right">Usimamizi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allPartners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{p.full_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{p.id.slice(0, 8)}...</span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{p.phone_number || '-'}</td>
                    <td className="py-3 px-3 text-slate-700">{p.fellowship_center || 'Makao Makuu'}</td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-purple-50 text-purple-900 font-medium border border-purple-200">
                        {p.partner_category || 'Mshirika wa Kawaida'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {p.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-purple-950 border border-amber-300">
                          <ShieldCheck className="w-3 h-3 text-purple-900" />
                          Msimamizi (Admin)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                          Mshirika
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {p.id !== profile?.id && (
                        <button
                          onClick={() => handleToggleAdminRole(p.id, p.role)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition text-slate-600 hover:text-purple-900 hover:bg-purple-50"
                        >
                          {p.role === 'admin' ? 'Shusha Hadhi' : 'Pandisha Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: All Pledges (Ahadi Zote) */}
      {activeAdminTab === 'pledges' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-purple-950">
                Ahadi Zote za Ushirika ({filteredPledges.length})
              </h3>
              <p className="text-xs text-slate-500">
                Orodha ya ahadi zote zilizowekwa na washirika katika kanzidata ya Supabase.
              </p>
            </div>
            <button
              onClick={exportPledgesExcel}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Hamisha Ahadi (Excel)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Namba</th>
                  <th className="py-3 px-3">Mshirika</th>
                  <th className="py-3 px-3">Mradi / Kusudi</th>
                  <th className="py-3 px-3 text-right">Kiasi cha Ahadi</th>
                  <th className="py-3 px-3">Tarehe ya Kuweka</th>
                  <th className="py-3 px-3">Tarehe ya Mwisho</th>
                  <th className="py-3 px-3 text-center">Hali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPledges.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-purple-950">{p.pledge_number}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {p.profiles?.full_name || 'Mshirika'}
                    </td>
                    <td className="py-3 px-3 text-slate-700">{p.title}</td>
                    <td className="py-3 px-3 text-right font-serif font-bold text-slate-900">
                      {formatTZS(p.target_amount)}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{formatDateSwahili(p.pledge_date)}</td>
                    <td className="py-3 px-3 text-slate-600">{formatDateSwahili(p.due_date)}</td>
                    <td className="py-3 px-3 text-center">
                      {p.status === 'completed' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Imekamilika
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900">
                          Inaendelea
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: All Contributions (Michango Yote) */}
      {activeAdminTab === 'contributions' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-purple-950">
                Kumbukumbu Zote za Michango & Utoaji ({filteredContributions.length})
              </h3>
              <p className="text-xs text-slate-500">
                Miamala yote ya utoaji iliyorekodiwa na stakabadhi zake rasmi.
              </p>
            </div>
            <button
              onClick={exportContributionsExcel}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Hamisha Michango (Excel)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Stakabadhi</th>
                  <th className="py-3 px-3">Mshirika</th>
                  <th className="py-3 px-3">Tarehe</th>
                  <th className="py-3 px-3">Kategoria</th>
                  <th className="py-3 px-3">Njia ya Malipo</th>
                  <th className="py-3 px-3 text-right">Kiasi (TZS)</th>
                  <th className="py-3 px-3 text-right">Stakabadhi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContributions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-purple-950">{c.receipt_number}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{c.profiles?.full_name || 'Mshirika'}</td>
                    <td className="py-3 px-3 text-slate-600">{formatDateSwahili(c.contribution_date)}</td>
                    <td className="py-3 px-3 text-slate-700">{c.category}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                        {c.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-serif font-black text-slate-900 text-sm">
                      {formatTZS(c.amount)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onViewReceipt(c)}
                        className="px-2 py-1 rounded bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 font-semibold text-xs transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-purple-700" />
                        <span>Tazama</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Expenses (Matumizi ya Huduma) */}
      {activeAdminTab === 'expenses' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-rose-950">
                Gharama na Matumizi ya Huduma ({filteredExpenses.length})
              </h3>
              <p className="text-xs text-slate-500">
                Matumizi yote yaliyorekodiwa kutoka kwenye hazina ya huduma.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenExpenseModal}
                className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Rekodi Gharama</span>
              </button>
              <button
                onClick={exportExpensesExcel}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-700" />
                <span>Hamisha Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Namba ya Matumizi</th>
                  <th className="py-3 px-3">Maelezo</th>
                  <th className="py-3 px-3">Kategoria</th>
                  <th className="py-3 px-3">Tarehe</th>
                  <th className="py-3 px-3">Namba ya Vocha</th>
                  <th className="py-3 px-3 text-right">Kiasi (TZS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-rose-900">{e.expense_number}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{e.title}</span>
                      {e.description && <span className="text-[10px] text-slate-400 block">{e.description}</span>}
                    </td>
                    <td className="py-3 px-3 text-slate-700">{e.category}</td>
                    <td className="py-3 px-3 text-slate-600">{formatDateSwahili(e.expense_date)}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{e.receipt_ref || '-'}</td>
                    <td className="py-3 px-3 text-right font-serif font-black text-rose-800 text-sm">
                      {formatTZS(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Reports & Excel Exports */}
      {activeAdminTab === 'reports' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif font-bold text-lg text-purple-950">
              Ripoti za Kina za Utoaji na Matumizi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chagua na pakua ripoti za kila wiki, mwezi, au mwaka zikiwa katika umbizo la Excel (.xlsx).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-purple-900 uppercase">Ripoti ya Michango (Giving Report)</span>
                <p className="text-xs text-slate-600 mt-1">
                  Inajumuisha stakabadhi zote, majina ya washirika, njia za malipo na mchanganuo wa miradi.
                </p>
              </div>
              <button
                onClick={exportContributionsExcel}
                className="mt-4 w-full py-2.5 bg-purple-900 hover:bg-purple-800 text-amber-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Pakua Ripoti ya Michango</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 uppercase">Ripoti ya Ahadi za Ushirika</span>
                <p className="text-xs text-slate-600 mt-1">
                  Inajumuisha ahadi zote, tarehe za mwisho, hadhi za utimilifu na kiasi kilicholipwa.
                </p>
              </div>
              <button
                onClick={exportPledgesExcel}
                className="mt-4 w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-purple-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Pakua Ripoti ya Ahadi</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-rose-900 uppercase">Ripoti ya Matumizi ya Hazina</span>
                <p className="text-xs text-slate-600 mt-1">
                  Inajumuisha gharama zote za uendeshaji, uinjilisti, vifaa vya ibada, na misaada ya kijamii.
                </p>
              </div>
              <button
                onClick={exportExpensesExcel}
                className="mt-4 w-full py-2.5 bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Pakua Ripoti ya Matumizi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
