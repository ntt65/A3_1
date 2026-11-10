import React from 'react';
import {
  BookOpen,
  CheckCircle,
  AlertOctagon,
  Award,
  Layers,
  Cpu,
  ArrowRight,
  ShieldAlert,
  Terminal,
  FileCheck,
} from 'lucide-react';
import { MISSION_SUMMARY } from '../data/missionData';

export const MissionBriefing: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Hero Mission Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {MISSION_SUMMARY.field}
            </span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {MISSION_SUMMARY.duration}
            </span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              필수 미션
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {MISSION_SUMMARY.title}
          </h1>

          <p className="mt-4 text-base text-slate-300 max-w-3xl leading-relaxed">
            스마트폰 카메라로 비스듬히 촬영된 다양한 문서(영수증, A4 보고서, 명함)를 OpenCV와 NumPy만을 활용해
            자동으로 검출하고 반듯한 직사각형으로 펴주는 완전한 <strong>문서 스캐너 파이프라인</strong>을 구축합니다.
            전통적인 규칙 기반 영상 처리의 한계를 직접 체감하고, 데이터 기반 머신러닝/딥러닝 패러다임의 필요성을 스스로 논증하는 심화 미션입니다.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">최종 제출 결과물 1</div>
                <div className="text-xs text-slate-300 font-medium">동작 가능한 Python 애플리케이션 (.py)</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  실시간 5개 윈도우 + 트랙바 GUI + 4점 좌표 정렬 + 적응형 이진화
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">최종 제출 결과물 2</div>
                <div className="text-xs text-slate-300 font-medium">상세 분석 보고서 1부 (PDF/MD)</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  20장 테스트 결과표 + 실패 3건 원인 + 파라미터 딜레마 + 학습 기반 가설
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Industrial Application Scenarios */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>트랙별 산업 현장 활용 시나리오</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MISSION_SUMMARY.scenarios.map((s, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition">
              <div className="text-xs font-bold text-indigo-400 mb-2">{s.track}</div>
              <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Architecture (5 Stages) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <span>5단계 컴퓨터 비전 파이프라인 아키텍처</span>
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          사용자가 이미지 경로를 입력하면 5개의 단계별 윈도우가 열리며 실시간으로 데이터 변환 과정을 시각화합니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            {
              step: 'Step 1',
              title: 'Original Window',
              detail: '휴대폰 촬영 원본',
              desc: '(H, W, C) 3차원 NumPy 배열 로드 및 리사이즈',
            },
            {
              step: 'Step 2',
              title: 'Preprocessed Window',
              detail: '노이즈 제거 필터',
              desc: 'Grayscale 변환 + Gaussian Blur (가우시안 커널 내적)',
            },
            {
              step: 'Step 3',
              title: 'Edges Window',
              detail: 'Canny 엣지 검출',
              desc: 'Sobel 미분 그래디언트 + NMS + 이중 히스테리시스 임계처리',
            },
            {
              step: 'Step 4',
              title: 'Contours Window',
              detail: '윤곽선 & 사각형 검출',
              desc: 'findContours + 면적 정렬 + approxPolyDP 4개 꼭짓점 추출',
            },
            {
              step: 'Step 5',
              title: 'Result Window',
              detail: '투시 변환 & 이진화',
              desc: '4점 정렬 + getPerspectiveTransform + Adaptive Threshold',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-400">{item.step}</span>
                <div className="text-xs font-bold text-white mt-1">{item.title}</div>
                <div className="text-[11px] font-semibold text-emerald-400 mt-0.5">{item.detail}</div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strict Rules & Restrictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strictly Forbidden (제약 사항) */}
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-rose-300 flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>엄격한 금지 사항 (Strictly Forbidden)</span>
          </h3>
          <ul className="space-y-3 text-xs text-rose-200">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <span>
                <strong>딥러닝 프레임워크 일체 사용 금지:</strong> PyTorch, TensorFlow, Keras 등을 이용한 딥러닝 세그멘테이션/바운딩 박스 모델 사용 금지
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <span>
                <strong>기성 OCR 라이브러리 사용 금지:</strong> Tesseract OCR, EasyOCR 등으로 텍스트 위치를 찾아 역산하는 행위 금지
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <span>
                <strong>외부 기하 라이브러리 사용 금지:</strong> scipy.spatial, shapely 등을 사용하여 꼭짓점 정렬이나 볼록 껍질을 계산하는 행위 절대 금지! (순수 NumPy 및 수학 기하 연산으로 직접 구현 필수)
              </span>
            </li>
          </ul>
        </div>

        {/* 4-Corner Ordering Math Insight */}
        <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-3xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-indigo-300 flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <span>핵심 평가 포인트: 좌표 정렬 순수 수학 구현</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            OpenCV에서 검출된 4개의 임의 순서 좌표를 <strong>[좌상(TL), 우상(TR), 우하(BR), 좌하(BL)]</strong> 순으로 정렬하는 기하학적 원리:
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/20 space-y-2 text-xs font-mono">
            <div className="text-indigo-300">
              <span className="text-slate-500"># 1. x + y 합:</span>
              <br />
              <span className="text-white">rect[0] = pts[np.argmin(x + y)]</span> # 좌상단 (Top-Left)
              <br />
              <span className="text-white">rect[2] = pts[np.argmax(x + y)]</span> # 우하단 (Bottom-Right)
            </div>
            <div className="text-cyan-300">
              <span className="text-slate-500"># 2. x - y 차이:</span>
              <br />
              <span className="text-white">rect[1] = pts[np.argmin(y - x)]</span> # 우상단 (Top-Right)
              <br />
              <span className="text-white">rect[3] = pts[np.argmax(y - x)]</span> # 좌하단 (Bottom-Left)
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            좌상단은 좌표계 원점 (0,0)에 가장 가까우므로 합이 최소가 되고, 우하단은 합이 최대가 되는 수학적 성질을 활용합니다.
          </p>
        </div>
      </div>

      {/* Bonus Tasks (가점 보너스 과제 3개) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-400" />
          <span>보너스 과제 (추가 가점 항목 3가지)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MISSION_SUMMARY.bonuses.map((b) => (
            <div key={b.num} className="bg-slate-950 p-4 rounded-2xl border border-amber-500/20 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  보너스 {b.num}
                </span>
                <div className="text-sm font-bold text-white mt-2 mb-1">{b.title}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
