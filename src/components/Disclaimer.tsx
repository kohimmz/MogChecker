import React, { useState } from 'react';
import { ShieldCheck, Lock, HeartHandshake, Sparkles, Check, ArrowRight } from 'lucide-react';

interface DisclaimerProps {
  onAccept: () => void;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ onAccept }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-8 bg-black text-white select-none max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-white" />
          <span>ПРИНЦИПЫ И БЕЗОПАСНОСТЬ</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 font-sans">
          Дисклеймер & Конфиденциальность
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
          Пожалуйста, внимательно ознакомьтесь с принципами работы нашего алгоритма перед началом сканирования.
        </p>
      </div>

      {/* Cards List */}
      <div className="my-6 space-y-3.5">
        {/* Card 1: Красота и индивидуальность */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white shrink-0 mt-0.5">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">
                Каждый человек по-своему красив
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Не существует идеальных людей. Восприятие привлекательности субъективно. Данный алгоритм анализирует лишь математические геометрические пропорции (золотое сечение, симметрию и углы черт лица).
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Психологический аспект & Отказ от ответственности */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">
                Психологический контекст & Отказ от ответственности
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Числовой результат и архетип созданы исключительно для развлечения, подбора идеальной прически и самосовершенствования. Оценки алгоритмов не определяют вашу истинную ценность, обаяние, харизму или человеческие качества.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: 100% Локальность & Память телефона */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">
                100% Локально: в памяти вашего устройства
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ваше лицо, снимки и биометрические расчеты остаются <strong className="text-white font-medium">исключительно в оперативной памяти вашего телефона</strong>. Никакие фотографии не передаются в интернет, облачные базы или на серверы третьих лиц.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Agreement Checkbox */}
      <div className="space-y-4 pt-2">
        <label
          onClick={() => setAgreed(!agreed)}
          className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer select-none transition-colors hover:bg-zinc-900/50"
        >
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              agreed ? 'bg-white border-white text-black' : 'border-zinc-600 bg-zinc-900'
            }`}
          >
            {agreed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
          <span className="text-xs text-zinc-300 font-medium leading-snug">
            Я ознакомлен с дисклеймером и принимаю условия локальной обработки
          </span>
        </label>

        <button
          disabled={!agreed}
          onClick={onAccept}
          className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 uppercase transition-all duration-200 ${
            agreed
              ? 'bg-white text-black hover:bg-zinc-200 active:scale-[0.99] shadow-lg shadow-white/10'
              : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
          }`}
        >
          <span>ПРИНЯТЬ И ПРОДОЛЖИТЬ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
