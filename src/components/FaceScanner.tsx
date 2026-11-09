import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { ScanDirection } from '../types';
import { estimateHeadPose, HeadPose } from '../utils/faceLandmarkAnalyzer';
import {
  Camera,
  Upload,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  HelpCircle
} from 'lucide-react';

interface FaceScannerProps {
  onScanComplete: (
    landmarks: faceapi.FaceLandmarks68,
    photo?: string,
    canvas?: HTMLCanvasElement
  ) => void;
  onBack: () => void;
}

const STAGES: Array<{ id: ScanDirection; title: string; instruction: string; hint: string }> = [
  { id: 'center', title: 'Центр', instruction: 'Смотрите прямо в центр круга', hint: 'Удерживайте нейтральный взгляд' },
  { id: 'left', title: 'Влево', instruction: 'Поверните голову влево', hint: 'Плавный поворот головы налево' },
  { id: 'right', title: 'Вправо', instruction: 'Поверните голову вправо', hint: 'Плавный поворот головы направо' },
  { id: 'up', title: 'Вверх', instruction: 'Приподнимите подбородок вверх', hint: 'Слегка наклоните голову назад' },
  { id: 'down', title: 'Вниз', instruction: 'Опустите подбородок вниз', hint: 'Слегка наклоните голову вперед' },
];

const TOTAL_TICKS = 48;

export const FaceScanner: React.FC<FaceScannerProps> = ({ onScanComplete, onBack }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelLoadingError, setModelLoadingError] = useState<string | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState<ScanDirection[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Real Head Pose State
  const [headPose, setHeadPose] = useState<HeadPose | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | undefined>();
  const [calibratedLandmarks, setCalibratedLandmarks] = useState<faceapi.FaceLandmarks68 | null>(null);

  // Success hold timers
  const poseHoldCounter = useRef(0);
  const isTransitioning = useRef(false);

  const currentStage = STAGES[currentStageIndex];
  const scanProgress = ((completedStages.length) / STAGES.length) * 100;

  // 1. Load Real Models from public/models
  useEffect(() => {
    let isMounted = true;

    async function loadModels() {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        if (isMounted) {
          setModelsLoaded(true);
        }
      } catch (err: any) {
        console.error('Failed to load face-api models:', err);
        if (isMounted) {
          setModelLoadingError('Не удалось загрузить локальную модель распознавания лица.');
        }
      }
    }

    loadModels();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Start Front Camera
  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Камера недоступна в этой среде');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
            setCameraActive(true);
          };
        }
      } catch (err: any) {
        console.warn('Camera error:', err);
        if (isMounted) {
          setCameraActive(false);
          setCameraError('Доступ к фронтальной камере ограничен. Разрешите доступ или загрузите снимок из галереи.');
        }
      }
    }

    if (modelsLoaded) {
      startCamera();
    }

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [modelsLoaded]);

  // Stage Advancement Handler
  const advanceToNextStage = useCallback((landmarks: faceapi.FaceLandmarks68) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    // Haptic feedback if available on device
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(60); } catch (e) {}
    }

    const stageId = STAGES[currentStageIndex].id;
    setCompletedStages((prev) => (prev.includes(stageId) ? prev : [...prev, stageId]));

    // Capture calibrated center snapshot
    if (currentStageIndex === 0 && videoRef.current) {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 320;
        offCanvas.height = 320;
        const ctx = offCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 320, 320);
          const dataUrl = offCanvas.toDataURL('image/jpeg', 0.85);
          setCapturedPhoto(dataUrl);
        }
      } catch (e) {}
    }

    setCalibratedLandmarks(landmarks);

    if (currentStageIndex < STAGES.length - 1) {
      setCurrentStageIndex((prev) => prev + 1);
      poseHoldCounter.current = 0;
      setTimeout(() => {
        isTransitioning.current = false;
      }, 400);
    } else {
      // Completed all 5 angles!
      setTimeout(() => {
        onScanComplete(landmarks, capturedPhoto, canvasRef.current || undefined);
      }, 500);
    }
  }, [currentStageIndex, capturedPhoto, onScanComplete]);

  // 3. Real Computer Vision Loop
  useEffect(() => {
    if (!modelsLoaded || !cameraActive) return;

    let animId: number;
    let isProcessing = false;

    const processFrame = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.paused || video.ended || video.readyState < 2) {
        animId = requestAnimationFrame(processFrame);
        return;
      }

      if (isProcessing) {
        animId = requestAnimationFrame(processFrame);
        return;
      }

      isProcessing = true;

      try {
        // Run real face detection with 68 landmarks
        const detection = await faceapi
          .detectSingleFace(
            video,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.35 })
          )
          .withFaceLandmarks(false);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (detection) {
            setFaceDetected(true);
            const dims = { width: canvas.width, height: canvas.height };
            const resizedDetection = faceapi.resizeResults(detection, dims);
            const landmarks = resizedDetection.landmarks;

            // Draw Real 68 Facial Landmark Mesh
            drawRealFaceMesh(ctx, landmarks);

            // Compute Real Head Pose (Yaw, Pitch, Roll)
            const pose = estimateHeadPose(landmarks, true);
            setHeadPose(pose);

            // Verify Current Stage Condition
            let isCurrentPoseMatched = false;
            if (currentStage.id === 'center') {
              isCurrentPoseMatched = pose.isCenter;
            } else if (currentStage.id === 'left') {
              isCurrentPoseMatched = pose.isLeft;
            } else if (currentStage.id === 'right') {
              isCurrentPoseMatched = pose.isRight;
            } else if (currentStage.id === 'up') {
              isCurrentPoseMatched = pose.isUp;
            } else if (currentStage.id === 'down') {
              isCurrentPoseMatched = pose.isDown;
            }

            if (isCurrentPoseMatched && !isTransitioning.current) {
              poseHoldCounter.current += 1;
              // Hold for ~4 frames (~200ms) to confirm intentional head turn
              if (poseHoldCounter.current >= 4) {
                advanceToNextStage(landmarks);
              }
            } else {
              poseHoldCounter.current = Math.max(0, poseHoldCounter.current - 1);
            }
          } else {
            setFaceDetected(false);
            setHeadPose(null);
            poseHoldCounter.current = 0;
          }
        }
      } catch (err) {
        // frame processing non-fatal error
      } finally {
        isProcessing = false;
        animId = requestAnimationFrame(processFrame);
      }
    };

    animId = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [modelsLoaded, cameraActive, currentStage, advanceToNextStage]);

  // Draw 68 Real Points & Connecting Lines
  const drawRealFaceMesh = (ctx: CanvasRenderingContext2D, landmarks: faceapi.FaceLandmarks68) => {
    const pts = landmarks.positions;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.fillStyle = '#ffffff';

    // Jawline: points 0 - 16
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // Right Eyebrow: 17 - 21
    ctx.beginPath();
    for (let i = 17; i <= 21; i++) {
      if (i === 17) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // Left Eyebrow: 22 - 26
    ctx.beginPath();
    for (let i = 22; i <= 26; i++) {
      if (i === 22) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // Nose Bridge: 27 - 30 & Nose Tip: 31 - 35
    ctx.beginPath();
    for (let i = 27; i <= 30; i++) {
      if (i === 27) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let i = 31; i <= 35; i++) {
      if (i === 31) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Right Eye: 36 - 41
    ctx.beginPath();
    for (let i = 36; i <= 41; i++) {
      if (i === 36) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Left Eye: 42 - 47
    ctx.beginPath();
    for (let i = 42; i <= 47; i++) {
      if (i === 42) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Lips: 48 - 67
    ctx.beginPath();
    for (let i = 48; i <= 59; i++) {
      if (i === 48) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw prominent landmark dots
    const keyIndices = [36, 39, 42, 45, 30, 8, 48, 54, 19, 24, 4, 12];
    keyIndices.forEach((idx) => {
      ctx.beginPath();
      ctx.arc(pts[idx].x, pts[idx].y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // 4. File Upload with Real Landmark Detection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = await faceapi.bufferToImage(file);
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }))
        .withFaceLandmarks(false);

      if (detection) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = img.width;
        offCanvas.height = img.height;
        const ctx = offCanvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);

        setCapturedPhoto(offCanvas.toDataURL('image/jpeg', 0.85));
        onScanComplete(detection.landmarks, offCanvas.toDataURL('image/jpeg', 0.85), offCanvas);
      } else {
        alert('Лицо на фото не обнаружено. Пожалуйста, выберите четкое фронтальное фото.');
      }
    } catch (err) {
      console.error('File detection error:', err);
      alert('Ошибка обработки изображения.');
    }
  };

  // Render Apple Face ID circular ticks
  const renderTicks = () => {
    const ticks = [];
    const radius = 135;
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
          <span
            className={`w-2 h-2 rounded-full ${
              faceDetected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span>{faceDetected ? 'ЛИЦО ЗАХВАЧЕНО' : 'ПОИСК ЛИЦА...'}</span>
        </div>

        <div className="text-xs font-mono text-zinc-400">
          {currentStageIndex + 1}/{STAGES.length}
        </div>
      </div>

      {/* Main Face ID Viewport */}
      <div className="my-auto flex flex-col items-center justify-center relative">
        <div className="relative w-[300px] h-[300px] flex items-center justify-center">
          {/* Radial Ticks Ring */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            viewBox="0 0 300 300"
          >
            {renderTicks()}
          </svg>

          {/* Camera Viewport (Circular cut) */}
          <div className="relative w-[236px] h-[236px] rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center z-10">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 p-4 text-center">
                {!modelsLoaded ? (
                  <>
                    <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                    <span className="text-xs font-mono text-zinc-300">Загрузка AI моделей...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-zinc-400 mb-2" />
                    <span className="text-xs font-mono text-zinc-400">Ожидание камеры</span>
                  </>
                )}
              </div>
            )}

            {/* Real Landmark Overlay Canvas */}
            <canvas
              ref={canvasRef}
              width={236}
              height={236}
              className="absolute inset-0 pointer-events-none z-15"
            />
          </div>

          {/* Halo */}
          <div className="absolute inset-0 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        </div>

        {/* Real-Time Angle / Pose Metrics Bar */}
        {headPose && (
          <div className="mt-4 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center gap-3">
            <span>Поворот (Yaw): <strong className="text-white">{headPose.yaw > 0 ? `+${headPose.yaw}` : headPose.yaw}°</strong></span>
            <span>Наклон (Pitch): <strong className="text-white">{headPose.pitch > 0 ? `+${headPose.pitch}` : headPose.pitch}°</strong></span>
          </div>
        )}

        {/* Step Instructions */}
        <div className="mt-5 text-center max-w-xs">
          <div className="inline-block px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
            ЭТАП {currentStageIndex + 1}: {currentStage.title}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-1">
            {currentStage.instruction}
          </h3>
          <p className="text-xs text-zinc-400">
            {currentStage.hint}
          </p>
        </div>

        {/* Stages Progress Dots */}
        <div className="flex items-center gap-2 mt-4">
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

      {/* Footer Controls */}
      <div className="pt-2 flex flex-col gap-2.5">
        {cameraError && (
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-400">
            <AlertCircle className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
            <span>{cameraError}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Real Photo Upload Fallback */}
          <label className="flex-1 py-3 px-3 rounded-xl font-mono text-xs tracking-wide bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase">
            <Upload className="w-3.5 h-3.5" />
            <span>Анализ фото из галереи</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          {/* Calibrate / Skip manually if user is stuck */}
          {calibratedLandmarks && (
            <button
              onClick={() => advanceToNextStage(calibratedLandmarks)}
              className="py-3 px-4 rounded-xl font-mono text-xs bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 uppercase"
              title="Зафиксировать текущий ракурс"
            >
              Фикс
            </button>
          )}
        </div>

        <div className="text-center text-[10px] text-zinc-600 font-mono">
          НЕЙРОСЕТЬ ВЫЧИСЛЯЕТ РЕАЛЬНЫЕ УГЛЫ НА ВАШЕМ УСТРОЙСТВЕ
        </div>
      </div>
    </div>
  );
};
