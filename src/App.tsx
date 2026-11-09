import React, { useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { AppStep, BodyType, ScanResult, UserProfile } from './types';
import { Splash } from './components/Splash';
import { Disclaimer } from './components/Disclaimer';
import { ProfileForm } from './components/ProfileForm';
import { BodyTypeSelect } from './components/BodyTypeSelect';
import { FaceScanner } from './components/FaceScanner';
import { Processing } from './components/Processing';
import { Results } from './components/Results';
import { calculateScanResults } from './utils/faceMetrics';
import { analyzeRealFacialLandmarks } from './utils/faceLandmarkAnalyzer';
import { getArchetypeByScore } from './utils/archetypes';

export const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>('splash');

  const [userProfile, setUserProfile] = useState<UserProfile>({
    height: 180,
    weight: 76,
    age: 22,
    bodyType: 'mesomorph',
    bmi: 23.5,
  });

  const [capturedPhoto, setCapturedPhoto] = useState<string | undefined>();
  const [detectedLandmarks, setDetectedLandmarks] = useState<faceapi.FaceLandmarks68 | null>(null);
  const [capturedCanvas, setCapturedCanvas] = useState<HTMLCanvasElement | undefined>();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Step 1: Splash completes -> Disclaimer
  const handleSplashComplete = () => {
    setCurrentStep('disclaimer');
  };

  // Step 2: Disclaimer accepted -> Profile
  const handleDisclaimerAccepted = () => {
    setCurrentStep('profile');
  };

  // Step 3: Profile submitted -> Body Type
  const handleProfileSubmitted = (data: {
    height: number;
    weight: number;
    age: number;
    bmi: number;
  }) => {
    setUserProfile((prev) => ({
      ...prev,
      height: data.height,
      weight: data.weight,
      age: data.age,
      bmi: data.bmi,
    }));
    setCurrentStep('body_type');
  };

  // Step 4: Body Type chosen -> Face Scanner
  const handleBodyTypeChosen = (bodyType: BodyType) => {
    setUserProfile((prev) => ({
      ...prev,
      bodyType,
    }));
    setCurrentStep('scanner');
  };

  // Step 5: Face Scan completes with real detected landmarks
  const handleScanComplete = (
    landmarks: faceapi.FaceLandmarks68,
    photo?: string,
    canvas?: HTMLCanvasElement
  ) => {
    setDetectedLandmarks(landmarks);
    setCapturedPhoto(photo);
    setCapturedCanvas(canvas);
    setCurrentStep('processing');
  };

  // Step 6: Processing calculation completes -> compute REAL metrics
  const handleProcessingComplete = () => {
    let result: ScanResult;

    if (detectedLandmarks) {
      // Calculate REAL metrics from computer vision
      const realAnalysis = analyzeRealFacialLandmarks(
        detectedLandmarks,
        userProfile,
        capturedCanvas
      );

      const archetype = getArchetypeByScore(realAnalysis.overallScore);

      result = {
        overallScore: realAnalysis.overallScore,
        archetype,
        hairAnalysis: realAnalysis.hairAnalysis,
        metrics: realAnalysis.metrics,
        flaws: realAnalysis.flaws,
        points: realAnalysis.points,
        faceShape: realAnalysis.faceShape,
        symmetryScore: realAnalysis.symmetryScore,
        jawlineScore: realAnalysis.jawlineScore,
        eyesScore: realAnalysis.eyesScore,
        canthalTilt: realAnalysis.canthalTiltDesc,
        strengths: realAnalysis.strengths,
        improvements: realAnalysis.improvements,
        capturedImage: capturedPhoto,
        date: new Date().toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      };
    } else {
      // Fallback
      result = calculateScanResults(userProfile, capturedPhoto);
    }

    setScanResult(result);
    setCurrentStep('results');
  };

  // Restart flow
  const handleRestart = () => {
    setCapturedPhoto(undefined);
    setDetectedLandmarks(null);
    setCapturedCanvas(undefined);
    setScanResult(null);
    setCurrentStep('profile');
  };

  return (
    <main className="min-h-screen bg-black text-white antialiased font-sans selection:bg-white selection:text-black">
      {currentStep === 'splash' && <Splash onComplete={handleSplashComplete} />}

      {currentStep === 'disclaimer' && (
        <Disclaimer onAccept={handleDisclaimerAccepted} />
      )}

      {currentStep === 'profile' && (
        <ProfileForm
          initialHeight={userProfile.height}
          initialWeight={userProfile.weight}
          initialAge={userProfile.age}
          onNext={handleProfileSubmitted}
        />
      )}

      {currentStep === 'body_type' && (
        <BodyTypeSelect
          initialType={userProfile.bodyType}
          onNext={handleBodyTypeChosen}
          onBack={() => setCurrentStep('profile')}
        />
      )}

      {currentStep === 'scanner' && (
        <FaceScanner
          onScanComplete={handleScanComplete}
          onBack={() => setCurrentStep('body_type')}
        />
      )}

      {currentStep === 'processing' && (
        <Processing onComplete={handleProcessingComplete} />
      )}

      {currentStep === 'results' && scanResult && (
        <Results
          result={scanResult}
          profile={userProfile}
          onRestart={handleRestart}
        />
      )}
    </main>
  );
};

export default App;
