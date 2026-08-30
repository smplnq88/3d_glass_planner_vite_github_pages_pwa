/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Todo, Category, ConfettiParticle } from './types';
import BackgroundBlobs from './components/BackgroundBlobs';
import TodoStats from './components/TodoStats';
import AddTodoForm from './components/AddTodoForm';
import TodoCard from './components/TodoCard';
import EditTodoModal from './components/EditTodoModal';
import CalendarView from './components/CalendarView';
import CategoryView from './components/CategoryView';
import { HealingJournalSection } from './components/HealingJournalSection';
import { 
  Sparkles, 
  Moon, 
  Sun
} from 'lucide-react';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [statusFilter] = useState<'All' | 'Completed' | 'Active'>('All');
  const [mainViewMode, setMainViewMode] = useState<'list' | 'calendar' | 'category'>('list');
  const [prefilledCalendarDate, setPrefilledCalendarDate] = useState<string>('');

  // Toast notifications feed
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Theme state: light or dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('3d_glass_theme');
      return (savedTheme as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('3d_glass_theme', nextTheme);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Toast helper
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save function
  const saveTodos = (newTodos: Todo[]) => {
    setTodos(newTodos);
    localStorage.setItem('3d_glass_todos', JSON.stringify(newTodos));
  };

  // Mock confetti effect
  const spawnConfetti = () => {
    showToast('🎉 일정을 성공적으로 생성했습니다!', 'success');
  };

  const handleAddTodoFromAI = (suggestion: any) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (suggestion.dueDateOffset || 0));
    const dueDateStr = targetDate.toISOString().split('T')[0];

    const newTodo: Todo = {
      id: 'ai-todo-' + Date.now(),
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category || 'Work',
      priority: suggestion.priority || 'medium',
      dueDate: dueDateStr,
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: (suggestion.subtasks || []).map((text: string, idx: number) => ({
        id: `ai-sub-${Date.now()}-${idx}`,
        text,
        completed: false
      }))
    };

    saveTodos([newTodo, ...todos]);
    spawnConfetti();
  };

  useEffect(() => {
    const saved = localStorage.getItem('3d_glass_todos');
    if (saved) {
      try { setTodos(JSON.parse(saved)); } catch(e) { console.error(e); }
    }
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-500 bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 relative overflow-hidden font-sans pb-12`}>
      <BackgroundBlobs theme={theme} />
      
      {/* 🔮 수정된 3D 글래스모피즘 커스텀 헤더 영역 */}
      <header className="max-w-7xl mx-auto px-4 pt-6 pb-2 relative z-10">
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-800/40 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* 🪐 입체적인 글래스 테마 아이콘 바인딩 */}
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-400/30 to-teal-600/30 rounded-2xl flex items-center justify-center p-2 border border-white/50 shadow-inner group transition-transform duration-300 hover:scale-105">
              <span className="text-3xl filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.15)] select-none">🔮</span>
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent tracking-tight">
                3D Glassmorphic Planner
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                유리 질감의 입체 글래스모피즘 투두리스트 PWA 플래너
              </p>
            </div>
          </div>

          {/* 뷰 모드 컨트롤 버튼 스위처 */}
          <div className="flex items-center gap-2 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-300/30">
            <button 
              onClick={() => setMainViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${mainViewMode === 'list' ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-slate-300/40'}`}
            >
              리스트 뷰
            </button>
            <button 
              onClick={() => setMainViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${mainViewMode === 'calendar' ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-slate-300/40'}`}
            >
              캘린더 뷰
            </button>
            <button 
              onClick={() => setMainViewMode('category')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${mainViewMode === 'category' ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-slate-300/40'}`}
            >
              칸반 보드
            </button>
            <button 
              onClick={toggleTheme}
              className="p-1.5 ml-2 bg-white/50 dark:bg-slate-700/50 rounded-lg hover:scale-105 transition-transform flex items-center justify-center"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* 대시보드 메인 본문 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 mt-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <AddTodoForm onAddTodo={(todo) => saveTodos([todo, ...todos])} prefilledDate={prefilledCalendarDate} />
          <TodoStats todos={todos} />
        </div>

        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {mainViewMode === 'list' && (
              <motion.div key="list" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
                <div className="space-y-4">
                  {todos.filter(t => {
                    if (statusFilter === 'Completed') return t.completed;
                    if (statusFilter === 'Active') return !t.completed;
                    return true;
                  }).map(todo => (
                    <TodoCard 
                      key={todo.id} 
                      todo={todo} 
                      onToggle={() => saveTodos(todos.map(t => t.id === todo.id ? {...t, completed: !t.completed} : t))}
                      onDelete={() => saveTodos(todos.filter(t => t.id !== todo.id))}
                      onEdit={() => {}}
                    />
                  ))}
                  {todos.length === 0 && (
                    <div className="text-center py-12 bg-white/20 dark:bg-slate-900/20 backdrop-blur border border-dashed rounded-xl border-slate-300/50">
                      <p className="text-sm text-slate-400">등록된 플래너 일정이 없습니다. 일정을 추가해보세요!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {mainViewMode === 'calendar' && (
              <motion.div key="calendar" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
                <CalendarView todos={todos} onSelectDate={(date) => { setPrefilledCalendarDate(date); setMainViewMode('list'); }} />
              </motion.div>
            )}

            {mainViewMode === 'category' && (
              <motion.div key="category" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
                <CategoryView todos={todos} onUpdateTodos={saveTodos} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="mt-8">
            <HealingJournalSection onAddSuggestion={handleAddTodoFromAI} />
          </div>
        </div>
      </main>

      {/* 토스트 알림 컴포넌트 피드 */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold border border-slate-700/50 flex items-center gap-2">
          <Sparkles size={14} className="text-emerald-400" />
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}
