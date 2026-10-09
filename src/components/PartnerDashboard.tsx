import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Pledge, Contribution, TimeFilter, MinistryNews } from '../types/database.types';
import { 
  formatTZS, 
  formatDateSwahili, 
  getDaysUntilDue, 
  exportToExcel 
} from '../utils/formatters';
import { 
  HeartHandshake, 
  Receipt, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet, 
  PlusCircle, 
  Eye, 
  Filter, 
  TrendingUp, 
  CreditCard,
  Sparkles,
  Radio,
  Flame,
  ChevronRight,
  ChevronLeft,
  Search,
  MessageSquare,
  RefreshCcw
} from 'lucide-react';
import { PartnershipGivingCard } from './PartnershipGivingCard';
import { triggerHaptic } from '../utils/haptics';

interface PartnerDashboardProps {
  pledges: Pledge[];
  contributions: Contribution[];
  loading: boolean;
  onOpenPledgeModal: () => void;
  onOpenContributionModal: (pledgeId?: string) => void;
  onViewReceipt: (contribution: Contribution) => void;
  onOpenTestimonialModal?: () => void;
  onOpenMessages?: () => void;
  onRefreshData?: () => void;
  currentSubTab?: 'overview' | 'pledges' | 'contributions' | 'reports';
  newsList?: MinistryNews[];
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({
  pledges,
  contributions,
  loading,
  onOpenPledgeModal,
  onOpenContributionModal,
  onViewReceipt,
  onOpenTestimonialModal,
  onOpenMessages,
  onRefreshData,
  currentSubTab = 'overview',
  newsList = [],
}) => {
  const { profile, user } = useAuth();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNewsIdx, setActiveNewsIdx] = useState(0);

  const activeNewsItems = useMemo(() => {
    return newsList.filter((n) => n.is_active);
  }, [newsList]);

  // 1. Filtered contributions by week, month, year, or all
  const filteredContributions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return contributions.filter((item) => {
      // Search text match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchReceipt = item.receipt_number?.toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        const matchMethod = item.payment_method?.toLowerCase().includes(q);
        const matchRef = item.transaction_reference?.toLowerCase().includes(q);
        if (!matchReceipt && !matchCategory && !matchMethod && !matchRef) {
          return false;
        }
      }

      if (timeFilter === 'all') return true;

      const cDate = new Date(item.contribution_date);
      if (isNaN(cDate.getTime())) return true;

      if (timeFilter === 'week') {
        // Last 7 days
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return cDate >= oneWeekAgo;
      }

      if (timeFilter === 'month') {
        // Current month & year
        return (
          cDate.getMonth() === now.getMonth() &&
          cDate.getFullYear() === now.getFullYear()
        );
      }

      if (timeFilter === 'year') {
        // Current year
        return cDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [contributions, timeFilter, searchQuery]);

  // 2. Personal Giving Totals & Metrics
  const totalPledged = useMemo(() => {
    return pledges.reduce((sum, p) => sum + (p.target_amount || 0), 0);
  }, [pledges]);

  const totalContributed = useMemo(() => {
    return contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [contributions]);

  const remainingBalance = Math.max(0, totalPledged - totalContributed);
  const overallProgress = totalPledged > 0 ? Math.min(100, Math.round((totalContributed / totalPledged) * 100)) : 0;

  // 3. Due Date Reminders (Approaching or Overdue pledges)
  const dueReminders = useMemo(() => {
    return pledges
      .filter((p) => p.status === 'active')
      .map((p) => {
        const dueInfo = getDaysUntilDue(p.due_date);
        // Find total paid towards this specific pledge
        const paidTowards = contributions
          .filter((c) => c.pledge_id === p.id)
          .reduce((sum, c) => sum + c.amount, 0);
        const remainingPledge = Math.max(0, p.target_amount - paidTowards);

        return {
          ...p,
          paidTowards,
          remainingPledge,
          dueInfo,
        };
      })
      .filter((p) => p.remainingPledge > 0 && (p.dueInfo.isOverdue || p.dueInfo.isApproaching))
      .sort((a, b) => a.dueInfo.days - b.dueInfo.days);
  }, [pledges, contributions]);

  // 4. Excel Export of Personal Giving
  const handleExportExcel = () => {
    const exportData = filteredContributions.map((item, idx) => ({
      Na: idx + 1,
      'Namba ya Stakabadhi': item.receipt_number,
      'Tarehe ya Utoaji': item.contribution_date,
      'Kiasi (TZS)': item.amount,
      'Kategoria ya Sadaka': item.category,
      'Njia ya Malipo': item.payment_method,
      'Kumbukumbu ya Muamala': item.transaction_reference || '-',
      'Dokezo': item.notes || '-',
    }));

    exportToExcel(
      exportData,
      `Michango_${profile?.full_name?.replace(/\s+/g, '_') || 'Mshirika'}_${new Date().toISOString().split('T')[0]}`,
      'Michango Yangu'
    );
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Partner Profile Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-purple-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-purple-950">
                {profile?.partner_category || 'Mshirika wa Huduma'}
              </span>
              <span className="text-purple-300 text-xs font-medium">
                Kituo: {profile?.fellowship_center || 'Makao Makuu'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
              Shalom, {profile?.full_name || user?.email}!
            </h1>
            <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl">
              Karibu kwenye dashibodi yako binafsi ya ushirika na utoaji wa Jerusalem Ministry of Gospel. 
              Mungu akubariki kwa uaminifu wako katika ufalme wake.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onRefreshData && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onRefreshData();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-amber-300 font-bold text-xs border border-purple-600/70 transition flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Bofya kuleta data mpya zilizosasishwa"
              >
                <RefreshCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Onyesha Upya</span>
              </button>
            )}
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenContributionModal();
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-purple-950 font-bold text-xs hover:from-amber-300 hover:to-amber-500 transition flex items-center gap-1.5 shadow-md order-1 sm:order-1 active:scale-95"
            >
              <Receipt className="w-4 h-4" />
              <span>Rekodi Sadaka</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenPledgeModal();
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-900/90 hover:bg-purple-800 text-amber-300 font-bold text-xs border border-purple-600/80 transition flex items-center gap-1.5 shadow-sm order-2 sm:order-2 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Weka Ahadi Mpya</span>
            </button>
            {onOpenMessages && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenMessages();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-[#200e3d] hover:bg-purple-900 text-indigo-300 hover:text-white font-semibold text-xs border border-indigo-600/50 transition flex items-center gap-1.5 shadow-sm order-3 sm:order-3 active:scale-95"
                title="Tuma ujumbe au ombi kwa Mchungaji / Admin"
              >
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Ujumbe kwa Mchungaji</span>
              </button>
            )}
            {onOpenTestimonialModal && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenTestimonialModal();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-amber-300 font-semibold text-xs border border-purple-700/60 transition flex items-center gap-1.5 shadow-sm order-4 sm:order-4 active:scale-95"
                title="Toa ushuhuda wa kile Mungu amekutendea"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Toa Ushuhuda</span>
              </button>
            )}
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-purple-900/60 rounded-2xl p-4 border border-purple-700/50 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
              Jumla ya Ahadi Zangu
            </span>
            <span className="text-lg sm:text-2xl font-serif font-black text-amber-300 mt-1 block">
              {formatTZS(totalPledged)}
            </span>
            <span className="text-[11px] text-purple-300 block mt-0.5">
              {pledges.length} {pledges.length === 1 ? 'Ahadi' : 'Ahadi zimesajiliwa'}
            </span>
          </div>

          <div className="bg-purple-900/60 rounded-2xl p-4 border border-purple-700/50 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
              Jumla Niliyotoa (Michango)
            </span>
            <span className="text-lg sm:text-2xl font-serif font-black text-emerald-300 mt-1 block">
              {formatTZS(totalContributed)}
            </span>
            <span className="text-[11px] text-emerald-400 block mt-0.5">
              {contributions.length} {contributions.length === 1 ? 'Muamala' : 'Miamala ya utoaji'}
            </span>
          </div>

          <div className="bg-purple-900/60 rounded-2xl p-4 border border-purple-700/50 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
              Baki ya Ahadi
            </span>
            <span className="text-lg sm:text-2xl font-serif font-black text-white mt-1 block">
              {formatTZS(remainingBalance)}
            </span>
            <span className="text-[11px] text-purple-300 block mt-0.5">
              {remainingBalance === 0 && totalPledged > 0 ? '✓ Ahadi zote zimekamilika!' : 'Kiasi kinachosubiriwa'}
            </span>
          </div>

          <div className="bg-purple-900/60 rounded-2xl p-4 border border-purple-700/50 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
              Kiwango cha Utimizaji
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg sm:text-2xl font-serif font-black text-amber-300">
                {overallProgress}%
              </span>
              <span className="text-xs text-purple-300">imefikiwa</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-purple-950 rounded-full h-2 mt-2 overflow-hidden border border-purple-700">
              <div
                className="bg-gradient-to-r from-amber-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Partnership Giving Account Box */}
      <PartnershipGivingCard onRecordContribution={() => onOpenContributionModal()} />

      {/* Animated TV News Card for Individual Partner Page */}
      {activeNewsItems.length > 0 && (
        <div className="bg-[#150a24] rounded-2xl p-4 sm:p-5 border border-purple-800/60 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3 pb-3 border-b border-purple-900/50">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <span>Matangazo ya Moja kwa Moja ya Huduma</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-red-950/80 text-rose-300 border border-red-700/60 text-[10px] font-bold">
                  MBASHARA
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-300 font-medium">
                {activeNewsIdx + 1} ya {activeNewsItems.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveNewsIdx((prev) => (prev - 1 + activeNewsItems.length) % activeNewsItems.length)}
                  className="p-1.5 rounded-lg bg-purple-900/70 hover:bg-purple-800 text-purple-200 hover:text-white transition border border-purple-700/40"
                  title="Tangazo lililotangulia"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveNewsIdx((prev) => (prev + 1) % activeNewsItems.length)}
                  className="p-1.5 rounded-lg bg-purple-900/70 hover:bg-purple-800 text-purple-200 hover:text-white transition border border-purple-700/40"
                  title="Tangazo linalofuata"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Broadcast News Details */}
          {activeNewsItems[activeNewsIdx] && (
            <div className="bg-[#1b0e2f] rounded-xl p-4 border border-purple-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  {activeNewsItems[activeNewsIdx].is_urgent && (
                    <span className="px-2 py-0.5 rounded-sm bg-amber-400 text-purple-950 font-black text-[9px] uppercase tracking-wider animate-pulse">
                      MUHIMU SANA
                    </span>
                  )}
                  {activeNewsItems[activeNewsIdx].category && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-900 text-amber-200 text-[10px] font-semibold border border-purple-700">
                      {activeNewsItems[activeNewsIdx].category}
                    </span>
                  )}
                  <span className="text-[10px] text-purple-400">
                    {formatDateSwahili(activeNewsItems[activeNewsIdx].created_at)}
                  </span>
                </div>
                <h4 className="font-serif font-bold text-sm sm:text-base text-amber-100">
                  {activeNewsItems[activeNewsIdx].title}
                </h4>
                <p className="text-xs text-purple-200/80 mt-1 line-clamp-2 leading-relaxed">
                  {activeNewsItems[activeNewsIdx].content}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      {dueReminders.length > 0 && (
        <div className="bg-[#1f112e] rounded-2xl p-5 border border-amber-500/40 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-200 uppercase tracking-wide">
              Vikumbusho vya Tarehe ya Ahadi (Pledge Due Reminders)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dueReminders.map((p) => (
              <div
                key={p.id}
                className="bg-[#170c26] rounded-xl p-3.5 border border-purple-800/60 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-xs font-bold text-amber-300">{p.pledge_number}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${p.dueInfo.badgeClass}`}>
                      {p.dueInfo.badgeText}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{p.title}</h4>
                  <div className="mt-2 text-xs space-y-0.5 text-purple-200/80">
                    <div className="flex justify-between">
                      <span>Lengo la Ahadi:</span>
                      <span className="font-semibold text-slate-100">{formatTZS(p.target_amount)}</span>
                    </div>
                    <div className="flex justify-between text-amber-300 font-bold">
                      <span>Baki Inayodaiwa:</span>
                      <span>{formatTZS(p.remainingPledge)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-purple-300/70">
                      <span>Tarehe ya Mwisho:</span>
                      <span>{formatDateSwahili(p.due_date)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onOpenContributionModal(p.id)}
                  className="mt-3 w-full py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-purple-950 font-bold text-xs transition flex items-center justify-center gap-1 shadow-xs"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Kamilisha Ahadi Hii</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area: Pledges & Contribution History */}
      <div className="space-y-8">
        {/* SECTION 1: Pledges Table / Cards */}
        <div className="bg-[#150a22] rounded-3xl p-6 sm:p-8 border border-purple-800/40 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-amber-400" />
                <h2 className="font-serif font-bold text-lg text-amber-100">
                  Ahadi Zangu za Ushirika (Pledges)
                </h2>
              </div>
              <p className="text-xs text-purple-300/80 mt-0.5">
                Kumbukumbu za ahadi ulizoweka kwa ajili ya miradi mbalimbali ya Jerusalem Ministry of Gospel.
              </p>
            </div>

            <button
              onClick={onOpenPledgeModal}
              className="px-3.5 py-1.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-amber-300 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs border border-purple-700/50"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Ahadi Mpya</span>
            </button>
          </div>

          {pledges.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-purple-950/30 border border-dashed border-purple-800/60">
              <HeartHandshake className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
              <h3 className="font-bold text-slate-200 text-sm">Bado Hujaweka Ahadi Yoyote</h3>
              <p className="text-xs text-purple-300/70 mt-1 max-w-sm mx-auto">
                Unaweza kuweka ahadi ya utoaji kwa ajili ya ujenzi wa kanisa, uinjilisti, au vyombo vya muziki.
              </p>
              <button
                onClick={onOpenPledgeModal}
                className="mt-4 px-4 py-2 rounded-xl bg-purple-900 text-amber-300 font-bold text-xs hover:bg-purple-800 transition border border-amber-500/30"
              >
                Weka Ahadi Yako ya Kwanza
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-purple-800/40 text-purple-300 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Namba ya Ahadi</th>
                    <th className="py-3 px-3">Mradi / Kusudi</th>
                    <th className="py-3 px-3 text-right">Kiasi cha Ahadi</th>
                    <th className="py-3 px-3 text-right">Kiasi Kilicholipwa</th>
                    <th className="py-3 px-3">Tarehe ya Mwisho</th>
                    <th className="py-3 px-3 text-center">Hali</th>
                    <th className="py-3 px-3 text-right">Kitendo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/30">
                  {pledges.map((p) => {
                    const paidTowards = contributions
                      .filter((c) => c.pledge_id === p.id)
                      .reduce((sum, c) => sum + c.amount, 0);
                    const remaining = Math.max(0, p.target_amount - paidTowards);
                    const isCompleted = p.status === 'completed' || paidTowards >= p.target_amount;
                    const dueInfo = getDaysUntilDue(p.due_date);

                    return (
                      <tr key={p.id} className="hover:bg-purple-950/40 transition">
                        <td className="py-3.5 px-3 font-mono font-bold text-amber-300">
                          {p.pledge_number}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-slate-100 block">{p.title}</span>
                          <span className="text-[11px] text-purple-300/80">{p.category || 'Sadaka ya Ushirika'}</span>
                          {p.notes && <p className="text-[10px] text-purple-400/80 italic mt-0.5">{p.notes}</p>}
                        </td>
                        <td className="py-3.5 px-3 text-right font-serif font-bold text-amber-200">
                          {formatTZS(p.target_amount)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-serif font-bold text-emerald-400">
                          {formatTZS(paidTowards)}
                          {remaining > 0 && (
                            <span className="block text-[10px] font-sans font-normal text-purple-300/70">
                              Baki: {formatTZS(remaining)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-medium text-slate-200 block">
                            {formatDateSwahili(p.due_date)}
                          </span>
                          {!isCompleted && (
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${dueInfo.badgeClass}`}>
                              {dueInfo.badgeText}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Imekamilika
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/40">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              Inaendelea
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {!isCompleted && (
                            <button
                              onClick={() => onOpenContributionModal(p.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
                            >
                              Lipia Ahadi
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 2: Giving / Contribution History & Filters */}
        <div className="bg-[#150a22] rounded-3xl p-6 sm:p-8 border border-purple-800/40 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h2 className="font-serif font-bold text-lg text-amber-100">
                  Historia ya Utoaji na Michango Yangu
                </h2>
              </div>
              <p className="text-xs text-purple-300/80 mt-0.5">
                Taarifa za michango iliyorekodiwa pamoja na stakabadhi rasmi za kielektroniki.
              </p>
            </div>

            {/* Filter Pills & Export */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Time Filter Buttons */}
              <div className="flex bg-[#1d1030] p-1 rounded-xl text-xs font-semibold border border-purple-800/40">
                <button
                  onClick={() => setTimeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    timeFilter === 'all'
                      ? 'bg-purple-900 text-amber-300 font-bold shadow-2xs'
                      : 'text-purple-300 hover:text-white'
                  }`}
                >
                  Yote
                </button>
                <button
                  onClick={() => setTimeFilter('week')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    timeFilter === 'week'
                      ? 'bg-purple-900 text-amber-300 font-bold shadow-2xs'
                      : 'text-purple-300 hover:text-white'
                  }`}
                >
                  Wiki Hii
                </button>
                <button
                  onClick={() => setTimeFilter('month')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    timeFilter === 'month'
                      ? 'bg-purple-900 text-amber-300 font-bold shadow-2xs'
                      : 'text-purple-300 hover:text-white'
                  }`}
                >
                  Mwezi Huu
                </button>
                <button
                  onClick={() => setTimeFilter('year')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    timeFilter === 'year'
                      ? 'bg-purple-900 text-amber-300 font-bold shadow-2xs'
                      : 'text-purple-300 hover:text-white'
                  }`}
                >
                  Mwaka Huu
                </button>
              </div>

              {/* Excel Export Button */}
              <button
                onClick={handleExportExcel}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-xs border border-emerald-600/40 transition flex items-center gap-1.5 shadow-2xs"
                title="Hamisha rekodi kwenye Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hamisha Excel</span>
              </button>
            </div>
          </div>

          {/* Search bar inside contributions */}
          <div className="mb-4 relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tafuta kwa namba ya stakabadhi, kategoria, au njia ya malipo..."
              className="w-full pl-9 pr-3.5 py-2 text-xs border border-purple-700/60 rounded-xl bg-[#160a28] text-white placeholder-purple-300/40 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
            />
          </div>

          {filteredContributions.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-purple-950/30 border border-dashed border-purple-800/60">
              <Receipt className="w-12 h-12 text-purple-400/40 mx-auto mb-2" />
              <h3 className="font-bold text-slate-200 text-sm">Hakuna Michango Iliyopatikana</h3>
              <p className="text-xs text-purple-300/70 mt-1">
                {searchQuery || timeFilter !== 'all'
                  ? 'Hakuna rekodi inayolingana na vichujio ulivyochagua.'
                  : 'Bado hujarekodi mchango wowote.'}
              </p>
              <button
                onClick={() => onOpenContributionModal()}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-600 transition shadow-xs"
              >
                Rekodi Sadaka Sasa
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-purple-800/40 text-purple-300 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Stakabadhi</th>
                    <th className="py-3 px-3">Tarehe</th>
                    <th className="py-3 px-3">Kategoria / Mradi</th>
                    <th className="py-3 px-3">Njia ya Malipo</th>
                    <th className="py-3 px-3 text-right">Kiasi (TZS)</th>
                    <th className="py-3 px-3 text-right">Stakabadhi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/30">
                  {filteredContributions.map((c) => (
                    <tr key={c.id} className="hover:bg-purple-950/40 transition">
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-amber-300 block">{c.receipt_number}</span>
                        {c.transaction_reference && (
                          <span className="text-[10px] font-mono text-purple-300/70 block">Ref: {c.transaction_reference}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-200">
                        {formatDateSwahili(c.contribution_date)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-100 block">{c.category}</span>
                        {c.pledges && (
                          <span className="text-[10px] text-purple-300 block">
                            Ahadi: {c.pledges.pledge_number}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-purple-950/80 text-purple-200 border border-purple-800/50 font-medium">
                          {c.payment_method}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-serif font-black text-sm text-emerald-400">
                        {formatTZS(c.amount)}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => onViewReceipt(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-900/80 hover:bg-purple-800 text-amber-300 border border-purple-700/60 font-semibold text-xs transition flex items-center gap-1 ml-auto shadow-2xs"
                          title="Tazama au chapisha stakabadhi rasmi"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Stakabadhi</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
