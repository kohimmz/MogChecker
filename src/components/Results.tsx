import React, { useState } from 'react';
import { ScanResult, UserProfile } from '../types';
import { ARCHETYPES } from '../utils/archetypes';
import { PhotoFlawInspector } from './PhotoFlawInspector';
import {
  Award,
  Scissors,
  CheckCircle,
  TrendingUp,
  Share2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  ShieldCheck,
  Eye,
  Sliders,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultsProps {
  result: ScanResult;
  profile: UserProfile;
  onRestart: () => void;
}

export const Results: React.FC<ResultsProps> = ({ result, profile, onRestart }) => {
  const [activeTab, setActiveTab] = useState<'flaws' | 'overview' | 'metrics' | 'hair' | 'plan'>('flaws');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Золотое сечение и трети');
  const [showTierList, setShowTierList] = useState(false);
  const [copied, setCopied] = useState(false);

  // Trigger celebration confetti for high scores
  React.useEffect(() => {
    if (result.overallScore >= 7.0) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#ffffff', '#a1a1aa', '#71717a']
        });
      } catch (e) {}
    }
  }, [result.overallScore]);

  // Group metrics by category
  const categories = Array.from(new Set(result.metrics.map((m) => m.category)));

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'MogChecker AI Result',
        text: `Мой результат в MogChecker: ${result.overallScore}/10 (${result.archetype.name}), оценка прически: ${result.hairAnalysis.score}/10!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `Мой результат в MogChecker: ${result.overallScore}/10 (${result.archetype.name}), оценка прически: ${result.hairAnalysis.score}/10!`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white select-none pb-12 max-w-lg mx-auto">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-mono tracking-widest uppercase text-zinc-400">
            ИТОГОВЫЙ ОТЧЕТ
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Поделиться"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRestart}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Заново"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Main Score & Archetype Hero Card */}
        <div className="relative rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 p-6 shadow-2xl overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
                Общий рейтинг привлекательности
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-black font-sans text-white tracking-tight">
                  {result.overallScore.toFixed(1)}
                </span>
                <span className="text-lg font-mono text-zinc-500">/ 10.0</span>
              </div>
            </div>

            {/* Archetype Badge */}
            <div className="flex flex-col items-end">
              <span className="px-3 py-1 rounded-full bg-white text-black font-extrabold text-xs tracking-wider uppercase font-mono shadow-md">
                {result.archetype.code}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 mt-1">
                {result.archetype.title}
              </span>
            </div>
          </div>

          {/* Archetype Illustration & Summary */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/60 border border-zinc-850 my-4">
            <div className="w-20 h-24 rounded-xl overflow-hidden bg-white/5 border border-zinc-700 shrink-0 flex items-center justify-center">
              <img
                src={result.archetype.image}
                alt={result.archetype.name}
                className="w-full h-full object-contain filter invert contrast-125"
                onError={(e) => {
                  // Fallback if image path differs
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white font-sans uppercase tracking-wide">
                  {result.archetype.name}
                </h4>
                <button
                  onClick={() => setShowTierList(!showTierList)}
                  className="text-[10px] font-mono text-zinc-400 hover:text-white underline"
                >
                  {showTierList ? 'Скрыть иерархию' : 'Все архетипы'}
                </button>
              </div>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                {result.archetype.description}
              </p>
            </div>
          </div>

          {/* Collapsible Tier list reference from image.png */}
          {showTierList && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="text-xs font-mono text-zinc-400 uppercase mb-3 flex items-center justify-between">
                <span>Иерархия типажей (из референса):</span>
                <span className="text-[10px] text-zinc-500">Sub 3 → True Adam</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {Object.values(ARCHETYPES).map((arch) => {
                  const isCurrent = arch.id === result.archetype.id;
                  return (
                    <div
                      key={arch.id}
                      className={`p-2 rounded-xl border flex flex-col items-center text-center ${
                        isCurrent
                          ? 'bg-zinc-800 border-white'
                          : 'bg-zinc-950/60 border-zinc-850 opacity-70'
                      }`}
                    >
                      <div className="w-10 h-14 overflow-hidden rounded mb-1">
                        <img
                          src={arch.image}
                          alt={arch.name}
                          className="w-full h-full object-contain filter invert contrast-125"
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-white uppercase">
                        {arch.code}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500">
                        {arch.scoreRange[0]}-{arch.scoreRange[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-850 text-center">
            <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-850">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Симметрия</div>
              <div className="text-base font-extrabold text-white font-mono mt-0.5">
                {result.symmetryScore}%
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-850">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Челюсть</div>
              <div className="text-base font-extrabold text-white font-mono mt-0.5">
                {result.jawlineScore}/10
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-850">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Прическа</div>
              <div className="text-base font-extrabold text-white font-mono mt-0.5">
                {result.hairAnalysis.score}/10
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-5 rounded-2xl bg-zinc-950 p-1 border border-zinc-800 text-[10px] sm:text-xs font-mono gap-1">
          <button
            onClick={() => setActiveTab('flaws')}
            className={`py-2 rounded-xl font-medium transition-all flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'flaws'
                ? 'bg-white text-black font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1">
              Дефекты
              {result.flaws && result.flaws.length > 0 && (
                <span
                  className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                    activeTab === 'flaws'
                      ? 'bg-red-500 text-white'
                      : 'bg-zinc-800 text-red-400'
                  }`}
                >
                  {result.flaws.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 rounded-xl font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-black font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Обзор
          </button>
          <button
            onClick={() => setActiveTab('hair')}
            className={`py-2 rounded-xl font-medium transition-all ${
              activeTab === 'hair'
                ? 'bg-white text-black font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Прическа
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-2 rounded-xl font-medium transition-all ${
              activeTab === 'metrics'
                ? 'bg-white text-black font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            100+ Черты
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`py-2 rounded-xl font-medium transition-all ${
              activeTab === 'plan'
                ? 'bg-white text-black font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            План
          </button>
        </div>

        {/* Tab Content: PHOTO FLAW INSPECTOR */}
        {activeTab === 'flaws' && (
          <div className="space-y-4">
            <PhotoFlawInspector
              imageSrc={result.capturedImage}
              flaws={result.flaws || []}
              points={result.points}
              faceShape={result.faceShape}
            />
          </div>
        )}

        {/* Tab Content: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Quick access banner to flaws */}
            <div
              onClick={() => setActiveTab('flaws')}
              className="p-4 rounded-2xl bg-gradient-to-r from-red-950/30 to-zinc-900 border border-red-900/40 hover:border-red-700/60 cursor-pointer flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Инспектор дефектов на фото</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-300 font-mono">
                      {result.flaws?.length || 0} отмечено
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Интерактивные линии симметрии, тилта и углов на вашем лице
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>
            {/* Morphological profile card */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
                <span>Морфология & Геометрия лица</span>
                <span className="text-[10px] text-zinc-500">3D Face Mesh</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Форма лица:</span>
                  <span className="font-bold font-mono text-white px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                    {result.faceShape}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Кантал-тилт (угол глаз):</span>
                  <span className="font-bold font-mono text-white">
                    {result.canthalTilt}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Телосложение:</span>
                  <span className="font-bold font-mono text-white capitalize">
                    {profile.bodyType === 'ectomorph' ? 'Худощавое (Эктоморф)' :
                     profile.bodyType === 'mesomorph' ? 'Атлетическое (Мезоморф)' :
                     profile.bodyType === 'average' ? 'Умеренное (Нормостеник)' : 'Плотное (Эндоморф)'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">ИМТ (Рост {profile.height} см / Вес {profile.weight} кг):</span>
                  <span className="font-bold font-mono text-white">
                    {profile.bmi.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Strengths card */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-white" />
                <span>Ключевые сильные стороны лица</span>
              </div>
              <div className="space-y-2">
                {result.strengths.map((str, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick action to Hair tab */}
            <div
              onClick={() => setActiveTab('hair')}
              className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-800 text-white">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Разбор прически</div>
                  <div className="text-[11px] text-zinc-400">
                    Оценка: {result.hairAnalysis.score}/10 • 3 подходящих стрижки
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-white">Смотреть →</span>
            </div>
          </div>
        )}

        {/* Tab Content: HAIR ANALYSIS */}
        {activeTab === 'hair' && (
          <div className="space-y-4">
            {/* Hair Score Hero */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Привлекательность прически
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-extrabold font-sans text-white">
                      {result.hairAnalysis.score.toFixed(1)}
                    </span>
                    <span className="text-sm font-mono text-zinc-500">/ 10.0</span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <Scissors className="w-7 h-7 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-zinc-850">
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Объем волос:</span>
                  <span className="text-white font-bold">{result.hairAnalysis.volumeRating}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Краевая линия:</span>
                  <span className="text-white font-bold">{result.hairAnalysis.hairlineShape}</span>
                </div>
              </div>
            </div>

            {/* Haircuts tailored to face shape */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
                <span>Идеальные стрижки для формы «{result.faceShape}»</span>
                <span className="text-[10px] text-zinc-500">Топ барбер-выбор</span>
              </div>
              <div className="space-y-3">
                {result.hairAnalysis.recommendedCuts.map((cut, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{cut.name}</span>
                      <span className="text-[10px] font-mono text-zinc-300 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
                        {cut.suitability}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-snug">{cut.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Styling tips */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
                Рекомендации по укладке и стайлингу
              </div>
              <div className="space-y-2">
                {result.hairAnalysis.stylingTips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: 100+ METRICS */}
        {activeTab === 'metrics' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 text-xs text-zinc-400 font-mono">
              <span>АНАТОМИЧЕСКИЕ ПАРАМЕТРЫ ({result.metrics.length})</span>
              <span>ИДЕАЛ / РЕЗУЛЬТАТ</span>
            </div>

            {categories.map((cat) => {
              const catMetrics = result.metrics.filter((m) => m.category === cat);
              const isExpanded = expandedCategory === cat;
              const avgCatScore = (
                catMetrics.reduce((acc, m) => acc + m.score, 0) / catMetrics.length
              ).toFixed(1);

              return (
                <div
                  key={cat}
                  className="rounded-2xl bg-zinc-950 border border-zinc-850 overflow-hidden"
                >
                  {/* Category Header Accordion */}
                  <div
                    onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-900/60 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{cat}</div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        {catMetrics.length} параметров
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-white px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        {avgCatScore} / 10
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {/* Category Metric Items */}
                  {isExpanded && (
                    <div className="border-t border-zinc-850 p-4 space-y-3 bg-zinc-950/40">
                      {catMetrics.map((item) => (
                        <div key={item.id} className="space-y-1">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="text-zinc-300 font-medium">{item.name}</span>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-zinc-500 text-[11px]">{item.userRatio}</span>
                              <span className="font-bold text-white">{item.score.toFixed(1)}</span>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white transition-all duration-300"
                              style={{ width: `${(item.score / 10) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                            <span>{item.detail}</span>
                            <span>Идеал: {item.idealRatio}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Content: ACTION PLAN */}
        {activeTab === 'plan' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-white" />
                <span>Персональный план луксмаксинга</span>
              </div>
              <p className="text-xs text-zinc-400">
                Практические научно обоснованные шаги для максимального раскрытия вашего эстетического потенциала.
              </p>
            </div>

            {result.improvements.map((imp, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                    {imp.category}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-300">
                    Эффект: {imp.impact}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5">{imp.title}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">{imp.tip}</p>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer Footer Reminder */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-850 flex items-start gap-3 text-xs text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <span>
            Все данные сканирования и фотографии обработаны исключительно на вашем устройстве и удаляются при закрытии приложения.
          </span>
        </div>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="w-full py-4 rounded-2xl font-bold text-sm tracking-wide bg-white text-black hover:bg-zinc-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase shadow-lg shadow-white/10"
        >
          <RotateCcw className="w-4 h-4" />
          <span>ПРОЙТИ ПОВТОРНОЕ СКАНИРОВАНИЕ</span>
        </button>
      </div>
    </div>
  );
};
