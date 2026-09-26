import React, { useState } from 'react';
import { Testimonial } from '../types/database.types';
import { formatDateSwahili } from '../utils/formatters';
import { Quote, Sparkles, HeartHandshake, User, MapPin, ChevronRight, X } from 'lucide-react';

interface TestimonialSectionProps {
  testimonials: Testimonial[];
  onOpenSubmitModal?: () => void;
  isLoggedIn?: boolean;
}

export const TestimonialSection: React.FC<TestimonialSectionProps> = ({
  testimonials,
  onOpenSubmitModal,
  isLoggedIn = false,
}) => {
  const approvedTestimonials = testimonials.filter((t) => t.is_approved);
  const [selectedTestimony, setSelectedTestimony] = useState<Testimonial | null>(null);

  if (approvedTestimonials.length === 0) {
    return null;
  }

  return (
    <div className="my-14 print:hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-500/30 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>SHUHUDA ZA WASHIRIKA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-amber-100">
            Kazi Kuu Ambazo Bwana Ametenda
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-xl">
            Tazama shuhuda halisi kutoka kwa washirika wa Jerusalem Ministry of Gospel walioona mkono wa Mungu kupitia agano la ushirika na dhabihu.
          </p>
        </div>

        {isLoggedIn && onOpenSubmitModal && (
          <button
            onClick={onOpenSubmitModal}
            className="px-4 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-amber-300 font-bold text-xs shadow-sm transition flex items-center gap-1.5 border border-amber-500/30 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Toa Ushuhuda Wako</span>
          </button>
        )}
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {approvedTestimonials.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelectedTestimony(t)}
            className="group relative cursor-pointer bg-[#150a24] rounded-3xl p-6 border border-purple-800/40 shadow-md hover:shadow-xl hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/40 text-amber-300 border border-amber-800/60">
                  {t.category || 'Ushuhuda wa Baraka'}
                </span>
                <Quote className="w-5 h-5 text-purple-600/70 group-hover:text-amber-400 transition" />
              </div>

              <h4 className="font-serif font-bold text-base text-amber-200 mb-2 group-hover:text-amber-300 transition line-clamp-2">
                {t.title}
              </h4>

              <p className="text-xs text-purple-200/80 line-clamp-4 italic leading-relaxed">
                "{t.content}"
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-purple-900/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-900 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-400/30">
                  {t.author_name?.charAt(0).toUpperCase() || 'M'}
                </div>
                <div>
                  <span className="font-bold text-slate-100 block text-xs">
                    {t.author_name}
                  </span>
                  <span className="text-[10px] text-purple-300/70 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{t.fellowship_center || 'Makao Makuu'}</span>
                  </span>
                </div>
              </div>

              <span className="text-[10px] text-purple-400">
                {formatDateSwahili(t.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for viewing full testimony */}
      {selectedTestimony && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#160b26] text-slate-100 rounded-3xl shadow-2xl border border-purple-800/70 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white relative border-b border-purple-800/50">
              <button
                onClick={() => setSelectedTestimony(null)}
                className="absolute top-4 right-4 p-1.5 text-purple-200 hover:text-white rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-purple-950 font-bold text-xs inline-block mb-2">
                {selectedTestimony.category || 'Ushuhuda wa Huduma'}
              </span>
              <h3 className="font-serif font-bold text-xl text-amber-200">
                {selectedTestimony.title}
              </h3>
              <p className="text-xs text-purple-200 mt-1">
                Kutoka kwa {selectedTestimony.author_name} ({selectedTestimony.fellowship_center || 'Makao Makuu'}) • {formatDateSwahili(selectedTestimony.created_at)}
              </p>
            </div>

            <div className="p-6 text-slate-200 text-sm leading-relaxed space-y-4 max-h-[60vh] overflow-y-auto italic">
              <p className="whitespace-pre-line font-serif">
                "{selectedTestimony.content}"
              </p>
            </div>

            <div className="p-4 bg-[#12081f] border-t border-purple-900/60 flex justify-end">
              <button
                onClick={() => setSelectedTestimony(null)}
                className="px-5 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-amber-300 font-bold text-xs transition border border-amber-500/30"
              >
                Funga
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
