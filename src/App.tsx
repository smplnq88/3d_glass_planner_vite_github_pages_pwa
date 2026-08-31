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

// 외부 연동 및 오류 발생 요소를 제거한 독립형 오프라인 핸들러 세팅
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const saved = localStorage.getItem('3d_glass_todos');
    if (saved) {
      try { setTodos(JSON.parse(saved)); } catch (e) {}
    } else {
      const today = new Date();
      const defaultDueDate = (daysAhead: number) => {
        const d = new Date();
        d.setDate(today.getDate() + daysAhead);
        return d.toISOString().split('T')[0];
      };

      const initialTodos: Todo[] = [
        {
          id: 'def-1',
          title: '글래스모피즘 3D 포트폴리오 웹 제작',
          description: '프론트엔드 역량을 뽐낼 수 있는 아름다운 파스텔 아트를 활용한 레이아웃을 작성합니다.',
          completed: false,
          category: 'Creative',
          priority: 'high',
          dueDate: defaultDueDate(3),
          createdAt: new Date().toISOString(),
          subtasks: [
            { id: 'def-1-sub1', text: '블렌더 로 폴리 모델 렌더링', completed: false },
            { id: 'def-1-sub2', text: '테일윈드 백드롭 필터 흐림 조절', completed: true },
            { id: 'def-1-sub3', text: '프레임 모션 스프링 물리 모델 배치', completed: false }
          ]
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
    <div className={`relative min-h-screen font-sans p-4 sm:p-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100 bg-[#141b2d]' : 'text-slate-800 bg-[#f4f7fb]'}`}>
      
      {/* 백그라운드 흐림 효과 요소 */}
      <BackgroundBlobs theme={theme} />

      <div className="max-w-4xl mx-auto flex flex-col gap-6 relative z-10">
        
        {/* 상단 다크모드 제어 줄 */}
        <div className="w-full flex justify-end">
          <button onClick={toggleTheme} className="text-xs font-bold px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-850 cursor-pointer shadow-2xs">
            {theme === 'light' ? '🌙 다크 모드' : '☀️ 라이트 모드'}
          </button>
        </div>

        {/* 🌟 원본 참조 사이트와 100% 동일한 대형 중앙 정렬 헤더 레이아웃 */}
        <header className="text-center flex flex-col items-center mt-2 mb-4">
          <div className="flex items-center justify-center gap-2.5 mb-1.5">
            <CheckCircle className="text-emerald-600" size={36} />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-850 dark:text-white tracking-tight">
              Master Planner
            </h1>
          </div>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase font-mono">
            3D Glassmorphic Planner Project
          </p>
        </header>

        {/* 원본 사이트 통계 및 카테고리 카드 제어기 장착 */}
        <TodoStats todos={todos} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
        
        {/* 할 일 입력 컴포넌트 */}
        <AddTodoForm onAddTodo={handleAddTodo} prefilledDate={prefilledCalendarDate} onClearPrefilledDate={() => setPrefilledCalendarDate('')} />

        {/* 검색 제어판 필터 줄 */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border p-4 bg-white/80 dark:bg-slate-850/80 rounded-2xl shadow-xs backdrop-blur-md">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="할 일 검색..." className="w-full rounded-xl border py-2 pl-10 pr-4 text-xs bg-slate-50/50 dark:bg-slate-900/50" />
          </div>
          <button onClick={() => setMainViewMode(mainViewMode === 'list' ? 'calendar' : 'list')} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border rounded-xl bg-white dark:bg-slate-800 cursor-pointer shadow-2xs">
            <CalendarDays size={13} />
            <span>{mainViewMode === 'list' ? '월/주로 보기 (캘린더)' : '리스트로 보기'}</span>
          </button>
        </div>

        {/* 동적 뷰어 메인 콘텐츠 보드 */}
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

        {/* 마음 치유 AI 저널 영역 피드 */}
        <div className="w-full pt-6 border-t border-dashed mt-4">
          <HealingJournalSection todos={todos} onAddTodoFromAI={() => {}} showToast={() => {}} theme={theme} />
        </div>

      </div>

      <EditTodoModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} todo={editingTodo} onEditTodo={handleEditTodo} />
    </div>
  );
}
