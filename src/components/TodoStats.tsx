/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Todo, Category } from '../types';
import { 
  CheckCircle2, 
  TrendingUp, 
  Briefcase, 
  User, 
  ShoppingCart, 
  Palette, 
  Activity,
  ListTodo
} from 'lucide-react';

interface TodoStatsProps {
  todos: Todo[];
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
  statusFilter?: 'All' | 'Completed' | 'Active';
  setStatusFilter?: (status: 'All' | 'Completed' | 'Active') => void;
}

export default function TodoStats({ 
  todos, 
  selectedCategory, 
  setSelectedCategory,
  statusFilter = 'All',
  setStatusFilter
}: TodoStatsProps) {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Count by categories
  const categories: { name: Category; count: number; completedCount: number; color: string; icon: any }[] = [
    { name: 'All', count: total, completedCount: completed, color: 'from-blue-500 to-indigo-600', icon: ListTodo },
    { name: 'Work', count: todos.filter(t => t.category === 'Work').length, completedCount: todos.filter(t => t.category === 'Work' && t.completed).length, color: 'from-violet-500 to-indigo-600', icon: Briefcase },
    { name: 'Personal', count: todos.filter(t => t.category === 'Personal').length, completedCount: todos.filter(t => t.category === 'Personal' && t.completed).length, color: 'from-sky-400 to-indigo-500', icon: User },
    { name: 'Shopping', count: todos.filter(t => t.category === 'Shopping').length, completedCount: todos.filter(t => t.category === 'Shopping' && t.completed).length, color: 'from-orange-400 to-amber-600', icon: ShoppingCart },
    { name: 'Creative', count: todos.filter(t => t.category === 'Creative').length, completedCount: todos.filter(t => t.category === 'Creative' && t.completed).length, color: 'from-emerald-400 to-teal-600', icon: Palette },
    { name: 'Health', count: todos.filter(t => t.category === 'Health').length, completedCount: todos.filter(t => t.category === 'Health' && t.completed).length, color: 'from-rose-400 to-pink-600', icon: Activity },
  ];

  // SVG Progress circle parameters
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3" id="todo-stats-panel">
      {/* 3D Glassmorphism Progress Ring Card */}
      <motion.div 
        className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/50 p-6 shadow-xl backdrop-blur-xl [transform-style:preserve-3d] [perspective:1000px] hover:border-white/60 transition-all duration-300"
        whileHover={{ translateZ: 10, rotateX: 2, rotateY: -2 }}
        id="stat-completion-card"
      >
        <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
        <h3 className="mb-4 text-sm font-bold tracking-wide text-slate-900">전체 완료율</h3>
        
        <div className="flex items-center justify-around">
          {/* Circular 3D Progress ring */}
          <div className="relative flex h-32 w-32 items-center justify-center">
            {/* Soft inner shadow for depth */}
            <div className="absolute inset-4 rounded-full bg-white/40 shadow-[inset_0_2px_6px_rgba(15,23,42,0.06)]" />
            
            <svg className="absolute inset-0 h-full w-full -rotate-90">
              {/* Outer Glow Line */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-slate-200"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Active Progress Line */}
              <motion.circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.45)]"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="z-10 text-center">
              <motion.span 
                className="text-2xl font-black tracking-tight text-slate-900 font-mono"
                animate={{ scale: [1, 1.1, 1] }}
                key={completionRate}
                transition={{ duration: 0.3 }}
              >
                {completionRate}%
              </motion.span>
              <div className="text-[10px] text-slate-550 font-bold uppercase tracking-widest mt-0.5">완료</div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setStatusFilter?.(statusFilter === 'Completed' ? 'All' : 'Completed')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                statusFilter === 'Completed'
                  ? 'bg-emerald-500/10 border-emerald-400 text-emerald-800 font-extrabold shadow-sm'
                  : 'bg-white/30 border-transparent hover:border-slate-200 hover:bg-white text-slate-550'
              }`}
              title="완료된 할 일만 보기"
              id="filter-completed-btn"
            >
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.45)] shrink-0" />
              <div className="text-xs">
                <span className="font-semibold">완료됨: </span>
                <span className="font-bold text-slate-900 font-mono text-sm">{completed}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter?.(statusFilter === 'Active' ? 'All' : 'Active')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                statusFilter === 'Active'
                  ? 'bg-sky-500/10 border-sky-400 text-sky-800 font-extrabold shadow-sm'
                  : 'bg-white/30 border-transparent hover:border-slate-200 hover:bg-white text-slate-550'
              }`}
              title="진행 중인 할 일만 보기"
              id="filter-active-btn"
            >
              <div className="h-2.5 w-2.5 rounded-full bg-slate-400 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold">진행중: </span>
                <span className="font-bold text-slate-900 font-mono text-sm">{total - completed}</span>
              </div>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Interactive Category Selector Grid */}
      <div className="md:col-span-2 flex flex-col gap-4" id="stat-categories-panel">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold tracking-wide text-slate-650 uppercase">보드 카테고리</h3>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <TrendingUp size={14} />
            <span>정렬 및 필터 적용됨</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            const Icon = cat.icon;
            
            // Percentage of category completed
            const catRate = cat.count > 0 ? Math.round((cat.completedCount / cat.count) * 100) : 0;

            return (
              <motion.button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`relative overflow-hidden rounded-2xl p-4 text-left border transition-all duration-300 [transform-style:preserve-3d] focus:outline-none ${
                  isSelected 
                    ? 'bg-emerald-500 border-transparent text-white shadow-xl shadow-emerald-500/20 ring-1 ring-emerald-400/10' 
                    : 'bg-white/50 border-slate-200/40 text-slate-800 hover:border-slate-350/50 hover:bg-white/80'
                }`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                id={`cat-btn-${cat.name.toLowerCase()}`}
              >
                {/* Visual Glass Reflection Accent */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.1] to-transparent pointer-events-none" />
                
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-md`}>
                    <Icon size={18} />
                  </div>
                  <span className={`text-sm font-bold font-mono ${isSelected ? 'text-white' : 'text-slate-800'}`}>{cat.count}</span>
                </div>

                <div className="mt-1">
                  <div className={`text-xs font-bold ${isSelected ? 'text-slate-100' : 'text-slate-800'}`}>
                    {cat.name === 'All' ? '전체' :
                     cat.name === 'Work' ? '업무' :
                     cat.name === 'Personal' ? '개인' :
                     cat.name === 'Shopping' ? '쇼핑' :
                     cat.name === 'Creative' ? '크리에이티브' : '건강'}
                  </div>
                  {cat.count > 0 ? (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className={isSelected ? 'text-slate-350' : 'text-slate-300'}>진행률</span>
                        <span className={isSelected ? 'text-white font-bold' : 'text-slate-700 font-bold'}>{catRate}%</span>
                      </div>
                      <div className={`h-1 w-full rounded-full overflow-hidden ${isSelected ? 'bg-emerald-900/50' : 'bg-slate-150'}`}>
                        <motion.div 
                          className={`h-full rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-600'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${catRate}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={`text-[10px] mt-2 ${isSelected ? 'text-slate-300/80' : 'text-slate-405'}`}>등록된 작업 없음</div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
