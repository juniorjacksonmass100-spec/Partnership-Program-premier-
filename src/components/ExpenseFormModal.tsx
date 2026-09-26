import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, formatSupabaseError } from '../lib/supabase';
import { formatTZS } from '../utils/formatters';
import { X, TrendingDown, Calendar, FileText, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { ExpenseCategory } from '../types/database.types';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Uendeshaji wa Huduma');
  const [amount, setAmount] = useState<string>('50000');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receiptRef, setReceiptRef] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  if (!isOpen || !isAdmin) return null;

  const presetAmounts = [20000, 50000, 100000, 250000, 500000, 1000000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amountNum = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Tafadhali weka kiasi sahihi cha matumizi (TZS).');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Tafadhali andika maelezo au jina la matumizi.');
      return;
    }

    setLoading(true);

    try {
      const currentYear = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const expenseNumber = `EXP-${currentYear}-${randomSuffix}`;

      const { error } = await supabase.from('expenses').insert([
        {
          expense_number: expenseNumber,
          title: title.trim(),
          category,
          amount: amountNum,
          expense_date: expenseDate,
          receipt_ref: receiptRef.trim() || null,
          description: description.trim() || null,
          created_by: user?.id,
        },
      ]);

      if (error) throw error;

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
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-purple-950 p-6 text-white text-left relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-rose-200 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-semibold mb-2">
            <TrendingDown className="w-3.5 h-3.5 text-rose-300" />
            <span>Rekodi ya Matumizi ya Hazina</span>
          </div>
          <h2 className="font-serif font-bold text-xl text-white">
            Rekodi Gharama / Matumizi ya Huduma
          </h2>
          <p className="text-xs text-rose-200 mt-0.5">
            Jopo la Utawala • Usimamizi thabiti wa fedha na uwazi
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kichwa / Kusudi la Matumizi *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="mfano: Ununuzi wa Kebo na Maikrofoni za Madhabahuni"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kategoria ya Matumizi *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-hidden bg-white"
            >
              <option value="Uendeshaji wa Huduma">Uendeshaji wa Huduma</option>
              <option value="Uinjilisti & Safari za Misheni">Uinjilisti & Safari za Misheni</option>
              <option value="Vifaa vya Sauti & Muziki">Vifaa vya Sauti & Muziki</option>
              <option value="Misaada ya Kijamii & Yatima">Misaada ya Kijamii & Yatima</option>
              <option value="Ujenzi & Ukarabati wa Kanisa">Ujenzi & Ukarabati wa Kanisa</option>
              <option value="Maji, Umeme & Pango">Maji, Umeme & Pango</option>
              <option value="Semina & Mikutano ya Injili">Semina & Mikutano ya Injili</option>
              <option value="Gharama za Utawala">Gharama za Utawala</option>
              <option value="Mengineyo">Mengineyo</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Kiasi cha Matumizi (TZS) *
              </label>
              <span className="text-xs font-bold text-rose-800">
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
              className="w-full px-3 py-2 text-base font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-hidden text-slate-900"
            />

            <div className="flex flex-wrap gap-1.5 mt-2">
              {presetAmounts.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmount(String(amt))}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                    amount === String(amt)
                      ? 'bg-rose-900 text-rose-100 font-bold'
                      : 'bg-slate-100 hover:bg-rose-50 text-slate-700'
                  }`}
                >
                  {formatTZS(amt)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tarehe ya Matumizi *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Namba ya Risiti / Vocha
              </label>
              <input
                type="text"
                value={receiptRef}
                onChange={(e) => setReceiptRef(e.target.value)}
                placeholder="mfano: VCH-9941"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Maelezo ya Ziada (Hiari)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Maelezo ya stakabadhi au walipwaji..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 focus:border-transparent outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-800 to-rose-700 text-white font-bold text-sm hover:from-rose-700 hover:to-rose-600 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Inahifadhiwa kwenye Supabase...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Hifadhi Rekodi ya Matumizi</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
