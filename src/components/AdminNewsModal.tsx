import React, { useState } from 'react';
import { MinistryNews } from '../types/database.types';
import { supabase, formatSupabaseError } from '../lib/supabase';
import { 
  X, 
  Megaphone, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Loader2, 
  Eye, 
  EyeOff,
  Sparkles
} from 'lucide-react';
import { formatDateSwahili } from '../utils/formatters';

interface AdminNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsList: MinistryNews[];
  onRefresh: () => void;
}

export const AdminNewsModal: React.FC<AdminNewsModalProps> = ({
  isOpen,
  onClose,
  newsList,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New item form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Matangazo ya Huduma');
  const [isUrgent, setIsUrgent] = useState(false);

  if (!isOpen) return null;

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !content.trim()) {
      setErrorMsg('Tafadhali jaza kichwa cha habari na maelezo.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('ministry_news').insert([
        {
          title: title.trim(),
          content: content.trim(),
          category: category.trim(),
          is_urgent: isUrgent,
          is_active: true,
        },
      ]);

      if (error) {
        console.warn('Supabase insert note:', error.message);
      }

      setTitle('');
      setContent('');
      setIsUrgent(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (item: MinistryNews) => {
    try {
      const { error } = await supabase
        .from('ministry_news')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (!error) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error toggling news active status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Je, una uhakika unataka kufuta tangazo hili la habari?')) return;
    try {
      const { error } = await supabase.from('ministry_news').delete().eq('id', id);
      if (!error) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting news item:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080312]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#140827] text-slate-100 rounded-3xl shadow-2xl border border-purple-800/60 overflow-hidden flex flex-col max-h-[90vh]">
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
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>Matangazo ya Habari za Huduma (News Ticker)</span>
          </div>
          <h2 className="font-serif font-bold text-xl text-white">
            Usimamizi wa Habari za Huduma
          </h2>
          <p className="text-xs text-purple-200/90 mt-0.5">
            Ongeza au hariri habari zinazotembea kwenye kichwa cha tovuti na dashibodi ya washirika.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Add News Form */}
          <form onSubmit={handleAddNews} className="bg-[#1b0e32] p-4 rounded-2xl border border-purple-700/60 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-400" />
              Tangaza Habari Mpya
            </h3>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                Kichwa cha Habari *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="mfano: Mkutano Mkuu wa Uamsho wa Kiroho Mwezi Huu"
                className="w-full px-3.5 py-2.5 text-sm bg-[#140827] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden placeholder-purple-300/40 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1.5">
                  Kategoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#140827] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
                >
                  <option value="Matangazo ya Huduma" className="bg-[#140827] text-white">Matangazo ya Huduma</option>
                  <option value="Ujenzi wa Hekalu" className="bg-[#140827] text-white">Ujenzi wa Hekalu</option>
                  <option value="Uinjilisti & Misheni" className="bg-[#140827] text-white">Uinjilisti & Misheni</option>
                  <option value="Vyombo vya Ibada" className="bg-[#140827] text-white">Vyombo vya Ibada</option>
                  <option value="Semina & Mafundisho" className="bg-[#140827] text-white">Semina & Mafundisho</option>
                  <option value="Taarifa Maalum" className="bg-[#140827] text-white">Taarifa Maalum</option>
                </select>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-purple-200">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500"
                  />
                  <span>Weka kama "Muhimu Sana" (Breaking Alert)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                Maelezo Kamili ya Tangazo *
              </label>
              <textarea
                rows={3}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Maelezo kamili ya tangazo yatakayotangazwa kwa washirika wote..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#140827] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden placeholder-purple-300/40 font-medium"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-amber-400 text-purple-950 font-bold text-xs hover:bg-amber-300 transition flex items-center gap-2 shadow-md disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-950" />
                    <span>Inatuma...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-950" />
                    <span>Tangaza Tangazo Hili</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* List of Existing News */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-3">
              Orodha ya Habari ({newsList.length})
            </h3>

            <div className="space-y-2.5">
              {newsList.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    item.is_active
                      ? 'bg-[#1b0e32] border-purple-700/50'
                      : 'bg-[#130822] border-purple-900/40 opacity-60'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {item.is_urgent && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-purple-950 uppercase">
                          Muhimu
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-950 text-purple-200 border border-purple-800">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-purple-400">
                        {formatDateSwahili(item.created_at)}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-[11px] text-purple-200/80 line-clamp-1 mt-0.5">{item.content}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                        item.is_active
                          ? 'bg-emerald-950/70 border-emerald-600/40 text-emerald-300'
                          : 'bg-purple-950/70 border-purple-800 text-purple-400'
                      }`}
                      title={item.is_active ? 'Sitisha tangazo' : 'Wezesha tangazo'}
                    >
                      {item.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span className="text-[10px] font-semibold">{item.is_active ? 'Inarushwa' : 'Imesitishwa'}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-700/50 text-rose-300 transition"
                      title="Futa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#120722] border-t border-purple-800/40 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 font-semibold text-xs border border-purple-700/50 transition"
          >
            Funga
          </button>
        </div>
      </div>
    </div>
  );
};
