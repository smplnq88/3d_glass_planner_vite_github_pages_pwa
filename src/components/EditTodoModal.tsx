/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Todo, Category, Priority, SubTodo, AlarmRepeatType, AlarmSoundType } from '../types';
import { playAlarmSound } from '../lib/alarmAudio';
import { 
  X,
  Calendar, 
  Briefcase, 
  User, 
  ShoppingCart, 
  Palette, 
  Activity, 
  Plus,
  Trash2,
  Bell,
  CalendarCheck,
  Clock,
  Sparkles,
  Mic,
  MicOff,
  Check
} from 'lucide-react';

interface EditTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  todo: Todo | null;
  onEditTodo: (todoId: string, updatedData: any) => void;
}

export default function EditTodoModal({ isOpen, onClose, todo, onEditTodo }: EditTodoModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Exclude<Category, 'All'>>('Work');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  
  // Alarm states
  const [alarmTime, setAlarmTime] = useState('');
  const [isAlarmConfirmed, setIsAlarmConfirmed] = useState(false);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [tempAlarmDate, setTempAlarmDate] = useState('');
  const [tempAlarmTime, setTempAlarmTime] = useState('09:00');
  const [alarmRepeat, setAlarmRepeat] = useState<AlarmRepeatType>('none');
  const [alarmRepeatDays, setAlarmRepeatDays] = useState<number[]>([]);
  const [alarmRepeatInterval, setAlarmRepeatInterval] = useState<number>(30); // Default to 30
  const [isMonthlyDayPickerConfirmed, setIsMonthlyDayPickerConfirmed] = useState(false);
  const [alarmSound, setAlarmSound] = useState<AlarmSoundType>('zen_bell');
  
  // Subtasks list for current task
  const [subtasks, setSubtasks] = useState<SubTodo[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Speech to text states for input dictation
  const [isTitleListening, setIsTitleListening] = useState(false);
  const [isDescListening, setIsDescListening] = useState(false);
  const titleRecognitionRef = useRef<any>(null);
  const descRecognitionRef = useRef<any>(null);

  const toggleTitleSpeech = () => {
    if (isTitleListening) {
      if (titleRecognitionRef.current) {
        titleRecognitionRef.current.stop();
      }
      setIsTitleListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 이나 Safari 브라우저를 이용해 주세요.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'ko-KR';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      titleRecognitionRef.current = rec;

      rec.onstart = () => {
        setIsTitleListening(true);
      };

      rec.onerror = (e: any) => {
        console.error('Title speech recognition error:', e);
        setIsTitleListening(false);
      };

      rec.onend = () => {
        setIsTitleListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setTitle((prev) => prev ? prev + ' ' + transcript : transcript);
        }
      };

      rec.start();
    } catch (err) {
      console.error(err);
      setIsTitleListening(false);
    }
  };

  const toggleDescSpeech = () => {
    if (isDescListening) {
      if (descRecognitionRef.current) {
        descRecognitionRef.current.stop();
      }
      setIsDescListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 이나 Safari 브라우저를 이용해 주세요.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'ko-KR';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      descRecognitionRef.current = rec;

      rec.onstart = () => {
        setIsDescListening(true);
      };

      rec.onerror = (e: any) => {
        console.error('Description speech recognition error:', e);
        setIsDescListening(false);
      };

      rec.onend = () => {
        setIsDescListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setDescription((prev) => prev ? prev + ' ' + transcript : transcript);
        }
      };

      rec.start();
    } catch (err) {
      console.error(err);
      setIsDescListening(false);
    }
  };

  // Dynamic time calculations for custom alarm dropdowns
  const { alarmAmpm, alarmHour12, alarmMinute } = (() => {
    const parts = (tempAlarmTime || '09:00').split(':');
    const h = parseInt(parts[0] || '9', 10);
    const m = parseInt(parts[1] || '0', 10);
    const ampmVal = h >= 12 ? 'PM' : 'AM';
    const hour12Val = h % 12 === 0 ? 12 : h % 12;
    return { alarmAmpm: ampmVal, alarmHour12: hour12Val, alarmMinute: m };
  })();

  const handleCustomTimeChange = (newAmpm: string, h12: number, min: number) => {
    let h24 = h12;
    if (newAmpm === 'PM' && h12 < 12) h24 = h12 + 12;
    if (newAmpm === 'AM' && h12 === 12) h24 = 0;
    const formatted = `${h24.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    setTempAlarmTime(formatted);
  };

  const alarmInputRef = useRef<HTMLInputElement>(null);

  // Load todo fields when opened
  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setCategory(todo.category);
      setPriority(todo.priority);
      setDueDate(todo.dueDate || '');
      setAlarmTime(todo.alarmTime || '');
      setIsAlarmConfirmed(!!todo.alarmTime);
      setAlarmRepeat(todo.alarmRepeat || 'none');
      setAlarmRepeatDays(todo.alarmRepeatDays || []);
      setAlarmRepeatInterval(todo.alarmRepeatInterval || 30);
      setIsMonthlyDayPickerConfirmed(todo.alarmRepeat === 'monthly_day');
      setAlarmSound(todo.alarmSound || 'zen_bell');
      setSubtasks(todo.subtasks || []);
    }
  }, [todo, isOpen]);

  const categoryIcons: Record<Exclude<Category, 'All'>, any> = {
    Work: Briefcase,
    Personal: User,
    Shopping: ShoppingCart,
    Creative: Palette,
    Health: Activity,
  };

  const categoryLabels: Record<Exclude<Category, 'All'>, string> = {
    Work: '업무',
    Personal: '개인',
    Shopping: '쇼핑',
    Creative: '크리에이티브',
    Health: '건강',
  };

  const handleAddSubtask = (e: FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;

    const newSub: SubTodo = {
      id: Math.random().toString(36).substring(2, 9),
      text: newSubtaskText.trim(),
      completed: false
    };

    setSubtasks([...subtasks, newSub]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(sub => sub.id !== id));
  };

  const handleConfirmAlarm = () => {
    const finalDate = tempAlarmDate || dueDate || new Date().toISOString().split('T')[0];
    const finalTime = tempAlarmTime || '09:00';
    setAlarmTime(`${finalDate}T${finalTime}`);
    setIsAlarmConfirmed(true);
    setIsAlarmModalOpen(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !todo) return;

    onEditTodo(todo.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      dueDate: dueDate || undefined,
      subtasks,
      alarmTime: alarmTime || undefined,
      alarmRepeat: alarmTime ? alarmRepeat : 'none',
      alarmRepeatDays: alarmTime && alarmRepeat === 'weekly' ? alarmRepeatDays : undefined,
      alarmRepeatInterval: alarmTime && (alarmRepeat === 'minute' || alarmRepeat === 'hour') ? alarmRepeatInterval : undefined,
      alarmSound: alarmTime ? alarmSound : undefined,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && todo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="edit-todo-overlay">
          {/* Backdrop screen */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/60 bg-white/80 p-6 sm:p-8 shadow-2xl z-10 backdrop-blur-xl"
            id="edit-todo-modal-card"
          >
            {/* Close trigger button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 cursor-pointer"
              id="edit-modal-close-x"
            >
              <X size={18} />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <Sparkles size={18} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-slate-900 font-display">일정 정보 수정</h3>
                <p className="text-xs text-slate-500 font-semibold">선택한 계획의 세부 옵션들을 유연하게 변경합니다</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              {/* Title input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold tracking-wider text-slate-655 uppercase">작업 제목</label>
                  <button
                    type="button"
                    onClick={toggleTitleSpeech}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer text-[11px] font-black tracking-wide ${
                      isTitleListening 
                        ? 'bg-rose-500 border-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:text-emerald-700'
                    }`}
                    title="음성 인식으로 제목 수정"
                  >
                    {isTitleListening ? (
                      <>
                        <MicOff size={13} className="animate-bounce" />
                        <span>듣는 중...</span>
                      </>
                    ) : (
                      <>
                        <Mic size={13} />
                        <span>음성 입력</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={isTitleListening ? "음성을 듣고 있어요. 말씀해 주세요..." : "예: 디자인 초안 완성하기..."}
                    className="w-full rounded-2xl border border-slate-200 bg-white/70 py-3 px-4 pr-4 text-slate-850 placeholder-slate-400 outline-none transition-all duration-300 focus:border-emerald-400 focus:bg-white focus:ring-1 focus:ring-emerald-500/10 shadow-sm text-xs"
                    id="edit-todo-input-title"
                  />
                </div>
              </div>

              {/* Description textarea */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold tracking-wider text-slate-655 uppercase">상세 설명 (선택)</label>
                  <button
                    type="button"
                    onClick={toggleDescSpeech}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer text-[11px] font-black tracking-wide ${
                      isDescListening 
                        ? 'bg-rose-500 border-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-105 hover:text-emerald-705'
                    }`}
                    title="음성 인식으로 세부 설명 수정"
                  >
                    {isDescListening ? (
                      <>
                        <MicOff size={13} className="animate-bounce" />
                        <span>듣는 중...</span>
                      </>
                    ) : (
                      <>
                        <Mic size={13} />
                        <span>음성 입력</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={isDescListening ? "음성을 듣고 있어요. 말씀해 주세요..." : "작업에 필수적인 참조 링크나 아이디어를 기록하세요..."}
                    className="w-full rounded-2xl border border-slate-205 bg-white/70 py-3 px-4 pr-12 text-slate-850 placeholder-slate-405 outline-none transition-all duration-300 focus:border-emerald-400 focus:bg-white focus:ring-1 focus:ring-emerald-550/10 min-h-[70px] shadow-sm text-xs"
                    id="edit-todo-input-desc"
                  />
                </div>
              </div>

              {/* Category, Priority & Due-Date grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Category selectors */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold tracking-wider text-slate-655 uppercase">분류 카테고리</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(['Work', 'Personal', 'Shopping', 'Creative', 'Health'] as const).map((cat) => {
                      const CatIcon = categoryIcons[cat];
                      const isSelected = category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all duration-300 select-none cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-450 scale-[1.02]'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                          id={`edit-catBtn-${cat}`}
                        >
                          <CatIcon size={12} className={isSelected ? 'text-emerald-600' : 'text-slate-400'} />
                          <span>{categoryLabels[cat]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority markers */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold tracking-wider text-slate-650 uppercase">중요도 우선순위</label>
                  <div className="flex gap-1.5">
                    {(['low', 'medium', 'high'] as Priority[]).map((pri) => {
                      const priLabels = { low: '낮음', medium: '보통', high: '높음' };
                      const priColors = {
                        low: 'hover:bg-emerald-50/20 text-emerald-700 bg-emerald-50/10 border-emerald-250',
                        medium: 'hover:bg-amber-50/20 text-amber-800 bg-amber-50/10 border-amber-250',
                        high: 'hover:bg-rose-50/20 text-rose-800 bg-rose-50/10 border-rose-250'
                      };
                      const priActiveColors = {
                        low: 'bg-emerald-500 border-transparent text-white shadow-emerald-500/10',
                        medium: 'bg-amber-500 border-transparent text-white shadow-amber-500/10',
                        high: 'bg-rose-500 border-transparent text-white shadow-rose-500/10'
                      };
                      const isSelected = priority === pri;
                      return (
                        <button
                          key={pri}
                          type="button"
                          onClick={() => setPriority(pri)}
                          className={`flex-1 rounded-xl border py-2 text-[11px] font-bold text-center transition-all duration-300 cursor-pointer shadow-sm ${
                            isSelected ? priActiveColors[pri] : priColors[pri]
                          }`}
                          id={`edit-priBtn-${pri}`}
                        >
                          {priLabels[pri]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Due Date row */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold tracking-wider text-slate-650 uppercase">마감 목표일 설정 (선택)</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/70 py-2.5 pl-10 pr-4 text-slate-850 outline-none transition-all duration-300 focus:border-emerald-400 focus:bg-white focus:ring-1 focus:ring-emerald-500/10 font-mono text-xs [color-scheme:light] shadow-sm"
                    id="edit-todo-input-duedate"
                  />
                </div>
              </div>

              {/* Alarm Config Settings panel */}
              <div className="flex flex-col gap-2.5 border-t border-slate-205/50 pt-4" id="edit-alarm-trigger-wrapper">
                <div className="grid grid-cols-1 gap-4" id="edit-alarm-calendar-wrapper">
                  {/* Alarm clock time input */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bell size={13} className="text-emerald-600" />
                        <label className="text-xs font-bold tracking-wider text-slate-650 uppercase">알람 시각 설정 (선택)</label>
                      </div>
                      {alarmTime && isAlarmConfirmed && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 animate-bounce">
                          ✓ 확정됨
                        </span>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (alarmTime) {
                          const parts = alarmTime.split('T');
                          setTempAlarmDate(parts[0] || '');
                          setTempAlarmTime(parts[1] || '09:00');
                        } else {
                          setTempAlarmDate(dueDate || new Date().toISOString().split('T')[0]);
                          setTempAlarmTime('09:00');
                        }
                        setIsAlarmModalOpen(true);
                      }}
                      className={`relative flex items-center justify-between w-full rounded-2xl border py-2.5 px-4 text-xs font-mono transition-all duration-300 outline-none text-left ${
                        alarmTime && isAlarmConfirmed
                          ? 'border-emerald-300 bg-emerald-50/50 text-emerald-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-300'
                      }`}
                      id="edit-todo-alarm-trigger-btn"
                    >
                      <span className="flex items-center gap-2">
                        <Clock size={14} className={alarmTime && isAlarmConfirmed ? 'text-emerald-500 font-bold' : 'text-slate-400'} />
                        {alarmTime && isAlarmConfirmed ? (
                          <span>{alarmTime.replace('T', ' ')}</span>
                        ) : (
                          <span className="text-slate-400 font-sans">설정하려면 탭하세요</span>
                        )}
                      </span>
                      <span className="text-[10px] uppercase font-bold py-1 px-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                        {alarmTime && isAlarmConfirmed ? '변경' : '설정'}
                      </span>
                    </button>

                    <AnimatePresence>
                      {isAlarmModalOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 shadow-2xl" id="edit-alarm-picker-overlay">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAlarmModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                          />
                          
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: 'spring', duration: 0.4 }}
                            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl z-10"
                            id="edit-alarm-picker-modal-card"
                          >
                            <button
                              type="button"
                              onClick={() => setIsAlarmModalOpen(false)}
                              className="absolute right-4.5 top-4.5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200"
                              id="edit-alarm-close-x"
                            >
                              <X size={16} />
                            </button>
                            
                            <div className="mb-4 flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <Bell size={16} className="animate-pulse" />
                              </div>
                              <div className="text-left">
                                <h4 className="text-sm font-bold text-slate-800">알람 시각 설정</h4>
                                <p className="text-[10px] text-slate-500 font-semibold">원하는 날짜와 정밀한 시각을 선택하세요</p>
                              </div>
                            </div>
                            
                            <div className="space-y-4 py-2 text-left">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <Calendar size={11} className="text-slate-400" />
                                  날짜 선택
                                </label>
                                <input
                                  type="date"
                                  value={tempAlarmDate}
                                  onChange={(e) => setTempAlarmDate(e.target.value)}
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-850 outline-none transition-all duration-300 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/10 font-mono text-sm [color-scheme:light]"
                                  id="edit-temp-alarm-date"
                                />
                              </div>
                              
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <Clock size={11} className="text-slate-400" />
                                  시각 선택 (오전/오후, 시간, 분)
                                </label>
                                <div className="flex gap-2 items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                                  {/* AM/PM Dropdown */}
                                  <select
                                    value={alarmAmpm}
                                    onChange={(e) => handleCustomTimeChange(e.target.value, alarmHour12, alarmMinute)}
                                    className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-sm transition-colors cursor-pointer"
                                    id="edit-alarm-ampm"
                                  >
                                    <option value="AM">오전 (AM)</option>
                                    <option value="PM">오후 (PM)</option>
                                  </select>

                                  {/* Hour Dropdown */}
                                  <select
                                    value={alarmHour12}
                                    onChange={(e) => handleCustomTimeChange(alarmAmpm, parseInt(e.target.value, 10), alarmMinute)}
                                    className="flex-1 rounded-xl border border-slate-205 bg-white px-2 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-sm transition-colors cursor-pointer"
                                    id="edit-alarm-hour"
                                  >
                                    {Array.from({ length: 12 }).map((_, i) => {
                                      const h = i + 1;
                                      return (
                                        <option key={h} value={h}>
                                          {h.toString().padStart(2, '0')}시
                                        </option>
                                      );
                                    })}
                                  </select>

                                  <span className="text-slate-400 font-extrabold text-xs shrink-0">:</span>

                                  {/* Minute Dropdown */}
                                  <select
                                    value={alarmMinute}
                                    onChange={(e) => handleCustomTimeChange(alarmAmpm, alarmHour12, parseInt(e.target.value, 10))}
                                    className="flex-1 rounded-xl border border-slate-205 bg-white px-2 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-sm transition-colors cursor-pointer"
                                    id="edit-alarm-minute"
                                  >
                                    {Array.from({ length: 60 }).map((_, i) => {
                                      return (
                                        <option key={i} value={i}>
                                          {i.toString().padStart(2, '0')}분
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleConfirmAlarm}
                                  className="mt-2.5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer group"
                                  id="edit-direct-time-select-confirm-btn"
                                >
                                  <Check size={13} className="text-emerald-450 group-hover:scale-110 transition-transform" />
                                  <span>선택 완료 및 원래 화면으로 이동</span>
                                </button>
                              </div>
                            </div>
                            
                            <div className="mt-5 flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setAlarmTime('');
                                  setIsAlarmConfirmed(false);
                                  setIsAlarmModalOpen(false);
                                }}
                                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-505 hover:bg-slate-100 hover:text-slate-705 transition-all duration-300"
                                id="edit-alarm-picker-clear-btn"
                              >
                                비우기
                              </button>
                              <button
                                type="button"
                                onClick={handleConfirmAlarm}
                                className="flex-1 rounded-2xl bg-emerald-500 hover:bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300"
                                id="edit-alarm-picker-confirm-btn"
                              >
                                선택
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Alarm repetition setting block */}
                <AnimatePresence>
                  {alarmTime && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col gap-3.5 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl overflow-hidden shadow-inner text-left"
                      id="edit-alarm-repeat-container"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold tracking-wider text-slate-505 uppercase">알람 반복 주기 설정</label>
                          {alarmRepeat !== 'none' && (
                            <span className="text-[10px] font-extrabold text-emerald-750 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg animate-pulse">
                              반복 활성화됨
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(['none', 'minute', 'hour', 'daily', 'weekly', 'monthly_lastday', 'monthly_day'] as AlarmRepeatType[]).map((type) => {
                            const typeLabels: Record<AlarmRepeatType, string> = {
                              none: '안 함',
                              minute: '분',
                              hour: '시간',
                              daily: '매일',
                              weekly: '요일',
                              monthly_lastday: '매월 말일',
                              monthly_day: '매월 지정일'
                            };
                            const isSelected = alarmRepeat === type;
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setAlarmRepeat(type);
                                  setIsMonthlyDayPickerConfirmed(false);
                                  if (type === 'weekly' && alarmRepeatDays.length === 0) {
                                    const currDay = new Date(alarmTime).getDay();
                                    setAlarmRepeatDays([isNaN(currDay) ? 1 : currDay]);
                                  }
                                }}
                                className={`rounded-xl border py-2 px-1 text-[10px] text-center font-extrabold tracking-tight transition-all duration-300 ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-emerald-600 to-teal-800 border-transparent text-white shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50/20 hover:text-emerald-900 hover:border-emerald-250'
                                }`}
                                id={`edit-repeat-typeBtn-${type}`}
                              >
                                {typeLabels[type]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Minute / Hour Repeat Interval Selector */}
                      {(alarmRepeat === 'minute' || alarmRepeat === 'hour') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col gap-2.5 border-t border-slate-200/50 pt-2.5"
                          id="edit-repeat-interval-picker"
                        >
                          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                            반복 간격 설정 ({alarmRepeat === 'minute' ? '분 단위' : '시간 단위'})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(alarmRepeat === 'minute' ? [5, 10, 15, 30, 45, 60] : [1, 2, 4, 5, 8, 12, 24]).map((val) => {
                              const isCurrent = alarmRepeatInterval === val;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setAlarmRepeatInterval(val)}
                                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-black font-mono transition-all duration-200 ${
                                    isCurrent
                                      ? 'bg-emerald-600 border-transparent text-white scale-[1.03] shadow-md shadow-emerald-600/10'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-250'
                                  }`}
                                >
                                  {val}{alarmRepeat === 'minute' ? '분' : '시간'}마다
                                </button>
                              );
                            })}
                          </div>
                          
                          {/* Direct Number Input */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10.5px] font-bold text-slate-700 shrink-0">직접 입력:</span>
                            <input
                              type="number"
                              min={1}
                              max={alarmRepeat === 'minute' ? 1440 : 168}
                              value={alarmRepeatInterval || ''}
                              onChange={(e) => {
                                const parsed = parseInt(e.target.value);
                                if (!isNaN(parsed) && parsed > 0) {
                                  setAlarmRepeatInterval(parsed);
                                } else if (e.target.value === '') {
                                  setAlarmRepeatInterval(1);
                                }
                              }}
                              className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/15"
                            />
                            <span className="text-[10.5px] font-bold text-slate-700">
                              {alarmRepeat === 'minute' ? '분 마다 반복 알림' : '시간 마다 반복 알림'}
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {/* Weekly Day Selector */}
                      {alarmRepeat === 'weekly' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col gap-2 border-t border-slate-200/50 pt-2.5"
                          id="edit-weekly-days-picker"
                        >
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">주간 반복 요일 설정 (중복 가능)</span>
                          <div className="flex justify-between gap-1.5">
                            {['일', '월', '화', '수', '목', '금', '토'].map((dayName, idx) => {
                              const isDaySelected = alarmRepeatDays.includes(idx);
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    if (isDaySelected) {
                                      if (alarmRepeatDays.length > 1) {
                                        setAlarmRepeatDays(alarmRepeatDays.filter(d => d !== idx));
                                      }
                                    } else {
                                      setAlarmRepeatDays([...alarmRepeatDays, idx]);
                                    }
                                  }}
                                  className={`flex-1 h-9 rounded-xl border flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer ${
                                    isDaySelected
                                      ? 'bg-emerald-605 bg-emerald-600 border-transparent text-white scale-[1.03] shadow-md shadow-emerald-600/10'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50/50 hover:border-emerald-300 hover:text-emerald-950 shadow-sm'
                                  }`}
                                  id={`edit-weekdayBtn-${idx}`}
                                >
                                  {dayName}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      {/* Monthly Day Selector */}
                      {alarmRepeat === 'monthly_day' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col gap-2 border-t border-slate-200/50 pt-2.5"
                          id="edit-monthly-day-picker"
                        >
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">매월 반복할 날짜 선택 (1일 ~ 31일)</span>
                          
                          {isMonthlyDayPickerConfirmed ? (
                            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-250 p-3 rounded-2xl" id="edit-monthly-day-picker-confirmed-view">
                              <span className="text-xs font-bold text-slate-800">
                                📅 매월 <span className="text-emerald-700 font-extrabold">{(() => {
                                  let currentSelectedDay = 1;
                                  if (alarmTime) {
                                    const alarmDatePart = alarmTime.split('T')[0];
                                    if (alarmDatePart) {
                                      const parts = alarmDatePart.split('-');
                                      currentSelectedDay = parseInt(parts[2]) || 1;
                                    }
                                  } else if (tempAlarmDate) {
                                    const parts = tempAlarmDate.split('-');
                                    currentSelectedDay = parseInt(parts[2]) || 1;
                                  }
                                  return currentSelectedDay;
                                })()}일</span>에 반복하도록 설정되었습니다.
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsMonthlyDayPickerConfirmed(false)}
                                className="text-[10px] font-black bg-white hover:bg-slate-50 border border-slate-300 hover:border-emerald-400 text-slate-750 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                                id="edit-monthly-day-picker-change-btn"
                              >
                                변경
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-7 gap-1 bg-white p-2.5 rounded-xl border border-slate-200/50 shadow-inner max-h-36 overflow-y-auto">
                                {Array.from({ length: 31 }).map((_, i) => {
                                  const dayNum = i + 1;
                                  let currentSelectedDay = 1;
                                  if (alarmTime) {
                                    const alarmDatePart = alarmTime.split('T')[0];
                                    if (alarmDatePart) {
                                      const parts = alarmDatePart.split('-');
                                      currentSelectedDay = parseInt(parts[2]) || 1;
                                    }
                                  } else if (tempAlarmDate) {
                                    const parts = tempAlarmDate.split('-');
                                    currentSelectedDay = parseInt(parts[2]) || 1;
                                  }
                                  
                                  const isDaySelected = currentSelectedDay === dayNum;

                                  return (
                                    <button
                                      key={dayNum}
                                      type="button"
                                      onClick={() => {
                                        let baseDateStr = alarmTime ? alarmTime.split('T')[0] : tempAlarmDate;
                                        if (!baseDateStr) {
                                          baseDateStr = dueDate || new Date().toISOString().split('T')[0];
                                        }
                                        const parts = baseDateStr.split('-');
                                        const year = parts[0] || new Date().getFullYear().toString();
                                        const month = parts[1] || (new Date().getMonth() + 1).toString().padStart(2, '0');
                                        const nextDateStr = `${year}-${month.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                                        
                                        setTempAlarmDate(nextDateStr);
                                        
                                        if (alarmTime) {
                                          const timePart = alarmTime.split('T')[1] || '09:00';
                                          setAlarmTime(`${nextDateStr}T${timePart}`);
                                        } else {
                                          setAlarmTime(`${nextDateStr}T${tempAlarmTime}`);
                                          setIsAlarmConfirmed(true);
                                        }
                                      }}
                                      className={`h-7 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center transition-all duration-200 ${
                                        isDaySelected
                                          ? 'bg-emerald-600 border-transparent text-white scale-[1.05] shadow-sm shadow-emerald-600/10'
                                          : 'bg-white border-slate-150 text-slate-650 hover:bg-emerald-50/50 hover:border-emerald-250 shadow-2xs'
                                      }`}
                                      id={`edit-monthly-dayBtn-${dayNum}`}
                                    >
                                      {dayNum}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Confirm Selection '선택' Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsMonthlyDayPickerConfirmed(true);
                                }}
                                className="w-full mt-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                id="edit-monthly-day-confirm-btn"
                              >
                                <span>선택</span>
                              </button>
                            </>
                          )}
                        </motion.div>
                      )}

                      {/* Alarm Sound Format Selector */}
                      <div className="flex flex-col gap-2 border-t border-slate-205/50 pt-2.5" id="edit-alarm-sound-picker">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">알람 벨소리 형식 선택</span>
                          <span className="text-[9px] text-emerald-605 font-bold">선택 시 미리듣기 재생 🎵</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(['zen_bell', 'digital_beep', 'morning_harp', 'cosmic_synth'] as AlarmSoundType[]).map((soundType) => {
                            const soundLabels: Record<AlarmSoundType, string> = {
                              zen_bell: '젠벨 🔔',
                              digital_beep: '디지털 🤖',
                              morning_harp: '하프 🎵',
                              cosmic_synth: '코스믹 🌌'
                            };
                            const isSoundSelected = alarmSound === soundType;
                            return (
                              <button
                                key={soundType}
                                type="button"
                                onClick={() => {
                                  setAlarmSound(soundType);
                                  const stop = playAlarmSound(soundType);
                                  setTimeout(() => {
                                    stop();
                                  }, 1500);
                                }}
                                className={`rounded-xl border py-2 px-1 text-[10px] text-center font-extrabold tracking-tight transition-all duration-300 cursor-pointer ${
                                  isSoundSelected
                                    ? 'bg-gradient-to-br from-emerald-600 to-teal-850 border-transparent text-white shadow-sm scale-[1.02]'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50/20 hover:text-emerald-990 hover:border-emerald-200'
                                }`}
                                id={`edit-sound-typeBtn-${soundType}`}
                              >
                                {soundLabels[soundType]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Checklist / Subtasks section */}
              <div className="flex flex-col gap-2 border-t border-slate-200/50 pt-4">
                <label className="text-xs font-bold tracking-wider text-slate-650 uppercase">하위 작업 체크리스트</label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask(e);
                      }
                    }}
                    placeholder="하위 필수 작업을 적고 Enter 키를 누르세요..."
                    className="flex-1 rounded-xl border border-slate-200 bg-white/70 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-300 focus:border-emerald-400 font-medium"
                    id="edit-todo-input-subtask"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="rounded-xl border border-slate-200 bg-white/70 hover:bg-slate-100 text-slate-605 hover:text-slate-900 px-3 flex items-center justify-center transition-all duration-350 hover:border-slate-300 shadow-sm"
                    id="edit-todo-btn-add-subtask"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Subtasks listings */}
                {subtasks.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {subtasks.map((sub, i) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between rounded-lg bg-white/40 border border-slate-150 px-3 py-1.5 shadow-sm"
                        id={`edit-temp-sub-${sub.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-200 h-4 w-4 rounded-full flex items-center justify-center border border-slate-300">
                            {i + 1}
                          </span>
                          <span className="text-xs text-slate-705 font-medium">{sub.text}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(sub.id)}
                          className="text-slate-500 hover:text-rose-500 transition-colors p-1"
                          id={`edit-temp-sub-del-${sub.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Complete additions buttons */}
              <div className="flex gap-3 justify-end mt-4 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-transparent px-5 py-2.5 text-xs font-bold text-slate-505 hover:text-slate-800 transition-all duration-300 cursor-pointer"
                  id="edit-todo-cancel-btn"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className={`rounded-xl px-5 py-2.5 text-xs font-bold shadow-lg transition-all duration-300 cursor-pointer ${
                    title.trim()
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  }`}
                  id="edit-todo-submit-btn"
                >
                  수정 완료
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
