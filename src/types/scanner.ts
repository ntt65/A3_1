export interface Point {
  x: number;
  y: number;
}

export interface QuadPoints {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export interface ScannerParams {
  blurKernel: number; // 3, 5, 7, 9, 11
  cannyLow: number;   // 10 - 255
  cannyHigh: number;  // 50 - 300
  adaptiveBlockSize: number; // 3 - 31 (odd)
  adaptiveC: number;  // 2 - 25
  autoAspectRatio: boolean;
  contrastEnhance: boolean;
}

export interface TestCase {
  id: string;
  name: string;
  category: 'simple_front' | 'shadow' | 'angled' | 'complex_bg';
  categoryLabel: string;
  description: string;
  illumination: '균일' | '부분 그림자' | '강한 얼룩' | '저조도';
  angle: '0° 정면' | '15° 경사' | '45° 이상 왜곡' | '원근 심함';
  backgroundComplexity: '단순 (단색)' | '보통 (책상)' | '복잡 (잡동사니)' | '무늬 목재';
  expectedSuccess: boolean;
  failureReason?: string;
  difficulty: '쉬움' | '보통' | '어려움' | '실패 고위험';
  sampleType: 'a4_paper' | 'receipt' | 'business_card' | 'crumpled_paper' | 'book_page';
}

export interface StepOutput {
  id: string;
  title: string;
  subtitle: string;
  canvas: HTMLCanvasElement | null;
  description: string;
}
