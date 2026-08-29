/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Todo, Category, Priority } from '../types';
import { getRepeatLabel } from '../lib/alarmUtils';
import { 
  Check, 
  Trash2, 
  Clock, 
  Briefcase, 
  User, 
  ShoppingCart, 
  Palette, 
  Activity,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Bell,
  CalendarCheck,
  Pencil,
  GripVertical
} from 'lucide-react';

interface TodoCardProps {
  key?: string;
  todo: Todo;
  onToggleTodo: (id: string, clickCoordinates?: { x: number; y: number }) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteTodo: (id: string) => void;
  onSyncToCalendar?: (todo: Todo) => void;
  onEditClick: (todo: Todo) => void;
  onCategoryClick?: (category: Category) => void;
  draggableProps?: any;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export default function TodoCard({ 
  todo, 
  onToggleTodo, 
  onToggleSubtask, 
  onDeleteTodo, 
  onSyncToCalendar, 
  onEditClick, 
  onCategoryClick,
  draggableProps,
  isDragging,
  isDragOver
}: TodoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Category Icons & Labels mapping
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

  // Render Category Icon
  const CategoryIcon = categoryIcons[todo.category];

  // Colors for Priority Pillar Glows
  const priorityColors = {
    low: {
      shadow: 'shadow-emerald-500/5 border-emerald-300',
      pill: 'bg-emerald-100 text-emerald-800 border-emerald-250',
      label: '낮음',
      bullet: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]'
    },
    medium: {
      shadow: 'shadow-amber-500/5 border-amber-300',
      pill: 'bg-amber-100 text-amber-850 border-amber-250',
      label: '보통',
      bullet: 'bg-amber-550 shadow-[0_0_6px_rgba(245,158,11,0.3)]'
    },
    high: {
      shadow: 'shadow-rose-400/5 border-rose-300',
      pill: 'bg-rose-100 text-rose-850 border-rose-250',
      label: '높음',
      bullet: 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.3)]'
    },
  };

  const activePriority = priorityColors[todo.priority];

  // Calculate D-Day
  const getDDay = (dueDateStr: string) => {
    const target = new Date(dueDateStr);
    target.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: 'D-Day', isOverdue: false, isSoon: true };
    if (diffDays > 0) {
      return { 
        text: `D-${diffDays}`, 
        isOverdue: false, 
        isSoon: diffDays <= 2 
      };
    }
    return { 
      text: `D+${Math.abs(diffDays)}`, 
      isOverdue: true, 
      isSoon: false 
    };
  };

  const dday = todo.dueDate ? getDDay(todo.dueDate) : null;

  // Track coordinates and toggle completion
  const handleToggleClick = (e: MouseEvent<HTMLButtonElement>) => {
    onToggleTodo(todo.id, { x: e.clientX, y: e.clientY });
  };

  // Subtask progress calculations
  const totalSubtasks = todo.subtasks?.length || 0;
  const completedSubtasks = todo.subtasks?.filter(s => s.completed).length || 0;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95, rotateX: 6 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, x: 120, scale: 0.92, rotateY: 5 }}
      transition={{ duration: 0.45, type: 'spring', stiffness: 120, damping: 15 }}
      {...draggableProps}
      className={`relative w-full rounded-2xl border bg-white/50 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 [transform-style:preserve-3d] [perspective:1000px] hover:border-white/80 ${
        isDragging ? 'opacity-30 border-dashed border-emerald-500 scale-95' : ''
      } ${
        isDragOver ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01] ring-2 ring-emerald-500/30 z-20' : ''
      } ${
        !isDragging && !isDragOver
          ? todo.completed 
            ? 'border-slate-205/40 opacity-65 bg-white/20 shadow-inner' 
            : `border-white/60 ${activePriority.shadow}`
          : ''
      }`}
      id={`todo-card-${todo.id}`}
    >
      {/* 3D Glass Surface glare reflect overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent pointer-events-none" />

      {/* Main Content Row */}
      <div className="flex items-start gap-4" id={`todo-card-main-${todo.id}`}>
        
        {/* Desktop Drag Handle */}
        <div 
          className="hidden md:flex items-center justify-center p-1 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-grab active:cursor-grabbing hover:bg-slate-200/30 dark:hover:bg-slate-800/40 rounded-lg transition-colors shrink-0"
          title="마우스로 드래그하여 순서 정렬하기"
        >
          <GripVertical size={16} />
        </div>

        {/* Modern 3D Toggle Checkbox - Dark analogous gradient when checked */}
        <button
          onClick={handleToggleClick}
          className={`group relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 focus:outline-none ${
            todo.completed
              ? 'bg-emerald-500 border-transparent shadow-[0_3px_10px_rgba(16,185,129,0.35)] scale-100 rotate-0'
              : 'border-slate-300 bg-white hover:border-emerald-500/60 hover:scale-105 hover:shadow-md active:scale-95'
          }`}
          id={`todo-card-check-btn-${todo.id}`}
        >
          {todo.completed ? (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12 }}
            >
              <Check size={14} className="text-white stroke-[3]" />
            </motion.div>
          ) : (
            <div className="h-2 w-2 rounded-full bg-transparent group-hover:bg-emerald-400/40 transition-colors" />
          )}
        </button>

        {/* Task Title & Details */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category badge */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCategoryClick?.(todo.category);
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-2xs"
              title={`${categoryLabels[todo.category]} 카테고리 필터링`}
              id={`todo-${todo.id}-cat-badge`}
            >
              <CategoryIcon size={11} className="text-slate-650 dark:text-slate-400 font-bold" />
              <span>{categoryLabels[todo.category]}</span>
            </button>

            {/* Priority level label */}
            <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${activePriority.pill}`}>
              <span className={`h-1 w-1 rounded-full ${activePriority.bullet}`} />
              <span>{activePriority.label}</span>
            </span>

            {/* D-Day badge if due */}
            {dday && (
              <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-extrabold font-mono border ${
                dday.isOverdue 
                  ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' 
                  : dday.isSoon 
                  ? 'bg-amber-100 text-amber-850 border-amber-300' 
                  : 'bg-emerald-50/80 text-emerald-850 border-emerald-250'
              }`}>
                {dday.isOverdue && <AlertTriangle size={10} />}
                <span>{dday.text}</span>
              </span>
            )}

            {/* Alarm clock scheduled details */}
            {todo.alarmTime && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${
                  todo.completed 
                    ? 'bg-slate-100/50 text-slate-400 border-slate-200' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-850'
                }`} title={`다음 알람 시각: ${new Date(todo.alarmTime).toLocaleString()}`}>
                  <Bell size={10} className={todo.completed ? 'text-slate-400' : 'text-emerald-600 animate-pulse'} />
                  <span>
                    알람: {new Date(todo.alarmTime).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} {new Date(todo.alarmTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </span>

                {todo.alarmRepeat && todo.alarmRepeat !== 'none' && (
                  <span className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[9px] font-extrabold ${
                    todo.completed
                      ? 'bg-slate-100/30 text-slate-400 border-slate-200'
                      : 'bg-emerald-50 border-emerald-250 text-emerald-805'
                  }`} title="자동 반복 일정 알람 설정">
                    <span>{getRepeatLabel(todo.alarmRepeat, todo.alarmRepeatDays, todo.alarmTime, todo.alarmRepeatInterval)}</span>
                  </span>
                )}

                {todo.alarmTime && (
                  <span className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[9px] font-extrabold ${
                    todo.completed
                      ? 'bg-slate-100/30 text-slate-400 border-slate-200'
                      : 'bg-teal-50 border-teal-200 text-teal-800'
                  }`} title="알람 벨소리">
                    <span>🎵 {todo.alarmSound === 'digital_beep' ? '디지털' : todo.alarmSound === 'morning_harp' ? '하프' : todo.alarmSound === 'cosmic_synth' ? '코스믹' : '젠벨'}</span>
                  </span>
                )}
              </div>
            )}

            {/* Google Calendar sync status badges */}
            {todo.dueDate && (
              todo.calendarSynced ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-250 px-2 py-0.5 text-[10px] font-bold text-emerald-800" title="Google Calendar와 연동 완료">
                  <CalendarCheck size={10} className="text-emerald-600" />
                  <span>Calendar 연동됨</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSyncToCalendar) onSyncToCalendar(todo);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:text-emerald-950 transition-colors cursor-pointer shadow-sm focus:outline-none"
                  title="이 할 일을 Google Calendar에 수동으로 연동 등록합니다."
                  id={`sync-calendar-btn-${todo.id}`}
                >
                  <CalendarCheck size={10} className="text-slate-500 hover:text-emerald-600" />
                  <span>Calendar 연동</span>
                </button>
              )
            )}
          </div>

          <h3 className={`text-base font-bold leading-relaxed tracking-tight text-slate-900 transition-all duration-300 ${
            todo.completed ? 'line-through text-slate-400 decoration-slate-400' : ''
          }`} id={`todo-title-${todo.id}`}>
            {todo.title}
          </h3>

          {todo.description && (
            <p className={`text-xs leading-relaxed text-slate-600 pr-2 font-medium ${
              todo.completed ? 'text-slate-400 line-through decoration-slate-300' : ''
            }`} id={`todo-desc-${todo.id}`}>
              {todo.description}
            </p>
          )}

          {/* Creation & Due dates */}
          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              <span>작성일: {new Date(todo.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
            </span>
            {todo.dueDate && (
              <span className="flex items-center gap-1">
                <Clock size={11} className={dday?.isOverdue ? 'text-rose-600' : ''} />
                <span className={dday?.isOverdue ? 'text-rose-600 font-bold' : ''}>
                  기한: {new Date(todo.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
              </span>
            )}
            {todo.completed && todo.completedAt && (
              <span className="flex items-center gap-1 text-emerald-800">
                <Check size={11} />
                <span>완료됨: {new Date(todo.completedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Controls Side (Delete / Toggle Expand) using cohesive dark gradient frames */}
        <div className="flex items-center gap-1.5 self-start">
          {totalSubtasks > 0 && (
            <button
               onClick={() => setIsExpanded(!isExpanded)}
               className="rounded-xl border border-emerald-400 bg-emerald-500 p-2 text-white hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm"
               id={`todo-card-expand-btn-${todo.id}`}
            >
              {isExpanded ? <ChevronUp size={14} className="stroke-[2.5]" /> : <ChevronDown size={14} className="stroke-[2.5]" />}
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(todo);
            }}
            className="rounded-xl border border-slate-300 bg-white/60 p-2 text-slate-700 hover:text-emerald-600 hover:border-emerald-405 hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm cursor-pointer"
            id={`todo-card-edit-btn-${todo.id}`}
            title="일정 정보 변경"
          >
            <Pencil size={14} />
          </button>

          <button
            onClick={() => onDeleteTodo(todo.id)}
            className="rounded-xl border border-slate-700 bg-gradient-to-r from-slate-850 to-slate-950 p-2 text-slate-300 hover:text-rose-400 hover:border-rose-400 hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm cursor-pointer"
            id={`todo-card-del-btn-${todo.id}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Subtasks Progress mini bar */}
      {!isExpanded && totalSubtasks > 0 && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]" id={`todo-card-sub-mini-${todo.id}`}>
          <div className="flex items-center gap-2 text-slate-600 font-bold">
            <span>하위 체크리스트 진행률</span>
            <span className="font-mono text-emerald-800 font-black">{completedSubtasks}/{totalSubtasks} ({subtaskProgress}%)</span>
          </div>
          <div className="h-1.5 w-24 bg-slate-200/80 rounded-full overflow-hidden border border-slate-300/30">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-350 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Expandable detailed checklist section */}
      <AnimatePresence>
        {isExpanded && totalSubtasks > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
            id={`todo-card-sub-expanded-${todo.id}`}
          >
            <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700">세부 체크리스트</span>
                <span className="font-mono text-emerald-900 font-black">{completedSubtasks}/{totalSubtasks} 완료됨 ({subtaskProgress}%)</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden border border-slate-300/30 mb-1">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 via-teal-350 to-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>

              {/* Subtasks checklists */}
              <div className="flex flex-col gap-2 bg-white/70 p-3 rounded-xl border border-slate-200/50 shadow-inner">
                {todo.subtasks.map((sub) => (
                  <label
                    key={sub.id}
                    className="flex items-center gap-2.5 cursor-pointer group"
                    id={`sub-label-${todo.id}-${sub.id}`}
                  >
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => onToggleSubtask(todo.id, sub.id)}
                      className="sr-only"
                      id={`sub-input-${todo.id}-${sub.id}`}
                    />
                    <div className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-all duration-200 ${
                      sub.completed
                        ? 'bg-emerald-500 border-transparent text-white'
                        : 'border-slate-300 bg-white group-hover:border-emerald-500'
                    }`}>
                      {sub.completed && <Check size={11} className="stroke-[3] text-white" />}
                    </div>
                    <span className={`text-xs tracking-tight transition-all duration-200 font-medium ${
                      sub.completed 
                        ? 'line-through text-slate-400' 
                        : 'text-slate-750 group-hover:text-slate-950'
                    }`}>
                      {sub.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
