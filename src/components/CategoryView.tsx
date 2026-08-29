import { useState, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  User, 
  ShoppingBag, 
  Sparkles, 
  HeartPulse, 
  Plus, 
  Check, 
  Trash2, 
  Edit2, 
  Clock, 
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { Todo, Category, Priority } from '../types';

interface CategoryViewProps {
  todos: Todo[];
  onToggleTodo: (id: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteTodo: (id: string) => void;
  onEditClick: (todo: Todo) => void;
  onAddTodoForCategory: (cat: Exclude<Category, 'All'>) => void;
  onUpdateTodoCategory: (todoId: string, newCategory: Exclude<Category, 'All'>) => void;
  theme: 'light' | 'dark';
}

interface CategoryConfig {
  key: Exclude<Category, 'All'>;
  label: string;
  sublabel: string;
  icon: typeof Briefcase;
  colorClass: string;
  badgeClass: string;
  borderClass: string;
  bgGradient: string;
  accentHex: string;
}

const CATEGORIES_CONFIG: CategoryConfig[] = [
  {
    key: 'Work',
    label: '업무',
    sublabel: 'Work & Projects',
    icon: Briefcase,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    borderClass: 'border-indigo-400/40 dark:border-indigo-500/30',
    bgGradient: 'from-indigo-500/10 via-indigo-600/5 to-transparent',
    accentHex: '#6366f1'
  },
  {
    key: 'Personal',
    label: '개인',
    sublabel: 'Personal & Life',
    icon: User,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    borderClass: 'border-emerald-400/40 dark:border-emerald-500/30',
    bgGradient: 'from-emerald-500/10 via-emerald-600/5 to-transparent',
    accentHex: '#10b981'
  },
  {
    key: 'Shopping',
    label: '쇼핑',
    sublabel: 'Shopping & Groceries',
    icon: ShoppingBag,
    colorClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    borderClass: 'border-amber-400/40 dark:border-amber-500/30',
    bgGradient: 'from-amber-500/10 via-amber-600/5 to-transparent',
    accentHex: '#f59e0b'
  },
  {
    key: 'Creative',
    label: '크리에이티브',
    sublabel: 'Creative & Hobby',
    icon: Sparkles,
    colorClass: 'text-violet-600 dark:text-violet-400',
    badgeClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
    borderClass: 'border-violet-400/40 dark:border-violet-500/30',
    bgGradient: 'from-violet-500/10 via-violet-600/5 to-transparent',
    accentHex: '#8b5cf6'
  },
  {
    key: 'Health',
    label: '건강',
    sublabel: 'Health & Workout',
    icon: HeartPulse,
    colorClass: 'text-rose-600 dark:text-rose-400',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    borderClass: 'border-rose-400/40 dark:border-rose-500/30',
    bgGradient: 'from-rose-500/10 via-rose-600/5 to-transparent',
    accentHex: '#f43f5e'
  }
];

export default function CategoryView({
  todos,
  onToggleTodo,
  onToggleSubtask,
  onDeleteTodo,
  onEditClick,
  onAddTodoForCategory,
  onUpdateTodoCategory,
  theme
}: CategoryViewProps) {
  const isDark = theme === 'dark';
  const [activeFilterCategory, setActiveFilterCategory] = useState<Category>('All');
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<Exclude<Category, 'All'> | null>(null);

  // Drag & drop handlers for category switching
  const handleDragStart = (e: DragEvent, todoId: string) => {
    setDraggedTodoId(todoId);
    e.dataTransfer.setData('text/plain', todoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent, catKey: Exclude<Category, 'All'>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCategory !== catKey) {
      setDragOverCategory(catKey);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setDragOverCategory(null);
  };

  const handleDrop = (e: DragEvent, targetCategory: Exclude<Category, 'All'>) => {
    e.preventDefault();
    setDragOverCategory(null);
    const todoId = draggedTodoId || e.dataTransfer.getData('text/plain');
    if (todoId) {
      onUpdateTodoCategory(todoId, targetCategory);
    }
    setDraggedTodoId(null);
  };

  const visibleConfigs = activeFilterCategory === 'All' 
    ? CATEGORIES_CONFIG 
    : CATEGORIES_CONFIG.filter(c => c.key === activeFilterCategory);

  const priorityStyle = (p: Priority) => {
    const styles: Record<Priority, string> = {
      high: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
      medium: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
      low: 'bg-slate-500/10 border-slate-500/20 text-slate-700 dark:text-slate-400'
    };
    return styles[p];
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left animate-fade-in" id="category-view-container">
      {/* Category View Header Banner */}
      <div className={`p-4 sm:p-5 rounded-3xl border backdrop-blur-xl transition-all duration-500 shadow-md ${
        isDark 
          ? 'border-white/10 bg-slate-950/40 shadow-emerald-950/5' 
          : 'border-white/70 bg-white/60 shadow-slate-100/50'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-500/35 rounded-xl blur-md" />
              <div className="relative h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-violet-500 to-indigo-500 text-white shadow-sm">
                <Layers size={18} />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                <span>카테고리별 매트릭스 보드 (Category Board)</span>
              </h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                5대 영역별 분류 및 드래그 앤 드롭 카테고리 재배치
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-white/5">
            <span>💡 카드를 다른 칸으로 드래그하면 분류가 즉시 이동됩니다</span>
          </div>
        </div>

        {/* Category Quick Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/50 dark:border-white/5">
          <button
            type="button"
            onClick={() => setActiveFilterCategory('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeFilterCategory === 'All'
                ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'bg-white/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-white border border-slate-200 dark:border-white/5'
            }`}
          >
            전체 영역 ({todos.length})
          </button>

          {CATEGORIES_CONFIG.map((cat) => {
            const count = todos.filter(t => t.category === cat.key).length;
            const isSelected = activeFilterCategory === cat.key;
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveFilterCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? `${cat.badgeClass} shadow-xs font-extrabold ring-1 ring-emerald-500/20`
                    : 'bg-white/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-white border border-slate-200 dark:border-white/5'
                }`}
              >
                <Icon size={12} className={cat.colorClass} />
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Category Columns */}
      <div className={`grid gap-5 ${
        visibleConfigs.length === 1 
          ? 'grid-cols-1' 
          : visibleConfigs.length === 2 
            ? 'grid-cols-1 md:grid-cols-2' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`} id="category-columns-grid">
        {visibleConfigs.map((config) => {
          const categoryTodos = todos.filter(t => t.category === config.key);
          const completedCount = categoryTodos.filter(t => t.completed).length;
          const totalCount = categoryTodos.length;
          const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const Icon = config.icon;
          const isOverThis = dragOverCategory === config.key;

          return (
            <div
              key={config.key}
              onDragOver={(e) => handleDragOver(e, config.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, config.key)}
              className={`rounded-3xl border p-4.5 sm:p-5 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
                isOverThis
                  ? `ring-2 ring-emerald-500 bg-emerald-500/10 scale-[1.01] ${config.borderClass}`
                  : isDark
                    ? 'border-white/10 bg-slate-950/40 shadow-sm'
                    : 'border-white/70 bg-white/60 shadow-md shadow-slate-100/50'
              }`}
              id={`category-column-${config.key}`}
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center border shadow-xs ${config.badgeClass}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{config.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({totalCount})</span>
                      </h5>
                      <span className="text-[9px] text-slate-400 font-mono">{config.sublabel}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddTodoForCategory(config.key)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${config.badgeClass} hover:opacity-90`}
                    title={`${config.label} 영역에 새 작업 추가`}
                  >
                    <Plus size={11} />
                    <span>추가</span>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mb-4 space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 font-mono">
                    <span>진행률: {completedCount}/{totalCount} 완료</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    />
                  </div>
                </div>

                {/* Task Cards in this category */}
                <div className="space-y-2.5 min-h-[140px] max-h-[420px] overflow-y-auto pr-1">
                  {categoryTodos.length > 0 ? (
                    categoryTodos.map((todo) => (
                      <div
                        key={todo.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, todo.id)}
                        className={`p-3 rounded-2xl border transition-all duration-200 cursor-grab active:cursor-grabbing text-left ${
                          todo.completed
                            ? 'bg-slate-100/30 dark:bg-slate-900/20 border-slate-200/40 opacity-70'
                            : isDark
                              ? 'bg-slate-900/60 border-white/10 hover:border-slate-600'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                        id={`category-card-${todo.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => onToggleTodo(todo.id)}
                              className={`mt-0.5 h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                todo.completed
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 bg-white/20'
                              }`}
                            >
                              {todo.completed && <Check size={9} strokeWidth={4} />}
                            </button>

                            <div className="space-y-1 flex-1 min-w-0">
                              <h6 className={`text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug truncate ${
                                todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                              }`}>
                                {todo.title}
                              </h6>

                              {todo.description && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                  {todo.description}
                                </p>
                              )}

                              {/* Badges row */}
                              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                <span className={`text-[8px] font-black px-1.5 py-0.2 rounded border ${priorityStyle(todo.priority)}`}>
                                  {todo.priority === 'high' ? '높음' : todo.priority === 'medium' ? '중간' : '낮음'}
                                </span>

                                {todo.dueDate && (
                                  <span className="text-[8.5px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                                    <Calendar size={9} />
                                    <span>{todo.dueDate}</span>
                                  </span>
                                )}

                                {todo.alarmTime && (
                                  <span className="text-[8.5px] font-mono text-rose-500 flex items-center gap-0.5">
                                    <Clock size={9} />
                                    <span>알람</span>
                                  </span>
                                )}
                              </div>

                              {/* Subtasks snippet */}
                              {todo.subtasks && todo.subtasks.length > 0 && (
                                <div className="space-y-0.5 pt-1">
                                  {todo.subtasks.map((st) => (
                                    <div key={st.id} className="flex items-center gap-1 text-[9.5px] text-slate-500 dark:text-slate-400">
                                      <button
                                        type="button"
                                        onClick={() => onToggleSubtask(todo.id, st.id)}
                                        className={`h-2.5 w-2.5 rounded border flex items-center justify-center shrink-0 ${
                                          st.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700'
                                        }`}
                                      >
                                        {st.completed && <Check size={6} strokeWidth={4} />}
                                      </button>
                                      <span className={`truncate ${st.completed ? 'line-through opacity-50' : ''}`}>
                                        {st.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => onEditClick(todo)}
                              className="h-5 w-5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                              title="수정"
                            >
                              <Edit2 size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTodo(todo.id)}
                              className="h-5 w-5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                              title="삭제"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs border border-dashed rounded-2xl border-slate-200 dark:border-white/10">
                      등록된 계획이 없습니다.
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom add trigger */}
              <button
                type="button"
                onClick={() => onAddTodoForCategory(config.key)}
                className="mt-3 w-full py-2 rounded-xl border border-dashed border-slate-300 dark:border-white/10 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer bg-white/20 dark:bg-slate-900/20"
              >
                <Plus size={12} />
                <span>이 카테고리에 할 일 등록</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
