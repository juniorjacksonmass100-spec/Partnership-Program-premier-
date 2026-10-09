import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, formatSupabaseError } from '../lib/supabase';
import { formatTZS } from '../utils/formatters';
import { X, TrendingDown, Calendar, FileText, AlertCircle, Loader2, Sparkles, Tag } from 'lucide-react';
import { ExpenseCategory, Expense } from '../types/database.types';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newExpense?: Expense) => void;
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

      const { data: inserted, error } = await supabase.from('expenses').insert([
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
      ]).select().single();

      if (error) throw error;

      onSuccess(inserted as Expense);
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
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-purple-950 p-6 text-white text-left relative border-b border-rose-800/40 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-rose-200 hover:text-white rounded-full hover:bg-white/10 transition"
            title="Funga"
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
          <p className="text-xs text-rose-200/90 mt-0.5">
            Dhibiti na fuatilia matumizi ya hazina ya kanisa kwa uwazi na stakabadhi.
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

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">
              Jina / Maelezo ya Gharama *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="mfano: Malipo ya Umeme na Maji ya Hekalu Kuu"
              className="w-full px-3.5 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-hidden placeholder-purple-300/40 font-medium"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">
              Kategoria ya Gharama *
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-hidden font-medium"
              >
                <option value="Ujenzi & Ukarabati" className="bg-[#140827] text-white">Ujenzi & Ukarabati wa Majengo</option>
                <option value="Uinjilisti & Mikutano" className="bg-[#140827] text-white">Uinjilisti & Mikutano ya Hadhara</option>
                <option value="Vyombo & Mifumo ya Sauti" className="bg-[#140827] text-white">Vyombo vya Muziki & Mifumo ya Sauti</option>
                <option value="Huduma ya Jamii & Misaada" className="bg-[#140827] text-white">Huduma ya Jamii & Misaada ya Yatima</option>
                <option value="Uendeshaji wa Huduma" className="bg-[#140827] text-white">Uendeshaji wa Kila Siku (Umeme, Maji, n.k.)</option>
                <option value="Usafiri & Mafuta" className="bg-[#140827] text-white">Usafiri wa Watumishi & Mafuta ya Magari</option>
                <option value="Gharama Nyingine" className="bg-[#140827] text-white">Gharama Nyinginezo Maalum</option>
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-purple-200">
                Kiasi Kilichotumika (TZS) *
              </label>
              <span className="text-xs font-bold text-rose-300">
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
              className="w-full px-3.5 py-2.5 text-base font-bold bg-[#1c0f33] text-rose-300 border border-purple-700/60 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-hidden"
            />

            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {presetAmounts.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmount(String(amt))}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                    amount === String(amt)
                      ? 'bg-rose-600 text-white font-bold shadow-xs'
                      : 'bg-[#1c0f33] hover:bg-purple-900/60 text-purple-200 border border-purple-700/40'
                  }`}
                >
                  {formatTZS(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Receipt Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                Tarehe ya Gharama *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                Namba ya Vocha / Risiti ya Muuzaji
              </label>
              <input
                type="text"
                value={receiptRef}
                onChange={(e) => setReceiptRef(e.target.value)}
                placeholder="mfano: REC-9921 au EFD..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-hidden placeholder-purple-300/40 font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">
              Maelezo ya Ziada (Hiari)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="mfano: Vifaa hivi vilinunuliwa Kariakoo kwa ajili ya awamu ya kwanza..."
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-hidden placeholder-purple-300/40 font-medium"
              />
            </div>
          </div>

          {/* Buttons: Cancel & Submit */}
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
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 text-white font-bold text-xs hover:from-rose-500 hover:to-rose-400 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Inarekodiwa...</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-white" />
                  <span>Rekodi Gharama ya Hazina</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
