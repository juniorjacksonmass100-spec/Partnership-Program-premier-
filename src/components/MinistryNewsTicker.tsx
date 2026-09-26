import React, { useState, useEffect } from 'react';
import { MinistryNews } from '../types/database.types';
import { formatDateSwahili } from '../utils/formatters';
import { 
  Radio, 
  Sparkles, 
  Calendar, 
  X, 
  Settings2,
  ChevronRight,
  ChevronLeft,
  Pause,
  Play,
  Volume2,
  Flame,
  AlertCircle
} from 'lucide-react';

interface MinistryNewsTickerProps {
  newsList: MinistryNews[];
  isAdmin?: boolean;
  onOpenManageNews?: () => void;
}

export const MinistryNewsTicker: React.FC<MinistryNewsTickerProps> = ({
  newsList,
  isAdmin = false,
  onOpenManageNews,
}) => {
  const activeNews = newsList.filter((n) => n.is_active);
  const [selectedNews, setSelectedNews] = useState<MinistryNews | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-flip featured breaking news headline every 6 seconds
  useEffect(() => {
    if (!isPlaying || activeNews.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeNews.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isPlaying, activeNews.length]);

  if (activeNews.length === 0) {
    return null;
  }

  const currentFeatured = activeNews[currentIndex] || activeNews[0];

  // Repeat items 4 times to ensure seamless infinite looping without gaps on any screen resolution
  const crawlerItems = [
    ...activeNews, 
    ...activeNews, 
    ...activeNews, 
    ...activeNews
  ];

  return (
    <>
      {/* Component-scoped CSS for guaranteed TV news ticker motion */}
      <style>{`
        @keyframes tvCrawlContinuous {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        @keyframes liveEqBar1 {
          0%, 100% { height: 4px; }
          50% { height: 14px; }
        }
        @keyframes liveEqBar2 {
          0%, 100% { height: 12px; }
          50% { height: 5px; }
        }
        @keyframes liveEqBar3 {
          0%, 100% { height: 6px; }
          50% { height: 16px; }
        }
        @keyframes liveEqBar4 {
          0%, 100% { height: 14px; }
          50% { height: 7px; }
        }
        .tv-news-crawler-track {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: tvCrawlContinuous 24s linear infinite;
        }
        .tv-news-crawler-paused {
          animation-play-state: paused !important;
        }
      `}</style>

      <section 
        aria-label="Habari za Huduma" 
        className="w-full bg-[#120822] text-amber-100 border-y border-purple-800/60 shadow-lg relative select-none print:hidden z-30"
      >
        {/* Main TV News Bar */}
        <div className="flex flex-col sm:flex-row items-stretch">
          
          {/* Left TV Broadcast Lower-Third Badge */}
          <div className="z-20 shrink-0 bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white px-3 sm:px-4 py-2 flex items-center justify-between sm:justify-start gap-2.5 shadow-md border-r border-red-600/50">
            <div className="flex items-center gap-2">
              {/* Pulsing Beacon */}
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>

              {/* Broadcast Title */}
              <div className="flex flex-col leading-none">
                <span className="font-serif font-black text-xs sm:text-xs tracking-wider uppercase text-white drop-shadow-xs">
                  HABARI ZA HUDUMA
                </span>
                <span className="text-[9px] text-amber-200 uppercase font-bold tracking-widest mt-0.5 flex items-center gap-1">
                  <span>MBASHARA</span>
                  <span className="inline-block w-1 h-1 rounded-full bg-amber-300"></span>
                  <span>LIVE NEWS</span>
                </span>
              </div>
            </div>

            {/* Broadcast Soundwave Audio Equalizer Animation */}
            <div className="flex items-end gap-0.5 h-4 ml-2 px-1 py-0.5 bg-red-950/60 rounded">
              <span className="w-1 bg-amber-400 rounded-full" style={{ animation: 'liveEqBar1 0.8s ease-in-out infinite' }}></span>
              <span className="w-1 bg-amber-300 rounded-full" style={{ animation: 'liveEqBar2 0.7s ease-in-out infinite 0.1s' }}></span>
              <span className="w-1 bg-amber-400 rounded-full" style={{ animation: 'liveEqBar3 0.9s ease-in-out infinite 0.2s' }}></span>
              <span className="w-1 bg-amber-300 rounded-full" style={{ animation: 'liveEqBar4 0.6s ease-in-out infinite 0.3s' }}></span>
            </div>
          </div>

          {/* Featured Breaking News Headline Flipper (TV Lower Third Highlight) */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-[#170c2a] border-r border-purple-800/50 shrink-0 max-w-sm">
            <span className="px-2 py-0.5 rounded bg-amber-400 text-purple-950 font-black text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Flame className="w-3 h-3 text-purple-950" />
              <span>Hivi Punde</span>
            </span>

            <div 
              onClick={() => setSelectedNews(currentFeatured)}
              className="cursor-pointer truncate text-xs font-semibold text-amber-100 hover:text-amber-300 transition"
              title="Bofya kusoma habari kamili"
            >
              <span className="truncate block max-w-[200px]">
                {currentFeatured.title}
              </span>
            </div>

            {/* Headline Controls */}
            <div className="flex items-center gap-1 ml-auto shrink-0">
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + activeNews.length) % activeNews.length)}
                className="p-1 rounded hover:bg-purple-900/60 text-purple-300 hover:text-white transition"
                title="Habari iliyotangulia"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 rounded hover:bg-purple-900/60 text-amber-300 hover:text-white transition"
                title={isPlaying ? 'Sitisha uhuishaji (Pause)' : 'Endeleza uhuishaji (Play)'}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % activeNews.length)}
                className="p-1 rounded hover:bg-purple-900/60 text-purple-300 hover:text-white transition"
                title="Habari inayofuata"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Continuous TV Broadcast Marquee Crawler */}
          <div className="flex-1 overflow-hidden relative py-2 sm:py-2.5 bg-gradient-to-r from-[#140924] via-[#190d2e] to-[#140924] flex items-center">
            <div 
              className={`tv-news-crawler-track flex items-center ${!isPlaying ? 'tv-news-crawler-paused' : ''}`}
            >
              {crawlerItems.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={() => setSelectedNews(item)}
                  className="inline-flex items-center gap-2.5 px-6 cursor-pointer hover:text-amber-300 transition-colors group whitespace-nowrap text-xs"
                >
                  {/* Glowing Star Separator */}
                  <span className="text-amber-400 font-bold text-sm shrink-0 drop-shadow-xs">✦</span>

                  {item.is_urgent && (
                    <span className="px-2 py-0.5 rounded-sm bg-amber-400 text-purple-950 font-black text-[9px] uppercase tracking-wider shrink-0 animate-pulse shadow-xs">
                      MUHIMU
                    </span>
                  )}

                  {item.category && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-900/90 text-amber-200 border border-purple-700/60 text-[10px] font-semibold shrink-0">
                      {item.category}
                    </span>
                  )}

                  <span className="font-semibold text-slate-100 group-hover:text-amber-300 text-xs sm:text-sm transition-colors drop-shadow-2xs">
                    {item.title}
                  </span>

                  <span className="text-purple-300/80 text-xs hidden md:inline max-w-sm truncate">
                    — {item.content}
                  </span>

                  <span className="text-amber-400/90 text-[10px] font-medium underline ml-1 hidden lg:inline group-hover:text-amber-200">
                    (Bofya kusoma)
                  </span>
                </div>
              ))}
            </div>

            {/* Left and right subtle fade gradient overlays for smooth TV broadcast aesthetics */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#140924] to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#140924] to-transparent pointer-events-none"></div>
          </div>

          {/* Right Action / Admin Quick Manage Trigger */}
          {isAdmin && onOpenManageNews && (
            <div className="z-20 shrink-0 px-2.5 py-1.5 bg-[#170c2a] border-l border-purple-800/50 flex items-center justify-end">
              <button
                onClick={onOpenManageNews}
                className="px-3 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs"
                title="Dhibiti Habari za Huduma (Admin)"
              >
                <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Simamia Habari</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Modal for Full News Article Details */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#160b26] text-slate-100 rounded-3xl shadow-2xl border border-purple-800/80 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white relative border-b border-purple-800/50">
              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-4 right-4 p-1.5 text-purple-200 hover:text-white rounded-full hover:bg-white/10 transition"
                aria-label="Funga"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-700 text-white font-bold text-xs shadow-xs">
                  {selectedNews.category || 'Habari za Huduma'}
                </span>
                {selectedNews.is_urgent && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-purple-950 font-black text-xs">
                    Taarifa Muhimu
                  </span>
                )}
              </div>

              <h3 className="font-serif font-bold text-xl text-amber-200 leading-snug">
                {selectedNews.title}
              </h3>
              
              <p className="text-xs text-purple-200 mt-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Tarehe: {formatDateSwahili(selectedNews.created_at)}</span>
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-slate-200 text-sm leading-relaxed space-y-4 max-h-[60vh] overflow-y-auto bg-[#160b26]">
              <div className="p-3.5 rounded-2xl bg-purple-950/50 border border-purple-800/40 text-purple-200 text-xs flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Tangazo rasmi kutoka Uongozi wa Jerusalem Ministry of Gospel.</span>
              </div>
              <p className="whitespace-pre-line text-slate-100 text-sm leading-relaxed">
                {selectedNews.content}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#12081f] border-t border-purple-900/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Zaburi 50:5</span>
              </div>
              <button
                onClick={() => setSelectedNews(null)}
                className="px-5 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-amber-300 font-bold text-xs transition border border-amber-500/30"
              >
                Funga
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
