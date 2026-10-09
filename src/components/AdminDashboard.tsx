import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  Profile, 
  Pledge, 
  Contribution, 
  Expense, 
  TimeFilter,
  DirectMessage
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
  Radio,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  AlertTriangle,
  MessageSquare,
  Database,
  Send,
  Loader2,
  RefreshCw,
  Phone,
  Building2
} from 'lucide-react';

interface AdminDashboardProps {
  allPartners: Profile[];
  allPledges: Pledge[];
  allContributions: Contribution[];
  allExpenses: Expense[];
  allMessages?: DirectMessage[];
  onOpenPledgeModal: () => void;
  onOpenContributionModal: () => void;
  onOpenExpenseModal: () => void;
  onViewReceipt: (contribution: Contribution) => void;
  onOpenManageNews?: () => void;
  onOpenManageTestimonials?: () => void;
  onOpenMessagingModal?: () => void;
  onOpenWipeDatabaseModal?: () => void;
  onSendMessage?: (receiverId: string, messageText: string) => Promise<void>;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  allPartners,
  allPledges,
  allContributions,
  allExpenses,
  allMessages = [],
  onOpenPledgeModal,
  onOpenContributionModal,
  onOpenExpenseModal,
  onViewReceipt,
  onOpenManageNews,
  onOpenManageTestimonials,
  onOpenMessagingModal,
  onOpenWipeDatabaseModal,
  onSendMessage,
  onRefreshData,
}) => {
  const { user, profile } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<
    'overview' | 'partners' | 'pledges' | 'contributions' | 'expenses' | 'messages' | 'reports' | 'database'
  >('overview');

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete mistake modal states
  const [pledgeToDelete, setPledgeToDelete] = useState<Pledge | null>(null);
  const [deletingPledge, setDeletingPledge] = useState(false);

  const [contribToDelete, setContribToDelete] = useState<Contribution | null>(null);
  const [deletingContrib, setDeletingContrib] = useState(false);

  // In-tab admin messaging states
  const [selectedChatPartnerId, setSelectedChatPartnerId] = useState<string>('');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [replying, setReplying] = useState(false);

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
      const pNum = p.pledge_number?.toLowerCase() || '';
      const title = p.title?.toLowerCase() || '';
      return pName.includes(q) || pNum.includes(q) || title.includes(q);
    });
  }, [allPledges, timeFilter, searchQuery]);

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((e) => {
      const matchTime = filterByTime(e.expense_date);
      if (!matchTime) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = e.title?.toLowerCase() || '';
      const cat = e.category?.toLowerCase() || '';
      const expNum = e.expense_number?.toLowerCase() || '';
      return title.includes(q) || cat.includes(q) || expNum.includes(q);
    });
  }, [allExpenses, timeFilter, searchQuery]);

  // 3. Calculated Totals
  const totalContributionsAmount = useMemo(() => {
    return filteredContributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [filteredContributions]);

  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalPledged = useMemo(() => {
    return filteredPledges.reduce((sum, p) => sum + (Number(p.target_amount) || 0), 0);
  }, [filteredPledges]);

  const netTreasury = totalContributionsAmount - totalExpensesAmount;

  // Unread messages count
  const unreadMessagesCount = useMemo(() => {
    return allMessages.filter((m) => m.receiver_id === user?.id && !m.is_read).length;
  }, [allMessages, user]);

  // 4. Excel Exporters
  const exportContributionsExcel = () => {
    const data = filteredContributions.map((c) => ({
      'Namba ya Stakabadhi': c.receipt_number,
      Mshirika: c.profiles?.full_name || 'Hajulikani',
      Simu: c.profiles?.phone_number || '-',
      Kituo: c.profiles?.fellowship_center || 'Makao Makuu',
      Kiasi: c.amount,
      'Njia ya Malipo': c.payment_method,
      'Kumbukumbu ya Muamala': c.transaction_reference || '-',
      Tarehe: c.contribution_date,
      Kategoria: c.category,
      Maelezo: c.notes || '-',
    }));
    exportToExcel(data, `Michango_Jerusalem_Ministry_${timeFilter}`);
  };

  const exportPledgesExcel = () => {
    const data = filteredPledges.map((p) => ({
      'Namba ya Ahadi': p.pledge_number,
      Mshirika: p.profiles?.full_name || 'Hajulikani',
      Simu: p.profiles?.phone_number || '-',
      'Mradi / Kusudi': p.title,
      Kategoria: p.category || 'Sadaka ya Ushirika',
      'Kiasi cha Ahadi': p.target_amount,
      'Tarehe ya Kuweka': p.pledge_date,
      'Tarehe ya Mwisho': p.due_date,
      Hali: p.status === 'completed' ? 'Imekamilika' : 'Inaendelea',
      Maelezo: p.notes || '-',
    }));
    exportToExcel(data, `Ahadi_Jerusalem_Ministry_${timeFilter}`);
  };

  const exportExpensesExcel = () => {
    const data = filteredExpenses.map((e) => ({
      'Namba ya Matumizi': e.expense_number,
      'Kusudi la Matumizi': e.title,
      Kategoria: e.category,
      Kiasi: e.amount,
      Tarehe: e.expense_date,
      'Namba ya Vocha': e.receipt_ref || '-',
      Maelezo: e.description || '-',
    }));
    exportToExcel(data, `Matumizi_Jerusalem_Ministry_${timeFilter}`);
  };

  // 5. Handle Delete Pledge (Fix for user mistake)
  const handleConfirmDeletePledge = async () => {
    if (!pledgeToDelete) return;
    setDeletingPledge(true);

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('pledges')
          .delete()
          .eq('id', pledgeToDelete.id);

        if (error) throw error;
      }

      setPledgeToDelete(null);
      onRefreshData();
    } catch (err: any) {
      alert(`Hitilafu wakati wa kufuta ahadi: ${err.message}`);
    } finally {
      setDeletingPledge(false);
    }
  };

  // 6. Handle Delete Contribution (Fix for mistake)
  const handleConfirmDeleteContribution = async () => {
    if (!contribToDelete) return;
    setDeletingContrib(true);

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('contributions')
          .delete()
          .eq('id', contribToDelete.id);

        if (error) throw error;
      }

      setContribToDelete(null);
      onRefreshData();
    } catch (err: any) {
      alert(`Hitilafu wakati wa kufuta mchango: ${err.message}`);
    } finally {
      setDeletingContrib(false);
    }
  };

  // 7. Toggle Partner Admin Role
  const handleToggleAdminRole = async (targetUserId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'partner' : 'admin';
    const confirmChange = window.confirm(
      `Je, una uhakika unataka kubadili hadhi ya mtumiaji huyu kuwa ${newRole === 'admin' ? 'Msimamizi (Admin)' : 'Mshirika wa Kawaida'}?`
    );
    if (!confirmChange) return;

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

  // Send admin in-tab reply
  const handleAdminSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedChatPartnerId || replying || !onSendMessage) return;
    setReplying(true);
    try {
      await onSendMessage(selectedChatPartnerId, adminReplyText.trim());
      setAdminReplyText('');
    } catch (err) {
      console.error(err);
    } finally {
      setReplying(false);
    }
  };

  // Active chat partner
  const activeChatPartner = allPartners.find((p) => p.id === selectedChatPartnerId);
  const activeChatMessages = allMessages.filter(
    (m) =>
      (m.sender_id === selectedChatPartnerId && m.receiver_id === user?.id) ||
      (m.sender_id === user?.id && m.receiver_id === selectedChatPartnerId) ||
      (m.sender_id === selectedChatPartnerId && !m.receiver_id)
  );

  return (
    <div className="space-y-6">
      {/* Top Admin Banner */}
      <div className="bg-gradient-to-r from-[#17092c] via-[#140826] to-[#1a0b33] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-purple-800/60">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Jopo Salama la Utawala (Admin Management Console)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-wide">
              Usimamizi wa Ushirika & Hazina ya Huduma
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 mt-1 max-w-2xl leading-relaxed">
              Tazama taarifa za washirika wote, dhibiti ahadi na michango, jibu ujumbe wa washirika, na dhibiti kanzidata kwa usalama.
            </p>
          </div>

          {/* Grouped & Organised Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full xl:w-auto">
            {/* GROUP 1: Fedha & Utoaji (Primary Actions) */}
            <div className="flex items-center gap-1.5 p-1 bg-[#1c0c38] rounded-2xl border border-purple-700/60 shadow-sm">
              <button
                onClick={onOpenContributionModal}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                title="Pokea na rekodi mchango mpya"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>+ Mchango</span>
              </button>

              <button
                onClick={onOpenPledgeModal}
                className="px-3.5 py-2 rounded-xl bg-[#281347] hover:bg-purple-900 text-amber-300 font-bold text-xs border border-purple-600/70 transition flex items-center gap-1.5 shadow-xs"
                title="Sajili ahadi mpya ya mshirika"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Ahadi</span>
              </button>

              <button
                onClick={onOpenExpenseModal}
                className="px-3 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 hover:text-white font-bold text-xs transition flex items-center gap-1.5 border border-rose-800/60"
                title="Rekodi gharama na matumizi ya huduma"
              >
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                <span>- Matumizi</span>
              </button>
            </div>

            {/* GROUP 2: Mawasiliano & Huduma */}
            <div className="flex items-center gap-1.5 p-1 bg-[#1c0c38] rounded-2xl border border-purple-700/60 shadow-sm">
              {onOpenMessagingModal && (
                <button
                  onClick={onOpenMessagingModal}
                  className="px-3 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-amber-300 font-bold text-xs border border-purple-700/60 transition flex items-center gap-1.5 relative shadow-xs"
                  title="Fungua mawasiliano na washirika"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ujumbe</span>
                  {unreadMessagesCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                </button>
              )}

              {onOpenManageNews && (
                <button
                  onClick={onOpenManageNews}
                  className="px-3 py-2 rounded-xl bg-[#281347] hover:bg-purple-900 text-purple-200 hover:text-white font-bold text-xs transition flex items-center gap-1.5"
                  title="Dhibiti matangazo na habari za huduma"
                >
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Habari</span>
                </button>
              )}

              {onOpenManageTestimonials && (
                <button
                  onClick={onOpenManageTestimonials}
                  className="px-3 py-2 rounded-xl bg-[#281347] hover:bg-purple-900 text-purple-200 hover:text-white font-bold text-xs transition flex items-center gap-1.5"
                  title="Kagua shuhuda za washirika"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Shuhuda</span>
                </button>
              )}
            </div>

            {/* GROUP 3: Kanzidata & Mfumo (Wipe/Reset Option) */}
            <div className="flex items-center gap-1.5 p-1 bg-[#1c0c38] rounded-2xl border border-rose-900/40 shadow-sm">
              {onOpenWipeDatabaseModal && (
                <button
                  onClick={onOpenWipeDatabaseModal}
                  className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-rose-100 font-bold text-xs border border-rose-800/60 transition flex items-center gap-1.5 shadow-xs"
                  title="Futa kanzidata au safisha rekodi zilizowekwa kwa majaribio"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Safisha Kanzidata</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Global Financial Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
          <div className="bg-[#1c0f33]/80 rounded-2xl p-4 border border-purple-700/50 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider block">
              Washirika Waliosajiliwa
            </span>
            <span className="text-xl sm:text-2xl font-serif font-black text-white mt-1 block">
              {allPartners.length}
            </span>
            <span className="text-[10px] text-purple-300 block">Kwenye Kanzidata</span>
          </div>

          <div className="bg-[#1c0f33]/80 rounded-2xl p-4 border border-purple-700/50 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider block">
              Jumla ya Ahadi
            </span>
            <span className="text-xl sm:text-2xl font-serif font-black text-amber-300 mt-1 block">
              {formatTZS(totalPledged)}
            </span>
            <span className="text-[10px] text-purple-300 block">{filteredPledges.length} Ahadi</span>
          </div>

          <div className="bg-[#1c0f33]/80 rounded-2xl p-4 border border-purple-700/50 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
              Michango / Mapato (+)
            </span>
            <span className="text-xl sm:text-2xl font-serif font-black text-emerald-400 mt-1 block">
              {formatTZS(totalContributionsAmount)}
            </span>
            <span className="text-[10px] text-emerald-400/90 block">{filteredContributions.length} Miamala</span>
          </div>

          <div className="bg-[#1c0f33]/80 rounded-2xl p-4 border border-purple-700/50 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-rose-200 uppercase tracking-wider block">
              Matumizi ya Huduma (-)
            </span>
            <span className="text-xl sm:text-2xl font-serif font-black text-rose-400 mt-1 block">
              {formatTZS(totalExpensesAmount)}
            </span>
            <span className="text-[10px] text-rose-400/90 block">{filteredExpenses.length} Matumizi</span>
          </div>

          <div className="bg-[#1c0f33]/80 rounded-2xl p-4 border border-amber-400/40 backdrop-blur-xs col-span-2 lg:col-span-1">
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

      {/* Admin Navigation Tabs & Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-purple-800/40 pb-3">
        <div className="flex flex-wrap gap-1 bg-[#160a26] border border-purple-800/50 p-1.5 rounded-2xl text-xs font-bold">
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
            className={`px-3 py-2 rounded-xl transition ${
              activeAdminTab === 'partners'
                ? 'bg-purple-900 text-amber-300 shadow-xs'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            Washirika ({allPartners.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('pledges')}
            className={`px-3 py-2 rounded-xl transition ${
              activeAdminTab === 'pledges'
                ? 'bg-purple-900 text-amber-300 shadow-xs'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            Ahadi ({filteredPledges.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('contributions')}
            className={`px-3 py-2 rounded-xl transition ${
              activeAdminTab === 'contributions'
                ? 'bg-purple-900 text-amber-300 shadow-xs'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            Michango ({filteredContributions.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('expenses')}
            className={`px-3 py-2 rounded-xl transition ${
              activeAdminTab === 'expenses'
                ? 'bg-purple-900 text-amber-300 shadow-xs'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            Matumizi ({filteredExpenses.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('messages')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeAdminTab === 'messages'
                ? 'bg-purple-900 text-amber-300 shadow-xs'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ujumbe</span>
            {unreadMessagesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-purple-950 font-bold">
                {unreadMessagesCount}
              </span>
            )}
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
            <span>Ripoti Excel</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('database')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeAdminTab === 'database'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'text-purple-300 hover:text-rose-300'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-rose-400" />
            <span>Kanzidata</span>
          </button>
        </div>

        {/* Global Filters: Time period */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#160a26] border border-purple-800/50 p-1 rounded-xl text-xs font-semibold">
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
        <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tafuta jina la mshirika, namba ya stakabadhi, ahadi, au kategoria..."
          className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-purple-700/60 rounded-xl bg-[#160a28] text-white placeholder-purple-300/40 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
        />
      </div>

      {/* TAB 1: Financial Overview (Muhtasari wa Fedha) */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Giving vs Expenses Comparison Card */}
            <div className="bg-[#150a24] rounded-3xl p-6 border border-purple-800/50 shadow-md">
              <h3 className="font-serif font-bold text-base text-amber-200 mb-4 flex items-center justify-between">
                <span>Uwiano wa Michango dhidi ya Matumizi</span>
                <span className="text-xs font-sans text-purple-300 font-normal">Kipindi: {timeFilter}</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Michango Iliyopokelewa
                    </span>
                    <span className="font-serif text-sm text-emerald-300">{formatTZS(totalContributionsAmount)}</span>
                  </div>
                  <div className="w-full bg-purple-950 rounded-full h-3 overflow-hidden border border-purple-800/40">
                    <div className="bg-emerald-500 h-3 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-rose-400 flex items-center gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5" /> Gharama & Matumizi
                    </span>
                    <span className="font-serif text-sm text-rose-300">{formatTZS(totalExpensesAmount)}</span>
                  </div>
                  <div className="w-full bg-purple-950 rounded-full h-3 overflow-hidden border border-purple-800/40">
                    <div
                      className="bg-rose-500 h-3 rounded-full"
                      style={{
                        width: `${totalContributionsAmount > 0 ? Math.min(100, Math.round((totalExpensesAmount / totalContributionsAmount) * 100)) : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-purple-800/40 flex items-center justify-between text-xs font-bold">
                  <span className="text-purple-200">Hazina Halisi Inayobaki:</span>
                  <span className={`text-base font-serif font-black ${netTreasury >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
                    {formatTZS(netTreasury)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action & Ministry Highlights */}
            <div className="bg-[#150a24] rounded-3xl p-6 border border-purple-800/50 shadow-md flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-amber-200 mb-2">
                  Vitendo vya Haraka vya Utawala
                </h3>
                <p className="text-xs text-purple-300/80 mb-4">
                  Tekeleza majukumu ya hazina, miamala ya washirika na usimamizi wa kanzidata kwa kubofya kitufe kimoja.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={onOpenContributionModal}
                    className="p-3 rounded-xl bg-[#1d0e33] hover:bg-purple-900/60 border border-purple-700/50 text-left transition flex items-center gap-2.5"
                  >
                    <Receipt className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-white block">Pokea Mchango</span>
                      <span className="text-[10px] text-purple-300">Tengeneza stakabadhi</span>
                    </div>
                  </button>

                  <button
                    onClick={onOpenExpenseModal}
                    className="p-3 rounded-xl bg-[#1d0e33] hover:bg-purple-900/60 border border-purple-700/50 text-left transition flex items-center gap-2.5"
                  >
                    <TrendingDown className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-white block">Rekodi Gharama</span>
                      <span className="text-[10px] text-purple-300">Weka matumizi ya kanisa</span>
                    </div>
                  </button>

                  <button
                    onClick={onOpenPledgeModal}
                    className="p-3 rounded-xl bg-[#1d0e33] hover:bg-purple-900/60 border border-purple-700/50 text-left transition flex items-center gap-2.5"
                  >
                    <HeartHandshake className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-white block">Sajili Ahadi Mpya</span>
                      <span className="text-[10px] text-purple-300">Weka ahadi ya mshirika</span>
                    </div>
                  </button>

                  {onOpenWipeDatabaseModal && (
                    <button
                      onClick={onOpenWipeDatabaseModal}
                      className="p-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/60 text-left transition flex items-center gap-2.5"
                    >
                      <Trash2 className="w-5 h-5 text-rose-400 shrink-0" />
                      <div>
                        <span className="font-bold text-xs text-rose-200 block">Safisha Kanzidata</span>
                        <span className="text-[10px] text-rose-300/80">Futa rekodi za majaribio</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-purple-800/40 mt-4 flex items-center justify-between text-xs text-purple-300">
                <span>Supabase Realtime: Imewashwa</span>
                <button
                  onClick={onRefreshData}
                  className="text-amber-300 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Pakia upya takwimu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Partners List (Orodha ya Washirika) */}
      {activeAdminTab === 'partners' && (
        <div className="bg-[#150a24] rounded-3xl p-6 border border-purple-800/50 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-amber-200">
                Orodha ya Washirika Waliosajiliwa ({allPartners.length})
              </h3>
              <p className="text-xs text-purple-300/80">
                Washirika wote wenye akaunti ndani ya mfumo wa Jerusalem Ministry.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-purple-800/50 text-purple-300 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Mshirika</th>
                  <th className="py-3 px-3">Simu</th>
                  <th className="py-3 px-3">Tawi / Kituo</th>
                  <th className="py-3 px-3">Kategoria</th>
                  <th className="py-3 px-3 text-center">Hadhi / Jukumu</th>
                  <th className="py-3 px-3 text-right">Usimamizi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/40">
                {allPartners.map((p) => (
                  <tr key={p.id} className="hover:bg-purple-950/40 transition">
                    <td className="py-3 px-3">
                      <span className="font-bold text-white block">{p.full_name}</span>
                      <span className="text-[10px] text-purple-400 font-mono">{p.id.slice(0, 8)}...</span>
                    </td>
                    <td className="py-3 px-3 text-slate-200">{p.phone_number || '-'}</td>
                    <td className="py-3 px-3 text-slate-200">{p.fellowship_center || 'Makao Makuu'}</td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-purple-950 text-purple-200 font-medium border border-purple-800">
                        {p.partner_category || 'Mshirika wa Kawaida'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {p.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-purple-950">
                          <ShieldCheck className="w-3 h-3 text-purple-950" />
                          Msimamizi (Admin)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-950/80 text-purple-300 border border-purple-800">
                          Mshirika
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedChatPartnerId(p.id);
                            setActiveAdminTab('messages');
                          }}
                          className="px-2 py-1 rounded-lg text-xs font-semibold bg-purple-900/60 border border-purple-700/50 text-purple-200 hover:text-white transition flex items-center gap-1"
                          title="Tuma ujumbe kwa mshirika huyu"
                        >
                          <MessageSquare className="w-3 h-3 text-indigo-400" />
                          <span>Ujumbe</span>
                        </button>
                        {p.id !== profile?.id && (
                          <button
                            onClick={() => handleToggleAdminRole(p.id, p.role)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold border border-purple-700/50 transition text-purple-300 hover:text-amber-300 hover:bg-purple-900/60"
                          >
                            {p.role === 'admin' ? 'Shusha' : 'Pandisha'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: All Pledges (Ahadi Zote) with Option to Delete Mistakes */}
      {activeAdminTab === 'pledges' && (
        <div className="bg-[#150a24] rounded-3xl p-6 border border-purple-800/50 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-amber-200">
                Ahadi Zote za Ushirika ({filteredPledges.length})
              </h3>
              <p className="text-xs text-purple-300/80">
                Orodha ya ahadi zilizowekwa. Unaweza kufuta ahadi yoyote iliyoingizwa kimakosa kwa kitufe cha 'Futa'.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenPledgeModal}
                className="px-3 py-1.5 rounded-xl bg-purple-800 hover:bg-purple-700 text-amber-300 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs border border-purple-600"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Weka Ahadi</span>
              </button>
              <button
                onClick={exportPledgesExcel}
                className="px-3 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-amber-300 font-bold text-xs border border-purple-700/50 transition flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>Hamisha (Excel)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-purple-800/50 text-purple-300 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Namba</th>
                  <th className="py-3 px-3">Mshirika</th>
                  <th className="py-3 px-3">Mradi / Kusudi</th>
                  <th className="py-3 px-3 text-right">Kiasi cha Ahadi</th>
                  <th className="py-3 px-3">Tarehe ya Kuweka</th>
                  <th className="py-3 px-3">Tarehe ya Mwisho</th>
                  <th className="py-3 px-3 text-center">Hali</th>
                  <th className="py-3 px-3 text-right">Usimamizi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/40">
                {filteredPledges.map((p) => (
                  <tr key={p.id} className="hover:bg-purple-950/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">{p.pledge_number}</td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {p.profiles?.full_name || 'Mshirika'}
                    </td>
                    <td className="py-3 px-3 text-slate-200">{p.title}</td>
                    <td className="py-3 px-3 text-right font-serif font-bold text-amber-300">
                      {formatTZS(p.target_amount)}
                    </td>
                    <td className="py-3 px-3 text-purple-300">{formatDateSwahili(p.pledge_date)}</td>
                    <td className="py-3 px-3 text-purple-300">{formatDateSwahili(p.due_date)}</td>
                    <td className="py-3 px-3 text-center">
                      {p.status === 'completed' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                          Imekamilika
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-600/40">
                          Inaendelea
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setPledgeToDelete(p)}
                        className="p-1.5 rounded-lg text-purple-400 hover:text-rose-400 hover:bg-rose-950/50 transition border border-transparent hover:border-rose-800/40"
                        title="Futa ahadi hii iliyoingizwa kwa makosa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: All Contributions (Michango Yote) with Delete Option */}
      {activeAdminTab === 'contributions' && (
        <div className="bg-[#150a24] rounded-3xl p-6 border border-purple-800/50 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-amber-200">
                Kumbukumbu Zote za Michango & Utoaji ({filteredContributions.length})
              </h3>
              <p className="text-xs text-purple-300/80">
                Miamala yote ya utoaji iliyorekodiwa na stakabadhi zake rasmi.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenContributionModal}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Rekodi Mchango</span>
              </button>
              <button
                onClick={exportContributionsExcel}
                className="px-3 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-amber-300 font-bold text-xs border border-purple-700/50 transition flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>Hamisha (Excel)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-purple-800/50 text-purple-300 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Stakabadhi</th>
                  <th className="py-3 px-3">Mshirika</th>
                  <th className="py-3 px-3">Tarehe</th>
                  <th className="py-3 px-3">Kategoria</th>
                  <th className="py-3 px-3">Njia ya Malipo</th>
                  <th className="py-3 px-3 text-right">Kiasi (TZS)</th>
                  <th className="py-3 px-3 text-right">Usimamizi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/40">
                {filteredContributions.map((c) => (
                  <tr key={c.id} className="hover:bg-purple-950/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">{c.receipt_number}</td>
                    <td className="py-3 px-3 font-semibold text-white">{c.profiles?.full_name || 'Mshirika'}</td>
                    <td className="py-3 px-3 text-slate-200">{formatDateSwahili(c.contribution_date)}</td>
                    <td className="py-3 px-3 text-slate-200">{c.category}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-200 text-[11px] border border-purple-800">
                        {c.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-serif font-black text-emerald-400 text-sm">
                      {formatTZS(c.amount)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewReceipt(c)}
                          className="px-2.5 py-1 rounded-lg bg-purple-900/80 text-amber-300 border border-purple-700/60 hover:bg-purple-800 font-semibold text-xs transition inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Tazama</span>
                        </button>
                        <button
                          onClick={() => setContribToDelete(c)}
                          className="p-1 rounded-lg text-purple-400 hover:text-rose-400 hover:bg-rose-950/50 transition border border-transparent hover:border-rose-800/40"
                          title="Futa mchango huu ulioingizwa kwa makosa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
        <div className="bg-[#150a24] rounded-3xl p-6 border border-purple-800/50 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-rose-300">
                Gharama na Matumizi ya Huduma ({filteredExpenses.length})
              </h3>
              <p className="text-xs text-purple-300/80">
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
                className="px-3 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 font-bold text-xs border border-purple-700/50 transition flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
                <span>Hamisha Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-purple-800/50 text-purple-300 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Namba ya Matumizi</th>
                  <th className="py-3 px-3">Maelezo</th>
                  <th className="py-3 px-3">Kategoria</th>
                  <th className="py-3 px-3">Tarehe</th>
                  <th className="py-3 px-3">Namba ya Vocha</th>
                  <th className="py-3 px-3 text-right">Kiasi (TZS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/40">
                {filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-purple-950/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-rose-300">{e.expense_number}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-white block">{e.title}</span>
                      {e.description && <span className="text-[10px] text-purple-300/80 block">{e.description}</span>}
                    </td>
                    <td className="py-3 px-3 text-slate-200">{e.category}</td>
                    <td className="py-3 px-3 text-purple-300">{formatDateSwahili(e.expense_date)}</td>
                    <td className="py-3 px-3 font-mono text-purple-300">{e.receipt_ref || '-'}</td>
                    <td className="py-3 px-3 text-right font-serif font-black text-rose-400 text-sm">
                      {formatTZS(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Admin Messages Tab (Ujumbe wa Washirika) */}
      {activeAdminTab === 'messages' && (
        <div className="bg-[#150a24] rounded-3xl p-6 border border-purple-800/50 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-serif font-bold text-base text-amber-200 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <span>Ujumbe na Maombi Kutoka kwa Washirika ({allMessages.length})</span>
              </h3>
              <p className="text-xs text-purple-300/80 mt-0.5">
                Mawasiliano ya moja kwa moja na washirika. Chagua mshirika kujibu au tazama maombi yao.
              </p>
            </div>

            {onOpenMessagingModal && (
              <button
                onClick={onOpenMessagingModal}
                className="px-4 py-2 rounded-xl bg-purple-800 hover:bg-purple-700 text-amber-300 font-bold text-xs transition flex items-center gap-1.5 shadow-sm border border-purple-600/70"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Fungua Dirisha Kamili la Gumzo</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Partners list sidebar */}
            <div className="bg-[#100622] rounded-2xl border border-purple-800/40 p-3 flex flex-col max-h-[500px] overflow-y-auto divide-y divide-purple-900/30">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-2 px-1">
                Washirika Wenye Mawasiliano:
              </span>
              {allPartners
                .filter((p) => p.id !== user?.id)
                .map((p) => {
                  const isSelected = p.id === selectedChatPartnerId;
                  const partnerMsgs = allMessages.filter(
                    (m) => (m.sender_id === p.id && m.receiver_id === user?.id) || (m.sender_id === user?.id && m.receiver_id === p.id)
                  );
                  const hasUnread = partnerMsgs.some((m) => m.sender_id === p.id && !m.is_read);

                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedChatPartnerId(p.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between mt-1 ${
                        isSelected
                          ? 'bg-purple-900/80 border border-amber-400/50'
                          : 'hover:bg-purple-950/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-purple-950 text-amber-300 font-bold text-xs flex items-center justify-center border border-purple-700 shrink-0">
                          {p.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-xs text-white block truncate">{p.full_name}</span>
                          <span className="text-[10px] text-purple-300 truncate block">{p.fellowship_center || 'Makao Makuu'}</span>
                        </div>
                      </div>

                      {hasUnread && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Conversation Window */}
            <div className="md:col-span-2 bg-[#120626] rounded-2xl border border-purple-800/40 flex flex-col h-[500px]">
              {selectedChatPartnerId && activeChatPartner ? (
                <>
                  <div className="p-3.5 border-b border-purple-800/40 bg-[#160a2c] flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-900 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/40">
                        {activeChatPartner.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-white block">{activeChatPartner.full_name}</span>
                        <span className="text-[10px] text-purple-300">{activeChatPartner.phone_number || activeChatPartner.fellowship_center || 'Mshirika'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                    {activeChatMessages.length === 0 ? (
                      <div className="py-20 text-center text-purple-300/60 text-xs">
                        Hakuna ujumbe na mshirika huyu bado. Andika hapa chini kuanzisha mazungumzo.
                      </div>
                    ) : (
                      activeChatMessages.map((m) => {
                        const isMine = m.sender_id === user?.id;
                        return (
                          <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs ${
                                isMine
                                  ? 'bg-purple-800 text-white rounded-br-xs border border-purple-600/50'
                                  : 'bg-[#1e0e38] text-slate-100 rounded-bl-xs border border-purple-700/40'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{m.message}</p>
                              <span className="text-[9px] text-purple-300 block text-right mt-1">
                                {formatDateSwahili(m.created_at)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleAdminSendReply} className="p-3 border-t border-purple-800/40 bg-[#0e051e] rounded-b-2xl flex items-center gap-2">
                    <input
                      type="text"
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      placeholder={`Jibu kwa ${activeChatPartner.full_name}...`}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#1a0c33] text-white border border-purple-700/80 text-xs placeholder-purple-400/50 focus:border-amber-400 outline-hidden font-medium"
                    />
                    <button
                      type="submit"
                      disabled={!adminReplyText.trim() || replying}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-purple-950 font-bold text-xs hover:from-amber-300 hover:to-amber-500 transition disabled:opacity-40 flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Jibu</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-purple-300/60">
                  <MessageSquare className="w-12 h-12 text-purple-600/40 mb-2" />
                  <span className="font-bold text-sm text-purple-200">Chagua Mshirika Kuanza Gumzo</span>
                  <span className="text-xs text-purple-400/70 mt-1">
                    Bofya jina la mshirika kwenye safu wima ya kushoto ili kuona na kujibu ujumbe wake.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: Reports & Excel Exports */}
      {activeAdminTab === 'reports' && (
        <div className="bg-[#150a24] rounded-3xl p-6 sm:p-8 border border-purple-800/50 shadow-md space-y-6">
          <div>
            <h3 className="font-serif font-bold text-lg text-amber-200">
              Ripoti za Kina za Utoaji na Matumizi
            </h3>
            <p className="text-xs text-purple-300/80 mt-0.5">
              Chagua na pakua ripoti za kila wiki, mwezi, au mwaka zikiwa katika umbizo la Excel (.xlsx).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#1b0e32] border border-purple-700/60 flex flex-col justify-between">
              <div>
                <Receipt className="w-8 h-8 text-emerald-400 mb-3" />
                <h4 className="font-bold text-sm text-white mb-1">Ripoti ya Michango Yote</h4>
                <p className="text-xs text-purple-300/80 leading-relaxed">
                  Pakua orodha kamili ya michango, stakabadhi, na majina ya washirika waliojitolea.
                </p>
              </div>
              <button
                onClick={exportContributionsExcel}
                className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Pakua Michango (.xlsx)</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-[#1b0e32] border border-purple-700/60 flex flex-col justify-between">
              <div>
                <HeartHandshake className="w-8 h-8 text-amber-400 mb-3" />
                <h4 className="font-bold text-sm text-white mb-1">Ripoti ya Ahadi za Ushirika</h4>
                <p className="text-xs text-purple-300/80 leading-relaxed">
                  Pakua takwimu za ahadi, malengo ya miradi, na tarehe za mwisho za utekelezaji.
                </p>
              </div>
              <button
                onClick={exportPledgesExcel}
                className="mt-4 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Pakua Ahadi (.xlsx)</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-[#1b0e32] border border-purple-700/60 flex flex-col justify-between">
              <div>
                <TrendingDown className="w-8 h-8 text-rose-400 mb-3" />
                <h4 className="font-bold text-sm text-white mb-1">Ripoti ya Gharama za Huduma</h4>
                <p className="text-xs text-purple-300/80 leading-relaxed">
                  Pakua taarifa zote za matumizi, manunuzi, na vocha za fedha za hazina ya huduma.
                </p>
              </div>
              <button
                onClick={exportExpensesExcel}
                className="mt-4 w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Pakua Matumizi (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: Database & Maintenance Tab (Kanzidata & Usalama) */}
      {activeAdminTab === 'database' && (
        <div className="bg-[#150a24] rounded-3xl p-6 sm:p-8 border border-rose-900/50 shadow-md space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-rose-400 mb-1">
                <Database className="w-5 h-5" />
                <h3 className="font-serif font-bold text-lg text-white">
                  Usimamizi wa Kanzidata na Kufuta Takwimu (Maintenance)
                </h3>
              </div>
              <p className="text-xs text-purple-300/80 max-w-2xl leading-relaxed">
                Hapa unaweza kusafisha rekodi za majaribio, kufuta ahadi au michango yote ya awali ili kuanza mfumo upya bila kuathiri akaunti za watumiaji.
              </p>
            </div>

            {onOpenWipeDatabaseModal && (
              <button
                onClick={onOpenWipeDatabaseModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-red-700 hover:from-rose-600 hover:to-red-600 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Futa / Safisha Kanzidata</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-purple-800/40">
            <div className="p-5 rounded-2xl bg-[#1c0c33] border border-purple-800/50">
              <span className="font-bold text-sm text-amber-200 block mb-1">
                Kufuta Ahadi Zilizowekwa kwa Makosa
              </span>
              <p className="text-xs text-purple-300 leading-relaxed">
                Ikiwa mshirika aliweka ahadi isiyo sahihi au kiasi cha makosa, nenda kwenye kichupo cha <strong className="text-white">'Ahadi'</strong> na ubofye kitufe cha pipa la takataka (<Trash2 className="w-3.5 h-3.5 inline text-rose-400" />) kwenye mstari husika ili kuifuta mara moja.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#1c0c33] border border-rose-900/50">
              <span className="font-bold text-sm text-rose-300 block mb-1">
                Kufuta Kanzidata Nzima (Database Reset)
              </span>
              <p className="text-xs text-rose-200/80 leading-relaxed">
                Kitufe cha <strong className="text-white">'Safisha Kanzidata'</strong> kinakupa machaguo ya kufuta ahadi zote na michango pekee, au kufuta taarifa zote za mfumo kwa ulinzi wa neno la uthibitisho <strong className="text-amber-300">FUTA ZOTE</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Delete Single Pledge */}
      {pledgeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080312]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#140827] text-slate-100 rounded-3xl shadow-2xl border border-rose-800/60 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-700/60 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">Futa Ahadi Hii?</h3>
                <span className="text-xs text-rose-300">Kitendo hiki kitafuta ahadi kutoka kwenye mfumo.</span>
              </div>
            </div>

            <div className="p-3.5 bg-[#1a0c33] rounded-2xl border border-purple-800/50 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-purple-300">Namba ya Ahadi:</span>
                <span className="font-mono font-bold text-amber-300">{pledgeToDelete.pledge_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">Mshirika:</span>
                <span className="font-bold text-white">{pledgeToDelete.profiles?.full_name || 'Mshirika'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">Kiasi:</span>
                <span className="font-bold text-amber-300 font-serif">{formatTZS(pledgeToDelete.target_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">Mradi:</span>
                <span className="text-slate-200">{pledgeToDelete.title}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPledgeToDelete(null)}
                className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-semibold text-xs transition"
              >
                Ghairi
              </button>
              <button
                type="button"
                disabled={deletingPledge}
                onClick={handleConfirmDeletePledge}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md"
              >
                {deletingPledge ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Inafuta...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ndio, Futa Ahadi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Delete Single Contribution */}
      {contribToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080312]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#140827] text-slate-100 rounded-3xl shadow-2xl border border-rose-800/60 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-700/60 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">Futa Mchango Huu?</h3>
                <span className="text-xs text-rose-300">Stakabadhi na mchango huu utafutwa kwenye mfumo.</span>
              </div>
            </div>

            <div className="p-3.5 bg-[#1a0c33] rounded-2xl border border-purple-800/50 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-purple-300">Namba ya Stakabadhi:</span>
                <span className="font-mono font-bold text-amber-300">{contribToDelete.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">Mshirika:</span>
                <span className="font-bold text-white">{contribToDelete.profiles?.full_name || 'Mshirika'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">Kiasi:</span>
                <span className="font-bold text-emerald-400 font-serif">{formatTZS(contribToDelete.amount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setContribToDelete(null)}
                className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-semibold text-xs transition"
              >
                Ghairi
              </button>
              <button
                type="button"
                disabled={deletingContrib}
                onClick={handleConfirmDeleteContribution}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md"
              >
                {deletingContrib ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Inafuta...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ndio, Futa Mchango</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
