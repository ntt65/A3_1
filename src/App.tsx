import React, { useState } from 'react';
import {
  Scan,
  BookOpen,
  BarChart3,
  Code2,
  FileText,
  Sliders,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { PipelineSimulator } from './components/PipelineSimulator';
import { MissionBriefing } from './components/MissionBriefing';
import { TestMatrixEda } from './components/TestMatrixEda';
import { CodeAndReportViewer } from './components/CodeAndReportViewer';
import { TestCase } from './types/scanner';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'briefing' | 'matrix' | 'code'>(
    'simulator'
  );
  const [simulatorSelectedCase, setSimulatorSelectedCase] = useState<TestCase | undefined>();

  const handleSelectCaseFromMatrix = (tc: TestCase) => {
    setSimulatorSelectedCase(tc);
    setActiveTab('simulator');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  OpenCV 문서 스캐너
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  AI/SW 심화 미션
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden md:block">
                휴대폰으로 찍은 종이를 똑바르게 펴서 스캔하게 만들기 (Computer Vision)
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
                activeTab === 'simulator'
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>파이프라인 시뮬레이터</span>
            </button>
            <button
              onClick={() => setActiveTab('briefing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
                activeTab === 'briefing'
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>미션 요구사항 분석</span>
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>20장 테스트 & EDA</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>코드 & 분석 보고서</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'simulator' && (
          <PipelineSimulator
            selectedTestCase={simulatorSelectedCase}
            onSelectTestCase={(tc) => setSimulatorSelectedCase(tc)}
          />
        )}

        {activeTab === 'briefing' && <MissionBriefing />}

        {activeTab === 'matrix' && (
          <TestMatrixEda onSelectCaseForSimulator={handleSelectCaseFromMatrix} />
        )}

        {activeTab === 'code' && <CodeAndReportViewer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI/SW 심화 - 컴퓨터 비전 필수 과제 인터랙티브 러닝 & 분석 플랫폼</span>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 순수 NumPy 4점 기하 연산
            </span>
            <span>•</span>
            <span>OpenCV 5단계 윈도우 파이프라인</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
