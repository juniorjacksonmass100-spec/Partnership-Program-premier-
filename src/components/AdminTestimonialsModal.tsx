import React, { useState } from 'react';
import { Testimonial } from '../types/database.types';
import { supabase } from '../lib/supabase';
import { 
  X, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { formatDateSwahili } from '../utils/formatters';

interface AdminTestimonialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  testimonials: Testimonial[];
  onRefresh: () => void;
}

export const AdminTestimonialsModal: React.FC<AdminTestimonialsModalProps> = ({
  isOpen,
  onClose,
  testimonials,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');

  if (!isOpen) return null;

  const filtered = testimonials.filter((t) => {
    if (filter === 'approved') return t.is_approved;
    if (filter === 'pending') return !t.is_approved;
    return true;
  });

  const handleToggleApproval = async (item: Testimonial) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_approved: !item.is_approved })
        .eq('id', item.id);

      if (!error) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error toggling approval:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Je, una uhakika unataka kufuta ushuhuda huu?')) return;
    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (!error) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting testimonial:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080312]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#140827] text-slate-100 rounded-3xl shadow-2xl border border-purple-800/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white relative border-b border-purple-800/50 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-white/10 transition"
            title="Funga"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif font-bold text-xl text-white">
              Usimamizi wa Shuhuda za Washirika (Admin)
            </h2>
          </div>
          <p className="text-xs text-purple-200/90">
            Kagua, thibitisha au sitisha shuhuda za washirika zinazoonekana kwenye ukurasa wa umma.
          </p>

          {/* Filter Pills */}
          <div className="flex gap-2 mt-4 text-xs font-bold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'all' ? 'bg-amber-400 text-purple-950 shadow-xs' : 'bg-purple-950 text-purple-200 border border-purple-700/50'
              }`}
            >
              Zote ({testimonials.length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'approved' ? 'bg-amber-400 text-purple-950 shadow-xs' : 'bg-purple-950 text-purple-200 border border-purple-700/50'
              }`}
            >
              Zilizoidhinishwa ({testimonials.filter((t) => t.is_approved).length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'pending' ? 'bg-amber-400 text-purple-950 shadow-xs' : 'bg-purple-950 text-purple-200 border border-purple-700/50'
              }`}
            >
              Zinazosubiri ({testimonials.filter((t) => !t.is_approved).length})
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-purple-300/70 text-xs">
              Hakuna shuhuda zilizopatikana kwenye kundi hili.
            </div>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                className="bg-[#1b0e32] border border-purple-700/50 rounded-2xl p-4 transition flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-amber-300">
                        {t.author_name}
                      </span>
                      <span className="text-[10px] text-purple-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-purple-400" />
                        {t.fellowship_center}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-purple-400">
                        {formatDateSwahili(t.created_at)}
                      </span>
                      {t.is_approved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Imethibitishwa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-600/40">
                          <Clock className="w-3 h-3 text-amber-400" />
                          Inasubiri
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-xs text-white mb-1">{t.title}</h3>
                  <p className="text-xs text-purple-200/80 leading-relaxed whitespace-pre-wrap">{t.content}</p>
                </div>

                <div className="flex items-center justify-between border-t border-purple-800/40 pt-2.5 mt-1">
                  <span className="text-[10px] font-medium text-amber-400/90">
                    Kategoria: {t.category}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleApproval(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        t.is_approved
                          ? 'bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700/50'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                      }`}
                    >
                      {t.is_approved ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Sitisha</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Idhinisha</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-700/50 text-rose-300 transition"
                      title="Futa ushuhuda huu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
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
