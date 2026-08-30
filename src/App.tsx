import { useState, useEffect, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Todo, Category, Priority, ConfettiParticle } from './types';
import BackgroundBlobs from './components/BackgroundBlobs';
import TodoStats from './components/TodoStats';
import AddTodoForm from './components/AddTodoForm';
import TodoCard from './components/TodoCard';
import EditTodoModal from './components/EditTodoModal';
import ConfettiEffect from './components/ConfettiEffect';
import CalendarView from './components/CalendarView';
import CategoryView from './components/CategoryView';
import { HealingJournalSection } from './components/HealingJournalSection';
import { 
  Sparkles, Search, ArrowDownAZ, CalendarDays, FlameKindling, 
  ListFilter, CheckCircle, Sun, Moon, Download, Settings, Move
} from 'lucide-react';

// 가짜 연동 처리로 에러를 원천 차단합니다.
const currentUser = { displayName: "테스트 유저", email: "test@example.com" };
const googleAccessToken = "mock-token";
const handleGoogleSignIn = () => {};
const handleLogout = () => {};
const handleManualSyncToCalendar = () => {};

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Active'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'dueDate' | 'priority' | 'custom'>('latest');
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [draggedOverTodoId, setDraggedOverTodoId] = useState<string | null>(null);
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [mainViewMode, setMainViewMode] = useState<'list' | 'calendar' | 'category'>('list');
  const [prefilledCalendarDate, setPrefilledCalendarDate] = useState<string>('');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const saved = localStorage.getItem('3d_glass_todos');
    if (saved) {
      try { setTodos(JSON.parse(saved)); } catch (e) {}
    } else {
      const initialTodos: Todo[] = [
        {
          id: 'def-1',
          title: '글래스모피즘 3D 포트폴리오 웹 제작',
          description: '프론트엔드 역량을 뽐낼 수 있는 아름다운 파스텔 아트를 활용한 레이아웃을 작성합니다.',
          completed: false,
          category: 'Creative',
          priority: 'high',
          dueDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          subtasks: []
        }
      ];
      setTodos(initialTodos);
      localStorage.setItem('3d_glass_todos', JSON.stringify(initialTodos));
    }
  }, []);

  const saveTodos = (updated: Todo[]) => {
    setTodos(updated);
    localStorage.setItem('3d_glass_todos', JSON.stringify(updated));
  };

  const handleAddTodo = async (newTodoData: any) => {
    const newTodo: Todo = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTodoData.title,
      description: newTodoData.description,
      completed: false,
      category: newTodoData.category,
      priority: newTodoData.priority,
      dueDate: newTodoData.dueDate,
      subtasks: newTodoData.subtasks || [],
      createdAt: new Date().toISOString()
    };
    saveTodos([newTodo, ...todos]);
  };

  const handleToggleTodo = async (id: string) => {
    const updated = todos.map((t) => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTodos(updated);
  };

  const handleToggleSubtask = async (todoId: string, subtaskId: string) => {
    const updated = todos.map((t) => {
      if (t.id === todoId) {
        const updatedSubs = t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        return { ...t, subtasks: updatedSubs };
      }
      return t;
    });
    saveTodos(updated);
  };

  const handleDeleteTodo = (id: string) => {
    saveTodos(todos.filter(t => t.id !== id));
  };

  const handleEditClick = (todo: Todo) => { setEditingTodo(todo); setIsEditModalOpen(true); };
  const handleEditTodo = async (todoId: string, updatedFields: Partial<Todo>) => {
    saveTodos(todos.map(t => t.id === todoId ? { ...t, ...updatedFields } : t));
  };

  const filteredTodos = todos
    .filter((todo) => {
      const matchCategory = selectedCategory === 'All' || todo.category === selectedCategory;
      const matchSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          todo.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' || (statusFilter === 'Completed' && todo.completed) || (statusFilter === 'Active' && !todo.completed);
      return matchCategory && matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className={`relative min-h-screen font-sans p-6 ${theme === 'dark' ? 'text-slate-100 bg-slate-900' : 'text-slate-800 bg-slate-50'}`}>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* 구버전 스타일의 깔끔한 헤더 상단 바 */}
        <header className="flex justify-between items-center pb-4 border-b">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-emerald-600" size={24} />
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Master Planner</h1>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={toggleTheme} className="text-sm px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-850 cursor-pointer">
              {theme === 'light' ? '🌙 다크 모드' : '☀️ 라이트 모드'}
            </button>
          </div>
        </header>

        {/* 대시보드 진행도 판넬 */}
        <TodoStats todos={todos} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
        
        {/* 입력 폼 */}
        <AddTodoForm onAddTodo={handleAddTodo} prefilledDate={prefilledCalendarDate} onClearPrefilledDate={() => setPrefilledCalendarDate('')} />

        {/* 검색 및 제어창 */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border p-4 bg-white dark:bg-slate-850 rounded-2xl shadow-xs">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="할 일 검색..." className="w-full rounded-xl border py-2 pl-10 pr-4 text-xs bg-slate-50 dark:bg-slate-900" />
          </div>
          <button onClick={() => setMainViewMode(mainViewMode === 'list' ? 'calendar' : 'list')} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border rounded-xl bg-white dark:bg-slate-800 cursor-pointer">
            <CalendarDays size={13} />
            <span>{mainViewMode === 'list' ? '월/주로 보기 (캘린더)' : '리스트로 보기'}</span>
          </button>
        </div>

        {/* 할 일 목록 타일들 */}
        {mainViewMode === 'calendar' ? (
          <CalendarView todos={todos} onToggleTodo={handleToggleTodo} onToggleSubtask={handleToggleSubtask} onDeleteTodo={handleDeleteTodo} onEditClick={handleEditClick} onAddTodoForDate={(d: string) => setPrefilledCalendarDate(d)} theme={theme} onSwitchToList={() => setMainViewMode('list')} />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggleTodo={handleToggleTodo}
                onToggleSubtask={handleToggleSubtask}
                onDeleteTodo={handleDeleteTodo}
                onSyncToCalendar={handleManualSyncToCalendar}
                onEditClick={handleEditClick}
                onCategoryClick={setSelectedCategory}
                draggableProps={{ draggable: false }}
                isDragging={false}
                isDragOver={false}
              />
            ))}
          </div>
        )}

        {/* 하단 힐링 저널 영역 */}
        <div className="w-full pt-6 border-t border-dashed mt-4">
          <HealingJournalSection todos={todos} onAddTodoFromAI={() => {}} showToast={() => {}} theme={theme} />
        </div>

      </div>

      <EditTodoModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} todo={editingTodo} onEditTodo={handleEditTodo} />
    </div>
  );
}
