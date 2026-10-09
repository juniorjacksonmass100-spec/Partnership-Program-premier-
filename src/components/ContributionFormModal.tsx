import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, formatSupabaseError } from '../lib/supabase';
import { formatTZS } from '../utils/formatters';
import { 
  X, 
  Receipt, 
  CreditCard, 
  Calendar, 
  FileText, 
  AlertCircle, 
  Loader2, 
  User, 
  Sparkles,
  Link2 
} from 'lucide-react';
import { Pledge, Profile, PaymentMethod, Contribution } from '../types/database.types';

interface ContributionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newContribution?: Contribution) => void;
  userPledges?: Pledge[];
  partnerList?: Profile[];
  initialPledgeId?: string;
}

export const ContributionFormModal: React.FC<ContributionFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userPledges = [],
  partnerList = [],
  initialPledgeId,
}) => {
  const { user, profile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPledgeId, setSelectedPledgeId] = useState<string>(initialPledgeId || '');
  const [amount, setAmount] = useState<string>('50000');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('M-Pesa');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [contributionDate, setContributionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('Sadaka ya Ushirika');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (user) {
      setSelectedUserId(user.id);
    }
    if (initialPledgeId) {
      setSelectedPledgeId(initialPledgeId);
    }
  }, [user, initialPledgeId]);

  if (!isOpen) return null;

  const presetAmounts = [10000, 20000, 50000, 100000, 200000, 500000];

  // Filter pledges available for current target user
  const effectiveUserId = (isAdmin && selectedUserId) ? selectedUserId : user?.id;
  const filteredPledges = userPledges.filter(p => p.user_id === effectiveUserId && p.status === 'active');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amountNum = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Tafadhali weka kiasi sahihi cha mchango katika Shilingi za Kitanzania (TZS).');
      return;
    }

    if (!effectiveUserId) {
      setErrorMsg('Mtumiaji hajatambuliwa. Tafadhali ingia kwenye akaunti kwanza.');
      return;
    }

    setLoading(true);

    try {
      // Generate clean receipt reference number: e.g. MCH-2025-XXXX
      const currentYear = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const receiptNumber = `MCH-${currentYear}-${randomSuffix}`;

      // Insert contribution
      const { data: inserted, error: insertError } = await supabase
        .from('contributions')
        .insert([
          {
            user_id: effectiveUserId,
            pledge_id: selectedPledgeId ? selectedPledgeId : null,
            receipt_number: receiptNumber,
            amount: amountNum,
            payment_method: paymentMethod,
            transaction_reference: transactionRef.trim() || null,
            contribution_date: contributionDate,
            category: category.trim(),
            notes: notes.trim() || null,
            recorded_by: user?.id,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Check if this pledge is now fully paid and update its status
      if (selectedPledgeId) {
        const { data: contribs } = await supabase
          .from('contributions')
          .select('amount')
          .eq('pledge_id', selectedPledgeId);

        const currentPledge = userPledges.find(p => p.id === selectedPledgeId);
        if (currentPledge && contribs) {
          const totalPaid = contribs.reduce((sum, c) => sum + (c.amount || 0), 0);
          if (totalPaid >= currentPledge.target_amount) {
            await supabase
              .from('pledges')
              .update({ status: 'completed' })
              .eq('id', selectedPledgeId);
          }
        }
      }

      onSuccess(inserted as Contribution);
      onClose();
    } catch (err: any) {
      setErrorMsg(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080312]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#140827] text-slate-100 rounded-3xl shadow-2xl border border-purple-800/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white text-left relative border-b border-purple-800/50 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-white/10 transition"
            title="Funga"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold mb-2">
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kumbukumbu ya Utoaji na Stakabadhi</span>
          </div>
          <h2 className="font-serif font-bold text-xl text-white">
            Rekodi Mchango / Sadaka
          </h2>
          <p className="text-xs text-purple-200/90 mt-0.5">
            Kila sadaka inatolewa kwa furaha na stakabadhi rasmi inatolewa papo hapo.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Admin selector for partner */}
          {isAdmin && partnerList.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                Mshirika Anayetoa Mchango (Kama Msimamizi) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
                >
                  <option value={user?.id} className="bg-[#140827] text-white">
                    Akaunti Yangu ({profile?.full_name || user?.email})
                  </option>
                  {partnerList
                    .filter((p) => p.id !== user?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#140827] text-white">
                        {p.full_name} ({p.fellowship_center || 'Tawi'})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Link to Pledge (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Unganisha na Ahadi Yako (Hiari)</span>
              </label>
              {selectedPledgeId && (
                <button
                  type="button"
                  onClick={() => setSelectedPledgeId('')}
                  className="text-[11px] text-amber-300 hover:underline font-semibold"
                >
                  Tenganisha
                </button>
              )}
            </div>
            <select
              value={selectedPledgeId}
              onChange={(e) => {
                setSelectedPledgeId(e.target.value);
                const pl = userPledges.find(p => p.id === e.target.value);
                if (pl) {
                  setCategory(pl.category || pl.title);
                }
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
            >
              <option value="" className="bg-[#140827] text-white">
                -- Sadaka ya Kawaida (Bila Ahadi Maalum) --
              </option>
              {filteredPledges.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#140827] text-white">
                  Ahadi: {p.pledge_number} - {p.title} (Lengo: {formatTZS(p.target_amount)})
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">
              Kategoria ya Utoaji *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
            >
              <option value="Sadaka ya Ushirika" className="bg-[#140827] text-white">Sadaka ya Ushirika (Kawaida)</option>
              <option value="Ujenzi wa Hekalu la Ibada" className="bg-[#140827] text-white">Ujenzi wa Hekalu la Ibada</option>
              <option value="Uinjilisti & Misheni za Vijijini" className="bg-[#140827] text-white">Uinjilisti & Misheni za Vijijini</option>
              <option value="Vyombo vya Muziki na Sauti" className="bg-[#140827] text-white">Vyombo vya Muziki na Sauti</option>
              <option value="Huduma ya Jamii & Yatima" className="bg-[#140827] text-white">Huduma ya Jamii & Yatima</option>
              <option value="Fungu la Kumi (Zaka)" className="bg-[#140827] text-white">Fungu la Kumi (Zaka)</option>
              <option value="Sadaka ya Shukrani" className="bg-[#140827] text-white">Sadaka ya Shukrani</option>
              <option value="Dhabihu Maalum ya Madhabahu" className="bg-[#140827] text-white">Dhabihu Maalum ya Madhabahu</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-purple-200">
                Kiasi cha Sadaka (TZS) *
              </label>
              <span className="text-xs font-bold text-emerald-400">
                {formatTZS(parseInt(amount || '0', 10))}
              </span>
            </div>
            <input
              type="number"
              min="500"
              step="500"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 text-base font-bold bg-[#1c0f33] text-emerald-400 border border-purple-700/60 rounded-xl focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-hidden"
            />

            {/* Quick Amount Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {presetAmounts.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmount(String(amt))}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                    amount === String(amt)
                      ? 'bg-emerald-500 text-purple-950 font-bold shadow-xs'
                      : 'bg-[#1c0f33] hover:bg-purple-900/60 text-purple-200 border border-purple-700/40'
                  }`}
                >
                  {formatTZS(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method & Transaction Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                Njia ya Malipo *
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
                >
                  <option value="M-Pesa" className="bg-[#140827] text-white">Vodacom M-Pesa</option>
                  <option value="Tigo Pesa" className="bg-[#140827] text-white">Mixx by Yas (Tigo Pesa)</option>
                  <option value="Airtel Money" className="bg-[#140827] text-white">Airtel Money</option>
                  <option value="Halopesa" className="bg-[#140827] text-white">Halopesa</option>
                  <option value="Benki (CRDB/NMB)" className="bg-[#140827] text-white">Benki (CRDB/NMB/NBC)</option>
                  <option value="Taslimu (Cash)" className="bg-[#140827] text-white">Taslimu Kanisani (Cash)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                Namba ya Kumbukumbu ya Muamala
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="mfano: 9HG57K2LP..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden placeholder-purple-300/40 font-mono"
              />
            </div>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                Tarehe ya Utoaji *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={contributionDate}
                  onChange={(e) => setContributionDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                Dokezo (Hiari)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="mfano: Sadaka ya mwezi Machi..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden placeholder-purple-300/40 font-medium"
              />
            </div>
          </div>

          {/* Action Buttons: Cancel & Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-purple-800/40 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 font-semibold text-xs border border-purple-700/50 transition"
            >
              Ghairi
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 text-purple-950 font-bold text-xs hover:from-emerald-400 hover:to-emerald-300 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-950" />
                  <span>Inarekodiwa...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-950" />
                  <span>Thibitisha na Toa Stakabadhi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
