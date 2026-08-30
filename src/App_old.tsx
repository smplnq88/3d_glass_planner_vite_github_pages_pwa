/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Todo, Category, Priority, ConfettiParticle } from './types';
import BackgroundBlobs from './components/BackgroundBlobs';
import TodoStats from './components/TodoStats';
import AddTodoForm from './components/AddTodoForm';
import TodoCard from './components/TodoCard';
import EditTodoModal from './components/EditTodoModal';
import ConfettiEffect from './components/ConfettiEffect';
import { 
  Sparkles, 
  Search, 
  ArrowDownAZ, 
  CalendarDays, 
  FlameKindling,
  ListFilter,
  CheckCircle,
  Sun,
  Moon
} from 'lucide-react';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Active'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'dueDate' | 'priority'>('latest');
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Theme state: light (pastel) or dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('3d_glass_theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('3d_glass_theme', nextTheme);
  };

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('3d_glass_todos');
    if (saved) {
      try { setTodos(JSON.parse(saved)); } catch (e) {}
    } else {
      const initialTodos: Todo[] = [
        {
          id: 'def-1',
          title: '글래스모피즘 3D 포트폴리오 웹 제작',
          description: '프론트엔드 역량을 뽐낼 수 있는 아름다운 파스텔톤 레이아웃을 작성합니다.',
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

  const spawnConfetti = (coordinates?: { x: number; y: number }) => {
    const originX = coordinates?.x ?? window.innerWidth / 2;
    const originY = coordinates?.y ?? window.innerHeight / 2;
    const colors = ['#22d3ee', '#6366f1', '#f43f5e', '#10b981'];
    
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      x: originX,
      y: originY,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * Math.PI * 2,
      speed: 4 + Math.random() * 6,
      size: 4 + Math.random() * 4,
      spin: Math.random(),
    }));
    setParticles((prev) => [...prev, ...newParticles]);
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

  const handleToggleTodo = async (id: string, clickCoordinates?: { x: number; y: number }) => {
    const updated = todos.map((t) => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        if (nextCompleted) spawnConfetti(clickCoordinates);
        return { ...t, completed: nextCompleted, completedAt: nextCompleted ? new Date().toISOString() : undefined };
      }
      return t;
    });
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
    if (confirm('이 계획을 정말 삭제하시겠습니까?')) {
      saveTodos(todos.filter(t => t.id !== id));
    }
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
    .sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'dueDate') return !a.dueDate ? 1 : !b.dueDate ? -1 : new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return 0;
    });

  return (
    <div className={`relative min-h-screen font-sans p-4 sm:p-6 lg:p-8 ${theme === 'dark' ? 'text-slate-100 bg-slate-955' : 'text-slate-800 bg-slate-50'}`}>
      <BackgroundBlobs theme={theme} />
      <ConfettiEffect particles={particles} onComplete={() => setParticles([])} />

      <div className="max-w-4xl mx-auto flex flex-col gap-6 relative z-10">
        <header className="flex justify-between items-center pb-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="text-emerald-500" />
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Task Planner</h1>
          </div>
          <button onClick={toggleTheme} className="p-2 border rounded-xl bg-white dark:bg-slate-800 cursor-pointer shadow-xs">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </header>

        <TodoStats todos={todos} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
        <AddTodoForm onAddTodo={handleAddTodo} />

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="할 일 검색..." className="w-full rounded-xl border py-2 pl-10 pr-4 text-xs font-bold bg-slate-50 dark:bg-slate-850" />
          </div>
          <div className="flex gap-2 text-xs font-bold">
            <button onClick={() => setSortBy('latest')} className={`px-3 py-1.5 rounded-lg ${sortBy === 'latest' ? 'bg-slate-800 text-white' : 'border'}`}>최신순</button>
            <button onClick={() => setSortBy('dueDate')} className={`px-3 py-1.5 rounded-lg ${sortBy === 'dueDate' ? 'bg-slate-800 text-white' : 'border'}`}>기한순</button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {filteredTodos.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onToggleTodo={handleToggleTodo}
              onToggleSubtask={handleToggleSubtask}
              onDeleteTodo={handleDeleteTodo}
              onSyncToCalendar={async () => {}}
              onEditClick={handleEditClick}
              onCategoryClick={setSelectedCategory}
              draggableProps={{}}
              isDragging={false}
              isDragOver={false}
            />
          ))}
        </div>
      </div>

      <EditTodoModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} todo={editingTodo} onEditTodo={handleEditTodo} />
    </div>
  );
}
