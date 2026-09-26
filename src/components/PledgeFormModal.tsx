import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, formatSupabaseError } from '../lib/supabase';
import { formatTZS } from '../utils/formatters';
import { X, HeartHandshake, Calendar, FileText, AlertCircle, Loader2, Sparkles, User } from 'lucide-react';
import { Profile } from '../types/database.types';

interface PledgeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

      const { error } = await supabase.from('pledges').insert([
        {
          user_id: effectiveUserId,
          pledge_number: pledgeNumber,
          title: title.trim(),
          category: category.trim(),
          target_amount: amountNum,
          pledge_date: pledgeDate,
          due_date: dueDate,
          status: 'active',
          notes: notes.trim() || null,
        },
      ]);

      if (error) {
        throw error;
      }

      onSuccess();
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
            <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
            <span>Agano la Ahadi ya Ushirika</span>
          </div>
          <h2 className="font-serif font-bold text-xl text-white">
            Weka Ahadi ya Utoaji
          </h2>
          <p className="text-xs text-purple-200 mt-0.5">
            "Kila mtu na atoe kama alivyokusudia moyoni mwake" — 2 Wakorintho 9:7
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
                Weka Ahadi kwa Ajili ya Mshirika (Kama Msimamizi)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
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

          {/* Purpose / Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kusudi la Ahadi / Mradi wa Huduma *
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setTitle(e.target.value);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden bg-white"
            >
              <option value="Ujenzi wa Hekalu la Ibada">Ujenzi wa Hekalu la Ibada</option>
              <option value="Uinjilisti & Misheni za Vijijini">Uinjilisti & Misheni za Vijijini</option>
              <option value="Vyombo vya Muziki na Sauti">Vyombo vya Muziki na Sauti</option>
              <option value="Huduma ya Jamii & Yatima">Huduma ya Jamii & Yatima</option>
              <option value="Sadaka ya Ushirika wa Kila Mwezi">Sadaka ya Ushirika wa Kila Mwezi</option>
              <option value="Gari la Huduma / Usafiri">Gari la Huduma / Usafiri</option>
              <option value="Sadaka Maalum ya Shukrani">Sadaka Maalum ya Shukrani</option>
              <option value="Mengineyo">Mradi Mwingine Maalum</option>
            </select>
          </div>

          {/* Title description if customized */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Maelezo Mafupi ya Ahadi *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="mfano: Mchango wa Vifaa vya Hekalu Kuu"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden"
            />
          </div>

          {/* Target Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Kiasi cha Ahadi (TZS) *
              </label>
              <span className="text-xs font-bold text-purple-900">
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
              className="w-full px-3 py-2 text-base font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden text-slate-900"
            />

            {/* Quick Amount Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presetAmounts.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setTargetAmount(String(amt))}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                    targetAmount === String(amt)
                      ? 'bg-purple-900 text-amber-300 font-bold'
                      : 'bg-slate-100 hover:bg-purple-50 text-slate-700'
                  }`}
                >
                  {formatTZS(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Dates: Pledge Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tarehe ya Kuweka Ahadi *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={pledgeDate}
                  onChange={(e) => setPledgeDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tarehe ya Kukamilisha (Due Date) *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-purple-600 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={dueDate}
                  min={pledgeDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden bg-purple-50/30"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dokezo au Maombi Maalum (Hiari)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="mfano: Ahadi itakamilishwa kwa awamu mbili kupitia M-Pesa..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-950 text-amber-300 font-bold text-sm hover:from-purple-800 hover:to-indigo-900 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-60 border border-amber-500/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Inahifadhiwa kwenye Supabase...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Thibitisha na Weka Ahadi</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
