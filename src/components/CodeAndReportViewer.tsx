import React, { useState } from 'react';
import {
  Code,
  FileText,
  Copy,
  Download,
  Check,
  Terminal,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react';
import { PYTHON_SCANNER_CODE, REPORT_MARKDOWN } from '../data/missionData';

export const CodeAndReportViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'code' | 'report'>('code');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  const handleCopy = (type: 'code' | 'report') => {
    if (type === 'code') {
      navigator.clipboard.writeText(PYTHON_SCANNER_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      navigator.clipboard.writeText(REPORT_MARKDOWN);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  const handleDownload = (type: 'code' | 'report') => {
    const filename = type === 'code' ? 'document_scanner.py' : 'scanner_analysis_report.md';
    const content = type === 'code' ? PYTHON_SCANNER_CODE : REPORT_MARKDOWN;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                제출 산출물 템플릿
              </span>
              <span className="text-xs text-slate-400">PDF 과제 규격 100% 만족 코드 및 분석서</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Python 소스코드 & 정량 분석 보고서 생성기
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'code' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Python 코드 (.py)</span>
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'report' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>분석 보고서 (.md)</span>
              </button>
            </div>

            <button
              onClick={() => handleCopy(activeTab)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              {(activeTab === 'code' ? copiedCode : copiedReport) ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>전체 복사</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleDownload(activeTab)}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>파일 다운로드</span>
            </button>
          </div>
        </div>

        {/* Python Code View */}
        {activeTab === 'code' && (
          <div className="pt-4 space-y-4">
            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 bg-slate-950 text-slate-300 rounded-lg border border-slate-800 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> OpenCV Trackbar GUI 내장
              </span>
              <span className="px-2.5 py-1 bg-slate-950 text-slate-300 rounded-lg border border-slate-800 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> 순수 NumPy 4점 기하 정렬 (scipy 금지 준수)
              </span>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-lg border border-amber-500/20 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" /> 보너스 1: 가우시안 컨볼루션 직접 구현 (Loop vs Vectorized)
              </span>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-lg border border-amber-500/20 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" /> 보너스 2: 종횡비 유클리드 거리 자동 계산
              </span>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-lg border border-amber-500/20 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" /> 보너스 3: PDF 파일 내보내기 내장
              </span>
            </div>

            {/* Code Block Container */}
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-xs">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold text-slate-200">document_scanner.py</span>
                </div>
                <span>Python 3.8+ (OpenCV, NumPy, Pillow)</span>
              </div>
              <pre className="p-4 text-slate-300 overflow-x-auto max-h-[600px] leading-relaxed custom-scrollbar selection:bg-indigo-500 selection:text-white">
                <code>{PYTHON_SCANNER_CODE}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Report Markdown View */}
        {activeTab === 'report' && (
          <div className="pt-4 space-y-4">
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>
                  미션 PDF 보고서 요구사항(1. 테스트 결과 요약표, 2. 실패 원인 분석, 3. 파라미터 딜레마, 4. 규칙 기반 한계, 5. 학습 기반 필요성)이 완벽하게 정리된 보고서입니다.
                </span>
              </div>
            </div>

            {/* Markdown Preview Area */}
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-6 max-h-[600px] overflow-y-auto custom-scrollbar text-slate-200 space-y-4 text-xs leading-relaxed">
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-xs bg-transparent p-0 text-slate-300">
                  {REPORT_MARKDOWN}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
