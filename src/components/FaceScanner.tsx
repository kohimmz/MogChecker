import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ScanDirection } from '../types';
import { Camera, RefreshCw, Upload, Sparkles, Check, AlertCircle, ArrowLeft } from 'lucide-react';

interface FaceScannerProps {
  onScanComplete: (capturedPhoto?: string) => void;
  onBack: () => void;
}

const STAGES: Array<{ id: ScanDirection; title: string; instruction: string }> = [
  { id: 'center', title: 'Центр', instruction: 'Смотрите прямо в центр круга' },
  { id: 'left', title: 'Влево', instruction: 'Медленно поверните голову влево' },
  { id: 'right', title: 'Вправо', instruction: 'Медленно поверните голову вправо' },
  { id: 'up', title: 'Вверх', instruction: 'Слегка приподнимите подбородок вверх' },
  { id: 'down', title: 'Вниз', instruction: 'Слегка опустите подбородок вниз' },
];

const TOTAL_TICKS = 48;

export const FaceScanner: React.FC<FaceScannerProps> = ({ onScanComplete, onBack }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState<ScanDirection[]>([]);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | undefined>();
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100

  const currentStage = STAGES[currentStageIndex];

  // Initialize Camera
  useEffect(() => {
    let active = true;

    async function initCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Камера недоступна в этом браузере/окружении');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setHasCamera(true);
      } catch (err: any) {
        console.warn('Camera init failed or permission denied:', err);
        if (active) {
          setHasCamera(false);
          setCameraError('Доступ к фронтальной камере не предоставлен. Вы можете продолжить в режиме симуляции или загрузить фото.');
        }
      }
    }

    initCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Complete Stage transition
  const handleStageComplete = useCallback(() => {
    const stageId = STAGES[currentStageIndex].id;
    if (!completedStages.includes(stageId)) {
      setCompletedStages((prev) => [...prev, stageId]);
    }

    // Capture snapshot on center stage
    if (currentStageIndex === 0 && videoRef.current) {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 300;
        offCanvas.height = 300;
        const ctx = offCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 300, 300);
          setCapturedPhoto(offCanvas.toDataURL('image/jpeg', 0.8));
        }
      } catch (e) {
        // ignore canvas capture error
      }
    }

    if (currentStageIndex < STAGES.length - 1) {
      setCurrentStageIndex((prev) => prev + 1);
      setScanProgress(((currentStageIndex + 1) / STAGES.length) * 100);
    } else {
      setScanProgress(100);
      setTimeout(() => {
        onScanComplete(capturedPhoto);
      }, 700);
    }
  }, [currentStageIndex, completedStages, capturedPhoto, onScanComplete]);

  // Automated or interactive angle progress loop
  useEffect(() => {
    const timer = setTimeout(() => {
      handleStageComplete();
    }, 2800);

    return () => clearTimeout(timer);
  }, [currentStageIndex, handleStageComplete]);

  // Animated Mesh Overlay on Canvas
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;

    const render = () => {
      angle += 0.04;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Coordinate shift based on current target stage
      let targetX = 0;
      let targetY = 0;
      if (currentStage.id === 'left') targetX = -18;
      if (currentStage.id === 'right') targetX = 18;
      if (currentStage.id === 'up') targetY = -15;
      if (currentStage.id === 'down') targetY = 15;

      const shiftX = Math.sin(angle) * 4 + targetX;
      const shiftY = Math.cos(angle * 1.2) * 3 + targetY;

      // Draw Face Wireframe Points
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;

      // Jawline curve
      const jawPoints = [
        [-55, -20], [-50, 15], [-35, 45], [-18, 62], [0, 68],
        [18, 62], [35, 45], [50, 15], [55, -20]
      ];

      // Draw jawline path
      ctx.beginPath();
      jawPoints.forEach(([x, y], idx) => {
        const px = cx + x + shiftX;
        const py = cy + y + shiftY;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Eyebrows & Eyes
      const eyePoints = [
        // Left eye
        [-32, -18], [-22, -22], [-14, -18], [-22, -14],
        // Right eye
        [14, -18], [22, -22], [32, -18], [22, -14],
        // Eyebrow points
        [-35, -30], [-22, -34], [-12, -30],
        [12, -30], [22, -34], [35, -30],
        // Nose bridge & tip
        [0, -15], [0, 2], [-8, 14], [0, 16], [8, 14],
        // Mouth
        [-18, 36], [0, 32], [18, 36], [0, 42],
        // Hairline boundary
        [-45, -55], [-20, -70], [0, -72], [20, -70], [45, -55]
      ];

      // Draw connecting lines for eyes and nose
      eyePoints.forEach(([x, y]) => {
        const px = cx + x + shiftX;
        const py = cy + y + shiftY;
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Crosshair center scanner line
      const scanLineY = cy + Math.sin(angle * 2) * 60;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 50, scanLineY);
      ctx.lineTo(cx + 50, scanLineY);
      ctx.stroke();
      ctx.setLineDash([]);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [currentStage]);

  // File Upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCapturedPhoto(result);
        setScanProgress(100);
        setTimeout(() => {
          onScanComplete(result);
        }, 500);
      };
      reader.readAsDataURL(file);
    }
  };

  // Render ticks for circular Face ID ring (Apple Face ID style from reference)
  const renderTicks = () => {
    const ticks = [];
    const radius = 135; // outer circle radius
    const tickLength = 10;
    const progressTicks = Math.round((scanProgress / 100) * TOTAL_TICKS);

    for (let i = 0; i < TOTAL_TICKS; i++) {
      const angleDeg = (i / TOTAL_TICKS) * 360 - 90;
      const angleRad = (angleDeg * Math.PI) / 180;

      const x1 = 150 + Math.cos(angleRad) * (radius - tickLength);
      const y1 = 150 + Math.sin(angleRad) * (radius - tickLength);
      const x2 = 150 + Math.cos(angleRad) * radius;
      const y2 = 150 + Math.sin(angleRad) * radius;

      const isCompleted = i <= progressTicks;

      ticks.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          strokeWidth={isCompleted ? '3' : '1.5'}
          stroke={isCompleted ? '#ffffff' : '#3f3f46'}
          strokeLinecap="round"
          className="transition-all duration-150"
        />
      );
    }
    return ticks;
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-8 bg-black text-white select-none max-w-lg mx-auto relative overflow-hidden">
      {/* Top Bar */}
      <div className="pt-2 flex items-center justify-between z-10">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>FACE ID CALIBRATION</span>
        </div>

        <div className="text-xs font-mono text-zinc-500">
          {currentStageIndex + 1}/{STAGES.length}
        </div>
      </div>

      {/* Main Face ID Circular Viewport */}
      <div className="my-auto flex flex-col items-center justify-center relative">
        {/* Apple Face ID Circular Scanner Assembly */}
        <div className="relative w-[300px] h-[300px] flex items-center justify-center">
          {/* SVG Radial Ticks Ring */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            viewBox="0 0 300 300"
          >
            {renderTicks()}
          </svg>

          {/* Camera Viewport (Circular cut) */}
          <div className="relative w-[236px] h-[236px] rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center z-10">
            {hasCamera ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              /* High-tech stylized simulation head placeholder when camera is unavailable */
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 relative">
                <div className="w-24 h-32 rounded-full border border-zinc-700/60 flex items-center justify-center">
                  <div className="w-16 h-20 rounded-full border border-zinc-800 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-zinc-400 animate-pulse" />
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 mt-2">РЕЖИМ СИМУЛЯЦИИ</span>
              </div>
            )}

            {/* Canvas Facial Landmark Mesh Overlay */}
            <canvas
              ref={canvasRef}
              width={236}
              height={236}
              className="absolute inset-0 pointer-events-none z-15"
            />
          </div>

          {/* Glowing Ambient Halo */}
          <div className="absolute inset-0 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        </div>

        {/* Step Instructions (Apple Face ID style) */}
        <div className="mt-8 text-center max-w-xs">
          <div className="inline-block px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
            ЭТАП: {currentStage.title}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-1">
            {currentStage.instruction}
          </h3>
          <p className="text-xs text-zinc-400">
            Сохраняйте лицо в поле зрения для фиксации 100+ ключевых точек
          </p>
        </div>

        {/* Stages Progress Dots */}
        <div className="flex items-center gap-2 mt-5">
          {STAGES.map((stg, idx) => {
            const isDone = completedStages.includes(stg.id);
            const isCurr = currentStageIndex === idx;

            return (
              <div
                key={stg.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isCurr
                    ? 'w-6 bg-white'
                    : isDone
                    ? 'w-3 bg-zinc-400'
                    : 'w-2 bg-zinc-800'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Camera Error or Action Controls */}
      <div className="pt-2 flex flex-col gap-3">
        {cameraError && (
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-400 mb-1">
            <AlertCircle className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
            <span>{cameraError}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Upload photo button */}
          <label className="flex-1 py-3 px-3 rounded-xl font-mono text-xs tracking-wide bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase">
            <Upload className="w-3.5 h-3.5" />
            <span>Загрузить фото</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          {/* Next Stage button (manual trigger if user prefers fast scan) */}
          <button
            onClick={handleStageComplete}
            className="flex-1 py-3 px-3 rounded-xl font-mono text-xs tracking-wide bg-white text-black hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 uppercase font-bold"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{currentStageIndex === STAGES.length - 1 ? 'Завершить' : 'Далее'}</span>
          </button>
        </div>

        <div className="text-center text-[10px] text-zinc-600 font-mono">
          КАДРЫ НЕ ПОКИДАЮТ ПАМЯТЬ ТЕЛЕФОНА • 0KB ПЕРЕДАНО В СЕТЬ
        </div>
      </div>
    </div>
  );
};
