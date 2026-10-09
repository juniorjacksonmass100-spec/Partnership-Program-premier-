import React, { useState } from 'react';
import emblemImg from '../assets/images/church_app_icon_1791534447376.jpg';

interface EmblemLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const EmblemLogo: React.FC<EmblemLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative shrink-0 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-purple-700 to-amber-300 shadow-md ${sizeClasses}`}>
        {!imgError ? (
          <img
            src={emblemImg}
            alt="Jerusalem Ministry of Gospel Seal"
            className="w-full h-full object-cover rounded-full"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-b from-purple-900 to-indigo-950 flex flex-col items-center justify-center p-1 border border-amber-400/60 text-amber-300">
            <span className="text-[9px] font-serif font-black tracking-wider uppercase">JERUSALEM</span>
            <div className="w-4 h-4 my-0.5 rounded-full border border-amber-400 bg-amber-500/20 flex items-center justify-center text-[8px] font-bold">
              ✝
            </div>
            <span className="text-[7px] text-amber-200/90 text-center scale-90">MINISTRY</span>
          </div>
        )}
      </div>

      {showSubtitle && (
        <div className="flex flex-col text-left">
          <span className="font-serif font-bold text-lg leading-tight tracking-wide text-purple-950">
            JERUSALEM
          </span>
          <span className="text-xs font-semibold text-amber-700 tracking-wider uppercase">
            MINISTRY OF GOSPEL
          </span>
          <span className="text-[10px] text-purple-700 font-medium">
            Ufunuo 21:1-6 • Zaburi 50:5
          </span>
        </div>
      )}
    </div>
  );
};
