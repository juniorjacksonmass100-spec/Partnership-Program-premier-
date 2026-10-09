import React from 'react';
import { EmblemLogo } from './EmblemLogo';
import { Contribution, Profile, Pledge } from '../types/database.types';
import { formatTZS, formatDateSwahili, numberToWordsSwahili } from '../utils/formatters';
import { X, Printer, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  contribution: Contribution | null;
  partner?: Profile | null;
  pledge?: Pledge | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  contribution,
  partner,
  pledge,
}) => {
  if (!isOpen || !contribution) return null;

  const handlePrint = () => {
    window.print();
  };

  const partnerName = contribution.profiles?.full_name || partner?.full_name || 'Mshirika Mpendwa';
  const partnerPhone = contribution.profiles?.phone_number || partner?.phone_number || '-';
  const fellowship = contribution.profiles?.fellowship_center || partner?.fellowship_center || 'Makao Makuu';
  const amountWords = numberToWordsSwahili(contribution.amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Action Bar (Hidden when printing) */}
        <div className="bg-purple-950 px-6 py-3 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Hakikisho la Stakabadhi ya Kielektroniki</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-amber-400 text-purple-950 font-bold text-xs hover:bg-amber-300 transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Chapisha Stakabadhi</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-purple-200 hover:text-white rounded-full hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-8 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900">
          {/* Receipt Border & Styling */}
          <div className="border-4 border-double border-purple-900/40 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-purple-50/20 via-white to-amber-50/20 relative">
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
              <EmblemLogo size="xl" />
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-purple-900/30 pb-6 mb-6 gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <EmblemLogo size="lg" />
                <div>
                  <h1 className="font-serif font-black text-xl sm:text-2xl text-purple-950 tracking-wide uppercase">
                    JERUSALEM MINISTRY OF GOSPEL
                  </h1>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                    MPANGO WA USHIRIKA NA UTOAJI
                  </p>
                  <p className="text-[11px] text-purple-900 font-serif italic mt-0.5">
                    "Nikusanyieni wacha Mungu wangu, Waliofanya agano nami kwa dhabihu" — Zaburi 50:5
                  </p>
                  <p className="text-[10px] text-slate-500">Ufunuo wa Yohana 21:1-6 • Makao Makuu, Tanzania</p>
                </div>
              </div>

              {/* Receipt Number Badge */}
              <div className="text-center sm:text-right shrink-0 bg-purple-50 border border-purple-200 rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-purple-700 block tracking-wider">
                  Namba ya Stakabadhi
                </span>
                <span className="font-mono font-bold text-lg text-purple-950">
                  {contribution.receipt_number}
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Tarehe: {formatDateSwahili(contribution.contribution_date)}
                </span>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-4">
              <span className="inline-block px-4 py-1 rounded-full bg-purple-900 text-amber-300 font-serif font-bold text-xs uppercase tracking-widest shadow-2xs">
                STAKABADHI RASMI YA MCHANGO WA HUDUMA
              </span>
            </div>

            {/* Details Table */}
            <div className="space-y-4 my-6 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Imepokelewa Kutoka Kwa (Mshirika):</span>
                  <span className="text-base font-bold text-purple-950">{partnerName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Kituo cha Ibada / Tawi:</span>
                  <span className="text-sm font-semibold text-slate-800">{fellowship}</span>
                  {partnerPhone && partnerPhone !== '-' && (
                    <span className="text-xs text-slate-500 block">Simu: {partnerPhone}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Kusudi / Kategoria ya Utoaji:</span>
                  <span className="text-sm font-bold text-slate-800">{contribution.category}</span>
                  {(contribution.pledges || pledge) && (
                    <span className="text-xs text-purple-700 block mt-0.5">
                      Ahadi Na: {(contribution.pledges || pledge)?.pledge_number} — {(contribution.pledges || pledge)?.title}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Njia ya Malipo:</span>
                  <span className="text-sm font-semibold text-slate-800">{contribution.payment_method}</span>
                  {contribution.transaction_reference && (
                    <span className="text-xs font-mono text-slate-600 block mt-0.5">
                      Ref / Muamala: {contribution.transaction_reference}
                    </span>
                  )}
                </div>
              </div>

              {/* Amount Highlight Box */}
              <div className="p-4 rounded-xl bg-purple-900/5 border-2 border-purple-900/20 text-center my-4">
                <span className="text-xs uppercase font-bold text-purple-900 block mb-1">
                  Kiasi Kilichopokelewa (Amount in Figures):
                </span>
                <span className="font-serif font-black text-2xl sm:text-3xl text-purple-950 tracking-tight">
                  {formatTZS(contribution.amount)}
                </span>
                <div className="mt-2 pt-2 border-t border-purple-200/60">
                  <span className="text-xs text-slate-500 uppercase font-semibold mr-1">Kiasi kwa Maneno:</span>
                  <span className="text-xs sm:text-sm font-semibold text-purple-950 italic">
                    "{amountWords}"
                  </span>
                </div>
              </div>

              {contribution.notes && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Dokezo: </span>
                  {contribution.notes}
                </div>
              )}
            </div>

            {/* Stamp & Signature Section */}
            <div className="pt-6 mt-6 border-t border-purple-900/20 flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Electronic Stamp Seal */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-600/70 p-1 flex items-center justify-center text-center rotate-[-8deg]">
                  <div className="w-full h-full rounded-full border border-amber-500/80 flex flex-col items-center justify-center text-[7px] font-bold text-amber-700 leading-tight">
                    <span>JERUSALEM</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 my-0.5" />
                    <span>IMETHIBITISHWA</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 block">Stakabadhi Halisi ya Kielektroniki</span>
                  <span>Imethibitishwa kupitia mfumo wa Supabase</span>
                </div>
              </div>

              {/* Signature Line */}
              <div className="text-center sm:text-right">
                <div className="w-48 border-b-2 border-slate-400 mb-1"></div>
                <span className="text-xs font-bold text-slate-800 block">Mweka Hazina / Mchungaji Kiongozi</span>
                <span className="text-[10px] text-slate-500">Jerusalem Ministry of Gospel</span>
              </div>
            </div>

            {/* Footer Blessing */}
            <div className="mt-6 pt-3 border-t border-slate-100 text-center text-[11px] text-purple-900/80 font-serif italic">
              "Bwana akubarikie na kukulinda; Bwana akuangazie nuru ya uso wake na kukufadhili." — Hesabu 6:24-25
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
