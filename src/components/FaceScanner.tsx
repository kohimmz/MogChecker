import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ScanDirection } from '../types';
import { estimateHeadPose, HeadPose } from '../utils/faceLandmarkAnalyzer';
import {
  Camera,
  Upload,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  RefreshCw,
  Sparkles
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
  { id: 'center', title: 'Центр', instruction: 'Смотрите прямо в центр круга', hint: 'Удерживайте нейтральный взгляд по центру' },
  { id: 'left', title: 'Влево', instruction: 'Поверните голову влево', hint: 'Медленно поверните голову налево' },
  { id: 'right', title: 'Вправо', instruction: 'Поверните голову вправо', hint: 'Медленно поверните голову направо' },
  { id: 'up', title: 'Вверх', instruction: 'Приподнимите подбородок вверх', hint: 'Слегка запрокиньте голову назад' },
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
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [isProcessingStatic, setIsProcessingStatic] = useState(false);

  // Real Head Pose State
  const [headPose, setHeadPose] = useState<HeadPose | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | undefined>();
  const [calibratedLandmarks, setCalibratedLandmarks] = useState<faceapi.FaceLandmarks68 | null>(null);

  const poseHoldCounter = useRef(0);
  const isTransitioning = useRef(false);

  const currentStage = STAGES[currentStageIndex];
  const scanProgress = (completedStages.length / STAGES.length) * 100;

  // 1. Load Real Models
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
          setModelLoadingError('Ошибка загрузки AI моделей. Проверьте интернет или память.');
        }
      }
    }

    loadModels();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Multi-tier camera initialization
  const startCamera = useCallback(async () => {
    setIsInitializingCamera(true);
    setCameraError(null);

    // Step A: Request native Android camera permission via Capacitor Camera plugin
    try {
      if (CapCamera && CapCamera.requestPermissions) {
        await CapCamera.requestPermissions();
      }
    } catch (e) {
      // Browser or already granted
    }

    // Step B: Multi-tier getUserMedia acquisition
    let stream: MediaStream | null = null;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Tier 1: Front camera (selfie) with ideal constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch (err1) {
        console.warn('Tier 1 ideal failed, trying facingMode:user string', err1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
        } catch (err2) {
          console.warn('Tier 2 facingMode:user failed, trying generic video', err2);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          } catch (err3) {
            console.warn('Tier 3 generic video failed:', err3);
          }
        }
      }
    }

    const videoEl = videoRef.current;
    if (stream && videoEl) {
      streamRef.current = stream;
      videoEl.srcObject = stream;
      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('autoplay', 'true');
      videoEl.setAttribute('muted', 'true');

      const handlePlay = () => {
        setCameraActive(true);
        setIsInitializingCamera(false);
      };

      videoEl.onloadedmetadata = () => {
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.then(handlePlay).catch(handlePlay);
        } else {
          handlePlay();
        }
      };
    } else {
      setIsInitializingCamera(false);
      setCameraActive(false);
      setCameraError('Прямой видеопоток недоступен на этом устройстве. Вы можете сделать фото через системную камеру или выбрать снимок из галереи.');
    }
  }, []);

  useEffect(() => {
    if (modelsLoaded) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [modelsLoaded, startCamera]);

  // Stage Advancement Handler
  const advanceToNextStage = useCallback((landmarks: faceapi.FaceLandmarks68) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(60); } catch (e) {}
    }

    const stageId = STAGES[currentStageIndex].id;
    setCompletedStages((prev) => (prev.includes(stageId) ? prev : [...prev, stageId]));

    // Capture calibrated center snapshot
    if (currentStageIndex === 0 && videoRef.current) {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = videoRef.current.videoWidth || 320;
        offCanvas.height = videoRef.current.videoHeight || 320;
        const ctx = offCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, offCanvas.width, offCanvas.height);
          const dataUrl = offCanvas.toDataURL('image/jpeg', 0.9);
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
      }, 350);
    } else {
      setTimeout(() => {
        onScanComplete(landmarks, capturedPhoto, canvasRef.current || undefined);
      }, 500);
    }
  }, [currentStageIndex, capturedPhoto, onScanComplete]);

  // 3. Real-time Computer Vision Detection Loop
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
        const detection = await faceapi
          .detectSingleFace(
            video,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.30 })
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

            // Draw Real 68 Points
            drawRealFaceMesh(ctx, landmarks);

            // Compute Real Head Pose (Yaw, Pitch, Roll)
            const pose = estimateHeadPose(landmarks, true);
            setHeadPose(pose);

            // Verify Stage Condition
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
              if (poseHoldCounter.current >= 3) {
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
        // frame processing catch
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

    // Eyebrows
    ctx.beginPath();
    for (let i = 17; i <= 21; i++) {
      if (i === 17) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let i = 22; i <= 26; i++) {
      if (i === 22) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // Nose
    ctx.beginPath();
    for (let i = 27; i <= 30; i++) {
      if (i === 27) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // Eyes
    ctx.beginPath();
    for (let i = 36; i <= 41; i++) {
      if (i === 36) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    for (let i = 42; i <= 47; i++) {
      if (i === 42) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Lips
    ctx.beginPath();
    for (let i = 48; i <= 59; i++) {
      if (i === 48) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Highlight key dots
    const keyIndices = [36, 39, 42, 45, 30, 8, 48, 54, 19, 24, 4, 12];
    keyIndices.forEach((idx) => {
      ctx.beginPath();
      ctx.arc(pts[idx].x, pts[idx].y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Tier 3: Native Android System Camera Snap
  const handleNativeCameraSnap = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image && image.dataUrl) {
        await processStaticPhoto(image.dataUrl);
      }
    } catch (e) {
      console.warn('Native camera cancelled or failed:', e);
    }
  };

  // Tier 4: Gallery Image Picker
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        await processStaticPhoto(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Process static image with multi-resolution 68 landmark detection
  const processStaticPhoto = async (dataUrl: string) => {
    setIsProcessingStatic(true);
    try {
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Memory safe downscaling for mobile devices
      const maxDim = 1024;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const offCanvas = document.createElement('canvas');
      offCanvas.width = width;
      offCanvas.height = height;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');
      ctx.drawImage(img, 0, 0, width, height);

      // Multi-tier detection for high reliability across various lighting and sizes
      let detection = await faceapi
        .detectSingleFace(
          offCanvas,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.20 })
        )
        .withFaceLandmarks(false);

      if (!detection) {
        detection = await faceapi
          .detectSingleFace(
            offCanvas,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.15 })
          )
          .withFaceLandmarks(false);
      }

      if (!detection) {
        detection = await faceapi
          .detectSingleFace(
            offCanvas,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.15 })
          )
          .withFaceLandmarks(false);
      }

      if (detection) {
        setCapturedPhoto(dataUrl);
        onScanComplete(detection.landmarks, dataUrl, offCanvas);
      } else {
        alert('Лицо на фото не обнаружено. Пожалуйста, используйте четкое фото лица анфас при хорошем освещении.');
      }
    } catch (err) {
      console.error('Photo analysis error:', err);
      alert('Ошибка при анализе фотографии. Попробуйте другой снимок.');
    } finally {
      setIsProcessingStatic(false);
    }
  };

  // Render Apple-style radial ticks
  const renderTicks = () => {
    const ticks = [];
    const center = 150;
    const radius = 135;
    const tickLength = 12;

    for (let i = 0; i < TOTAL_TICKS; i++) {
      const angle = (i * 360) / TOTAL_TICKS - 90;
      const rad = (angle * Math.PI) / 180;

      const x1 = center + (radius - tickLength) * Math.cos(rad);
      const y1 = center + (radius - tickLength) * Math.sin(rad);
      const x2 = center + radius * Math.cos(rad);
      const y2 = center + radius * Math.sin(rad);

      let isTickActive = false;
      const ticksPerStage = TOTAL_TICKS / STAGES.length;

      completedStages.forEach((stageId) => {
        const stageIdx = STAGES.findIndex((s) => s.id === stageId);
        const stageStart = stageIdx * ticksPerStage;
        const stageEnd = stageStart + ticksPerStage;
        if (i >= stageStart && i < stageEnd) {
          isTickActive = true;
        }
      });

      if (headPose) {
        const currentStageStart = currentStageIndex * ticksPerStage;
        const currentStageEnd = currentStageStart + ticksPerStage;
        if (i >= currentStageStart && i < currentStageEnd) {
          isTickActive = true;
        }
      }

      ticks.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isTickActive ? '#ffffff' : '#27272a'}
          strokeWidth={isTickActive ? '2.5' : '1.5'}
          strokeLinecap="round"
          className="transition-all duration-200"
        />
      );
    }
    return ticks;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col justify-between select-none max-w-md mx-auto relative">
      {/* Processing Static Photo Loading Overlay */}
      {isProcessingStatic && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Нейросеть вычисляет 68 точек лица</h3>
          <p className="text-xs text-zinc-400 font-mono">Анализ симметрии, пропорций и углов костной структуры...</p>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-emerald-400 animate-ping' : 'bg-white/40'}`} />
          <span className="text-xs font-mono tracking-widest uppercase text-zinc-300">
            {faceDetected ? 'ЛИЦО ЗАХВАЧЕНО' : '3D FACE ID SCANNER'}
          </span>
        </div>

        <div className="text-xs font-mono text-zinc-400">
          {currentStageIndex + 1}/{STAGES.length}
        </div>
      </div>

      {/* Main Face ID Viewport */}
      <div className="my-auto flex flex-col items-center justify-center relative">
        <div className="relative w-[300px] h-[300px] flex items-center justify-center">
          {/* Radial Ticks */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            viewBox="0 0 300 300"
          >
            {renderTicks()}
          </svg>

          {/* Camera Viewport (Circular cut) */}
          <div className="relative w-[236px] h-[236px] rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center z-10">
            {/* Always-mounted video element to eliminate chicken-and-egg ref issues */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover -scale-x-100 ${cameraActive ? 'block' : 'hidden'}`}
            />

            {!cameraActive && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 p-4 text-center">
                {!modelsLoaded || isInitializingCamera ? (
                  <>
                    <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                    <span className="text-xs font-mono text-zinc-300">
                      {!modelsLoaded ? 'Загрузка AI моделей...' : 'Подключение камеры...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-zinc-400 mb-2" />
                    <span className="text-xs font-mono text-zinc-300 mb-2">Видеопоток недоступен</span>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-xs font-mono border border-zinc-700 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Повторить
                    </button>
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

          {/* Glowing Halo */}
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
        <div className="mt-4 text-center max-w-xs">
          <div className="inline-block px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-1">
            ЭТАП {currentStageIndex + 1}: {currentStage.title}
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight mb-0.5">
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

      {/* Footer Controls & Fail-proof camera buttons */}
      <div className="pt-2 flex flex-col gap-2">
        {cameraError && (
          <div className="p-3 rounded-xl bg-zinc-900/95 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{cameraError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {/* Native Phone Camera Snap */}
          <button
            onClick={handleNativeCameraSnap}
            className="py-3 px-3 rounded-xl font-mono text-xs tracking-wide bg-zinc-900 text-white border border-zinc-700 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 uppercase font-medium"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Сделать фото</span>
          </button>

          {/* Photo Gallery Upload */}
          <label className="py-3 px-3 rounded-xl font-mono text-xs tracking-wide bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase font-medium">
            <Upload className="w-4 h-4" />
            <span>Из галереи</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Skip to Next angle if user is physically locked */}
        {calibratedLandmarks && (
          <button
            onClick={() => advanceToNextStage(calibratedLandmarks)}
            className="w-full py-2.5 rounded-xl font-mono text-xs bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-850 uppercase"
          >
            Зафиксировать ракурс вручную
          </button>
        )}

        <div className="text-center text-[10px] text-zinc-500 font-mono">
          НЕЙРОСЕТЬ ВЫЧИСЛЯЕТ РЕАЛЬНЫЕ ТОЧКИ НА ВАШЕМ УСТРОЙСТВЕ
        </div>
      </div>
    </div>
  );
};
