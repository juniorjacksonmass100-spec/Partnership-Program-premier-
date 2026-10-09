import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Testimonial } from '../types/database.types';
import { supabase, formatSupabaseError } from '../lib/supabase';
import { 
  X, 
  Sparkles, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Tag 
} from 'lucide-react';

interface TestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  userTestimonials?: Testimonial[];
  onSuccess: () => void;
}

export const TestimonialModal: React.FC<TestimonialModalProps> = ({
  isOpen,
  onClose,
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
          is_approved: true,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080312]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#140827] text-slate-100 rounded-3xl shadow-2xl border border-purple-800/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white relative border-b border-purple-800/50 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-white/10 transition"
            title="Funga"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Kazi Kuu za Mungu</span>
          </div>
          <h2 className="font-serif font-bold text-xl text-white">
            Shuhudia Wema wa Mungu
          </h2>
          <p className="text-xs text-purple-200/90 mt-0.5">
            "Nao wakamshinda kwa damu ya Mwana-kondoo, na kwa neno la ushuhuda wao" — Ufunuo 12:11
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                Kichwa cha Ushuhuda *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="mfano: Jinsi Mungu Alivyofungua Milango Baada ya Ahadi ya Hekalu"
                className="w-full px-3.5 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden placeholder-purple-300/40 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                Kategoria ya Ushuhuda *
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
                >
                  <option value="Utoaji na Miujiza ya Kifedha" className="bg-[#140827] text-white">Utoaji na Miujiza ya Kifedha</option>
                  <option value="Ujenzi wa Hekalu la Bwana" className="bg-[#140827] text-white">Ujenzi wa Hekalu la Bwana</option>
                  <option value="Uponyaji wa Kimuujiza" className="bg-[#140827] text-white">Uponyaji wa Kimuujiza</option>
                  <option value="Amani na Ushindi Kwenye Familia" className="bg-[#140827] text-white">Amani na Ushindi Kwenye Familia</option>
                  <option value="Kazi, Biashara & Ajira Mpya" className="bg-[#140827] text-white">Kazi, Biashara & Ajira Mpya</option>
                  <option value="Ushuhuda wa Shukrani ya Kipekee" className="bg-[#140827] text-white">Ushuhuda wa Shukrani ya Kipekee</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                Ushuhuda Wako Kamili *
              </label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Eleza kwa ufupi jinsi Mungu alivyokutendea tangu uanze kushiriki kwenye agano hili la dhabihu..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden placeholder-purple-300/40 font-medium"
              />
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
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-purple-950 font-bold text-xs hover:from-amber-400 hover:to-amber-300 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-950" />
                    <span>Inatuma...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-purple-950" />
                    <span>Tuma Ushuhuda Wangu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
