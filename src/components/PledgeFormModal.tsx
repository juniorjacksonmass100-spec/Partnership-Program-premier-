import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, formatSupabaseError } from '../lib/supabase';
import { formatTZS } from '../utils/formatters';
import { X, HeartHandshake, Calendar, FileText, AlertCircle, Loader2, Sparkles, User } from 'lucide-react';
import { Profile, Pledge } from '../types/database.types';

interface PledgeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPledge?: Pledge) => void;
  partnerList?: Profile[];
}

export const PledgeFormModal: React.FC<PledgeFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  partnerList = [],
}) => {
  const { user, profile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [title, setTitle] = useState('Ujenzi wa Hekalu Kuu la Ibada');
  const [category, setCategory] = useState('Ujenzi wa Hekalu la Ibada');
  const [targetAmount, setTargetAmount] = useState<string>('100000');
  const [pledgeDate, setPledgeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Default due date: 30 days from now
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 30);
  const [dueDate, setDueDate] = useState<string>(defaultDueDate.toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) {
      setSelectedUserId(user.id);
    }
  }, [user]);

  if (!isOpen) return null;

  // Quick preset amount buttons
  const presetAmounts = [20000, 50000, 100000, 250000, 500000, 1000000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amountNum = parseInt(targetAmount.replace(/[^0-9]/g, ''), 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Tafadhali weka kiasi sahihi cha ahadi katika Shilingi za Kitanzania (TZS).');
      return;
    }

    if (!dueDate) {
      setErrorMsg('Tafadhali chagua tarehe ya mwisho (due date) ya kutimiza ahadi hii.');
      return;
    }

    const effectiveUserId = (isAdmin && selectedUserId) ? selectedUserId : user?.id;
    if (!effectiveUserId) {
      setErrorMsg('Haujaingia kwenye akaunti au mtumiaji hajatambuliwa.');
      return;
    }

    setLoading(true);

    try {
      // Generate clean pledge reference number
      const currentYear = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const pledgeNumber = `AHD-${currentYear}-${randomSuffix}`;

      const payload = {
        user_id: effectiveUserId,
        pledge_number: pledgeNumber,
        title: title.trim(),
        category: category.trim(),
        target_amount: amountNum,
        pledge_date: pledgeDate,
        due_date: dueDate,
        status: 'active' as const,
        notes: notes.trim() || null,
      };

      const { data: insertedPledge, error } = await supabase
        .from('pledges')
        .insert([payload])
        .select()
        .single();

      if (error) {
        throw error;
      }

      onSuccess(insertedPledge as Pledge);
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

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold mb-2">
            <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
            <span>Agano la Ahadi ya Ushirika</span>
          </div>
          <h2 className="font-serif font-bold text-xl text-white">
            Weka Ahadi ya Utoaji
          </h2>
          <p className="text-xs text-purple-200/90 mt-0.5">
            "Kila mtu na atoe kama alivyokusudia moyoni mwake" — 2 Wakorintho 9:7
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
                Weka Ahadi kwa Ajili ya Mshirika (Kama Msimamizi)
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

          {/* Purpose / Category */}
          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">
              Kusudi la Ahadi / Mradi wa Huduma *
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setTitle(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
            >
              <option value="Ujenzi wa Hekalu la Ibada" className="bg-[#140827] text-white">Ujenzi wa Hekalu la Ibada</option>
              <option value="Uinjilisti & Misheni za Vijijini" className="bg-[#140827] text-white">Uinjilisti & Misheni za Vijijini</option>
              <option value="Vyombo vya Muziki na Sauti" className="bg-[#140827] text-white">Vyombo vya Muziki na Sauti</option>
              <option value="Huduma ya Jamii & Yatima" className="bg-[#140827] text-white">Huduma ya Jamii & Yatima</option>
              <option value="Sadaka ya Ushirika wa Kila Mwezi" className="bg-[#140827] text-white">Sadaka ya Ushirika wa Kila Mwezi</option>
              <option value="Gari la Huduma / Usafiri" className="bg-[#140827] text-white">Gari la Huduma / Usafiri</option>
              <option value="Sadaka Maalum ya Shukrani" className="bg-[#140827] text-white">Sadaka Maalum ya Shukrani</option>
              <option value="Mengineyo" className="bg-[#140827] text-white">Mradi Mwingine Maalum</option>
            </select>
          </div>

          {/* Title description if customized */}
          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">
              Maelezo Mafupi ya Ahadi *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="mfano: Mchango wa Vifaa vya Hekalu Kuu"
              className="w-full px-3.5 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden placeholder-purple-300/40 font-medium"
            />
          </div>

          {/* Target Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-purple-200">
                Kiasi cha Ahadi (TZS) *
              </label>
              <span className="text-xs font-bold text-amber-300">
                {formatTZS(parseInt(targetAmount || '0', 10))}
              </span>
            </div>
            <input
              type="number"
              min="1000"
              step="1000"
              required
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 text-base font-bold bg-[#1c0f33] text-amber-300 border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden"
            />

            {/* Quick Amount Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {presetAmounts.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setTargetAmount(String(amt))}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                    targetAmount === String(amt)
                      ? 'bg-amber-400 text-purple-950 font-bold shadow-xs'
                      : 'bg-[#1c0f33] hover:bg-purple-900/60 text-purple-200 border border-purple-700/40'
                  }`}
                >
                  {formatTZS(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Dates: Pledge Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                Tarehe ya Kuweka Ahadi *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={pledgeDate}
                  onChange={(e) => setPledgeDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                Tarehe ya Kukamilisha (Due Date) *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-amber-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={dueDate}
                  min={pledgeDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-amber-500/50 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">
              Dokezo au Maombi Maalum (Hiari)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="mfano: Ahadi itakamilishwa kwa awamu mbili kupitia M-Pesa..."
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden placeholder-purple-300/40 font-medium"
              />
            </div>
          </div>

          {/* Action Buttons: Cancel and Submit arranged logically */}
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
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-purple-950 font-bold text-xs hover:from-amber-400 hover:to-amber-300 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-950" />
                  <span>Inahifadhiwa...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-950" />
                  <span>Thibitisha na Weka Ahadi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
