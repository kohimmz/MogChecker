export type AppStep =
  | 'splash'
  | 'disclaimer'
  | 'profile'
  | 'body_type'
  | 'scanner'
  | 'processing'
  | 'results';

export type BodyType = 'ectomorph' | 'mesomorph' | 'average' | 'endomorph';

export interface UserProfile {
  height: number; // in cm
  weight: number; // in kg
  age: number; // in years
  bodyType: BodyType;
  bmi: number;
}

export type ScanDirection = 'center' | 'left' | 'right' | 'up' | 'down';

export type ArchetypeId =
  | 'sub_3'
  | 'sub_5'
  | 'ltn'
  | 'mtn'
  | 'htn'
  | 'chad'
  | 'true_adam';

export interface ArchetypeInfo {
  id: ArchetypeId;
  name: string;
  code: string;
  title: string;
  scoreRange: [number, number];
  description: string;
  image: string;
  features: string[];
}

export interface MetricItem {
  id: string;
  name: string;
  category: string;
  value: number; // 0 - 100 or specific ratio
  score: number; // 0.0 - 10.0
  status: 'optimal' | 'good' | 'average' | 'improvable';
  detail: string;
  idealRatio?: string;
  userRatio?: string;
}

export interface HairAnalysis {
  score: number; // 0.0 - 10.0
  volumeRating: 'Высокий' | 'Сбалансированный' | 'Умеренный' | 'Недостаточный';
  hairlineShape: 'Симметричная' | 'M-образная' | 'Прямая' | 'Скругленная';
  recommendedCuts: {
    name: string;
    description: string;
    suitability: string;
  }[];
  stylingTips: string[];
}

export interface FlawItem {
  id: string;
  title: string;
  category: 'symmetry' | 'canthal' | 'jaw' | 'thirds' | 'hair';
  severity: 'high' | 'medium' | 'low';
  valueText: string;
  idealText: string;
  description: string;
  howToFix: string;
  pinX: number;
  pinY: number;
}

export interface ScanResult {
  overallScore: number; // 0.0 - 10.0
  archetype: ArchetypeInfo;
  hairAnalysis: HairAnalysis;
  metrics: MetricItem[];
  flaws: FlawItem[];
  faceShape: 'Овал' | 'Квадрат' | 'Ромб' | 'Прямоугольник' | 'Круг';
  symmetryScore: number;
  jawlineScore: number;
  eyesScore: number;
  canthalTilt: 'Положительный (+5°)' | 'Нейтральный (0°)' | 'Отрицательный (-3°)';
  strengths: string[];
  improvements: {
    category: string;
    title: string;
    tip: string;
    impact: 'Высокий' | 'Средний' | 'Базовый';
  }[];
  capturedImage?: string;
  points?: Array<{ x: number; y: number }>;
  date: string;
}
