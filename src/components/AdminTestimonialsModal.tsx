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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-purple-200 dark:border-purple-900/40 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-purple-200 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif font-bold text-xl text-white">
              Usimamizi wa Shuhuda za Washirika (Admin)
            </h2>
          </div>
          <p className="text-xs text-purple-200">
            Kagua, thibitisha au sitisha shuhuda za washirika zinazoonekana kwenye ukurasa wa umma
          </p>

          {/* Filter Pills */}
          <div className="flex gap-2 mt-4 text-xs font-bold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'all' ? 'bg-amber-400 text-purple-950 shadow-xs' : 'bg-purple-900/60 text-purple-200'
              }`}
            >
              Zote ({testimonials.length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'approved' ? 'bg-amber-400 text-purple-950 shadow-xs' : 'bg-purple-900/60 text-purple-200'
              }`}
            >
              Zilizoidhinishwa ({testimonials.filter(t => t.is_approved).length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'pending' ? 'bg-amber-400 text-purple-950 shadow-xs' : 'bg-purple-900/60 text-purple-200'
              }`}
            >
              Zinazosubiri Idhini ({testimonials.filter(t => !t.is_approved).length})
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 text-slate-800 dark:text-slate-100">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              Hakuna shuhuda zilizopatikana kwenye kategoria hii.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-purple-950 dark:text-amber-200">
                        {item.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {item.category || 'Ushuhuda'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.is_approved 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {item.is_approved ? '✓ Inaonekana Hadharani' : '⏳ Inasubiri Idhini'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.author_name}</span>
                      <span>• {item.fellowship_center || 'Makao Makuu'}</span>
                      <span>• {formatDateSwahili(item.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleApproval(item)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                        item.is_approved
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs'
                      }`}
                    >
                      {item.is_approved ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Sitisha</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Idhinisha (Approve)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition"
                      title="Futa ushuhuda"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                  "{item.content}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
