import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Testimonial } from '../types/database.types';
import { supabase, formatSupabaseError } from '../lib/supabase';
import { 
  X, 
  Sparkles, 
  HeartHandshake, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Quote, 
  Calendar 
} from 'lucide-react';
import { formatDateSwahili } from '../utils/formatters';

interface TestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  userTestimonials?: Testimonial[];
  onSuccess: () => void;
}

export const TestimonialModal: React.FC<TestimonialModalProps> = ({
  isOpen,
  onClose,
  userTestimonials = [],
  onSuccess,
}) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Utoaji na Miujiza ya Kifedha');
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim() || !content.trim()) {
      setErrorMsg('Tafadhali jaza kichwa cha ushuhuda na maelezo yako ya kumshukuru Mungu.');
      return;
    }

    if (!user) {
      setErrorMsg('Tafadhali ingia kwenye akaunti kwanza.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('testimonials').insert([
        {
          user_id: user.id,
          author_name: profile?.full_name || user.email?.split('@')[0] || 'Mshirika',
          fellowship_center: profile?.fellowship_center || 'Makao Makuu',
          title: title.trim(),
          category: category.trim(),
          content: content.trim(),
          is_approved: true, // Default active so immediately visible or admin can manage
        },
      ]);

      if (error) {
        throw error;
      }

      setSuccessMsg('Ushuhuda wako umepokelewa na kuhifadhiwa kwa utukufu wa Mungu! Sasa unaonekana kwenye ukurasa wa huduma.');
      setTitle('');
      setContent('');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-purple-200 dark:border-purple-900/40 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-purple-200 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Kazi Kuu za Mungu</span>
          </div>
          <h2 className="font-serif font-bold text-xl text-white">
            Toa Ushuhuda Wako wa Ushirika & Baraka
          </h2>
          <p className="text-xs text-purple-200 mt-0.5">
            "Wakamshinda kwa damu ya Mwana-Kondoo, na kwa neno la ushuhuda wao" — Ufunuo 12:11
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-slate-800 dark:text-slate-100">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kichwa cha Ushuhuda *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="mfano: Jinsi Mungu Alivyofungua Milango Baada ya Ahadi ya Hekalu"
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kategoria ya Ushuhuda
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-600 outline-hidden"
              >
                <option value="Utoaji na Miujiza ya Kifedha">Utoaji na Miujiza ya Kifedha</option>
                <option value="Ujenzi wa Hekalu la Bwana">Ujenzi wa Hekalu la Bwana</option>
                <option value="Uponyaji wa Kimuujiza">Uponyaji wa Kimuujiza</option>
                <option value="Amani na Ushindi Kwenye Familia">Amani na Ushindi Kwenye Familia</option>
                <option value="Kazi, Biashara & Ajira Mpya">Kazi, Biashara & Ajira Mpya</option>
                <option value="Ushuhuda wa Shukrani ya Kipekee">Ushuhuda wa Shukrani ya Kipekee</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ushuhuda Wako Kamili *
              </label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Eleza kwa ufupi jinsi Mungu alivyokutendea tangu uanze kushiriki kwenye agano hili la dhabihu..."
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-600 outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-950 text-amber-300 font-bold text-xs rounded-xl shadow-md hover:from-purple-800 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-60 border border-amber-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Inahifadhiwa kwenye Supabase...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>Tuma Ushuhuda Wangu</span>
                </>
              )}
            </button>
          </form>

          {/* User's Previous Testimonies */}
          {userTestimonials.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Shuhuda Zako Zilizopita ({userTestimonials.length})
              </h4>
              <div className="space-y-2">
                {userTestimonials.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-purple-950 dark:text-amber-200">{t.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        t.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.is_approved ? 'Inaonekana hadharani' : 'Inakaguliwa'}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 line-clamp-2 italic">"{t.content}"</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formatDateSwahili(t.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
