import React, { useState, useRef, useEffect } from 'react';
import { FlawItem } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Sliders,
  ChevronRight,
  Info,
  Maximize2
} from 'lucide-react';

interface PhotoFlawInspectorProps {
  imageSrc?: string;
  flaws: FlawItem[];
  points?: Array<{ x: number; y: number }>;
  faceShape: string;
}

export const PhotoFlawInspector: React.FC<PhotoFlawInspectorProps> = ({
  imageSrc,
  flaws,
  points,
  faceShape,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'symmetry' | 'canthal' | 'jaw' | 'thirds' | 'clean'>('all');
  const [selectedFlawId, setSelectedFlawId] = useState<string | null>(flaws[0]?.id || null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedFlaw = flaws.find((f) => f.id === selectedFlawId) || flaws[0];

  // Draw Diagnostic Overlays on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (activeFilter === 'clean') return;

    // Use landmarks if available, otherwise estimate standard anatomical positions
    const p = (idx: number, fallbackX: number, fallbackY: number) => {
      if (points && points[idx]) {
        return { x: points[idx].x, y: points[idx].y };
      }
      return { x: fallbackX * w, y: fallbackY * h };
    };

    const eyeL_inner = p(42, 0.55, 0.42);
    const eyeL_outer = p(45, 0.68, 0.41);
    const eyeR_inner = p(39, 0.45, 0.42);
    const eyeR_outer = p(36, 0.32, 0.41);

    const noseTip = p(30, 0.50, 0.55);
    const browMid = p(27, 0.50, 0.38);
    const chin = p(8, 0.50, 0.85);

    const jawR = p(4, 0.28, 0.68);
    const jawL = p(12, 0.72, 0.68);

    // 1. ASYMMETRY OVERLAYS
    if (activeFilter === 'all' || activeFilter === 'symmetry') {
      // Central vertical midline
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)'; // sky blue
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(browMid.x, Math.max(10, browMid.y - 60));
      ctx.lineTo(chin.x, Math.min(h - 10, chin.y + 20));
      ctx.stroke();
      ctx.setLineDash([]);

      // Horizontal eye balance axis
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // red alert
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(eyeR_outer.x - 10, eyeR_outer.y);
      ctx.lineTo(eyeL_outer.x + 10, eyeL_outer.y);
      ctx.stroke();

      // Mouth horizontal axis
      const mouthR = p(48, 0.38, 0.70);
      const mouthL = p(54, 0.62, 0.70);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.beginPath();
      ctx.moveTo(mouthR.x, mouthR.y);
      ctx.lineTo(mouthL.x, mouthL.y);
      ctx.stroke();
    }

    // 2. CANTHAL TILT OVERLAYS
    if (activeFilter === 'all' || activeFilter === 'canthal') {
      const isCanthalFlaw = flaws.some((f) => f.category === 'canthal');
      ctx.strokeStyle = isCanthalFlaw ? '#ef4444' : '#10b981'; // red if flaw, emerald if good
      ctx.lineWidth = 2.5;

      // Right Eye Vector
      ctx.beginPath();
      ctx.moveTo(eyeR_inner.x, eyeR_inner.y);
      ctx.lineTo(eyeR_outer.x, eyeR_outer.y);
      ctx.stroke();

      // Left Eye Vector
      ctx.beginPath();
      ctx.moveTo(eyeL_inner.x, eyeL_inner.y);
      ctx.lineTo(eyeL_outer.x, eyeL_outer.y);
      ctx.stroke();

      // Eye endpoint dots
      ctx.fillStyle = isCanthalFlaw ? '#ef4444' : '#10b981';
      [eyeR_outer, eyeR_inner, eyeL_inner, eyeL_outer].forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 3. JAWLINE / GONIAL OVERLAYS
    if (activeFilter === 'all' || activeFilter === 'jaw') {
      const isJawFlaw = flaws.some((f) => f.category === 'jaw');
      ctx.strokeStyle = isJawFlaw ? 'rgba(245, 158, 11, 0.85)' : 'rgba(255, 255, 255, 0.8)'; // amber
      ctx.lineWidth = 2;

      // Draw jawline ramus and body
      ctx.beginPath();
      ctx.moveTo(jawR.x, jawR.y - 30);
      ctx.lineTo(jawR.x, jawR.y);
      ctx.lineTo(chin.x, chin.y);
      ctx.lineTo(jawL.x, jawL.y);
      ctx.lineTo(jawL.x, jawL.y - 30);
      ctx.stroke();

      // Gonial angle dots
      ctx.fillStyle = '#f59e0b';
      [jawR, jawL, chin].forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 4. FACIAL THIRDS OVERLAYS
    if (activeFilter === 'all' || activeFilter === 'thirds') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      const subnasale = p(33, 0.50, 0.60);
      const hairlineY = Math.max(15, browMid.y - (subnasale.y - browMid.y));

      [hairlineY, browMid.y, subnasale.y, chin.y].forEach((y) => {
        ctx.beginPath();
        ctx.moveTo(15, y);
        ctx.lineTo(w - 15, y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }
  }, [activeFilter, points, flaws]);

  return (
    <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
            РАЗБОР НЕДОСТАТКОВ НА ФОТО ({flaws.length})
          </span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">
          Интерактивная диагностика
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
            activeFilter === 'all'
              ? 'bg-white text-black font-bold'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Все дефекты
        </button>
        <button
          onClick={() => setActiveFilter('canthal')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
            activeFilter === 'canthal'
              ? 'bg-white text-black font-bold'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Глаза & Тилт
        </button>
        <button
          onClick={() => setActiveFilter('jaw')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
            activeFilter === 'jaw'
              ? 'bg-white text-black font-bold'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Челюсть & Угол
        </button>
        <button
          onClick={() => setActiveFilter('symmetry')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
            activeFilter === 'symmetry'
              ? 'bg-white text-black font-bold'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Симметрия
        </button>
        <button
          onClick={() => setActiveFilter('clean')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
            activeFilter === 'clean'
              ? 'bg-white text-black font-bold'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Чистое фото
        </button>
      </div>

      {/* Photo with Overlay Pins */}
      <div className="relative w-full aspect-square max-w-[340px] mx-auto rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center shadow-2xl">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Captured face"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500">
            <span className="text-xs font-mono">Снимок лица</span>
          </div>
        )}

        {/* Diagnostic Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Interactive Glowing Flaw Pins */}
        {activeFilter !== 'clean' &&
          flaws.map((flaw, idx) => {
            const isSelected = selectedFlawId === flaw.id;
            const pinColor =
              flaw.severity === 'high'
                ? 'bg-red-500 ring-red-400'
                : flaw.severity === 'medium'
                ? 'bg-amber-400 ring-amber-300'
                : 'bg-emerald-400 ring-emerald-300';

            return (
              <div
                key={flaw.id}
                onClick={() => setSelectedFlawId(flaw.id)}
                style={{
                  left: `${flaw.pinX * 100}%`,
                  top: `${flaw.pinY * 100}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                title={flaw.title}
              >
                {/* Ping ring */}
                <div
                  className={`absolute -inset-1.5 rounded-full ${pinColor} opacity-75 animate-ping`}
                />
                {/* Badge Pin */}
                <div
                  className={`relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-black shadow-lg transition-transform ${
                    isSelected ? 'scale-125 ring-2 ring-white' : 'group-hover:scale-110'
                  } ${pinColor}`}
                >
                  {idx + 1}
                </div>
              </div>
            );
          })}
      </div>

      {/* Selected Flaw Detailed Card */}
      {selectedFlaw && (
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-750 space-y-2.5 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedFlaw.severity === 'high'
                    ? 'bg-red-500'
                    : selectedFlaw.severity === 'medium'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <h4 className="text-sm font-bold text-white tracking-tight">
                {selectedFlaw.title}
              </h4>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                selectedFlaw.severity === 'high'
                  ? 'border-red-500/50 text-red-300 bg-red-950/40'
                  : 'border-amber-500/50 text-amber-300 bg-amber-950/40'
              }`}
            >
              {selectedFlaw.severity === 'high' ? 'Критический дефект' : 'Зона роста'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono py-1">
            <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block">Зафиксировано:</span>
              <span className="text-white font-bold">{selectedFlaw.valueText}</span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block">Идеальный эталон:</span>
              <span className="text-zinc-300 font-bold">{selectedFlaw.idealText}</span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            {selectedFlaw.description}
          </p>

          {/* Actionable Remedy */}
          <div className="p-3 rounded-xl bg-black/60 border border-zinc-800 text-xs text-zinc-300 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5 text-[11px] uppercase font-mono">
              <Info className="w-3.5 h-3.5 text-white" />
              <span>Как исправить и компенсировать:</span>
            </div>
            <p className="leading-snug text-zinc-400">{selectedFlaw.howToFix}</p>
          </div>
        </div>
      )}

      {/* Flaws Quick List (Clickable to switch pins) */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
          Нажмите на дефект для подсветки на фото:
        </span>
        <div className="grid grid-cols-1 gap-1.5">
          {flaws.map((flaw, idx) => {
            const isSelected = selectedFlawId === flaw.id;

            return (
              <div
                key={flaw.id}
                onClick={() => setSelectedFlawId(flaw.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-zinc-850 border-white text-white'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-black ${
                      flaw.severity === 'high'
                        ? 'bg-red-400'
                        : flaw.severity === 'medium'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium">{flaw.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-400">{flaw.valueText}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
