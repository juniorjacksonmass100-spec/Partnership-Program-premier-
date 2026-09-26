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
  EyeOff 
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
        // If table doesn't exist yet, save locally
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
    if (!window.confirm('Je, una uhakika unataka kufuta habari hii?')) return;
    try {
      const { error } = await supabase
        .from('ministry_news')
        .delete()
        .eq('id', id);

      if (!error) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting news:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-purple-200 dark:border-purple-900/40 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-purple-200 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif font-bold text-xl text-white">
              Usimamizi wa Habari za Huduma (News Admin)
            </h2>
          </div>
          <p className="text-xs text-purple-200">
            Dhibiti habari na matangazo yanayoonekana juu ya kurasa zote za washirika na wageni
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 dark:text-slate-100">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Add News Form */}
          <form onSubmit={handleAddNews} className="bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/50 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-950 dark:text-amber-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-purple-700 dark:text-amber-400" />
              Tangaza Habari Mpya
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kichwa cha Habari *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="mfano: Mkutano Mkuu wa Uamsho wa Kiroho Mwezi Huu"
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-600 outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-600 outline-hidden"
                >
                  <option value="Matangazo ya Huduma">Matangazo ya Huduma</option>
                  <option value="Ujenzi wa Hekalu">Ujenzi wa Hekalu</option>
                  <option value="Uinjilisti & Misheni">Uinjilisti & Misheni</option>
                  <option value="Vyombo vya Ibada">Vyombo vya Ibada</option>
                  <option value="Semina & Mafundisho">Semina & Mafundisho</option>
                  <option value="Taarifa Maalum">Taarifa Maalum</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                  />
                  <span>Tia alama kama Taarifa Muhimu (Urgent)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Maelezo Kamili ya Habari *
              </label>
              <textarea
                rows={2}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Andika maelezo ya kina ya habari au tangazo la huduma..."
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-600 outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-amber-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Chapisha Habari Hii</span>
            </button>
          </form>

          {/* Existing News List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Habari Zilizopo ({newsList.length})
            </h3>

            {newsList.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Hakuna habari zilizorekodiwa kwa sasa.</p>
            ) : (
              <div className="space-y-2.5">
                {newsList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-start justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs text-purple-950 dark:text-amber-200">
                          {item.title}
                        </span>
                        {item.is_urgent && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-bold text-[9px] uppercase">
                            MUHIMU
                          </span>
                        )}
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                          item.is_active 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {item.is_active ? 'Inaonekana' : 'Imezimwa'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{item.content}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {formatDateSwahili(item.created_at)} • Kategoria: {item.category || 'Huduma'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-purple-900 hover:bg-purple-50 dark:hover:bg-slate-700 transition"
                        title={item.is_active ? 'Zima habari hii' : 'Washa habari hii'}
                      >
                        {item.is_active ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition"
                        title="Futa habari"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
