/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Todo, Category, Priority, ConfettiParticle, AlarmRepeatType, AlarmSoundType } from './types';
import { getNextAlarmTime } from './lib/alarmUtils';
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
  downloadStandaloneHtmlFile,
  downloadViteGitHubPagesPwaZip,
  downloadOfflineAppPackageZip,
  downloadIconsBundleZip,
  downloadSourceCodeZip,
  downloadModifiedFilesZip
} from './lib/exportUtils';
import { 
  Sparkles, 
  Search, 
  ArrowDownAZ, 
  CalendarDays,
  Calendar, 
  FlameKindling,
  ListFilter,
  Layers,
  CheckCircle,
  HelpCircle,
  LogOut,
  Bell,
  Clock,
  AlertCircle,
  Sun,
  Moon,
  Download,
  Smartphone,
  Laptop,
  Tablet,
  Share,
  Move,
  ExternalLink,
  ChevronDown,
  Settings,
  Database,
  Upload,
  QrCode,
  SlidersHorizontal
} from 'lucide-react';
import { 
  playAlarmSound 
} from './lib/alarmAudio';
import { 
  CUBE_ICON_DATA,
  ORIGINAL_ICON_DATA,
  LOTUS_ICON_DATA,
  NEBULA_ICON_DATA,
  AURORA_ICON_DATA
} from './iconData';

// Firebase 연결을 끊고 오프라인 가짜(Mock) 함수로 대체합니다.
const initAuth = (onSuccess: any, onFailure: any) => {
  onSuccess({ displayName: "테스트 유저", email: "test@example.com", photoURL: null }, "mock-token");
  return () => {};
};
const googleSignIn = async () => {
  return { user: { displayName: "테스트 유저", email: "test@example.com", photoURL: null }, accessToken: "mock-token" };
};
const logout = async () => {};
const syncTodoToGoogleCalendar = async (todo: any, token: string) => "mock-event-id";
const deleteTodoFromGoogleCalendar = async (id: string, token: string) => {};

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

  // Google Sign-In and Token States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Alarms coordination state
  const [activeAlarmTodo, setActiveAlarmTodo] = useState<Todo | null>(null);
  const [audioStopper, setAudioStopper] = useState<(() => void) | null>(null);
  
  // Editing state
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Device view mode: 'pc' | 'tablet' | 'mobile'
  const [deviceViewMode, setDeviceViewMode] = useState<'pc' | 'tablet' | 'mobile'>('pc');
  const isMobileSimulator = deviceViewMode === 'mobile';
  const isTabletSimulator = deviceViewMode === 'tablet';
  
  // Mobile settings dropdown and Sort dropdown state
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  
  // Custom toast notifications feed
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Theme state: light (pastel) or dark (dark glass)
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

  // PWA Install prompt state & device compatibility listeners
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // App icon customizer states
  const [selectedIconKey, setSelectedIconKey] = useState<string>('original');
  const [previewIconKey, setPreviewIconKey] = useState<string>('original');
  const [iconVersion, setIconVersion] = useState<number>(Date.now());
  const [pwaUpdateAvailable, setPwaUpdateAvailable] = useState(false);

  const handleSetIcon = async (key: string) => {
    try {
      const response = await fetch('/api/set-icon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      if (response.ok) {
        setSelectedIconKey(key);
        setPreviewIconKey(key);
        localStorage.setItem('3d_glass_icon_key', key);
        setIconVersion(Date.now());

        const iconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
        const appleIconLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
        const manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
        
        const buster = `?v=${Date.now()}`;
        if (iconLink) iconLink.href = `/icon.png${buster}`;
        if (appleIconLink) appleIconLink.href = `/icon.png${buster}`;
        if (manifestLink) manifestLink.href = `/manifest.json${buster}`;

        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
              const cache = await caches.open(cacheName);
              await cache.delete('/icon.png');
              await cache.delete('/manifest.json');
              await cache.delete('/');
              await cache.delete('/index.html');
            }
          } catch (err) {
            console.warn('Cache purge bypassed:', err);
          }
        }

        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }
            await navigator.serviceWorker.register('/sw.js');
          } catch (err) {
            console.warn('SW reset/re-register bypassed:', err);
          }
        }

        showToast('🎨 앱 아이콘이 실시간으로 교체되었습니다!', 'success');
      } else {
        showToast('❌ 앱 아이콘 교체 처리에 실패했습니다.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('❌ 서버 연결에 실패하여 아이콘을 적용하지 못했습니다.', 'error');
    }
  };

  const downloadIconAsFile = async (iconKey: string) => {
    try {
      showToast('📥 이미지 파일을 다운로드하는 중...', 'info');
      let imageUrl = '';
      let filename = 'app_icon.png';
      
      if (iconKey === 'original') {
        imageUrl = '/icon_original.png';
        filename = 'original_classic_icon.png';
      } else {
        imageUrl = `/icon_${iconKey}.jpg`;
        filename = `${iconKey}_icon.jpg`;
      }
      
      const response = await fetch(`${imageUrl}?v=${Date.now()}`);
      if (!response.ok) throw new Error('파일 가져오기 실패');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      showToast('📥 아이콘 파일 다운로드가 완료되었습니다!', 'success');
    } catch (e) {
      window.open(`/icon_${iconKey}.jpg`, '_blank');
      showToast('💡 기기 보안 정책으로 새 탭에 아이콘이 열렸습니다. 저장해 주세요.', 'info');
    }
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

