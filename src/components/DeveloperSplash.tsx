import React, { useEffect } from 'react';

interface DeveloperSplashProps {
  onContinue: () => void;
}

export const DeveloperSplash: React.FC<DeveloperSplashProps> = ({ onContinue }) => {
  useEffect(() => {
    const timer = window.setTimeout(onContinue, 2800);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [onContinue]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center select-none"
      style={{
        background:
          'radial-gradient(circle at 50% 35%, #1e1b4b 0%, #090d1a 62%, #030712 100%)',
      }}
      data-testid="developer-splash"
    >
      {/* Golden Ornamental Crest */}
      <div className="mb-6 animate-float-slow">
        <svg
          width="88"
          height="88"
          viewBox="0 0 88 88"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="44"
            cy="44"
            r="40"
            stroke="#FBBF24"
            strokeWidth="2.5"
            strokeDasharray="6 4"
          />
          <circle cx="44" cy="44" r="32" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
          <path
            d="M44 19L51 35H66L54 45L58 61L44 52L30 61L34 45L22 35H37L44 19Z"
            fill="#FBBF24"
            stroke="#FEF3C7"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <p className="text-xs sm:text-sm font-semibold tracking-[0.28em] text-amber-300/90 uppercase mb-3">
        Welcome To
      </p>

      <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl text-balance leading-tight">
        ALPHABET ADVENTURE
      </h1>
      <p className="mt-2 text-sm sm:text-lg font-semibold tracking-[0.22em] text-amber-400 uppercase">
        The Ultimate A to Z World
      </p>

      {/* Dark & Golden Developer Signature Plaque */}
      <div
        className="mt-10 px-8 py-6 rounded-2xl border border-amber-400/35 max-w-md w-full"
        style={{
          background: 'rgba(15, 23, 42, 0.88)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(251,191,36,0.2)',
        }}
      >
        <p className="text-[11px] tracking-[0.26em] text-amber-200/75 uppercase">
          DEVELOPED BY
        </p>
        <p className="font-display text-2xl sm:text-3xl font-extrabold tracking-wider text-amber-300 mt-1">
          TIRTHA JAGAT
        </p>
        <div className="my-3 h-px w-24 mx-auto bg-amber-400/40" />
        <p className="text-[11px] tracking-[0.24em] text-slate-300/80 uppercase">
          FROM
        </p>
        <p className="text-sm sm:text-base font-semibold tracking-[0.14em] text-amber-100 mt-1">
          NUAPADA, ODISHA, INDIA
        </p>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-8 px-7 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm tracking-wide transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
      >
        Enter A–Z World
      </button>
    </div>
  );
};
