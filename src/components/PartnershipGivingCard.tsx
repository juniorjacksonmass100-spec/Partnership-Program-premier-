import React, { useState } from 'react';
import { 
  Phone, 
  Copy, 
  Check, 
  User, 
  Sparkles, 
  Wallet, 
  ArrowRight, 
  ShieldCheck, 
  Receipt,
  HeartHandshake
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface PartnershipGivingCardProps {
  onRecordContribution?: () => void;
  compact?: boolean;
}

export const PartnershipGivingCard: React.FC<PartnershipGivingCardProps> = ({
  onRecordContribution,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);

  const PARTNER_PHONE = '0660022949';
  const PARTNER_NAME = 'Brighton Lameck Peter';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PARTNER_PHONE);
      setCopied(true);
      triggerHaptic('success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (compact) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/90 via-[#180a2c] to-indigo-950/90 border border-amber-500/40 p-4 shadow-lg text-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block">
                Namba ya Kutuma Ahadi & Sadaka
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-white tracking-wider">
                  {PARTNER_PHONE}
                </span>
                <span className="text-xs text-purple-200">({PARTNER_NAME})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border shadow-sm active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-amber-400 hover:bg-amber-300 text-purple-950 border-amber-300'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Imenakiliwa!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Nakili Namba</span>
                </>
              )}
            </button>
            {onRecordContribution && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onRecordContribution();
                }}
                className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-purple-900/80 hover:bg-purple-800 text-amber-300 border border-purple-700/80 transition-all flex items-center gap-1 active:scale-95"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Rekodi Muamala</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b0a30] via-[#140726] to-[#10061e] border-2 border-amber-500/50 shadow-2xl p-6 sm:p-8 text-slate-100 my-8 transition-all hover:border-amber-400">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Side: Headline & Badge */}
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Akaunti Rasmi ya Ushirika & Sadaka ya Ahadi</span>
          </div>

          <h3 className="font-serif font-black text-xl sm:text-2xl text-white tracking-tight leading-snug">
            Njia Rasmi ya Kutuma Sadaka na Ahadi za Ushirika
          </h3>

          <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
            Unaweza kutuma sadaka yako ya ushirika au malipo ya ahadi moja kwa moja kupitia namba hii ya simu. 
            Inapokea kutoka mitandao yote ya simu Tanzania (<strong className="text-amber-300 font-semibold">M-Pesa, Tigo Pesa, Airtel Money, HaloPesa</strong>).
          </p>

          {/* Network Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-red-950/70 text-red-300 border border-red-700/50">
              Vodacom M-Pesa
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-950/70 text-blue-300 border border-blue-700/50">
              Tigo Pesa
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-950/70 text-rose-300 border border-rose-700/50">
              Airtel Money
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-orange-950/70 text-orange-300 border border-orange-700/50">
              HaloPesa
            </span>
          </div>
        </div>

        {/* Right Side: Big Account Box */}
        <div className="w-full lg:w-auto bg-[#1f0b38] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col gap-4 shrink-0 lg:min-w-[340px]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 block mb-1">
              Namba ya Simu / Muamala
            </span>
            <div className="flex items-center justify-between gap-3 bg-[#120624] px-4 py-3 rounded-2xl border border-purple-700/60">
              <span className="font-mono text-xl sm:text-2xl font-black text-amber-300 tracking-wider">
                {PARTNER_PHONE}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs active:scale-90 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-400 hover:bg-amber-300 text-purple-950'
                }`}
                title="Nakili namba"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Imenakiliwa!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Nakili</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-[#120624] px-4 py-2.5 rounded-2xl border border-purple-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-900 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/30 shrink-0">
              <User className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] text-purple-300/80 block uppercase font-medium">Jina la Usajili</span>
              <span className="font-serif font-bold text-sm text-white block">
                {PARTNER_NAME}
              </span>
            </div>
          </div>

          {onRecordContribution && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onRecordContribution();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
            >
              <Receipt className="w-4 h-4" />
              <span>Nimeshatuma — Rekodi Muamala Wangu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
