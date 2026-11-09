import React, { useState } from 'react';
import { AppStep, BodyType, ScanResult, UserProfile } from './types';
import { Splash } from './components/Splash';
import { Disclaimer } from './components/Disclaimer';
import { ProfileForm } from './components/ProfileForm';
import { BodyTypeSelect } from './components/BodyTypeSelect';
import { FaceScanner } from './components/FaceScanner';
import { Processing } from './components/Processing';
import { Results } from './components/Results';
import { calculateScanResults } from './utils/faceMetrics';

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

  // Step 5: Face Scan completes (all 5 angles captured) -> Processing
  const handleScanComplete = (photo?: string) => {
    setCapturedPhoto(photo);
    setCurrentStep('processing');
  };

  // Step 6: Processing calculation completes -> Results
  const handleProcessingComplete = () => {
    const results = calculateScanResults(userProfile, capturedPhoto);
    setScanResult(results);
    setCurrentStep('results');
  };

  // Restart flow
  const handleRestart = () => {
    setCapturedPhoto(undefined);
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
