import React, { useState } from 'react';
import { BodyType } from '../types';
import { EctomorphIcon, MesomorphIcon, AverageIcon, EndomorphIcon } from './BodyTypeIcons';
import { Check, ArrowRight, UserCheck } from 'lucide-react';

interface BodyTypeSelectProps {
  initialType?: BodyType;
  onNext: (bodyType: BodyType) => void;
  onBack: () => void;
}

interface BodyOption {
  type: BodyType;
  title: string;
  sub: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; selected?: boolean }>;
}

const BODY_OPTIONS: BodyOption[] = [
  {
    type: 'ectomorph',
    title: 'Худощавое',
    sub: 'Эктоморф',
    desc: 'Узкие плечи, быстрый метаболизм, тонкий костный каркас, минимальный процент жира.',
    icon: EctomorphIcon,
  },
  {
    type: 'mesomorph',
    title: 'Атлетическое',
    sub: 'Мезоморф',
    desc: 'V-образный силуэт, развитая мускулатура, широкие плечи, узкая талия.',
    icon: MesomorphIcon,
  },
  {
    type: 'average',
    title: 'Умеренное',
    sub: 'Нормостеник',
    desc: 'Сбалансированное телосложение, пропорциональный костяк, гармоничные линии.',
    icon: AverageIcon,
  },
  {
    type: 'endomorph',
    title: 'Плотное',
    sub: 'Эндоморф',
    desc: 'Широкая костная структура, массивный торс, плотное телосложение и сила.',
    icon: EndomorphIcon,
  },
];

export const BodyTypeSelect: React.FC<BodyTypeSelectProps> = ({
  initialType = 'mesomorph',
  onNext,
  onBack,
}) => {
  const [selected, setSelected] = useState<BodyType>(initialType);

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-8 bg-black text-white select-none max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-4">
          <UserCheck className="w-3.5 h-3.5 text-white" />
          <span>ШАГ 2 ИЗ 3 • ТЕЛОСЛОЖЕНИЕ</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 font-sans">
          Тип телосложения
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Выберите фигуру, наиболее точно отражающую ваше текущее телосложение.
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="my-6 grid grid-cols-2 gap-3 sm:gap-4">
        {BODY_OPTIONS.map((opt) => {
          const isSelected = selected === opt.type;
          const Icon = opt.icon;

          return (
            <div
              key={opt.type}
              onClick={() => setSelected(opt.type)}
              className={`relative p-4 rounded-2xl cursor-pointer flex flex-col items-center text-center transition-all duration-200 border ${
                isSelected
                  ? 'bg-zinc-900 border-white shadow-xl shadow-white/5 ring-1 ring-white'
                  : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
              }`}
            >
              {/* Selected check badge */}
              <div
                className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  isSelected ? 'bg-white text-black' : 'border border-zinc-700 bg-zinc-900 text-transparent'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>

              {/* Graphic Icon */}
              <div className="my-2 flex items-center justify-center">
                <Icon className="w-16 h-24 sm:w-20 sm:h-28 transition-transform duration-200 group-hover:scale-105" selected={isSelected} />
              </div>

              {/* Text */}
              <div className="mt-2 w-full">
                <div className="text-sm font-bold text-white tracking-tight">{opt.title}</div>
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">{opt.sub}</div>
                <p className="text-[10px] text-zinc-500 leading-tight hidden sm:block">
                  {opt.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Buttons */}
      <div className="pt-2 flex items-center gap-3">
        <button
          onClick={onBack}
          className="py-4 px-6 rounded-2xl font-semibold text-xs tracking-wide bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition-colors uppercase"
        >
          НАЗАД
        </button>
        <button
          onClick={() => onNext(selected)}
          className="flex-1 py-4 rounded-2xl font-bold text-sm tracking-wide bg-white text-black hover:bg-zinc-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase shadow-lg shadow-white/10"
        >
          <span>ПЕРЕЙТИ К СКАНЕРУ ЛИЦА</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
