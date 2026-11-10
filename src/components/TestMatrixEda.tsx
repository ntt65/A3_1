import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  Filter,
  Split,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { TEST_CASES_20 } from '../data/missionData';
import { TestCase } from '../types/scanner';

interface Props {
  onSelectCaseForSimulator?: (tc: TestCase) => void;
}

export const TestMatrixEda: React.FC<Props> = ({ onSelectCaseForSimulator }) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<TestCase>(TEST_CASES_20[6]); // TC-07 (representative shadow failure)

  // Filtered list
  const filteredCases = filterCategory === 'all'
    ? TEST_CASES_20
    : TEST_CASES_20.filter((c) => c.category === filterCategory);

  // Statistics
  const total = TEST_CASES_20.length;
  const successCount = TEST_CASES_20.filter((c) => c.expectedSuccess).length;
  const failCount = total - successCount;
  const successRate = ((successCount / total) * 100).toFixed(1);

  const statsByCategory = [
    { cat: '단순 배경 + 정면', total: 5, success: 5, fail: 0, rate: '100%' },
    { cat: '그림자 있음', total: 5, success: 3, fail: 2, rate: '60%' },
    { cat: '45도 이상 기울어짐', total: 5, success: 4, fail: 1, rate: '80%' },
    { cat: '복잡한 배경', total: 5, success: 3, fail: 2, rate: '60%' },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Quantitative Performance Evaluation Summary Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                정량적 평가 보고서 (Quantitative Evaluation)
              </span>
              <span className="text-xs text-slate-400">PDF 보고서 필수 제출 1번 항목</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">20장 테스트셋 검출 성공률 요약표</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">총 테스트</div>
              <div className="text-lg font-bold text-white">{total}장</div>
            </div>
            <div className="px-4 py-2 bg-slate-950 rounded-2xl border border-emerald-500/30 text-center">
              <div className="text-[10px] text-emerald-400">검출 성공</div>
              <div className="text-lg font-bold text-emerald-400">{successCount}장</div>
            </div>
            <div className="px-4 py-2 bg-slate-950 rounded-2xl border border-rose-500/30 text-center">
              <div className="text-[10px] text-rose-400">검출 실패</div>
              <div className="text-lg font-bold text-rose-400">{failCount}장</div>
            </div>
            <div className="px-4 py-2 bg-indigo-950/60 rounded-2xl border border-indigo-500/40 text-center">
              <div className="text-[10px] text-indigo-300">종합 성공률</div>
              <div className="text-lg font-bold text-indigo-400">{successRate}%</div>
            </div>
          </div>
        </div>

        {/* Condition Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-4 font-semibold">조건 (Condition)</th>
                <th className="py-3 px-4 font-semibold text-center">테스트 수</th>
                <th className="py-3 px-4 font-semibold text-center">성공 (Success)</th>
                <th className="py-3 px-4 font-semibold text-center">실패 (Failure)</th>
                <th className="py-3 px-4 font-semibold text-center">성공률 (%)</th>
                <th className="py-3 px-4 font-semibold">비고 및 주요 원인</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {statsByCategory.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    {s.cat}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{s.total}</td>
                  <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">{s.success}</td>
                  <td className="py-3 px-4 text-center font-mono text-rose-400 font-bold">{s.fail}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full font-bold font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {s.rate}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {idx === 0 && '모든 A4, 영수증, 명함의 4꼭짓점 완벽 검출'}
                    {idx === 1 && '강한 그림자 경계선이 엣지로 오인되어 윤곽선 왜곡 (TC-07, TC-10)'}
                    {idx === 2 && '종횡비 보정 성공, 책등 3D 곡면 왜곡 케이스 실패 (TC-14)'}
                    {idx === 3 && '키보드 격자 고주파 노이즈 및 볼펜 가림으로 인한 오검출 (TC-17, TC-18)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. EDA (Exploratory Data Analysis): Pixel Histogram & Theory */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <span>이미지 탐색적 분석 (EDA): 픽셀 히스토그램과 엣지 검출 원리</span>
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          PDF 미션 요구사항 2번: "왜 어두운 이미지에서 엣지 검출이 어려운지 밝기 분포 관점에서 설명한다."
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Easy Case Histogram */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400">쉬운 케이스 (단순 배경 + 균일 조명)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">이봉형 (Bimodal)</span>
            </div>
            <div className="h-28 flex items-end gap-1 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 my-3">
              {/* Simulated Bimodal Curve */}
              {Array.from({ length: 32 }).map((_, i) => {
                let h = 5;
                if (i >= 3 && i <= 8) h = 20 + Math.sin((i - 3) * 0.6) * 60; // Dark background peak
                if (i >= 22 && i <= 28) h = 30 + Math.sin((i - 22) * 0.6) * 65; // Bright paper peak
                return (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="flex-1 bg-emerald-500/80 rounded-t-sm"
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-3">
              <span>0 (어두운 배경 픽셀: 30~70)</span>
              <span>128 (경계 계곡)</span>
              <span>255 (밝은 종이 픽셀: 210~250)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>분포 특성:</strong> 배경(어두움)과 종이(밝음)가 명확한 두 개의 봉우리로 분리됩니다.
              두 영역 사이의 픽셀값 차이(Gradient: $|I_x| + |I_y|$)가 150 이상으로 매우 커서, Canny 엣지 검출기가 문서 테두리를 오차 없이 연속된 선으로 검출할 수 있습니다.
            </p>
          </div>

          {/* Hard / Dark Case Histogram */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-400">어려운 케이스 (그림자 / 저조도 환경)</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono">단봉형 (Unimodal / 좁은 편향)</span>
            </div>
            <div className="h-28 flex items-end gap-1 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 my-3">
              {/* Simulated Unimodal Narrow Curve */}
              {Array.from({ length: 32 }).map((_, i) => {
                let h = 5;
                if (i >= 7 && i <= 15) h = 15 + Math.sin((i - 7) * 0.4) * 80; // Dense mid-dark peak
                return (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="flex-1 bg-rose-500/80 rounded-t-sm"
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-3">
              <span>0</span>
              <span>60~110 대역에 전 픽셀 밀집</span>
              <span>255</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>분포 관점의 실패 원인:</strong> 조도가 낮거나 그림자가 지면 종이와 배경 모두 60~110 사이의 좁은 밝기 대역에 몰립니다.
              경계면의 미분값(Gradient)이 20~30 이하로 감소하여 Canny Low 임계값 아래로 떨어지므로, 외곽선이 뚝뚝 끊어지는 <strong>비연결성(Discontinuity)</strong>이 발생하여 닫힌 사각형 검출에 실패합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Parameter Dilemma (파라미터 딜레마) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <Split className="w-5 h-5 text-amber-400" />
          <span>파라미터 딜레마 (The Parameter Dilemma)</span>
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          "모든 이미지에 적용 가능한 만능 최적 파라미터는 존재하는가?" 에 대한 정량적 분석
        </p>

        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-900 rounded-xl border border-indigo-500/20">
              <span className="font-bold text-indigo-400">이미지 A에 맞춘 설정 (Low=50, High=150)</span>
              <p className="text-slate-400 text-[11px] mt-1">
                대비가 뚜렷한 A4 문서(TC-01)는 잡음 없이 테두리만 깔끔하게 검출되지만,
                그림자가 드리운 저조도 문서(TC-10)에서는 엣지가 아예 인식되지 않아 사각형 실패.
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/20">
              <span className="font-bold text-amber-400">이미지 B에 맞춘 설정 (Low=15, High=50)</span>
              <p className="text-slate-400 text-[11px] mt-1">
                저조도 문서의 희미한 테두리는 잡았으나, 나뭇결 책상(TC-16)이나 잡동사니(TC-18)에 적용하면 수만 개의 배경 나뭇결이 전부 엣지로 폭발하여 문서 윤곽선이 파괴됨.
              </p>
            </div>
          </div>
          <p className="text-xs text-amber-300 pt-2 border-t border-slate-800">
            <strong>딜레마의 본질:</strong> 인간이 수동으로 고정하는 규칙 파라미터는 전역적(Global) 환경 변화에 적응하지 못합니다. 이것이 바로 로컬 컨텍스트와 물체 형태를 포괄적으로 학습하는 <strong>딥러닝(학습 기반 모델)</strong>이 필요한 이유입니다.
          </p>
        </div>
      </div>

      {/* 4. 20 Test Cases Interactive Explorer & Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">20장 테스트 케이스 상세 데이터베이스</h3>
            <p className="text-xs text-slate-400">각 케이스를 클릭하여 촬영 조건 및 실패 원인을 확인하고 시뮬레이터로 전송하세요.</p>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterCategory === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              전체 (20)
            </button>
            <button
              onClick={() => setFilterCategory('simple_front')}
              className={`px-3 py-1 rounded-lg transition ${
                filterCategory === 'simple_front' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              정면 (5)
            </button>
            <button
              onClick={() => setFilterCategory('shadow')}
              className={`px-3 py-1 rounded-lg transition ${
                filterCategory === 'shadow' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              그림자 (5)
            </button>
            <button
              onClick={() => setFilterCategory('angled')}
              className={`px-3 py-1 rounded-lg transition ${
                filterCategory === 'angled' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              기울어짐 (5)
            </button>
            <button
              onClick={() => setFilterCategory('complex_bg')}
              className={`px-3 py-1 rounded-lg transition ${
                filterCategory === 'complex_bg' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              복잡 배경 (5)
            </button>
          </div>
        </div>

        {/* Selected Case Detail Card */}
        {selectedCase && (
          <div className="p-5 bg-slate-950 rounded-2xl border border-indigo-500/30 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-indigo-400">{selectedCase.id.toUpperCase()}</span>
                <span className="text-white font-bold text-sm">{selectedCase.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                  {selectedCase.categoryLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedCase.expectedSuccess ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 검출 성공 (Success)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 text-xs font-bold bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                    <XCircle className="w-3.5 h-3.5" /> 검출 실패 (Failure)
                  </span>
                )}
                {onSelectCaseForSimulator && (
                  <button
                    onClick={() => onSelectCaseForSimulator(selectedCase)}
                    className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition"
                  >
                    <Sparkles className="w-3 h-3" /> 시뮬레이터에서 시험하기
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4">{selectedCase.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500">조명 상태</div>
                <div className="font-semibold text-slate-200 mt-0.5">{selectedCase.illumination}</div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500">촬영 각도</div>
                <div className="font-semibold text-slate-200 mt-0.5">{selectedCase.angle}</div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500">배경 복잡도</div>
                <div className="font-semibold text-slate-200 mt-0.5">{selectedCase.backgroundComplexity}</div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500">난이도</div>
                <div className="font-semibold text-slate-200 mt-0.5">{selectedCase.difficulty}</div>
              </div>
            </div>

            {selectedCase.failureReason && (
              <div className="mt-3 p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                <strong>실패 원인 분석 (보고서 요구사항):</strong> {selectedCase.failureReason}
              </div>
            )}
          </div>
        )}

        {/* 20 List table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {filteredCases.map((tc) => {
            const isCurrent = selectedCase?.id === tc.id;
            return (
              <button
                key={tc.id}
                onClick={() => setSelectedCase(tc)}
                className={`p-3 rounded-2xl text-left border transition flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                    : 'bg-slate-950 hover:bg-slate-800/60 border-slate-800/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-indigo-400">{tc.id.toUpperCase()}</span>
                    {tc.expectedSuccess ? (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> 성공
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-0.5">
                        <XCircle className="w-3 h-3" /> 실패
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-white line-clamp-1">{tc.name.split(':')[1]}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{tc.description}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{tc.illumination}</span>
                  <span>{tc.angle}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
