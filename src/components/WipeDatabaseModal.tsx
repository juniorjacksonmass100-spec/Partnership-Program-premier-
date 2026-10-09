import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  RefreshCcw,
  Database
} from 'lucide-react';

interface WipeDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WipeDatabaseModal: React.FC<WipeDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [scope, setScope] = useState<'pledges_contributions' | 'entire_database'>('pledges_contributions');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const REQUIRED_CONFIRM_PHRASE = 'FUTA ZOTE';
  const isConfirmed = confirmText.trim().toUpperCase() === REQUIRED_CONFIRM_PHRASE;

  const handleExecuteWipe = async () => {
    if (!isConfirmed || loading) return;
    setLoading(true);
    setError(null);

    try {
      if (isSupabaseConfigured) {
        if (scope === 'pledges_contributions') {
          // Delete contributions first due to foreign keys, then pledges
          const { error: contribErr } = await supabase.from('contributions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (contribErr) throw contribErr;

          const { error: pledgeErr } = await supabase.from('pledges').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (pledgeErr) throw pledgeErr;
        } else {
          // Entire database wipe (contributions, pledges, expenses, messages, notifications, news, testimonials)
          await supabase.from('contributions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('pledges').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Hitilafu wakati wa kufuta data:', err);
      setError(err?.message || 'Hitilafu imetokea wakati wa kufuta data kwenye kanzidata.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080312]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#140827] text-slate-100 rounded-3xl shadow-2xl border border-rose-800/60 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-red-950 to-purple-950 p-6 text-white text-left relative border-b border-rose-800/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-rose-300 hover:text-white rounded-full hover:bg-white/10 transition"
            title="Funga"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-rose-900/60 border border-rose-600/50 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-white">
                Kufuta & Kusafisha Kanzidata (Admin Only)
              </h2>
              <span className="text-xs text-rose-300 font-semibold">
                Hatua hii ni ya kudumu na haiwezi kubadilishwa baada ya kutekelezwa!
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-700/80 rounded-xl text-xs text-rose-200">
              {error}
            </div>
          )}

          {/* Scope Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-purple-200 uppercase tracking-wider">
              Chagua Kiwango cha Kufuta:
            </label>

            <div className="space-y-2">
              <label
                onClick={() => setScope('pledges_contributions')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  scope === 'pledges_contributions'
                    ? 'bg-purple-950/80 border-amber-500/80 shadow-xs'
                    : 'bg-[#180b2f] border-purple-800/50 hover:bg-purple-950/40'
                }`}
              >
                <input
                  type="radio"
                  name="wipe_scope"
                  checked={scope === 'pledges_contributions'}
                  onChange={() => setScope('pledges_contributions')}
                  className="mt-1 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <span className="font-serif font-bold text-sm text-white block">
                    Safisha Ahadi na Michango Pekee (Pledges & Contributions)
                  </span>
                  <span className="text-xs text-purple-300/80 block mt-0.5">
                    Hufuta ahadi zote na stakabadhi za michango (kwa mfano baada ya kufanya majaribio). Akaunti za washirika na gharama zitasalia salama.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setScope('entire_database')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  scope === 'entire_database'
                    ? 'bg-rose-950/60 border-rose-500 shadow-xs'
                    : 'bg-[#180b2f] border-purple-800/50 hover:bg-purple-950/40'
                }`}
              >
                <input
                  type="radio"
                  name="wipe_scope"
                  checked={scope === 'entire_database'}
                  onChange={() => setScope('entire_database')}
                  className="mt-1 text-rose-500 focus:ring-rose-500"
                />
                <div>
                  <span className="font-serif font-bold text-sm text-rose-300 block">
                    Futa Kanzidata Yote (Full Wipe)
                  </span>
                  <span className="text-xs text-rose-200/80 block mt-0.5">
                    Hufuta ahadi zote, michango, matumizi/gharama, ujumbe na arifa zote. Hurejesha mfumo kuwa safi kabisa kwa ajili ya kuanza upya.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Warning box */}
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3 text-xs text-rose-200 leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-1">Thibitisha Kufuta:</p>
              Ili kuzuia kubofya kwa bahati mbaya, tafadhali andika neno <span className="font-mono font-black text-amber-300 bg-black/40 px-1.5 py-0.5 rounded border border-amber-500/40">FUTA ZOTE</span> kwenye kisanduku hapa chini ili kuruhusu kitufe cha kufuta.
            </div>
          </div>

          {/* Confirmation input */}
          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1.5">
              Andika <span className="font-mono text-amber-400">FUTA ZOTE</span> kuthibitisha:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Andika FUTA ZOTE..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#1c0f33] text-white border border-rose-700/80 text-xs placeholder-purple-400/50 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-hidden font-mono tracking-wider font-bold"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#100622] border-t border-purple-800/40 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 hover:text-white font-semibold text-xs transition"
          >
            Ghairi (Sitisha)
          </button>

          <button
            type="button"
            disabled={!isConfirmed || loading}
            onClick={handleExecuteWipe}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white font-bold text-xs hover:from-rose-500 hover:to-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Inafuta...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Tekeleza Kufuta Takwimu</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
