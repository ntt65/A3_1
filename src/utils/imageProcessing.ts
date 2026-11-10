import { Point, QuadPoints, ScannerParams } from '../types/scanner';

/**
 * 4개 점을 좌상(TL), 우상(TR), 우하(BR), 좌하(BL) 순서로 정렬하는 기하학적 알고리즘
 * 과제 제약 조건: "scipy.spatial, shapely 등 외부 라이브러리 사용 금지, 순수 기하/수학 원리로 직접 구현"
 * 원리:
 * - x + y 합: 가장 작은 점 = 좌상단 (Top-Left), 가장 큰 점 = 우하단 (Bottom-Right)
 * - y - x 차 (또는 x - y): x - y가 가장 큰 점 = 우상단 (Top-Right), 가장 작은 점 = 좌하단 (Bottom-Left)
 */
export function orderPointsGeometric(pts: Point[]): QuadPoints {
  if (pts.length !== 4) {
    throw new Error('4개의 점이 필요합니다.');
  }

  // 1. x + y 계산
  let minSum = Infinity;
  let maxSum = -Infinity;
  let tlIndex = 0;
  let brIndex = 0;

  pts.forEach((p, i) => {
    const sum = p.x + p.y;
    if (sum < minSum) {
      minSum = sum;
      tlIndex = i;
    }
    if (sum > maxSum) {
      maxSum = sum;
      brIndex = i;
    }
  });

  // 2. x - y 계산
  let maxDiff = -Infinity;
  let minDiff = Infinity;
  let trIndex = 0;
  let blIndex = 0;

  pts.forEach((p, i) => {
    const diff = p.x - p.y;
    if (diff > maxDiff) {
      maxDiff = diff;
      trIndex = i;
    }
    if (diff < minDiff) {
      minDiff = diff;
      blIndex = i;
    }
  });

  return {
    topLeft: pts[tlIndex],
    topRight: pts[trIndex],
    bottomRight: pts[brIndex],
    bottomLeft: pts[blIndex],
  };
}

/**
 * 두 점 사이의 유클리드 거리 계산
 */
export function euclideanDistance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * 보너스 과제 2: 원본 좌표 간 거리를 계산하여 결과 이미지의 종횡비 자동 결정
 */
export function calculateAutoDimensions(quad: QuadPoints): { width: number; height: number } {
  const widthA = euclideanDistance(quad.bottomRight, quad.bottomLeft);
  const widthB = euclideanDistance(quad.topRight, quad.topLeft);
  const maxWidth = Math.max(Math.round(widthA), Math.round(widthB));

  const heightA = euclideanDistance(quad.topRight, quad.bottomRight);
  const heightB = euclideanDistance(quad.topLeft, quad.bottomLeft);
  const maxHeight = Math.max(Math.round(heightA), Math.round(heightB));

  return {
    width: Math.max(100, Math.min(maxWidth, 1200)),
    height: Math.max(100, Math.min(maxHeight, 1600)),
  };
}

/**
 * 이미지 전처리: 그레이스케일 + 가우시안 블러
 */
export function applyGrayscaleAndBlur(
  srcCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  kernelSize: number
): ImageData {
  const srcData = srcCtx.getImageData(0, 0, width, height);
  const pixels = srcData.data;

  // 1. Grayscale (ITU-R BT.601: 0.299R + 0.587G + 0.114B)
  const gray = new Float32Array(width * height);
  for (let i = 0; i < pixels.length; i += 4) {
    gray[i >> 2] = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  }

  // 2. 가우시안 블러 (1D Separable Gaussian Filter로 고속 처리)
  const sigma = Math.max(0.5, kernelSize / 3);
  const radius = Math.floor(kernelSize / 2);
  const kernel = new Float32Array(kernelSize);
  let kernelSum = 0;

  for (let i = -radius; i <= radius; i++) {
    const val = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + radius] = val;
    kernelSum += val;
  }
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= kernelSum;
  }

  // Horizontal pass
  const temp = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) {
        const px = Math.min(width - 1, Math.max(0, x + k));
        acc += gray[rowOffset + px] * kernel[k + radius];
      }
      temp[rowOffset + x] = acc;
    }
  }

  // Vertical pass
  const blurred = new Float32Array(width * height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) {
        const py = Math.min(height - 1, Math.max(0, y + k));
        acc += temp[py * width + x] * kernel[k + radius];
      }
      blurred[y * width + x] = acc;
    }
  }

  // Output ImageData
  const outData = new ImageData(width, height);
  const outPixels = outData.data;
  for (let i = 0; i < blurred.length; i++) {
    const val = Math.min(255, Math.max(0, Math.round(blurred[i])));
    const idx = i << 2;
    outPixels[idx] = val;
    outPixels[idx + 1] = val;
    outPixels[idx + 2] = val;
    outPixels[idx + 3] = 255;
  }

  return outData;
}

/**
 * Canny 엣지 검출기 (Sobel 미분 + 비최대 억제 + 히스테리시스 임계처리)
 */
export function applyCannyEdge(
  blurredGray: ImageData,
  lowThresh: number,
  highThresh: number
): ImageData {
  const width = blurredGray.width;
  const height = blurredGray.height;
  const data = blurredGray.data;

  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = data[i << 2];
  }

  const grad = new Float32Array(width * height);
  const dir = new Uint8Array(width * height); // 0: 0°, 1: 45°, 2: 90°, 3: 135°

  // Sobel 연산자 (Gx, Gy)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx =
        -gray[(y - 1) * width + (x - 1)] +
        gray[(y - 1) * width + (x + 1)] -
        2 * gray[y * width + (x - 1)] +
        2 * gray[y * width + (x + 1)] -
        gray[(y + 1) * width + (x - 1)] +
        gray[(y + 1) * width + (x + 1)];

      const gy =
        -gray[(y - 1) * width + (x - 1)] -
        2 * gray[(y - 1) * width + x] -
        gray[(y - 1) * width + (x + 1)] +
        gray[(y + 1) * width + (x - 1)] +
        2 * gray[(y + 1) * width + x] +
        gray[(y + 1) * width + (x + 1)];

      const mag = Math.hypot(gx, gy);
      grad[idx] = mag;

      let theta = Math.atan2(gy, gx) * (180 / Math.PI);
      if (theta < 0) theta += 180;

      if ((theta >= 0 && theta < 22.5) || (theta >= 157.5 && theta <= 180)) {
        dir[idx] = 0; // 수평
      } else if (theta >= 22.5 && theta < 67.5) {
        dir[idx] = 1; // 45도
      } else if (theta >= 67.5 && theta < 112.5) {
        dir[idx] = 2; // 수직
      } else {
        dir[idx] = 3; // 135도
      }
    }
  }

  // Non-Maximum Suppression (비최대 억제)
  const nms = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const m = grad[idx];
      const d = dir[idx];

      let q = 255;
      let r = 255;

      if (d === 0) {
        q = grad[idx + 1];
        r = grad[idx - 1];
      } else if (d === 1) {
        q = grad[(y + 1) * width + (x - 1)];
        r = grad[(y - 1) * width + (x + 1)];
      } else if (d === 2) {
        q = grad[(y + 1) * width + x];
        r = grad[(y - 1) * width + x];
      } else if (d === 3) {
        q = grad[(y - 1) * width + (x - 1)];
        r = grad[(y + 1) * width + (x + 1)];
      }

      if (m >= q && m >= r) {
        nms[idx] = m;
      } else {
        nms[idx] = 0;
      }
    }
  }

  // Hysteresis Thresholding (히스테리시스 이중 임계처리)
  const result = new Uint8Array(width * height);
  const STRONG = 255;
  const WEAK = 75;

  for (let i = 0; i < nms.length; i++) {
    const val = nms[i];
    if (val >= highThresh) {
      result[i] = STRONG;
    } else if (val >= lowThresh) {
      result[i] = WEAK;
    } else {
      result[i] = 0;
    }
  }

  // 연결성 추적: Weak edge가 Strong edge와 인접하면 연결
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (result[idx] === WEAK) {
        let hasStrong = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (result[(y + dy) * width + (x + dx)] === STRONG) {
              hasStrong = true;
              break;
            }
          }
          if (hasStrong) break;
        }
        result[idx] = hasStrong ? STRONG : 0;
      }
    }
  }

  const outData = new ImageData(width, height);
  const outPixels = outData.data;
  for (let i = 0; i < result.length; i++) {
    const val = result[i] === STRONG ? 255 : 0;
    const idx = i << 2;
    outPixels[idx] = val;
    outPixels[idx + 1] = val;
    outPixels[idx + 2] = val;
    outPixels[idx + 3] = 255;
  }

  return outData;
}

/**
 * 엣지 맵에서 가장 큰 사각형 윤곽선(4꼭짓점)을 검출
 */
export function detectDocumentCorners(
  edgeData: ImageData,
  fallbackMargin: number = 0.12
): Point[] {
  const width = edgeData.width;
  const height = edgeData.height;
  const pixels = edgeData.data;

  // 1. 강한 엣지 픽셀 좌표 수집 (다운샘플링)
  const step = 2;
  const edgePoints: Point[] = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (pixels[(y * width + x) * 4] > 200) {
        edgePoints.push({ x, y });
      }
    }
  }

  if (edgePoints.length < 50) {
    // 엣지가 너무 적을 경우 기본 사각형 영역 반환
    return [
      { x: Math.round(width * fallbackMargin), y: Math.round(height * fallbackMargin) },
      { x: Math.round(width * (1 - fallbackMargin)), y: Math.round(height * (fallbackMargin * 1.2)) },
      { x: Math.round(width * (1 - fallbackMargin * 0.9)), y: Math.round(height * (1 - fallbackMargin)) },
      { x: Math.round(width * (fallbackMargin * 1.1)), y: Math.round(height * (1 - fallbackMargin * 1.1)) },
    ];
  }

  // 4분면 기하 중심점 기준 극점 탐색 (Convex Quad 검출)
  let cx = 0;
  let cy = 0;
  for (const p of edgePoints) {
    cx += p.x;
    cy += p.y;
  }
  cx /= edgePoints.length;
  cy /= edgePoints.length;

  let bestTL = { p: { x: 0, y: 0 }, dist: -Infinity };
  let bestTR = { p: { x: 0, y: 0 }, dist: -Infinity };
  let bestBR = { p: { x: 0, y: 0 }, dist: -Infinity };
  let bestBL = { p: { x: 0, y: 0 }, dist: -Infinity };

  for (const p of edgePoints) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d2 = dx * dx + dy * dy;

    if (dx <= 0 && dy <= 0) {
      // 2사분면 (Top-Left)
      if (d2 > bestTL.dist) bestTL = { p, dist: d2 };
    } else if (dx > 0 && dy <= 0) {
      // 1사분면 (Top-Right)
      if (d2 > bestTR.dist) bestTR = { p, dist: d2 };
    } else if (dx > 0 && dy > 0) {
      // 4사분면 (Bottom-Right)
      if (d2 > bestBR.dist) bestBR = { p, dist: d2 };
    } else if (dx <= 0 && dy > 0) {
      // 3사분면 (Bottom-Left)
      if (d2 > bestBL.dist) bestBL = { p, dist: d2 };
    }
  }

  if (
    bestTL.dist > 0 &&
    bestTR.dist > 0 &&
    bestBR.dist > 0 &&
    bestBL.dist > 0
  ) {
    return [bestTL.p, bestTR.p, bestBR.p, bestBL.p];
  }

  return [
    { x: Math.round(width * 0.15), y: Math.round(height * 0.15) },
    { x: Math.round(width * 0.85), y: Math.round(height * 0.12) },
    { x: Math.round(width * 0.88), y: Math.round(height * 0.88) },
    { x: Math.round(width * 0.12), y: Math.round(height * 0.85) },
  ];
}

/**
 * 3x3 투시 변환 행렬 (Homography) 계산 및 역행렬 와핑
 * OpenCV getPerspectiveTransform & warpPerspective 구현
 */
export function warpPerspectiveCanvas(
  srcCanvas: HTMLCanvasElement,
  srcQuad: QuadPoints,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetWidth;
  outCanvas.height = targetHeight;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return outCanvas;

  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) return outCanvas;

  const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
  const srcPixels = srcData.data;
  const sW = srcCanvas.width;
  const sH = srcCanvas.height;

  const outData = outCtx.createImageData(targetWidth, targetHeight);
  const outPixels = outData.data;

  // 매핑: 목적지 사각형 [0,0], [W,0], [W,H], [0,H] -> 원본 4점
  // H 행렬 구하기: (x, y) -> (u, v)
  const H = getPerspectiveMatrix(
    [
      { x: 0, y: 0 },
      { x: targetWidth, y: 0 },
      { x: targetWidth, y: targetHeight },
      { x: 0, y: targetHeight },
    ],
    [
      srcQuad.topLeft,
      srcQuad.topRight,
      srcQuad.bottomRight,
      srcQuad.bottomLeft,
    ]
  );

  // 목적지 픽셀마다 원본의 실수 좌표 (srcX, srcY)를 구하고 쌍선형 보간(Bilinear Interpolation)
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const denom = H[6] * x + H[7] * y + H[8];
      if (Math.abs(denom) < 1e-7) continue;

      const sx = (H[0] * x + H[1] * y + H[2]) / denom;
      const sy = (H[3] * x + H[4] * y + H[5]) / denom;

      if (sx >= 0 && sx < sW - 1 && sy >= 0 && sy < sH - 1) {
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const wx1 = sx - x0;
        const wx0 = 1 - wx1;
        const wy1 = sy - y0;
        const wy0 = 1 - wy1;

        const i00 = (y0 * sW + x0) * 4;
        const i10 = (y0 * sW + x1) * 4;
        const i01 = (y1 * sW + x0) * 4;
        const i11 = (y1 * sW + x1) * 4;

        const outIdx = (y * targetWidth + x) * 4;
        for (let c = 0; c < 3; c++) {
          outPixels[outIdx + c] = Math.round(
            wy0 * (wx0 * srcPixels[i00 + c] + wx1 * srcPixels[i10 + c]) +
            wy1 * (wx0 * srcPixels[i01 + c] + wx1 * srcPixels[i11 + c])
          );
        }
        outPixels[outIdx + 3] = 255;
      }
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return outCanvas;
}

/**
 * 8개의 점 대응 관계로부터 3x3 투시 변환 행렬 도출 (Gaussian Elimination)
 */
function getPerspectiveMatrix(src: Point[], dst: Point[]): number[] {
  const A: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < 4; i++) {
    const x = src[i].x;
    const y = src[i].y;
    const u = dst[i].x;
    const v = dst[i].y;

    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    B.push(u);

    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    B.push(v);
  }

  // Gaussian Elimination 풀이
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    const tempA = A[i];
    A[i] = A[maxRow];
    A[maxRow] = tempA;

    const tempB = B[i];
    B[i] = B[maxRow];
    B[maxRow] = tempB;

    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        A[k][j] -= factor * A[i][j];
      }
      B[k] -= factor * B[i];
    }
  }

  const h = new Array(8).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * h[j];
    }
    h[i] = (B[i] - sum) / A[i][i];
  }

  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

/**
 * 적응형 이진화 (Adaptive Thresholding: Mean - C)
 * 조명 얼룩이나 그림자가 있는 경우에도 문자를 깨끗하게 추출
 */
export function applyAdaptiveThreshold(
  canvas: HTMLCanvasElement,
  blockSize: number,
  C: number
): HTMLCanvasElement {
  const width = canvas.width;
  const height = canvas.height;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const ctx = canvas.getContext('2d');
  const outCtx = outCanvas.getContext('2d');
  if (!ctx || !outCtx) return outCanvas;

  const imgData = ctx.getImageData(0, 0, width, height);
  const src = imgData.data;

  // 1. Grayscale 변환
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * src[idx] + 0.587 * src[idx + 1] + 0.114 * src[idx + 2];
  }

  // 2. Integral Image (적분 이미지)를 사용하여 O(1)로 로컬 평균 계산
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += gray[y * width + x];
      integral[(y + 1) * (width + 1) + (x + 1)] =
        integral[y * (width + 1) + (x + 1)] + rowSum;
    }
  }

  const r = Math.floor(blockSize / 2);
  const outData = outCtx.createImageData(width, height);
  const dst = outData.data;

  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - r);
    const y2 = Math.min(height - 1, y + r);

    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - r);
      const x2 = Math.min(width - 1, x + r);

      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      // Integral lookup: S = I(x2+1, y2+1) - I(x1, y2+1) - I(x2+1, y1) + I(x1, y1)
      const sum =
        integral[(y2 + 1) * (width + 1) + (x2 + 1)] -
        integral[(y2 + 1) * (width + 1) + x1] -
        integral[y1 * (width + 1) + (x2 + 1)] +
        integral[y1 * (width + 1) + x1];

      const mean = sum / count;
      const pixelVal = gray[y * width + x];
      const binaryVal = pixelVal > mean - C ? 255 : 0;

      const outIdx = (y * width + x) * 4;
      dst[outIdx] = binaryVal;
      dst[outIdx + 1] = binaryVal;
      dst[outIdx + 2] = binaryVal;
      dst[outIdx + 3] = 255;
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return outCanvas;
}

/**
 * 픽셀 밝기 히스토그램 (0~255) 계산
 */
export function calculateHistogram(canvas: HTMLCanvasElement): number[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Array(256).fill(0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const hist = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    hist[gray]++;
  }

  // 정규화 (최대 빈도수 기준 0~100)
  const max = Math.max(...hist, 1);
  return hist.map((v) => Math.round((v / max) * 100));
}

/**
 * 20개 테스트 케이스용 합성 문서 이미지 생성기
 * (A4 용지, 영수증, 명함, 강한 그림자, 45도 기울어짐, 복잡한 배경 등)
 */
export function generateSyntheticTestImage(
  type: string,
  width: number = 600,
  height: number = 450
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. 배경 그리기
  if (type.includes('complex')) {
    // 복잡한 잡동사니 배경 / 무늬 테이블
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#533b2a');
    grad.addColorStop(0.5, '#724b33');
    grad.addColorStop(1, '#3b2518');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 테이블 텍스처 줄무늬
    ctx.strokeStyle = '#2b1a11';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < width; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 20, height);
      ctx.stroke();
    }

    // 주변 물품 (펜, 커피잔, 키보드 자국 등)
    ctx.fillStyle = '#222';
    ctx.fillRect(20, 20, 80, 240); // 펜통 또는 수첩
    ctx.beginPath();
    ctx.arc(width - 50, 60, 35, 0, Math.PI * 2); // 컵
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (type.includes('shadow')) {
    // 단순 책상 위 강한 그림자 드리움
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, width, height);
  } else {
    // 단순 단색 정돈된 매트
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#475569';
    ctx.fillRect(15, 15, width - 30, height - 30);
  }

  // 2. 문서 다각형 꼭짓점 결정 (기울어짐 반영)
  let p1: Point, p2: Point, p3: Point, p4: Point;

  if (type.includes('angled')) {
    // 45도 이상 가파른 기울어짐 및 원근 왜곡
    p1 = { x: width * 0.35, y: height * 0.12 };
    p2 = { x: width * 0.82, y: height * 0.18 };
    p3 = { x: width * 0.65, y: height * 0.90 };
    p4 = { x: width * 0.15, y: height * 0.65 };
  } else if (type.includes('receipt')) {
    // 영수증 (길쭉한 형태, 약간 기울어짐)
    p1 = { x: width * 0.32, y: height * 0.10 };
    p2 = { x: width * 0.68, y: height * 0.14 };
    p3 = { x: width * 0.62, y: height * 0.92 };
    p4 = { x: width * 0.28, y: height * 0.88 };
  } else if (type.includes('card')) {
    // 명함 (가로형 소형)
    p1 = { x: width * 0.25, y: height * 0.30 };
    p2 = { x: width * 0.75, y: height * 0.28 };
    p3 = { x: width * 0.72, y: height * 0.72 };
    p4 = { x: width * 0.22, y: height * 0.70 };
  } else {
    // A4 문서 (가벼운 원근 각도)
    p1 = { x: width * 0.22, y: height * 0.15 };
    p2 = { x: width * 0.78, y: height * 0.18 };
    p3 = { x: width * 0.82, y: height * 0.86 };
    p4 = { x: width * 0.18, y: height * 0.82 };
  }

  // 문서 종이 그리기
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();

  // 그림자 효과 (문서 자체 그림자)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.restore();

  // 문서 텍스처 및 본문 글자 시뮬레이션
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();
  ctx.clip();

  // 종이 색상
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 문서 헤더 및 텍스트 라인
  ctx.fillStyle = '#0f172a';
  const docCenter = { x: (p1.x + p2.x + p3.x + p4.x) / 4, y: (p1.y + p2.y + p3.y + p4.y) / 4 };

  // 제목 바
  ctx.fillRect(docCenter.x - 100, docCenter.y - 110, 200, 14);

  // 텍스트 단락 시뮬레이션
  for (let i = -70; i <= 100; i += 18) {
    const lineLen = 160 + ((i * 17) % 60);
    ctx.fillStyle = i % 36 === 0 ? '#1e293b' : '#64748b';
    ctx.fillRect(docCenter.x - 110, docCenter.y + i, lineLen, 7);
  }

  // 바코드/표 영역
  if (type.includes('receipt')) {
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(docCenter.x - 90, docCenter.y + 40, 180, 45);
    for (let b = 0; b < 160; b += 6) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(docCenter.x - 80 + b, docCenter.y + 45, b % 12 === 0 ? 3 : 1.5, 35);
    }
  }

  ctx.restore();

  // 3. 그림자 오버레이 (그림자 조건인 경우 대각선 강한 손/휴대폰 그림자)
  if (type.includes('shadow')) {
    ctx.save();
    ctx.beginPath();
    // 가파른 그림자 다각형
    ctx.moveTo(0, height * 0.2);
    ctx.lineTo(width * 0.7, height * 0.45);
    ctx.lineTo(width * 0.4, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fill();

    // 부드러운 반사광 및 반대편 그늘
    const radial = ctx.createRadialGradient(
      width * 0.8,
      height * 0.1,
      20,
      width * 0.8,
      height * 0.1,
      250
    );
    radial.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  return canvas;
}
