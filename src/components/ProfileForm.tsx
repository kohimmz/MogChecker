import React, { useState } from 'react';
import { Ruler, Scale, Calendar, ArrowRight, Activity } from 'lucide-react';

interface ProfileFormProps {
  initialHeight?: number;
  initialWeight?: number;
  initialAge?: number;
  onNext: (data: { height: number; weight: number; age: number; bmi: number }) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialHeight = 180,
  initialWeight = 76,
  initialAge = 22,
  onNext,
}) => {
  const [height, setHeight] = useState(initialHeight);
  const [weight, setWeight] = useState(initialWeight);
  const [age, setAge] = useState(initialAge);

  const heightInMeters = height / 100;
  const bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(1));

  let bmiLabel = 'Нормальный вес';
  let bmiColor = 'text-white border-zinc-700 bg-zinc-900';
  if (bmi < 18.5) {
    bmiLabel = 'Дефицит массы';
    bmiColor = 'text-zinc-300 border-zinc-700 bg-zinc-900';
  } else if (bmi >= 25 && bmi < 30) {
    bmiLabel = 'Плотное / Атлетичное';
    bmiColor = 'text-zinc-200 border-zinc-700 bg-zinc-900';
  } else if (bmi >= 30) {
    bmiLabel = 'Массивное телосложение';
    bmiColor = 'text-zinc-300 border-zinc-700 bg-zinc-900';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ height, weight, age, bmi });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-8 bg-black text-white select-none max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-4">
          <Activity className="w-3.5 h-3.5 text-white" />
          <span>ШАГ 1 ИЗ 3 • ПАРАМЕТРЫ ТЕЛА</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 font-sans">
          Антропометрия
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Укажите ваш рост, вес и возраст для расчета индекса массы и калибровки пропорций черепа.
        </p>
      </div>

      {/* Inputs Form */}
      <form onSubmit={handleSubmit} className="my-6 space-y-5">
        {/* Height Slider & Input */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
              <Ruler className="w-4 h-4 text-white" />
              <span>Рост</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-white font-mono">{height}</span>
              <span className="text-xs font-mono text-zinc-500">см</span>
            </div>
          </div>
          <input
            type="range"
            min={140}
            max={220}
            step={1}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-2">
            <span>140 см</span>
            <span>180 см</span>
            <span>220 см</span>
          </div>
        </div>

        {/* Weight Slider & Input */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
              <Scale className="w-4 h-4 text-white" />
              <span>Вес</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-white font-mono">{weight}</span>
              <span className="text-xs font-mono text-zinc-500">кг</span>
            </div>
          </div>
          <input
            type="range"
            min={40}
            max={150}
            step={1}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-2">
            <span>40 кг</span>
            <span>75 кг</span>
            <span>150 кг</span>
          </div>
        </div>

        {/* Age Slider & Input */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-white" />
              <span>Возраст</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-white font-mono">{age}</span>
              <span className="text-xs font-mono text-zinc-500">лет</span>
            </div>
          </div>
          <input
            type="range"
            min={14}
            max={75}
            step={1}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-2">
            <span>14 лет</span>
            <span>25 лет</span>
            <span>75 лет</span>
          </div>
        </div>

        {/* Calculated BMI Badge */}
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs text-zinc-400 font-mono">Расчетный ИМТ:</span>
            <span className="text-sm font-bold font-mono text-white">{bmi}</span>
          </div>
          <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${bmiColor}`}>
            {bmiLabel}
          </span>
        </div>
      </form>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl font-bold text-sm tracking-wide bg-white text-black hover:bg-zinc-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase shadow-lg shadow-white/10"
        >
          <span>ВЫБРАТЬ ТЕЛОСЛОЖЕНИЕ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
