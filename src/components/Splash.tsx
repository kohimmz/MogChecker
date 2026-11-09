import React, { useEffect, useState } from 'react';
import { Scan, Shield, Sparkles } from 'lucide-react';

interface SplashProps {
  onComplete: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 400);
          return 100;
        }
        return prev + 4;
      });
    }, 60);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between p-8 bg-black text-white select-none overflow-hidden">
      {/* Background ambient subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Top subtle tag */}
      <div className="pt-8 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-zinc-500 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span>V1.0 • ON-DEVICE AI</span>
      </div>

      {/* Main Logo & Branding */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="relative mb-8">
          {/* Animated glow ring */}
          <div className="absolute -inset-4 rounded-3xl bg-white/5 blur-xl animate-pulse" />
          
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-950 border border-zinc-700/60 flex items-center justify-center shadow-2xl">
            <Scan className="w-12 h-12 text-white stroke-[1.5]" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-white font-sans uppercase">
          Mog Checker
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 tracking-[0.2em] uppercase font-mono mb-6">
          Aesthetic Facial Symmetry
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-xs text-[11px] text-zinc-400 font-mono">
          <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-white" /> 100+ Пропорций
          </span>
          <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-white" /> 100% On-Device
          </span>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="w-full max-w-xs pb-6">
        <div className="flex justify-between text-xs font-mono text-zinc-500 mb-2">
          <span>Инициализация нейросети</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-white transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center text-[10px] text-zinc-600 font-mono mt-3">
          SECURE ENCLAVE LOCAL PROCESSING
        </div>
      </div>
    </div>
  );
};
