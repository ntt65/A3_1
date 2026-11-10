import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Sliders,
  Maximize2,
  Download,
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileText,
  Sparkles,
} from 'lucide-react';
import { ScannerParams, QuadPoints, Point, TestCase } from '../types/scanner';
import {
  applyGrayscaleAndBlur,
  applyCannyEdge,
  detectDocumentCorners,
  orderPointsGeometric,
  calculateAutoDimensions,
  warpPerspectiveCanvas,
  applyAdaptiveThreshold,
  calculateHistogram,
  generateSyntheticTestImage,
} from '../utils/imageProcessing';
import { TEST_CASES_20 } from '../data/missionData';

interface Props {
  selectedTestCase?: TestCase;
  onSelectTestCase?: (tc: TestCase) => void;
}

export const PipelineSimulator: React.FC<Props> = ({
  selectedTestCase,
  onSelectTestCase,
}) => {
  // Current active test case
  const [activeCase, setActiveCase] = useState<TestCase>(
    selectedTestCase || TEST_CASES_20[0]
  );

  // Trackbar parameters (matching the PDF requirements)
  const [params, setParams] = useState<ScannerParams>({
    blurKernel: 5,
    cannyLow: 50,
    cannyHigh: 150,
    adaptiveBlockSize: 21,
    adaptiveC: 10,
    autoAspectRatio: true,
    contrastEnhance: false,
  });

  // State
  const [activeWindow, setActiveWindow] = useState<number>(0); // 0 = all 5 windows, 1-5 = single zoomed window
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedPoints, setDetectedPoints] = useState<QuadPoints | null>(null);
  const [autoDimensions, setAutoDimensions] = useState<{ width: number; height: number }>({ width: 450, height: 600 });
  const [histogram, setHistogram] = useState<number[]>([]);
  const [webcamActive, setWebcamActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canvases refs for the 5 stages
  const canvasOrigRef = useRef<HTMLCanvasElement | null>(null);
  const canvasPreRef = useRef<HTMLCanvasElement | null>(null);
  const canvasEdgeRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContourRef = useRef<HTMLCanvasElement | null>(null);
  const canvasResultRef = useRef<HTMLCanvasElement | null>(null);

  // Base canvas holding raw loaded image
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync external prop if changed
  useEffect(() => {
    if (selectedTestCase && selectedTestCase.id !== activeCase.id) {
      setActiveCase(selectedTestCase);
    }
  }, [selectedTestCase]);

  // Load / generate synthetic image when active case changes
  useEffect(() => {
    if (webcamActive) return;

    let sampleKey = 'a4_paper';
    if (activeCase.category === 'complex_bg') sampleKey = 'complex_' + activeCase.sampleType;
    else if (activeCase.category === 'shadow') sampleKey = 'shadow_' + activeCase.sampleType;
    else if (activeCase.category === 'angled') sampleKey = 'angled_' + activeCase.sampleType;
    else sampleKey = activeCase.sampleType;

    const synCanvas = generateSyntheticTestImage(sampleKey, 640, 480);
    baseCanvasRef.current = synCanvas;
    runPipeline();
  }, [activeCase]);

  // Run image processing pipeline
  const runPipeline = useCallback(() => {
    const base = baseCanvasRef.current;
    if (!base) return;

    setIsProcessing(true);

    try {
      const width = base.width;
      const height = base.height;

      // 1. Original Window
      const cOrig = canvasOrigRef.current;
      if (cOrig) {
        cOrig.width = width;
        cOrig.height = height;
        const ctxO = cOrig.getContext('2d');
        if (ctxO) ctxO.drawImage(base, 0, 0);
      }

      // Calculate pixel histogram of original image
      setHistogram(calculateHistogram(base));

      // 2. Preprocessed Window (Grayscale + Gaussian Blur)
      const baseCtx = base.getContext('2d');
      if (!baseCtx) return;

      const blurredImageData = applyGrayscaleAndBlur(baseCtx, width, height, params.blurKernel);
      const cPre = canvasPreRef.current;
      if (cPre) {
        cPre.width = width;
        cPre.height = height;
        const ctxP = cPre.getContext('2d');
        if (ctxP) ctxP.putImageData(blurredImageData, 0, 0);
      }

      // 3. Edges Window (Canny Edge Detection)
      const edgeImageData = applyCannyEdge(blurredImageData, params.cannyLow, params.cannyHigh);
      const cEdge = canvasEdgeRef.current;
      if (cEdge) {
        cEdge.width = width;
        cEdge.height = height;
        const ctxE = cEdge.getContext('2d');
        if (ctxE) ctxE.putImageData(edgeImageData, 0, 0);
      }

      // 4. Contour Window (approxPolyDP 4-corner quad detection)
      const rawCorners = detectDocumentCorners(edgeImageData);
      let orderedQuad: QuadPoints | null = null;
      try {
        orderedQuad = orderPointsGeometric(rawCorners);
        setDetectedPoints(orderedQuad);
      } catch (e) {
        setDetectedPoints(null);
      }

      const cContour = canvasContourRef.current;
      if (cContour) {
        cContour.width = width;
        cContour.height = height;
        const ctxC = cContour.getContext('2d');
        if (ctxC) {
          // Draw base image
          ctxC.drawImage(base, 0, 0);

          if (orderedQuad) {
            // Draw green contour polygon
            ctxC.beginPath();
            ctxC.moveTo(orderedQuad.topLeft.x, orderedQuad.topLeft.y);
            ctxC.lineTo(orderedQuad.topRight.x, orderedQuad.topRight.y);
            ctxC.lineTo(orderedQuad.bottomRight.x, orderedQuad.bottomRight.y);
            ctxC.lineTo(orderedQuad.bottomLeft.x, orderedQuad.bottomLeft.y);
            ctxC.closePath();

            ctxC.lineWidth = 3;
            ctxC.strokeStyle = '#22c55e'; // Vibrant green
            ctxC.stroke();
            ctxC.fillStyle = 'rgba(34, 197, 94, 0.15)';
            ctxC.fill();

            // Draw red points for 4 corners with labels
            const pts = [
              { p: orderedQuad.topLeft, label: 'TL (좌상)', color: '#ef4444' },
              { p: orderedQuad.topRight, label: 'TR (우상)', color: '#3b82f6' },
              { p: orderedQuad.bottomRight, label: 'BR (우하)', color: '#a855f7' },
              { p: orderedQuad.bottomLeft, label: 'BL (좌하)', color: '#f59e0b' },
            ];

            pts.forEach(({ p, label, color }) => {
              ctxC.beginPath();
              ctxC.arc(p.x, p.y, 7, 0, Math.PI * 2);
              ctxC.fillStyle = color;
              ctxC.fill();
              ctxC.strokeStyle = '#ffffff';
              ctxC.lineWidth = 2;
              ctxC.stroke();

              // Label badge
              ctxC.fillStyle = 'rgba(15, 23, 42, 0.85)';
              ctxC.fillRect(p.x + 10, p.y - 12, 60, 18);
              ctxC.fillStyle = '#ffffff';
              ctxC.font = 'bold 10px sans-serif';
              ctxC.fillText(label, p.x + 14, p.y + 1);
            });
          }
        }
      }

      // 5. Result Window (Perspective Transform + Adaptive Thresholding)
      const cResult = canvasResultRef.current;
      if (cResult && orderedQuad) {
        // Calculate dimensions
        let dims = { width: 400, height: 550 };
        if (params.autoAspectRatio) {
          dims = calculateAutoDimensions(orderedQuad);
        }
        setAutoDimensions(dims);

        // Perspective transform
        const warped = warpPerspectiveCanvas(base, orderedQuad, dims.width, dims.height);

        // Adaptive thresholding
        const scanned = applyAdaptiveThreshold(
          warped,
          params.adaptiveBlockSize,
          params.adaptiveC
        );

        cResult.width = dims.width;
        cResult.height = dims.height;
        const ctxR = cResult.getContext('2d');
        if (ctxR) {
          ctxR.drawImage(scanned, 0, 0);
        }
      }
    } catch (err) {
      console.error('Pipeline processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [params, activeCase]);

  // Trigger pipeline whenever trackbar parameters change
  useEffect(() => {
    runPipeline();
  }, [runPipeline]);

  // Handle custom file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();
    reader.onload = (event) => {
      img.onload = () => {
        const c = document.createElement('canvas');
        // Clamp to max 800px for smooth client-side processing
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, w, h);
        baseCanvasRef.current = c;
        setToastMessage(`사용자 이미지(${w}x${h}) 로드 완료`);
        runPipeline();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Webcam toggle (Requirement 3: 웹캠 보드)
  const toggleWebcam = async () => {
    if (webcamActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      setWebcamActive(false);
      setToastMessage('웹캠 연결 해제됨');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setWebcamActive(true);
        setToastMessage('웹캠 활성화됨! 프레임 캡처 버튼을 눌러 스캔하세요.');
      }
    } catch (err) {
      alert('카메라 접근 권한이 없거나 지원되지 않는 환경입니다.');
    }
  };

  const captureWebcamFrame = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const c = document.createElement('canvas');
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    const ctx = c.getContext('2d');
    if (ctx) ctx.drawImage(v, 0, 0, c.width, c.height);
    baseCanvasRef.current = c;
    setToastMessage('웹캠 프레임 캡처 완료 (S 키 시뮬레이션)');
    runPipeline();
  };

  // Download scanned image (Requirement 6 & Bonus 3)
  const downloadResult = (format: 'png' | 'pdf') => {
    const canvas = canvasResultRef.current;
    if (!canvas) return;

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `scanned_${activeCase.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setToastMessage('scanned_result.png 다운로드 완료');
    } else {
      // PDF export simulation (prints to PDF / downloadable via canvas)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const w = window.open('');
      if (w) {
        w.document.write(`
          <html>
            <head><title>Scanned Document PDF</title></head>
            <body style="margin:0;display:flex;align-items:center;justify-content:center;background:#1e293b;height:100vh;">
              <div style="background:#fff;padding:20px;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
                <img src="${dataUrl}" style="max-height:90vh;max-width:90vw;display:block;" />
                <p style="text-align:center;font-family:sans-serif;font-size:12px;color:#64748b;margin-top:10px;">
                  OpenCV Document Scanner - [Bonus 3: PDF Export Format]
                </p>
              </div>
            </body>
          </html>
        `);
        setToastMessage('PDF 미리보기 창이 열렸습니다. (Ctrl+P로 PDF 저장 가능)');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-white text-xs underline"
          >
            닫기
          </button>
        </div>
      )}

      {/* Top Controls: Test Case Selector & Inputs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                실시간 파이프라인 시뮬레이터
              </span>
              <span className="text-xs text-slate-400">OpenCV GUI 5개 윈도우 완벽 재현</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              문서 영역 자동 검출 & 투시 변환 (Homography)
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
              title="사용자 이미지 직접 업로드"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              이미지 업로드
            </button>

            <button
              onClick={toggleWebcam}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                webcamActive
                  ? 'bg-rose-900/40 border-rose-500/50 text-rose-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="3. 웹캠 모드 (선택 과제 실시간 프레임)"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              {webcamActive ? '웹캠 끄기' : '웹캠 모드'}
            </button>

            {webcamActive && (
              <button
                onClick={captureWebcamFrame}
                className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow transition"
              >
                [S] 프레임 캡처
              </button>
            )}

            <button
              onClick={runPipeline}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              title="파이프라인 재실행"
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Hidden video element for webcam */}
        <video ref={videoRef} className={webcamActive ? 'w-full max-h-48 rounded-xl mt-3 object-contain bg-black' : 'hidden'} />

        {/* 20 Test Case Quick Carousel / Chips */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>20장 테스트 케이스 프리셋 선택:</span>
              <span className="text-slate-500 text-[11px] font-normal">
                (단순 5장, 그림자 5장, 45도 기울어짐 5장, 복잡 배경 5장)
              </span>
            </span>
            <span className="text-[11px] text-indigo-400">
              현재: {activeCase.name} ({activeCase.categoryLabel})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
            {TEST_CASES_20.map((tc) => {
              const isSelected = tc.id === activeCase.id;
              let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              if (tc.category === 'shadow') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
              if (tc.category === 'angled') badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
              if (tc.category === 'complex_bg') badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

              return (
                <button
                  key={tc.id}
                  onClick={() => {
                    setActiveCase(tc);
                    if (onSelectTestCase) onSelectTestCase(tc);
                  }}
                  className={`p-2 rounded-xl text-left border transition text-xs flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-[11px] text-white truncate">{tc.id.toUpperCase()}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded border ${badgeColor}`}>
                      {tc.category === 'simple_front' ? '정면' : tc.category === 'shadow' ? '그림자' : tc.category === 'angled' ? '기울임' : '복잡'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{tc.name.split(':')[1]}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Trackbar Panel + 5 Process Windows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: OpenCV Trackbar Control Panel (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">트랙바 파라미터 조절</h3>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                Trackbar Panel
              </span>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              {/* Blur Kernel Slider */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-medium">1. Blur Kernel (가우시안 블러 크기):</span>
                  <span className="font-mono text-indigo-400 font-bold">{params.blurKernel} x {params.blurKernel}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="2"
                  value={params.blurKernel}
                  onChange={(e) => setParams({ ...params, blurKernel: Number(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>3 (섬세함)</span>
                  <span>7 (과제 권장값)</span>
                  <span>15 (강한 노이즈 제거)</span>
                </div>
              </div>

              {/* Canny Low Threshold */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-medium">2. Canny Low Threshold:</span>
                  <span className="font-mono text-cyan-400 font-bold">{params.cannyLow}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={params.cannyLow}
                  onChange={(e) => setParams({ ...params, cannyLow: Number(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>10 (약한 엣지 보존)</span>
                  <span>50 (표준)</span>
                  <span>150 (잡음 억제)</span>
                </div>
              </div>

              {/* Canny High Threshold */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-medium">3. Canny High Threshold:</span>
                  <span className="font-mono text-amber-400 font-bold">{params.cannyHigh}</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="280"
                  step="10"
                  value={params.cannyHigh}
                  onChange={(e) => setParams({ ...params, cannyHigh: Math.max(params.cannyLow + 10, Number(e.target.value)) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>60 (연한 경계선 검출)</span>
                  <span>150 (표준)</span>
                  <span>280 (강한 경계만)</span>
                </div>
              </div>

              {/* Adaptive Threshold Block Size */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-medium">4. 후처리 적응형 이진화 Block:</span>
                  <span className="font-mono text-emerald-400 font-bold">{params.adaptiveBlockSize}</span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="35"
                  step="2"
                  value={params.adaptiveBlockSize}
                  onChange={(e) => setParams({ ...params, adaptiveBlockSize: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Adaptive Threshold C Constant */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-medium">5. 이진화 보정 상수 (C):</span>
                  <span className="font-mono text-emerald-400 font-bold">{params.adaptiveC}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={params.adaptiveC}
                  onChange={(e) => setParams({ ...params, adaptiveC: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Bonus 2: Auto Aspect Ratio Toggle */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-200">보너스 2: 종횡비 자동 보정</div>
                  <div className="text-[10px] text-slate-400">유클리드 거리 기반 가로/세로 자동 산출</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.autoAspectRatio}
                    onChange={(e) => setParams({ ...params, autoAspectRatio: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Real-time Corner Coordinates & Geometry Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-xs">
            <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>검출된 4꼭짓점 좌표 (x+y & x-y 정렬 알고리즘)</span>
            </h4>
            <p className="text-[11px] text-slate-400 mb-3">
              외부 기하 라이브러리(scipy/shapely) 없이 순수 수학 기하 공식으로 정렬된 좌표입니다:
            </p>

            {detectedPoints ? (
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2 bg-slate-950/60 rounded-lg border border-red-500/20 text-red-300">
                  <div className="text-[10px] text-slate-400">TL (좌상단: x+y 최소)</div>
                  <div>({Math.round(detectedPoints.topLeft.x)}, {Math.round(detectedPoints.topLeft.y)})</div>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-blue-500/20 text-blue-300">
                  <div className="text-[10px] text-slate-400">TR (우상단: x-y 최대)</div>
                  <div>({Math.round(detectedPoints.topRight.x)}, {Math.round(detectedPoints.topRight.y)})</div>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-purple-500/20 text-purple-300">
                  <div className="text-[10px] text-slate-400">BR (우하단: x+y 최대)</div>
                  <div>({Math.round(detectedPoints.bottomRight.x)}, {Math.round(detectedPoints.bottomRight.y)})</div>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-amber-500/20 text-amber-300">
                  <div className="text-[10px] text-slate-400">BL (좌하단: x-y 최소)</div>
                  <div>({Math.round(detectedPoints.bottomLeft.x)}, {Math.round(detectedPoints.bottomLeft.y)})</div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>4개 사각형 정점을 찾지 못했습니다. Canny 임계값을 낮추거나 블러를 조절해보세요.</span>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
              <span>변환 해상도 (보너스 2):</span>
              <span className="font-mono text-indigo-400 font-bold">{autoDimensions.width} x {autoDimensions.height} px</span>
            </div>
          </div>

          {/* Histogram Mini Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white text-xs">픽셀 밝기 히스토그램 (EDA)</h4>
              <span className="text-[10px] text-slate-500">0(어두움) ~ 255(밝음)</span>
            </div>
            <div className="h-16 flex items-end gap-[1px] bg-slate-950 p-1.5 rounded-lg border border-slate-800">
              {histogram.filter((_, idx) => idx % 4 === 0).map((val, idx) => (
                <div
                  key={idx}
                  style={{ height: `${Math.max(2, val)}%` }}
                  className="flex-1 bg-indigo-500/70 hover:bg-indigo-400 transition"
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {activeCase.category === 'shadow'
                ? '⚠️ 어두운 픽셀 영역에 좁게 밀집되어 엣지 검출 경계선이 약해집니다.'
                : '✅ 배경과 문서가 이봉형(Bimodal)으로 뚜렷이 분리되어 엣지 검출이 용이합니다.'}
            </p>
          </div>
        </div>

        {/* Right Side: 5 Step Windows (col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            {/* Header with zoom/view toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">단계별 윈도우 시각화</span>
                <span className="text-xs text-slate-400">(원본 → 전처리 → 엣지 → 윤곽선 → 최종 결과)</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveWindow(0)}
                  className={`px-2.5 py-1 rounded-md transition ${
                    activeWindow === 0 ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  전체 5개 보기
                </button>
                <button
                  onClick={() => setActiveWindow(4)}
                  className={`px-2.5 py-1 rounded-md transition ${
                    activeWindow === 4 ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  윤곽선 (W4)
                </button>
                <button
                  onClick={() => setActiveWindow(5)}
                  className={`px-2.5 py-1 rounded-md transition ${
                    activeWindow === 5 ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  최종 스캔본 (W5)
                </button>
              </div>
            </div>

            {/* 5 Windows Layout */}
            {activeWindow === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {/* Window 1: Original */}
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">Window 1: Original</span>
                    <span className="text-[10px] text-slate-500">입력 원본 이미지</span>
                  </div>
                  <div className="relative aspect-video bg-black/40 rounded-lg overflow-hidden flex items-center justify-center">
                    <canvas ref={canvasOrigRef} className="max-w-full max-h-full object-contain" />
                  </div>
                </div>

                {/* Window 2: Preprocessed */}
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">Window 2: Preprocessed</span>
                    <span className="text-[10px] text-slate-500">Grayscale + Gaussian Blur</span>
                  </div>
                  <div className="relative aspect-video bg-black/40 rounded-lg overflow-hidden flex items-center justify-center">
                    <canvas ref={canvasPreRef} className="max-w-full max-h-full object-contain" />
                  </div>
                </div>

                {/* Window 3: Edges */}
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">Window 3: Edges (Canny)</span>
                    <span className="text-[10px] text-slate-500">Sobel + NMS + Hysteresis</span>
                  </div>
                  <div className="relative aspect-video bg-black/40 rounded-lg overflow-hidden flex items-center justify-center">
                    <canvas ref={canvasEdgeRef} className="max-w-full max-h-full object-contain" />
                  </div>
                </div>

                {/* Window 4: Contours */}
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400">Window 4: Contours</span>
                    <span className="text-[10px] text-emerald-500/80">approxPolyDP 4꼭짓점</span>
                  </div>
                  <div className="relative aspect-video bg-black/40 rounded-lg overflow-hidden flex items-center justify-center">
                    <canvas ref={canvasContourRef} className="max-w-full max-h-full object-contain" />
                  </div>
                </div>

                {/* Window 5: Result (Spans 2 columns) */}
                <div className="md:col-span-2 bg-slate-950 rounded-xl p-4 border border-indigo-500/40 shadow-lg flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-300">Window 5: Result (최종 스캔본)</span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                        투시 변환 + 적응형 이진화
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadResult('png')}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs border border-slate-700 transition"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        PNG 저장
                      </button>
                      <button
                        onClick={() => downloadResult('pdf')}
                        className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow transition"
                      >
                        <FileText className="w-3 h-3" />
                        PDF 내보내기 (보너스 3)
                      </button>
                    </div>
                  </div>
                  <div className="relative min-h-[300px] bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center p-4">
                    <canvas ref={canvasResultRef} className="max-w-full max-h-[360px] object-contain shadow-2xl rounded" />
                  </div>
                </div>
              </div>
            ) : (
              /* Single Focused Window View */
              <div className="pt-4">
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 min-h-[450px] flex items-center justify-center">
                  {activeWindow === 4 && (
                    <canvas ref={canvasContourRef} className="max-w-full max-h-[500px] object-contain" />
                  )}
                  {activeWindow === 5 && (
                    <div className="space-y-4 text-center">
                      <canvas ref={canvasResultRef} className="max-w-full max-h-[500px] object-contain shadow-2xl mx-auto rounded" />
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => downloadResult('png')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-xl border border-slate-700"
                        >
                          <Download className="w-4 h-4 text-emerald-400" />
                          scanned_result.png 저장
                        </button>
                        <button
                          onClick={() => downloadResult('pdf')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow"
                        >
                          <FileText className="w-4 h-4" />
                          PDF 문서 생성 (보너스 3)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
