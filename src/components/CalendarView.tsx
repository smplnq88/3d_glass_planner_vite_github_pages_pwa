import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, ClipboardList, Check, Trash2, Edit2, CornerDownRight, ListFilter } from 'lucide-react';
import { Todo, Category, Priority, SubTodo } from '../types';

interface CalendarViewProps {
  todos: Todo[];
  onToggleTodo: (id: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteTodo: (id: string) => void;
  onEditClick: (todo: Todo) => void;
  onAddTodoForDate: (dateStr: string) => void;
  theme: 'light' | 'dark';
  onSwitchToList?: () => void;
}

export default function CalendarView({
  todos,
  onToggleTodo,
  onToggleSubtask,
  onDeleteTodo,
  onEditClick,
  onAddTodoForDate,
  theme,
  onSwitchToList
}: CalendarViewProps) {
  const isDark = theme === 'dark';
  
  // View mode state: 'month' | 'week'
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  // Active selected date in calendar (defaults to today, formatted as YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Current calendar pivot date
  const [pivotDate, setPivotDate] = useState<Date>(() => new Date());

  // 1. Helper to get all days in the current pivot month
  const getMonthDays = (pivot: Date) => {
    const year = pivot.getFullYear();
    const month = pivot.getMonth(); // 0-indexed
    
    // First day of target month
    const firstDay = new Date(year, month, 1);
    // Day of the week of first day (0 = Sun, 1 = Mon...)
    const startOffset = firstDay.getDay();
    
    // Last day of target month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Prep calendar grid array (including padding slots for preceding month)
    const daysArr: (Date | null)[] = [];
    
    // Padding preceding days
    for (let i = 0; i < startOffset; i++) {
      daysArr.push(null);
    }
    
    // Actual month days
    for (let day = 1; day <= totalDays; day++) {
      daysArr.push(new Date(year, month, day));
    }
    
    // Fill the remaining grid cells to make multiples of 7
    while (daysArr.length % 7 !== 0) {
      daysArr.push(null);
    }
    
    return daysArr;
  };

  // 2. Helper to get the 7 days of pivot date's week
  const getWeekDays = (pivot: Date) => {
    const currentDayOfWeek = pivot.getDay(); // 0 = Sun, 1 = Mon...
    const weekStart = new Date(pivot);
    weekStart.setDate(pivot.getDate() - currentDayOfWeek); // Rollback to Sunday
    
    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  };

  // Navigate pivot month / week
  const handlePrev = () => {
    const next = new Date(pivotDate);
    if (viewMode === 'month') {
      next.setMonth(pivotDate.getMonth() - 1);
    } else {
      next.setDate(pivotDate.getDate() - 7);
    }
    setPivotDate(next);
  };

  const handleNext = () => {
    const next = new Date(pivotDate);
    if (viewMode === 'month') {
      next.setMonth(pivotDate.getMonth() + 1);
    } else {
      next.setDate(pivotDate.getDate() + 7);
    }
    setPivotDate(next);
  };

  const setTodayPivot = () => {
    const today = new Date();
    setPivotDate(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // Translate Date objects to YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Retrieve todos for a given YYYY-MM-DD string
  const getTodosForDate = (dateStr: string) => {
    return todos.filter(t => t.dueDate === dateStr);
  };

  // Get localized month string
  const getHeaderTitle = () => {
    const year = pivotDate.getFullYear();
    const month = pivotDate.toLocaleString('ko-KR', { month: 'long' });
    if (viewMode === 'month') {
      return `${year}년 ${month}`;
    } else {
      const days = getWeekDays(pivotDate);
      const start = days[0];
      const end = days[6];
      return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getMonth() + 1}월 ${end.getDate()}일`;
    }
  };

  // Color mappings for category indicators
  const categoryDotColor = (cat: Exclude<Category, 'All'>) => {
    const colors: Record<string, string> = {
      Work: 'bg-indigo-500 shadow-indigo-500/50',
      Personal: 'bg-emerald-500 shadow-emerald-500/50',
      Shopping: 'bg-amber-500 shadow-amber-500/50',
      Creative: 'bg-violet-500 shadow-violet-500/50',
      Health: 'bg-rose-500 shadow-rose-500/50'
    };
    return colors[cat] || 'bg-slate-400';
  };

  const categoryKorean = (cat: Exclude<Category, 'All'>) => {
    const names: Record<string, string> = {
      Work: '업무',
      Personal: '개인',
      Shopping: '쇼핑',
      Creative: '창의',
      Health: '건강'
    };
    return names[cat] || cat;
  };

  // Priority badge styling
  const priorityStyle = (p: Priority) => {
    const styles: Record<Priority, string> = {
      high: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
      medium: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
      low: 'bg-slate-500/10 border-slate-500/20 text-slate-700 dark:text-slate-400'
    };
    return styles[p];
  };

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const gridDays = viewMode === 'month' ? getMonthDays(pivotDate) : getWeekDays(pivotDate);

  // Filter list of schedules scheduled for focused click selection
  const selectedDateTodos = getTodosForDate(selectedDate);

  return (
    <div className="w-full flex flex-col gap-6" id="calendar-layout-viewport">
      {/* 🔮 Calendar Navigation Header Card */}
      <div className={`p-4 sm:p-5 rounded-3xl border backdrop-blur-xl transition-all duration-500 shadow-md ${
        isDark 
          ? 'border-white/10 bg-slate-950/40 shadow-emerald-950/5' 
          : 'border-white/70 bg-white/60 shadow-slate-100/50'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4.5 mb-5 select-none">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/35 rounded-xl blur-md" />
              <div className="relative h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-sm">
                <CalendarDays size={18} />
              </div>
            </div>
            <div className="text-left">
              <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                <span>일정 캘린더 매트릭스</span>
              </h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Month / Week Grid Navigation</p>
            </div>
          </div>

          {/* Navigators & Switch View type */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Level Toggles */}
            <div className="flex rounded-xl bg-slate-100/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-0.5 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-505 dark:text-slate-400 hover:text-slate-850'
                }`}
              >
                월별 (Month)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-505 dark:text-slate-400 hover:text-slate-850'
                }`}
              >
                주별 (Week)
              </button>
            </div>

            {onSwitchToList && (
              <button
                type="button"
                onClick={onSwitchToList}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer"
                title="목록으로 보기로 전환"
              >
                <ListFilter size={13} />
                <span>목록으로 보기</span>
              </button>
            )}

            <div className="h-5 w-[1px] bg-slate-300 dark:bg-slate-805 hidden sm:block" />

            {/* Current month pivot handlers */}
            <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/20 border border-slate-200 dark:border-white/5 rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                className="h-7 w-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-350 cursor-pointer"
                title="이전 기한 범위"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={setTodayPivot}
                className="text-[10px] font-black px-2.5 py-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="h-7 w-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-350 cursor-pointer"
                title="다음 기한 범위"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar core display matrix */}
        <div className="w-full text-center">
          <div className="text-sm font-black text-slate-800 dark:text-white font-mono tracking-tight mb-4 flex items-center justify-center gap-1.5">
            <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 text-[10px] uppercase font-black px-2 py-0.5 rounded-lg border border-emerald-500/10">Active</span>
            {getHeaderTitle()}
          </div>

          {/* Grids headers days */}
          <div className="grid grid-cols-7 gap-1.5 mb-2.5">
            {weekdays.map((day, idx) => {
              const isSun = idx === 0;
              const isSat = idx === 6;
              return (
                <div 
                  key={idx} 
                  className={`text-[11px] font-bold uppercase font-mono py-1 rounded-md ${
                    isSun 
                      ? 'text-rose-500' 
                      : isSat 
                        ? 'text-sky-500' 
                        : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Grids numeric cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {gridDays.map((dt, idx) => {
              if (dt === null) {
                // Empty matching slot padding
                return (
                  <div 
                    key={`empty-${idx}`} 
                    className="aspect-square rounded-2xl bg-slate-500/5 opacity-20 border border-transparent" 
                  />
                );
              }

              const formatted = formatDateString(dt);
              const isSelected = selectedDate === formatted;
              const isToday = formatDateString(new Date()) === formatted;
              const dayNum = dt.getDate();
              const dateTodos = getTodosForDate(formatted);
              const completedAll = dateTodos.length > 0 && dateTodos.every(t => t.completed);

              // Sunday vs Saturday colors
              const isSun = dt.getDay() === 0;
              const isSat = dt.getDay() === 6;

              return (
                <motion.div
                  key={formatted}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(formatted)}
                  className={`aspect-square rounded-2xl border transition-all duration-300 flex flex-col justify-between p-1.5 relative cursor-pointer select-none group ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/10 scale-[1.03]'
                      : isToday
                        ? 'bg-slate-350/15 border-slate-650 dark:border-white/40' 
                        : isDark
                          ? 'bg-white/5 border-white/5 hover:border-slate-600 hover:bg-white/10'
                          : 'bg-white/60 border-slate-200/60 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Main Numeric Day Tag */}
                  <span className={`text-[11px] sm:text-xs font-black font-mono relative z-10 block text-left px-0.5 ${
                    isSelected
                      ? 'text-emerald-700 dark:text-emerald-400 scale-[1.15]'
                      : isToday
                        ? 'text-slate-800 dark:text-white font-extrabold'
                        : isSun
                          ? 'text-rose-400 group-hover:text-rose-500'
                          : isSat
                            ? 'text-sky-400 group-hover:text-sky-500'
                            : 'text-slate-600 dark:text-slate-300'
                  }`}>
                    {dayNum}
                  </span>

                  {/* Bubble indicators of listed categories */}
                  <div className="flex flex-wrap gap-0.5 justify-start items-center p-0.5 max-h-5 overflow-hidden">
                    {dateTodos.slice(0, 4).map((todo, tIdx) => (
                      <span 
                        key={tIdx} 
                        className={`h-1.5 w-1.5 rounded-full shadow-inner animate-pulse shrink-0 ${categoryDotColor(todo.category)} ${
                          todo.completed ? 'opacity-40 line-through' : ''
                        }`}
                        title={todo.title}
                      />
                    ))}
                    {dateTodos.length > 4 && (
                      <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 font-mono scale-[0.8] leading-none shrink-0 border border-slate-200 dark:border-white/10 px-0.5 rounded">
                        +{dateTodos.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Completion star decorator */}
                  {dateTodos.length > 0 && completedAll && (
                    <div className="absolute right-1 top-1 text-[8px] text-emerald-500 dark:text-emerald-400 animate-wiggle">
                      💎
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🏡 Focused Selection Pane details side block  */}
      <div className={`p-5 rounded-3xl border text-left flex flex-col gap-4 backdrop-blur-xl transition-all duration-500 ${
        isDark 
          ? 'border-white/10 bg-slate-950/30' 
          : 'border-white/60 bg-white/50 shadow-sm'
      }`} id="calendar-focused-day-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Selected Plan Date</span>
            <h5 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
              📅 <span>{selectedDate.replace(/-/g, '. ')}</span>
              {selectedDate === formatDateString(new Date()) && (
                <span className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-black px-1.5 py-0.5 rounded-md text-[9px]">오늘</span>
              )}
            </h5>
          </div>

          <button
            type="button"
            onClick={() => onAddTodoForDate(selectedDate)}
            className="px-3.5 py-2 hover:scale-[1.02] active:scale-95 text-[11px] font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer max-w-xs shrink-0 self-start sm:self-center"
          >
            <Plus size={12} strokeWidth={3} />
            <span>이 날짜에 계획 추가</span>
          </button>
        </div>

        {/* Scheduled items list viewport */}
        <div className="space-y-3 mt-1.5">
          {selectedDateTodos.length > 0 ? (
            selectedDateTodos.map((todo) => (
              <div 
                key={todo.id}
                className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                  todo.completed
                    ? 'bg-slate-100/30 border-slate-200/40 opacity-70'
                    : isDark
                      ? 'bg-white/5 border-white/15'
                      : 'bg-white border-slate-200 shadow-sm shadow-slate-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    {/* Checkbox trigger */}
                    <button
                      type="button"
                      onClick={() => onToggleTodo(todo.id)}
                      className={`mt-1.5 h-4.5 w-4.5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                        todo.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 bg-white/20'
                      }`}
                    >
                      {todo.completed && <Check size={10} strokeWidth={4} />}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className={`text-[8px] font-black tracking-wider px-1.5 py-0.5 border rounded-md uppercase ${
                          todo.category === 'Work' ? 'bg-indigo-50/50 border-indigo-200 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-300 dark:border-indigo-500/20' :
                          todo.category === 'Personal' ? 'bg-emerald-50/50 border-emerald-250 text-emerald-750 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-500/20' :
                          todo.category === 'Shopping' ? 'bg-amber-50/50 border-amber-200 text-amber-750 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-500/20' :
                          todo.category === 'Creative' ? 'bg-violet-50/50 border-violet-255 text-violet-750 dark:bg-violet-950/20 dark:text-violet-300 dark:border-violet-500/20' :
                          'bg-rose-50/50 border-rose-200 text-rose-750 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-500/20'
                        }`}>
                          {categoryKorean(todo.category)}
                        </span>
                        
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${priorityStyle(todo.priority)}`}>
                          {todo.priority === 'high' ? '높음' : todo.priority === 'medium' ? '보통' : '낮음'}
                        </span>
                      </div>

                      <h6 className={`text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate ${
                        todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}>
                        {todo.title}
                      </h6>
                      
                      {todo.description && (
                        <p className="text-[11px] text-slate-550 dark:text-slate-400 line-clamp-1 leading-relaxed">
                          {todo.description}
                        </p>
                      )}

                      {/* Render mini subtasks summary */}
                      {todo.subtasks && todo.subtasks.length > 0 && (
                        <div className="space-y-1 pt-1 ml-1 pl-1 border-l border-slate-200 dark:border-slate-800">
                          {todo.subtasks.map((st) => (
                            <div key={st.id} className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                              <button
                                type="button"
                                onClick={() => onToggleSubtask(todo.id, st.id)}
                                className={`h-3 w-3 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                  st.completed
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-slate-300 dark:border-slate-700 bg-white/10'
                                }`}
                              >
                                {st.completed && <Check size={8} strokeWidth={4} />}
                              </button>
                              <span className={`truncate ${st.completed ? 'line-through opacity-60' : ''}`}>
                                {st.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Core Card tools */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditClick(todo)}
                      className="h-6.5 w-6.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-850 dark:text-slate-450 dark:hover:text-slate-200 transition-colors"
                      title="수정"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTodo(todo.id)}
                      className="h-6.5 w-6.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center text-slate-505 hover:text-rose-600 transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-450 dark:text-slate-500 font-semibold text-xs border border-dashed rounded-2xl border-slate-200/80 dark:border-white/10 leading-relaxed">
              이 날짜에 정렬된 계획 일정이 없습니다. <br />
              <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-450">위에 있는 '+ 이 날짜에 계획 추가'</span> 버튼을 눌러 하루를 채워 보셔요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
