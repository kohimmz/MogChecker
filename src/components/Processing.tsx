import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle2 } from 'lucide-react';

interface ProcessingProps {
  onComplete: () => void;
}

const ANALYSIS_STEPS = [
  'Построение 3D-матрицы ключевых точек лица...',
  'Вычисление золотого сечения и гармонии третьей (fWHR)...',
  'Анализ гониального угла нижней челюсти и подбородка...',
  'Оценка кантал-тилта глаз и периорбитальной зоны...',
  'Анализ привлекательности прически и обрамления лица...',
  'Сопоставление с архетипом внешности (Sub 3 → True Adam)...',
];

export const Processing: React.FC<ProcessingProps> = ({ onComplete }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [characteristicsCount, setCharacteristicsCount] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Increment characteristics counter up to 100+
    const countTimer = setInterval(() => {
      setCharacteristicsCount((prev) => {
        if (prev >= 104) {
          clearInterval(countTimer);
          return 104;
        }
        return prev + 2;
      });
    }, 45);

    // Progress bar
    const progTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progTimer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 55);

    return () => {
      clearInterval(countTimer);
      clearInterval(progTimer);
    };
  }, [onComplete]);

  // Rotate through steps
  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStepIdx((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 450);

    return () => clearInterval(stepTimer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-8 bg-black text-white select-none max-w-lg mx-auto relative overflow-hidden">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_0,transparent_70%)] pointer-events-none" />

      {/* Header */}
      <div className="pt-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-3">
          <Cpu className="w-3.5 h-3.5 text-white animate-spin" />
          <span>НЕЙРОСЕТЕВАЯ ОБРАБОТКА</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
          Анализ пропорций
        </h2>
      </div>

      {/* Center Visualization */}
      <div className="my-auto flex flex-col items-center justify-center text-center">
        {/* Pulsing Hexagon / Ring */}
        <div className="relative w-36 h-36 flex items-center justify-center mb-8">
          <div className="absolute inset-0 rounded-full border border-zinc-800 animate-ping opacity-25" />
          <div className="absolute inset-2 rounded-full border border-dashed border-zinc-600 animate-spin" style={{ animationDuration: '12s' }} />
          <div className="absolute inset-6 rounded-full border border-white/20" />
          
          <div className="flex flex-col items-center">
            <span className="text-4xl font-extrabold font-mono text-white tracking-tighter">
              {characteristicsCount}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
              ХАРАКТЕРИСТИК
            </span>
          </div>
        </div>

        {/* Current Action Text */}
        <div className="h-14 flex items-center justify-center px-4">
          <p className="text-sm font-medium text-zinc-300 font-mono tracking-tight animate-pulse text-center">
            {ANALYSIS_STEPS[currentStepIdx]}
          </p>
        </div>

        {/* Done steps checklist */}
        <div className="mt-4 flex flex-col gap-1.5 w-full max-w-xs text-left">
          {ANALYSIS_STEPS.slice(0, currentStepIdx + 1).map((step, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{step.replace('...', '')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Progress */}
      <div className="pb-6 w-full">
        <div className="flex justify-between text-xs font-mono text-zinc-500 mb-2">
          <span>Синтез отчета</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-white transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center text-[10px] text-zinc-600 font-mono mt-3">
          ВЫЧИСЛЕНИЯ ЗАВЕРШАЮТСЯ В ОПЕРАТИВНОЙ ПАМЯТИ
        </div>
      </div>
    </div>
  );
};
