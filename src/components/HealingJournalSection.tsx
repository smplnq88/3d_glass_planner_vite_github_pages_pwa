/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Sparkles, 
  BookOpen, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  Lightbulb, 
  Smile, 
  Coffee, 
  CloudRain, 
  Sun, 
  Leaf,
  Send,
  Zap,
  Info
} from 'lucide-react';
import { Todo, JournalEntry, MoodType, AIDiagnosisData, AIDiagnosisSuggestion } from '../types';

interface HealingJournalSectionProps {
  todos: Todo[];
  onAddTodoFromAI: (suggestion: {
    title: string;
    description: string;
    category: any;
    priority: any;
    dueDateOffset: number;
    subtasks: string[];
  }) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  theme?: string;
}

const JOURNAL_STORAGE_KEY = '3d_glass_planner_journal_entries';

const MOOD_OPTIONS: Array<{ key: MoodType; label: string; icon: string; color: string; desc: string }> = [
  { key: 'great', label: '활기참', icon: '✨', color: 'border-amber-400 bg-amber-50/50 text-amber-900 dark:text-amber-300', desc: '에너지와 활력이 넘쳐요' },
  { key: 'good', label: '행복함', icon: '😊', color: 'border-emerald-400 bg-emerald-50/50 text-emerald-900 dark:text-emerald-300', desc: '만족스럽고 기분 좋아요' },
  { key: 'calm', label: '차분함', icon: '🌿', color: 'border-teal-400 bg-teal-50/50 text-teal-900 dark:text-teal-300', desc: '평온하고 안정적이에요' },
  { key: 'tired', label: '피로함', icon: '☕', color: 'border-blue-400 bg-blue-50/50 text-blue-900 dark:text-blue-300', desc: '휴식이 조금 필요해요' },
  { key: 'stressed', label: '부담됨', icon: '🌧️', color: 'border-rose-400 bg-rose-50/50 text-rose-900 dark:text-rose-300', desc: '할 일이 많아 벅차요' },
];

export const HealingJournalSection: React.FC<HealingJournalSectionProps> = ({
  todos,
  onAddTodoFromAI,
  showToast,
  theme = 'light'
}) => {
  const [activeTab, setActiveTab] = useState<'journal' | 'diagnosis'>('journal');

  // Journal States
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load journals:', e);
    }
    return [
      {
        id: 'initial-journal-1',
        date: new Date().toISOString().split('T')[0],
        mood: 'calm',
        gratitude: '오늘 하루도 차근차근 계획대로 소화할 수 있어 감사한 마음입니다.',
        content: '마음이 조급할 때는 잠시 숨을 고르고 가장 중요한 일부터 하나씩 해결해 나가려고 합니다. 나만의 속도로 성장하는 중!',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [currentMood, setCurrentMood] = useState<MoodType>('calm');
  const [gratitudeText, setGratitudeText] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // AI Diagnosis States
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<AIDiagnosisData | null>(null);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  // Save entries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save journals:', e);
    }
  }, [entries]);

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalContent.trim() && !gratitudeText.trim()) {
      showToast('감사한 일이나 오늘 하루 일기 내용을 작성해 주세요.', 'info');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newEntry: JournalEntry = {
      id: 'journal-' + Date.now(),
      date: todayStr,
      mood: currentMood,
      gratitude: gratitudeText.trim() || undefined,
      content: journalContent.trim(),
      createdAt: new Date().toISOString()
    };

    setEntries([newEntry, ...entries]);
    setGratitudeText('');
    setJournalContent('');
    setIsAddingNew(false);
    showToast('🌿 마음 힐링 저널이 안전하게 저장되었습니다!', 'success');
  };

  const handleDeleteJournal = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
    showToast('저널 기록이 삭제되었습니다.', 'info');
  };

  // Run AI / Local Heuristic Diagnosis
  const handleRunDiagnosis = async () => {
    setIsDiagnosing(true);
    showToast('🤖 AI 모델이 일정 균형 및 생산성을 정밀 진단 중입니다...', 'info');

    try {
      // 1. Attempt server AI API call
      const res = await fetch('/api/planner/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todos })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.analysis) {
          setDiagnosisResult({
            feedback: data.analysis.feedback || '전반적으로 균형 있게 일정이 수립되어 있습니다.',
            tips: data.analysis.tips || [],
            suggestions: data.analysis.suggestions || [],
            analyzedAt: new Date().toLocaleTimeString(),
            isOfflineFallback: false
          });
          showToast('✨ Gemini AI 정밀 진단 보고서가 도착했습니다!', 'success');
          setIsDiagnosing(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Online AI diagnosis fallback triggered:', e);
    }

    // 2. Offline / Heuristic Fallback Algorithm (Ensures 100% reliable UX even without internet/API keys!)
    setTimeout(() => {
      const totalCount = todos.length;
      const completedCount = todos.filter(t => t.completed).length;
      const activeTodos = todos.filter(t => !t.completed);
      const highPriorityCount = activeTodos.filter(t => t.priority === 'high').length;
      const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      let feedback = '';
      if (totalCount === 0) {
        feedback = '현재 등록된 일정이 없습니다. 오늘 꼭 이루고 싶은 핵심 목표 1~2가지를 가볍게 추가해 하루를 시작해 보세요!';
      } else if (completionRate >= 70) {
        feedback = `전체 ${totalCount}개 일정 중 ${completedCount}개(${completionRate}%)를 완수하셨습니다! 뛰어난 집중력과 실행력을 보여주고 계시며, 저녁 시간대에는 충분한 휴식을 추천합니다.`;
      } else if (highPriorityCount >= 3) {
        feedback = `현재 긴급/중요도가 높은 일정이 ${highPriorityCount}개로 다소 집중되어 있습니다. 오전 시간대에 가장 무거운 과제를 1개 끝내고, 나머지는 내일로 분산 배치하여 피로도를 낮춰보세요.`;
      } else {
        feedback = `총 ${activeTodos.length}개의 진행 중인 일정이 잘 정돈되어 있습니다. 서두르지 않고 우선순위 순서대로 하나씩 완료 체크를 해 나가시면 높은 성취감을 얻을 수 있습니다.`;
      }

      const generatedTips = [
        {
          title: '25분 집중 + 5분 이완 (뽀모도로)',
          description: '높은 집중력이 필요한 작업은 25분간 몰입한 뒤 5분간 가볍게 스트레칭을 병행하면 뇌의 피로를 예방할 수 있습니다.'
        },
        {
          title: '하루 3대 핵심 과제 (Rule of 3)',
          description: '모든 일을 오늘 다 하려 하기보다, 오늘 반드시 끝낼 가장 가치 있는 3가지 작업에 마크를 찍고 먼저 해결하세요.'
        }
      ];

      const generatedSuggestions: AIDiagnosisSuggestion[] = [];
      if (activeTodos.some(t => t.category === 'Work')) {
        generatedSuggestions.push({
          title: '업무 중간 10분 마인드 리셋 & 눈 스트레칭',
          description: '장시간 모니터 응시로 인한 피로를 덜기 위한 가벼운 이완 시간',
          category: 'Health',
          priority: 'medium',
          dueDateOffset: 0,
          subtasks: ['인공눈물 넣기', '먼 산 바라보며 심호흡 5회']
        });
      }
      generatedSuggestions.push({
        title: '내일 아침을 위한 5분 데스크 정리 & 일정 프리뷰',
        description: '하루를 마감하며 내일 할 일을 3줄로 미리 훑어보는 습관',
        category: 'Personal',
        priority: 'low',
        dueDateOffset: 1,
        subtasks: ['책상 위 컵 정리', '내일 1순위 할 일 캘린더 확인']
      });

      setDiagnosisResult({
        feedback,
        tips: generatedTips,
        suggestions: generatedSuggestions,
        analyzedAt: new Date().toLocaleTimeString(),
        isOfflineFallback: true
      });

      showToast('💡 로컬 정밀 진단 분석이 완료되었습니다.', 'success');
      setIsDiagnosing(false);
    }, 600);
  };

  return (
    <div className="w-full mt-4 flex flex-col gap-5 text-left" id="healing-journal-container">
      {/* Tab Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-white/60 dark:bg-slate-850/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'journal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Heart size={14} className={activeTab === 'journal' ? 'fill-current' : 'text-rose-500'} />
            <span>🌿 마음 힐링 저널</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'journal' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {entries.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diagnosis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'diagnosis'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'diagnosis' ? 'fill-current text-amber-300' : 'text-amber-500'} />
            <span>⚡ AI 일정 정밀 진단</span>
          </button>
        </div>

        {/* Info & Config Trigger */}
        <button
          type="button"
          onClick={() => setShowConfigHelp(!showConfigHelp)}
          className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Info size={13} />
          <span>AI 및 오프라인 동작 안내</span>
        </button>
      </div>

      {/* Guide & Configuration Help Banner */}
      <AnimatePresence>
        {showConfigHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-slate-800 dark:text-slate-200 text-xs space-y-2 overflow-hidden shadow-xs"
          >
            <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-400">
              <Sparkles size={16} />
              <span>AI 정밀 진단 및 마음 힐링 저널 작동 가이드</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11.5px] leading-relaxed">
              <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                <p className="font-bold text-slate-900 dark:text-white mb-1">🌿 마음 힐링 저널 (100% 로컬 영구 보존)</p>
                <p className="text-slate-600 dark:text-slate-400">
                  인터넷 연결 없이도 내 브라우저(localStorage)에 안전하게 저장됩니다. JSON 백업 시 저널 데이터도 함께 안전하게 보관됩니다.
                </p>
              </div>
              <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                <p className="font-bold text-slate-900 dark:text-white mb-1">⚡ AI 정밀 진단 & 환경 설정 안내</p>
                <p className="text-slate-600 dark:text-slate-400">
                  - <strong>인터넷 연결</strong>: Gemini 클라우드 AI 모델과 통신 시 인터넷 연결이 필요합니다.<br />
                  - <strong>필요 설정</strong>: AI Studio 환경에서는 <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">GEMINI_API_KEY</code>가 자동 주입되며, 오프라인 상태에서도 자체 로컬 분석 엔진으로 안전하게 즉각 전환됩니다!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. 🌿 마음 힐링 저널 (Mind Healing Journal View) */}
      {activeTab === 'journal' && (
        <div className="flex flex-col gap-4">
          {/* New Journal Entry Form / Toggle Button */}
          {!isAddingNew ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-white/70 dark:from-slate-850 dark:via-slate-850 dark:to-slate-900 border border-emerald-300/60 dark:border-emerald-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                  <Heart size={20} className="fill-current" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">오늘의 마음 기분과 감사한 일 기록하기</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    바쁜 하루 속에서 잠시 멈추고 내 마음에 따뜻한 위로와 응원을 남겨보세요.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Plus size={14} className="stroke-[3]" />
                <span>오늘의 저널 작성</span>
              </button>
            </div>
          ) : (
            <motion.form
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleSaveJournal}
              className="p-5 rounded-2xl bg-white/90 dark:bg-slate-850/90 border border-emerald-400/80 dark:border-emerald-600/70 shadow-lg backdrop-blur-md space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
                <div className="flex items-center gap-2">
                  <Leaf className="text-emerald-600 dark:text-emerald-400" size={18} />
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">오늘의 마음 힐링 저널 작성</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  취소
                </button>
              </div>

              {/* Mood Selector Chips */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-2">
                  오늘 나의 기분 / 감정 상태
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {MOOD_OPTIONS.map((mood) => {
                    const isSelected = currentMood === mood.key;
                    return (
                      <button
                        key={mood.key}
                        type="button"
                        onClick={() => setCurrentMood(mood.key)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-lg">{mood.icon}</span>
                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">{mood.label}</span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-none">{mood.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gratitude Line */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <span>✨ 오늘 감사했던 순간 (하루 한 줄 감사)</span>
                </label>
                <input
                  type="text"
                  value={gratitudeText}
                  onChange={(e) => setGratitudeText(e.target.value)}
                  placeholder="예: 따뜻한 커피 한 잔의 여유를 즐길 수 있어 감사했다."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Freeform Journal Thoughts */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                  🌿 오늘 하루 생각 & 성찰 노트
                </label>
                <textarea
                  rows={3}
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="오늘 있었던 일, 스스로에게 건네고 싶은 응원의 말, 떠오른 생각들을 편안하게 적어보세요..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Send size={13} />
                  <span>저널 기록 저장하기</span>
                </button>
              </div>
            </motion.form>
          )}

          {/* Journal Entries History List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h5 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>나의 마음 힐링 저널 기록함 ({entries.length}개)</span>
              </h5>
            </div>

            {entries.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 text-xs">
                아직 작성된 저널이 없습니다. 상단의 '오늘의 저널 작성' 버튼을 눌러 첫 감사 일기를 남겨보세요!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {entries.map((entry) => {
                  const moodInfo = MOOD_OPTIONS.find(m => m.key === entry.mood) || MOOD_OPTIONS[2];
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-white/80 dark:bg-slate-850/80 border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex flex-col justify-between gap-3 relative group"
                    >
                      <div className="space-y-2">
                        {/* Header: Date + Mood Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{moodInfo.icon}</span>
                            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                              {entry.date}
                            </span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${moodInfo.color}`}>
                              {moodInfo.label}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteJournal(entry.id)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                            title="저널 삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Gratitude Line */}
                        {entry.gratitude && (
                          <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-[11px] text-amber-900 dark:text-amber-300 font-bold flex items-start gap-1.5">
                            <Sparkles size={13} className="shrink-0 text-amber-500 mt-0.5" />
                            <span>{entry.gratitude}</span>
                          </div>
                        )}

                        {/* Content */}
                        {entry.content && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                            {entry.content}
                          </p>
                        )}
                      </div>

                      <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
                        <span>기록됨: {new Date(entry.createdAt).toLocaleDateString()}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% 로컬 보관</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ⚡ AI 일정 정밀 진단 (AI Productivity & Workload Diagnosis View) */}
      {activeTab === 'diagnosis' && (
        <div className="flex flex-col gap-4">
          {/* Action Trigger Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-650 to-emerald-700 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
                  Gemini AI Workload Intelligence
                </span>
                <span className="text-[10px] text-emerald-200">
                  총 {todos.length}개 일정 감지됨
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black">
                현재 등록된 일정 전체를 종합 진단받아 보세요
              </h4>
              <p className="text-xs text-emerald-100 max-w-md leading-relaxed">
                마감 기한 분포, 우선순위 조율 상태, 번아웃 예방 및 추천 연계 일정을 AI가 분석해 드립니다.
              </p>
            </div>

            <button
              type="button"
              disabled={isDiagnosing}
              onClick={handleRunDiagnosis}
              className="relative z-10 px-5 py-3 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-black shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0 disabled:opacity-50"
            >
              {isDiagnosing ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-emerald-600" />
                  <span>AI 분석 진행 중...</span>
                </>
              ) : (
                <>
                  <Zap size={14} className="fill-current text-amber-500" />
                  <span>⚡ AI 정밀 진단 시작하기</span>
                </>
              )}
            </button>
          </div>

          {/* Diagnosis Results Display */}
          {diagnosisResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Status Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <span>진단 완료 시각: {diagnosisResult.analyzedAt}</span>
                  {diagnosisResult.isOfflineFallback ? (
                    <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full text-[9.5px]">
                      로컬 오프라인 휴리스틱 엔진
                    </span>
                  ) : (
                    <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[9.5px]">
                      Gemini 클라우드 AI 정밀 모델
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleRunDiagnosis}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={11} />
                  <span>다시 진단</span>
                </button>
              </div>

              {/* 1. 종합 피드백 카드 */}
              <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-850/90 border border-emerald-300/80 dark:border-emerald-700/70 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-black text-xs">
                  <TrendingUp size={15} />
                  <span>📊 일정 분석 및 워크로드 피드백</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {diagnosisResult.feedback}
                </p>
              </div>

              {/* 2. 관리 팁 카드 2개 */}
              {diagnosisResult.tips && diagnosisResult.tips.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {diagnosisResult.tips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                        <Lightbulb size={14} className="text-amber-500 shrink-0" />
                        <span>{tip.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {tip.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. 추천 연계 일정 카드 (원클릭 추가 지원) */}
              {diagnosisResult.suggestions && diagnosisResult.suggestions.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-850/70 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-500" />
                      <h5 className="text-xs font-black text-slate-900 dark:text-white">
                        🎯 AI 추천 스마트 연계 일정 (원클릭 추가)
                      </h5>
                    </div>
                    <span className="text-[10px] text-slate-500">클릭 즉시 플래너 보드에 등록됩니다</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {diagnosisResult.suggestions.map((sug, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-2.5"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {sug.category}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">
                              {sug.dueDateOffset === 0 ? '오늘 추천' : `${sug.dueDateOffset}일 후 기한`}
                            </span>
                          </div>
                          <h6 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                            {sug.title}
                          </h6>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                            {sug.description}
                          </p>

                          {/* Subtasks preview */}
                          {sug.subtasks && sug.subtasks.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {sug.subtasks.map((st, sIdx) => (
                                <div key={sIdx} className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1 font-mono">
                                  <span className="text-emerald-500">▪</span>
                                  <span>{st}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onAddTodoFromAI(sug);
                            showToast(`🎯 '${sug.title}' 일정이 플래너에 추가되었습니다!`, 'success');
                          }}
                          className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <Plus size={12} className="stroke-[3]" />
                          <span>+ 내 플래너에 바로 추가</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
