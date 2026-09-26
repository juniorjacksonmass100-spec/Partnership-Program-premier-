import React from 'react';
import { EmblemLogo } from './EmblemLogo';
import { Sparkles, Shield, HeartHandshake, BookOpen, ArrowRight } from 'lucide-react';

interface ScriptureBannerProps {
  onJoinClick: () => void;
  onLoginClick: () => void;
}

export const ScriptureBanner: React.FC<ScriptureBannerProps> = ({ onJoinClick, onLoginClick }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white shadow-xl border border-amber-500/30 p-8 sm:p-12 mb-10">
      {/* Decorative Gold & Purple Background Glows */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        {/* Ministry Official Seal */}
        <div className="shrink-0 flex flex-col items-center">
          <EmblemLogo size="xl" />
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Mpango Rasmi wa Ushirika</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <span className="text-amber-400 font-serif font-bold text-sm tracking-widest uppercase block mb-1">
            JERUSALEM MINISTRY OF GOSPEL
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
            Agano la Ushirika na Utoaji wa Injili
          </h1>

          {/* Scripture Verse Quote Card */}
          <div className="my-4 p-4 rounded-xl bg-purple-900/60 border border-amber-400/30 backdrop-blur-xs text-left">
            <p className="text-amber-100 font-serif text-sm sm:text-base italic leading-relaxed">
              "Nikusanidieni wacha Mungu wangu, Waliofanya agano nami kwa dhabihu."
            </p>
            <div className="mt-1 flex items-center justify-between text-xs text-amber-300 font-semibold">
              <span>— Zaburi 50:5</span>
              <span className="text-purple-300">Ufunuo wa Yohana 21:1-6</span>
            </div>
          </div>

          <p className="text-purple-200 text-sm leading-relaxed mb-6">
            Karibu katika jukwaa rasmi la usimamizi wa ahadi na utoaji wa huduma. Simamia ahadi zako, 
            rekodi michango ya ujenzi, uinjilisti na vyombo vya ibada, na upate stakabadhi rasmi zenye uwazi kamili.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              onClick={onJoinClick}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-purple-950 font-bold text-sm shadow-lg hover:from-amber-300 hover:to-amber-500 transition flex items-center gap-2"
            >
              <span>Jiunge Kama Mshirika</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLoginClick}
              className="px-6 py-3 rounded-xl bg-purple-800/80 hover:bg-purple-700 text-amber-200 font-semibold text-sm border border-purple-500/40 transition flex items-center gap-2"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Ingia Kwenye Akaunti</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
