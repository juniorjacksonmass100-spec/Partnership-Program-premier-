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
  CheckCircle2, 
  User, 
  Link2 
} from 'lucide-react';
import { Pledge, Profile, PaymentMethod } from '../types/database.types';

interface ContributionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newContributionId?: string) => void;
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

      onSuccess(inserted?.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white text-left relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-purple-200 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold mb-2">
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>Kumbukumbu ya Utoaji na Stakabadhi</span>
          </div>
          <h2 className="font-serif font-bold text-xl text-white">
            Rekodi Mchango / Sadaka
          </h2>
          <p className="text-xs text-purple-200 mt-0.5">
            Jerusalem Ministry of Gospel • Stakabadhi rasmi itazalishwa papo hapo
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Admin selector for partner */}
          {isAdmin && partnerList.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rekodi Mchango kwa Mshirika (Kama Msimamizi)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setSelectedPledgeId('');
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden bg-white"
                >
                  <option value={user?.id}>Akaunti Yangu ({profile?.full_name || user?.email})</option>
                  {partnerList
                    .filter((p) => p.id !== user?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.fellowship_center || 'Tawi'})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Optional Pledge Linkage */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Husisha na Ahadi Yako (Pledge Link)
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={selectedPledgeId}
                onChange={(e) => {
                  setSelectedPledgeId(e.target.value);
                  const p = userPledges.find(item => item.id === e.target.value);
                  if (p && p.category) {
                    setCategory(p.category);
                  }
                }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden bg-white"
              >
                <option value="">Sadaka ya Hiari / Bila Kuhusisha na Ahadi Maalum</option>
                {filteredPledges.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.pledge_number} — {p.title} (Lengo: {formatTZS(p.target_amount)})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Ukichagua ahadi, mchango huu utapunguza kiotomatiki deni la ahadi hiyo.
            </p>
          </div>

          {/* Amount in TZS */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Kiasi cha Mchango (TZS) *
              </label>
              <span className="text-xs font-bold text-purple-900">
                {formatTZS(parseInt(amount || '0', 10))}
              </span>
            </div>
            <input
              type="number"
              min="1000"
              step="1000"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-base font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden text-slate-900"
            />

            {/* Quick Amount presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presetAmounts.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmount(String(amt))}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                    amount === String(amt)
                      ? 'bg-purple-900 text-amber-300 font-bold'
                      : 'bg-slate-100 hover:bg-purple-50 text-slate-700'
                  }`}
                >
                  {formatTZS(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method & Transaction Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Njia ya Malipo (Payment Method) *
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden bg-white"
                >
                  <option value="M-Pesa">M-Pesa (Vodacom)</option>
                  <option value="Tigo Pesa">Tigo Pesa</option>
                  <option value="Airtel Money">Airtel Money</option>
                  <option value="Benki (NMB / CRDB)">Benki (NMB / CRDB)</option>
                  <option value="Taslimu (Cash)">Taslimu (Cash Kanisani)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kumbukumbu ya Muamala (Ref No.)
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="mfano: QDX894KLM"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden"
              />
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategoria ya Utoaji *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden bg-white"
              >
                <option value="Sadaka ya Ushirika">Sadaka ya Ushirika</option>
                <option value="Ujenzi wa Hekalu la Ibada">Ujenzi wa Hekalu la Ibada</option>
                <option value="Uinjilisti & Misheni za Vijijini">Uinjilisti & Misheni za Vijijini</option>
                <option value="Vyombo vya Muziki na Sauti">Vyombo vya Muziki na Sauti</option>
                <option value="Sadaka Maalum ya Shukrani">Sadaka Maalum ya Shukrani</option>
                <option value="Zaka na Fungu la Kumi">Zaka na Fungu la Kumi</option>
                <option value="Misaada ya Kijamii & Yatima">Misaada ya Kijamii & Yatima</option>
                <option value="Mengineyo">Mengineyo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tarehe ya Mchango *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={contributionDate}
                  onChange={(e) => setContributionDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dokezo la Ziada (Hiari)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Maelezo yoyote kuhusu mchango huu..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white font-bold text-sm hover:from-emerald-600 hover:to-teal-600 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Inarekodiwa kwenye Supabase...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Thibitisha na Toa Stakabadhi</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
