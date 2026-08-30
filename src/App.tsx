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
  initAuth, 
  googleSignIn, 
  logout 
} from './lib/firebase';
import { 
  syncTodoToGoogleCalendar, 
  deleteTodoFromGoogleCalendar 
} from './lib/calendar';
import { 
  playAlarmSound 
} from './lib/alarmAudio';
import { User } from 'firebase/auth';
import { CUBE_ICON_DATA } from './iconData';

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

        // Update DOM link elements instantly to prevent cache read
        const iconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
        const appleIconLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
        const manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
        
        const buster = `?v=${Date.now()}`;
        if (iconLink) iconLink.href = `/icon.png${buster}`;
        if (appleIconLink) appleIconLink.href = `/icon.png${buster}`;
        if (manifestLink) manifestLink.href = `/manifest.json${buster}`;

        // Dynamic Cache Storage clearing for perfect instant reflection
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

        // Unregister and immediately re-register service worker to claim clients and cache new icon instantly
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }
            // Register a fresh service worker instance to fetch and cache the newly swapped icon
            await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker successfully reset and re-registered with new icon caching.');
          } catch (err) {
            console.warn('SW reset/re-register bypassed:', err);
          }
        }

        showToast('🎨 앱 아이콘이 실시간으로 교체되었습니다! 바로 설치(PWA)하셔도 새 아이콘으로 전용 앱 설치가 진행됩니다.', 'success');
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
      } else if (iconKey === 'emerald_lotus') {
        imageUrl = '/icon_emerald_lotus.jpg';
        filename = 'emerald_lotus_icon.jpg';
      } else if (iconKey === 'cosmic_nebula') {
        imageUrl = '/icon_cosmic_nebula.jpg';
        filename = 'cosmic_nebula_icon.jpg';
      } else if (iconKey === 'polar_aurora') {
        imageUrl = '/icon_polar_aurora.jpg';
        filename = 'polar_aurora_icon.jpg';
      } else {
        imageUrl = '/icon.png';
        filename = 'active_app_icon.png';
      }
      
      // Append cache-busting query to avoid cache policy blocks or proxy caching
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
      console.error(e);
      // Premium interactive fallback: open in a new browser tab for manual save
      const fallbackUrl = iconKey === 'original' ? '/icon_original.png' : `/icon_${iconKey}.jpg`;
      window.open(fallbackUrl, '_blank');
      showToast('💡 기기 보안 정책으로 새 탭에 아이콘이 열렸습니다. 꾹 눌러서 그림 저장을 선택해 주세요.', 'info');
    }
  };

  // Add todo suggested by AI diagnosis directly to the board
  const handleAddTodoFromAI = (suggestion: {
    title: string;
    description: string;
    category: any;
    priority: any;
    dueDateOffset: number;
    subtasks: string[];
  }) => {
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
      subtasks: (suggestion.subtasks || []).map((text, idx) => ({
        id: `ai-sub-${Date.now()}-${idx}`,
        text,
        completed: false
      }))
    };

    saveTodos([newTodo, ...todos]);
    spawnConfetti();
  };

  // Export current task and app state to a local JSON backup file
  const handleExportBackup = () => {
    try {
      let journals = [];
      try {
        const savedJournals = localStorage.getItem('3d_glass_planner_journal_entries');
        if (savedJournals) journals = JSON.parse(savedJournals);
      } catch (e) {
        console.error('Error reading journals for backup:', e);
      }

      const backupData = {
        todos,
        journals,
        selectedIconKey,
        theme,
        backupDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `3D_Glass_Planner_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      
      showToast('💾 플래너 할 일 및 저널 정보가 백업 파일(JSON)로 다운로드되었습니다!', 'success');
    } catch (err) {
      console.error(err);
      showToast('❌ 백업 파일 작성 도중 오류가 발생했습니다.', 'error');
    }
  };

  // Import task state from a local JSON backup file saved earlier
  const handleImportBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;
    
    if (!files || files.length === 0) return;
    
    fileReader.onload = async (e) => {
      try {
        const resultString = e.target?.result;
        if (typeof resultString !== 'string') return;
        
        const importedData = JSON.parse(resultString);
        
        if (Array.isArray(importedData.todos)) {
          // Set todos state
          setTodos(importedData.todos);
          
          // Sync with local storage
          localStorage.setItem('todos', JSON.stringify(importedData.todos));
          
          // Restore journals if present
          if (Array.isArray(importedData.journals)) {
            localStorage.setItem('3d_glass_planner_journal_entries', JSON.stringify(importedData.journals));
          }

          // Optionally restore other states
          if (importedData.selectedIconKey) {
            setSelectedIconKey(importedData.selectedIconKey);
            setPreviewIconKey(importedData.selectedIconKey);
            localStorage.setItem('3d_glass_icon_key', importedData.selectedIconKey);
          }
          if (importedData.theme) {
            setTheme(importedData.theme);
            localStorage.setItem('theme', importedData.theme);
          }
          
          showToast('📂 이전 백업 데이터(할 일 + 저널)가 성공적으로 복구되었습니다!', 'success');
        } else {
          showToast('❌ 유효하지 않은 백업 파일 형식입니다.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('❌ 파일 분석에 실패했습니다. 올바른 .json 백업 파일을 업로드해 주세요.', 'error');
      }
    };
    
    fileReader.readAsText(files[0]);
  };

  useEffect(() => {
    // Dynamically retrieve and restore the last chosen active icon key from localStorage on mount to preserve custom user choices
    const restoreSavedIconOnMount = async () => {
      try {
        const savedIconKey = localStorage.getItem('3d_glass_icon_key') || 'original';
        await fetch('/api/set-icon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: savedIconKey })
        });
        setSelectedIconKey(savedIconKey);
        setPreviewIconKey(savedIconKey);
      } catch (e) {
        console.error("Auto load saved active icon failed:", e);
      }
    };
    restoreSavedIconOnMount();
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default mini-bar
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Initial check for standalone mode (PWA installed and running directly)
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (navigator as any).standalone === true; // iOS Safari fallback
      if (isStandalone) {
        setIsInstallable(false);
      } else {
        // Unconditional install guide option is always good for manual instructions
        setIsInstallable(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setPwaUpdateAvailable(true);
    };
    window.addEventListener('pwa-update-available', handleUpdate);
    return () => {
      window.removeEventListener('pwa-update-available', handleUpdate);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If prompt wasn't fired (like on iOS Safari), toggle instructions directly
      setShowInstallGuide(true);
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('PWA installation user choice outcome:', outcome);
    
    // Reset stashed event
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('3d_glass_todos');
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse todos:", e);
      }
    } else {
      // First-time users preload default mock data
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
          description: '프론트엔드 역량을 뽐낼 수 있는 아름다운 3D 글래스 아트를 활용한 레이아웃을 작성합니다.',
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
        },
        {
          id: 'def-2',
          title: '마트에서 피트니스 섭취 식단 장보기',
          description: '체력 증진 및 골격근 성장을 위해 고단백 다이어트 장을 봅니다.',
          completed: true,
          category: 'Shopping',
          priority: 'medium',
          dueDate: defaultDueDate(0),
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          completedAt: new Date().toISOString(),
          subtasks: [
            { id: 'def-2-sub1', text: '닭가슴살 슬라이스 10팩', completed: true },
            { id: 'def-2-sub2', text: '양배추 & 청경채 패키지', completed: true },
            { id: 'def-2-sub3', text: '프로틴 드링크 1박스', completed: true }
          ]
        },
        {
          id: 'def-3',
          title: '매일 아침 공원 30분 유산소 달리기',
          description: '신진대사 유도 및 심폐 기능 확장을 위한 아침 가벼운 러닝.',
          completed: false,
          category: 'Health',
          priority: 'medium',
          dueDate: defaultDueDate(1),
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          subtasks: [
            { id: 'def-3-sub1', text: '스트레칭 및 관절 풀기 5분', completed: true },
            { id: 'def-3-sub2', text: '속보 및 파워 조깅 20분', completed: false }
          ]
        },
        {
          id: 'def-4',
          title: '밀린 미확인 업무 메일함 정리 및 회신',
          description: '수신함 미확인 편지를 검독하고 핵심 거래처에 정중한 메일을 보냅니다.',
          completed: false,
          category: 'Work',
          priority: 'low',
          dueDate: defaultDueDate(2),
          createdAt: new Date(Date.now() - 10800000).toISOString(),
          subtasks: []
        }
      ];

      setTodos(initialTodos);
      localStorage.setItem('3d_glass_todos', JSON.stringify(initialTodos));
    }
  }, []);

  // Custom Toast helper
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
  };

  // Auto clear custom toast messages
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Firebase Auth integration listener
  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setGoogleAccessToken(token);
        setAuthChecking(false);
      },
      () => {
        setCurrentUser(null);
        setGoogleAccessToken(null);
        setAuthChecking(false);
      }
    );
    return () => unsub();
  }, []);

  // Alarms Checker runner loop
  useEffect(() => {
    const interval = setInterval(() => {
      // Avoid firing multiple overlays simultaneously
      if (activeAlarmTodo) return;

      const now = new Date();
      const currentIsoTime = now.toISOString();

      const triggered = todos.find((todo) => {
        if (todo.completed) return false;
        if (!todo.alarmTime) return false;
        if (todo.alarmDismissed) return false;

        const alarmDate = new Date(todo.alarmTime);
        return now >= alarmDate;
      });

      if (triggered) {
        setActiveAlarmTodo(triggered);
        const stop = playAlarmSound(triggered.alarmSound);
        setAudioStopper(() => stop);

        // 1. Try triggering native desktop/mobile System Notification
        const notificationTitle = '🔔 [3D Glass Planner 알람]';
        const notificationBody = `일정 시각 도달: ${triggered.title}\n${triggered.description || '할 일 정보가 등록된 일정에 도달했습니다!'}`;

        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            try {
              if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then((reg) => {
                  reg.showNotification(notificationTitle, {
                    body: notificationBody,
                    icon: '/icon.png',
                    badge: '/icon.png',
                    tag: 'glass-tracker-alarm-' + triggered.id,
                    vibrate: [250, 100, 250],
                  } as any);
                }).catch(() => {
                  new Notification(notificationTitle, {
                    body: notificationBody,
                    icon: '/icon.png',
                  });
                });
              } else {
                new Notification(notificationTitle, {
                  body: notificationBody,
                  icon: '/icon.png',
                });
              }
            } catch (notifyErr) {
              console.warn('System Notification error, using legacy alternative:', notifyErr);
              try {
                new Notification(notificationTitle, {
                  body: notificationBody,
                  icon: '/icon.png',
                });
              } catch (e) {}
            }
          }
        }

        // 2. Also, trigger a true native popup dialog window to capture guaranteed attention on computer and mobile
        setTimeout(() => {
          try {
            alert(`⏰ [3D Glassmorphic Planner 알람 시각 도달]\n\n📌 일정: ${triggered.title}\n✍️ 메모: ${triggered.description || '등록된 메모 내용 없음'}\n⏰ 시각: ${new Date(triggered.alarmTime!).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}`);
          } catch (alertErr) {
            console.warn('Browser sandbox context blocked native alert:', alertErr);
          }
        }, 150);
      }
    }, 4000); // Check every 4 seconds for immediate responsiveness

    return () => clearInterval(interval);
  }, [todos, activeAlarmTodo]);

  // Request browser permission for notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Save to LocalStorage
  const saveTodos = (updated: Todo[]) => {
    setTodos(updated);
    localStorage.setItem('3d_glass_todos', JSON.stringify(updated));
  };

  // Spark Confetti Burst
  const spawnConfetti = (coordinates?: { x: number; y: number }) => {
    const originX = coordinates?.x ?? window.innerWidth / 2;
    const originY = coordinates?.y ?? window.innerHeight / 2;
    const colors = ['#22d3ee', '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#ec4899', '#c084fc', '#38bdf8'];
    
    const newParticles = Array.from({ length: 45 }).map((_, i) => ({
      id: `${Date.now()}-${i}-${Math.random()}`,
      x: originX,
      y: originY,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * Math.PI * 2,
      speed: 4 + Math.random() * 8,
      size: 4 + Math.random() * 6,
      spin: Math.random() * Math.PI * 2,
    }));
    
    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Google Login / Sync Hub Handlers
  const handleGoogleSignIn = async () => {
    try {
      showToast('Google 계정 연동 시작...', 'info');
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setGoogleAccessToken(result.accessToken);
        showToast('Google Calendar 연동이 성공적으로 활성화되었습니다!', 'success');
      }
    } catch (error) {
      console.error('Google OAuth signin failed:', error);
      showToast('호스트 연동에 실패했습니다. 다시 시도해 주세요.', 'error');
    }
  };

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Google 계정 연동 해제',
      message: 'Google 계정 연동을 종료하시겠습니까? 구글 캘린더 자동 업데이트 기능이 비활성화됩니다.',
      confirmText: '연동 해제',
      cancelText: '취소',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await logout();
          setCurrentUser(null);
          setGoogleAccessToken(null);
          showToast('연동이 정상 해제되었습니다.', 'info');
        } catch (e) {
          showToast('로그아웃 중 오류가 발생했습니다.', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Alarm dismissing & snoozing
  const handleDismissAlarm = (todoId: string) => {
    if (audioStopper) {
      audioStopper();
      setAudioStopper(null);
    }
    setActiveAlarmTodo(null);

    const updated = todos.map((todo) => {
      if (todo.id === todoId) {
        if (todo.alarmRepeat && todo.alarmRepeat !== 'none') {
          const nextTime = getNextAlarmTime(todo.alarmTime!, todo.alarmRepeat, todo.alarmRepeatDays, new Date(), todo.alarmRepeatInterval);
          if (nextTime) {
            return {
              ...todo,
              alarmTime: nextTime,
              alarmDismissed: false
            };
          }
        }
        return { ...todo, alarmDismissed: true };
      }
      return todo;
    });
    saveTodos(updated);
    showToast('일정 알람을 확인 완료 처리했습니다.', 'success');
  };

  const handleSnoozeAlarm = (todoId: string) => {
    if (audioStopper) {
      audioStopper();
      setAudioStopper(null);
    }
    setActiveAlarmTodo(null);

    // Set next alarm threshold for 5 minutes later
    const snoozeTime = new Date(Date.now() + 5 * 1000 * 60).toISOString();

    const updated = todos.map((todo) => {
      if (todo.id === todoId) {
        return { 
          ...todo, 
          alarmTime: snoozeTime,
          alarmDismissed: false 
        };
      }
      return todo;
    });
    saveTodos(updated);
    showToast('알림을 5분 뒤로 연기했습니다 (스누즈).', 'info');
  };

  // Manual trigger to sync a todo card to Google Calendar
  const handleManualSyncToCalendar = async (todo: Todo) => {
    let currentToken = googleAccessToken;

    // Trigger Google Sign-In automatically if token missing
    if (!currentToken) {
      try {
        showToast('구글 로그인 연동이 필요합니다...', 'info');
        const loginResult = await googleSignIn();
        if (loginResult) {
          setCurrentUser(loginResult.user);
          currentToken = loginResult.accessToken;
          setGoogleAccessToken(loginResult.accessToken);
        } else {
          return;
        }
      } catch (err) {
        showToast('Google 연동에 실패했습니다. 설정을 확인해 보세요.', 'error');
        return;
      }
    }

    if (!todo.dueDate) {
      showToast('캘린더에 연동하기 위해서는 마감일 설정이 필요합니다.', 'error');
      return;
    }

    try {
      showToast('구글 캘린더 일정 동기화 중...', 'info');
      const eventId = await syncTodoToGoogleCalendar(todo, currentToken!);

      const updated = todos.map((t) => {
        if (t.id === todo.id) {
          return {
            ...t,
            calendarEventId: eventId,
            calendarSynced: true,
          };
        }
        return t;
      });
      saveTodos(updated);
      showToast('Google Calendar에 일정을 성공적으로 연동했습니다!', 'success');
    } catch (err) {
      console.error(err);
      showToast('구글 캘린더 동기화에 실패했습니다. 다시 시도해 주세요.', 'error');
    }
  };

  // Create Todo
  const handleAddTodo = async (newTodoData: {
    title: string;
    description?: string;
    category: Exclude<Category, 'All'>;
    priority: Priority;
    dueDate?: string;
    subtasks: any[];
    alarmTime?: string;
    alarmRepeat?: AlarmRepeatType;
    alarmRepeatDays?: number[];
    alarmRepeatInterval?: number;
    alarmSound?: AlarmSoundType;
    syncToCalendar?: boolean;
  }) => {
    const newTodo: Todo = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTodoData.title,
      description: newTodoData.description,
      completed: false,
      category: newTodoData.category,
      priority: newTodoData.priority,
      dueDate: newTodoData.dueDate,
      subtasks: newTodoData.subtasks,
      alarmTime: newTodoData.alarmTime,
      alarmRepeat: newTodoData.alarmRepeat,
      alarmRepeatDays: newTodoData.alarmRepeatDays,
      alarmRepeatInterval: newTodoData.alarmRepeatInterval,
      alarmSound: newTodoData.alarmSound,
      createdAt: new Date().toISOString()
    };

    let updated = [newTodo, ...todos];

    // Handle automated calendar sync on creation
    if (newTodoData.syncToCalendar) {
      if (!newTodo.dueDate) {
        showToast('마감일이 설정되지 않아 캘린더 연동을 보류했습니다.', 'error');
      } else if (!googleAccessToken) {
        showToast('구글 로그인이 해제되어 자동 연동을 취소했습니다. 카드의 연동 버튼을 이용해 보세요.', 'info');
      } else {
        try {
          const eventId = await syncTodoToGoogleCalendar(newTodo, googleAccessToken);
          newTodo.calendarEventId = eventId;
          newTodo.calendarSynced = true;
          showToast('작성된 목표를 구글 캘린더에 등록 완료했습니다!', 'success');
        } catch (err) {
          console.error(err);
          showToast('자동 캘린더 예약 중 일부 요류가 생겼습니다.', 'error');
        }
      }
    }

    saveTodos(updated);
    setPrefilledCalendarDate('');
  };

  const handleAddTodoForCalendarDate = (dateStr: string) => {
    setPrefilledCalendarDate(dateStr);
    showToast(`🤖 ${dateStr.replace(/-/g, '. ')} 날짜 계획 추가 설정을 위해 입력 폼을 활성화합니다.`, 'info');
  };

  const handleAddTodoForCategory = (cat: Exclude<Category, 'All'>) => {
    setSelectedCategory(cat);
    const catKorean: Record<string, string> = {
      Work: '업무',
      Personal: '개인',
      Shopping: '쇼핑',
      Creative: '크리에이티브',
      Health: '건강'
    };
    showToast(`📂 [${catKorean[cat] || cat}] 영역에 새로운 할 일을 바로 등록할 수 있도록 설정했습니다.`, 'info');
    const formElement = document.getElementById('add-todo-wrapper');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleUpdateTodoCategory = (todoId: string, newCategory: Exclude<Category, 'All'>) => {
    const updated = todos.map(t => {
      if (t.id === todoId) {
        return { ...t, category: newCategory };
      }
      return t;
    });
    saveTodos(updated);
    const catKorean: Record<string, string> = {
      Work: '업무',
      Personal: '개인',
      Shopping: '쇼핑',
      Creative: '크리에이티브',
      Health: '건강'
    };
    showToast(`✨ 일정이 [${catKorean[newCategory] || newCategory}] 영역으로 재분류되었습니다.`, 'success');
  };

  // Drag & Drop event handlers
  const handleDragStart = (e: DragEvent, id: string) => {
    setDraggedTodoId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: DragEvent, id: string) => {
    e.preventDefault();
    if (draggedTodoId === id) return;
    setDraggedOverTodoId(id);
  };

  const handleDrop = (e: DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTodoId || draggedTodoId === targetId) return;

    // Find indices in full todos state array
    const sourceIndex = todos.findIndex(t => t.id === draggedTodoId);
    const targetIndex = todos.findIndex(t => t.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedTodoId(null);
      setDraggedOverTodoId(null);
      return;
    }

    const newTodos = [...todos];
    const [movedTodo] = newTodos.splice(sourceIndex, 1);
    newTodos.splice(targetIndex, 0, movedTodo);

    saveTodos(newTodos);

    if (sortBy !== 'custom') {
      setSortBy('custom');
      showToast('🤖 직접 드래그로 정렬 모드가 활성화되어 [직접 정렬] 순서로 전환되었습니다!', 'success');
    } else {
      showToast('🤖 계획 순서가 마우스 드래그로 깔끔하게 정렬되었습니다.', 'success');
    }

    setDraggedTodoId(null);
    setDraggedOverTodoId(null);
  };

  const handleDragEnd = () => {
    setDraggedTodoId(null);
    setDraggedOverTodoId(null);
  };

  // Toggle Todo Complete
  const handleToggleTodo = async (id: string, clickCoordinates?: { x: number; y: number }) => {
    const targetTodo = todos.find(t => t.id === id);
    if (!targetTodo) return;

    const nextCompleted = !targetTodo.completed;
    if (nextCompleted) {
      spawnConfetti(clickCoordinates);
    }

    let updatedTodo: Todo = {
      ...targetTodo,
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
      subtasks: targetTodo.subtasks?.map(s => ({ ...s, completed: nextCompleted })) || []
    };

    // Update synced calendar event's title (e.g. "[완료] 3D 작업")
    if (targetTodo.calendarSynced && targetTodo.calendarEventId && googleAccessToken) {
      try {
        const cleanTitle = targetTodo.title.replace(/^\[완료\]\s*/, '');
        const nextTitle = nextCompleted ? `[완료] ${cleanTitle}` : cleanTitle;

        const updatedSync: Todo = {
          ...updatedTodo,
          title: nextTitle
        };
        await syncTodoToGoogleCalendar(updatedSync, googleAccessToken);
      } catch (e) {
        console.warn('Silent Google Calendar status update failed:', e);
      }
    }

    const updated = todos.map((todo) => {
      if (todo.id === id) {
        return updatedTodo;
      }
      return todo;
    });
    saveTodos(updated);
  };

  // Toggle Subtask Checked
  const handleToggleSubtask = async (todoId: string, subtaskId: string) => {
    const targetTodo = todos.find(t => t.id === todoId);
    if (!targetTodo) return;

    let updatedTodo: Todo | null = null;

    const updated = todos.map((todo) => {
      if (todo.id === todoId) {
        const updatedSubtasks = todo.subtasks.map((sub) => {
          if (sub.id === subtaskId) {
            return { ...sub, completed: !sub.completed };
          }
          return sub;
        });

        const allCompleted = updatedSubtasks.every(s => s.completed);
        const wasCompleted = todo.completed;
        const nextCompleted = updatedSubtasks.length > 0 ? allCompleted : todo.completed;

        if (nextCompleted && !wasCompleted) {
          spawnConfetti();
        }

        updatedTodo = {
          ...todo,
          subtasks: updatedSubtasks,
          completed: nextCompleted,
          completedAt: nextCompleted && !wasCompleted ? new Date().toISOString() : todo.completedAt
        };

        return updatedTodo;
      }
      return todo;
    });

    if (updatedTodo && (updatedTodo as Todo).calendarSynced && (updatedTodo as Todo).calendarEventId && googleAccessToken) {
      try {
        const cleanTitle = (updatedTodo as Todo).title.replace(/^\[완료\]\s*/, '');
        const nextTitle = (updatedTodo as Todo).completed ? `[완료] ${cleanTitle}` : cleanTitle;

        const updatedSync: Todo = {
          ...(updatedTodo as Todo),
          title: nextTitle
        };
        await syncTodoToGoogleCalendar(updatedSync, googleAccessToken);
      } catch (e) {
        console.warn('Subtasks sync event update issue:', e);
      }
    }

    saveTodos(updated);
  };

  // Delete Todo (Step 2 user confirmation mandatory for Workspace deletes)
  const handleDeleteTodo = (id: string) => {
    const targetTodo = todos.find(t => t.id === id);
    if (!targetTodo) return;

    let promptText = `"${targetTodo.title}" 계획을 정말 안전하게 완전 삭제할까요?`;
    if (targetTodo.calendarSynced && targetTodo.calendarEventId) {
      promptText = `"${targetTodo.title}" 계획을 삭제하면 Google Calendar에 저장되어 있는 예약 일정도 함께 완전히 삭제됩니다.\n계속 진행하시겠습니까?`;
    }

    setConfirmModal({
      isOpen: true,
      title: '일정/목표 삭제',
      message: promptText,
      confirmText: '삭제',
      cancelText: '취소',
      isDestructive: true,
      onConfirm: async () => {
        if (targetTodo.calendarSynced && targetTodo.calendarEventId && googleAccessToken) {
          try {
            await deleteTodoFromGoogleCalendar(targetTodo.calendarEventId, googleAccessToken);
          } catch (err) {
            console.warn('Silent Google Calendar delete fail:', err);
          }
        }

        const updated = todos.filter(t => t.id !== id);
        saveTodos(updated);
        showToast('일정을 안전하게 삭제했습니다.', 'success');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Edit Todo Handlers
  const handleEditClick = (todo: Todo) => {
    setEditingTodo(todo);
    setIsEditModalOpen(true);
  };

  const handleEditTodo = async (todoId: string, updatedFields: Partial<Todo>) => {
    const updated = todos.map((todo) => {
      if (todo.id === todoId) {
        const nextTodo = { ...todo, ...updatedFields };
        
        // Synchronize updated info with Google Calendar if it has been synced
        if (nextTodo.calendarSynced && nextTodo.calendarEventId && googleAccessToken) {
          syncTodoToGoogleCalendar(nextTodo, googleAccessToken).catch((err) => {
            console.warn('Silent Google Calendar sync during edit failure:', err);
          });
        }
        return nextTodo;
      }
      return todo;
    });

    saveTodos(updated);
    showToast('일정 세부 정보가 성공적으로 변경되었습니다.', 'success');
  };

  // Filter & Search & Sort logic
  const filteredTodos = todos
    .filter((todo) => {
      const matchCategory = selectedCategory === 'All' || todo.category === selectedCategory;
      const matchSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          todo.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' || 
                          (statusFilter === 'Completed' && todo.completed) || 
                          (statusFilter === 'Active' && !todo.completed);
      return matchCategory && matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'custom') {
        return todos.indexOf(a) - todos.indexOf(b);
      }
      if (sortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'priority') {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return 0;
    });

  const renderCorePlannerContent = () => (
    <div className={`mx-auto flex flex-col gap-6 relative z-10 ${isMobileSimulator ? 'w-full max-w-full p-3' : 'max-w-4xl gap-8 px-4 py-8 sm:px-6 lg:px-8 pb-20'}`} id="main-content-layout">

      {/* 🛠️ Top Bar: View Mode Switcher (PC, 태블릿, 모바일), 바탕화면 앱 다운로드, 개발자 도구 */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2.5 px-1 pt-1 pb-1 relative z-20" id="top-utility-bar">
        {/* Device View Mode Switcher */}
        <div className="flex items-center gap-1 bg-white/70 dark:bg-slate-850/70 p-1 rounded-2xl border border-slate-300/70 dark:border-slate-700/70 backdrop-blur-md shadow-xs">
          <button
            type="button"
            onClick={() => {
              setDeviceViewMode('pc');
              showToast('💻 PC 와이드 뷰 화면으로 전환되었습니다.', 'info');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer active:scale-95 ${
              deviceViewMode === 'pc'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-150/60 dark:hover:bg-slate-800'
            }`}
            id="view-mode-pc-btn"
            title="PC 와이드 화면 모드"
          >
            <Laptop size={13} className="stroke-[2.5]" />
            <span>PC 뷰</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setDeviceViewMode('tablet');
              showToast('📟 태블릿 뷰 시뮬레이터로 전환되었습니다.', 'info');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer active:scale-95 ${
              deviceViewMode === 'tablet'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-150/60 dark:hover:bg-slate-800'
            }`}
            id="view-mode-tablet-btn"
            title="태블릿 (아이패드) 화면 모드"
          >
            <Tablet size={13} className="stroke-[2.5]" />
            <span>태블릿 뷰</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDeviceViewMode('mobile');
              showToast('📱 스마트폰 모바일 뷰 시뮬레이터로 전환되었습니다.', 'info');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer active:scale-95 ${
              deviceViewMode === 'mobile'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-150/60 dark:hover:bg-slate-800'
            }`}
            id="view-mode-mobile-btn"
            title="모바일 스마트폰 화면 모드"
          >
            <Smartphone size={13} className="stroke-[2.5]" />
            <span>모바일 뷰</span>
          </button>
        </div>

        {/* Right side actions: 바탕화면 앱 다운로드 & 개발자 도구 */}
        <div className="flex items-center gap-2">
          {/* 바탕화면 앱 다운로드 단추 */}
          <button
            type="button"
            onClick={() => {
              if (deferredPrompt) {
                handleInstallClick();
              } else {
                setShowInstallGuide(true);
              }
            }}
            className="flex items-center gap-1.5 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 text-white px-3.5 py-1.5 rounded-xl cursor-pointer shadow-md shadow-emerald-500/15 transition-all duration-200 hover:scale-[1.02] active:scale-95"
            id="top-pwa-install-btn"
            title="바탕화면 / 스마트폰 홈 화면에 앱 다운로드 및 설치"
          >
            <Download size={13} className="stroke-[2.5]" />
            <span>바탕화면 앱 다운로드</span>
          </button>

          {/* Dev Tools Trigger Button (아이콘 선택 & 소장, 다운로드 센터, 백업/복원) */}
          <button
            type="button"
            onClick={() => setShowDevTools(true)}
            className="flex items-center gap-1.5 text-xs font-black bg-white/80 hover:bg-white dark:bg-slate-850/80 dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-xs transition-all duration-200 hover:scale-[1.02] active:scale-95 backdrop-blur-md"
            id="open-dev-tools-btn"
            title="개발자 도구 (3D 아이콘 테마 교체, 소스코드 다운로드 센터, 백업)"
          >
            <Settings size={12} className="text-emerald-600 dark:text-emerald-400 animate-spin animate-duration-[10000ms]" />
            <span>🛠️ 개발자 도구</span>
          </button>
        </div>
      </div>

      {/* Main Title Banner */}
      <header className="text-center flex flex-col items-center mt-2 mb-6 relative z-10" id="main-header">
        {/* 상단 엠블럼 아이콘 (3D 에메랄드 글래스 큐브 아이콘) */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden shadow-xl border border-emerald-500/40 flex items-center justify-center bg-emerald-500/10 mb-3 transform hover:scale-105 transition-all"
        >
          <img 
            src={CUBE_ICON_DATA} 
            alt="3D Glass Cube App Icon" 
            className="w-full h-full object-cover" 
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.35 }}
          className="text-5xl sm:text-6xl md:text-7xl font-black font-display tracking-widest uppercase text-emerald-800 dark:text-emerald-400 filter drop-shadow-[0_3px_6px_rgba(4,120,87,0.3)] mb-1 transition-all duration-300 select-none"
          id="vivid-bloom-title"
        >
          Master Planner
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-widest uppercase font-display select-none"
        >
          3D Glass Planner
        </motion.div>

        {/* 🌟 타이틀 바로 아래: 구글 캘린더 연동 로그인 단추 + 어둡게/밝게 단추 (투명한 사각형 단추) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-2.5 mt-5"
          id="title-sub-controls"
        >
          {/* Google Calendar 연동 로그인 / 사용자 계정 상태 */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-transparent border border-emerald-600/80 dark:border-emerald-300 rounded-none px-3.5 py-1.5 shadow-xs">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Google Avatar" className="w-5 h-5 rounded-none border border-emerald-400 shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-5 h-5 rounded-none bg-emerald-600 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                  {currentUser.displayName ? currentUser.displayName[0] : (currentUser.email ? currentUser.email[0].toUpperCase() : 'G')}
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-black text-slate-850 dark:text-slate-50 leading-tight">
                  {currentUser.displayName || 'Google 사용자'}
                </span>
                <span className="text-[9px] text-slate-600 dark:text-slate-200 font-mono leading-none">
                  {currentUser.email}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-1.5 flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-200 hover:bg-rose-500/10 border border-rose-400 dark:border-rose-400 rounded-none px-2 py-1 transition-all cursor-pointer active:scale-95"
                id="title-google-logout-btn"
                title="Google 연동 해제"
              >
                <LogOut size={11} />
                <span>연동 해제</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex items-center gap-2 bg-transparent hover:bg-slate-500/10 dark:hover:bg-white/20 border border-slate-400/90 dark:border-slate-100 rounded-none px-4 py-2 text-xs font-black text-slate-850 dark:text-slate-50 transition-all duration-200 cursor-pointer active:scale-95 shadow-xs"
              id="title-google-login-btn"
            >
              <Calendar size={14} className="text-emerald-600 dark:text-emerald-300 shrink-0 stroke-[2.5]" />
              <span className="text-slate-850 dark:text-slate-50 font-black">google calendar 연동</span>
            </button>
          )}

          {/* Dark Mode Toggle Button (다크모드 / 라이트모드 - 투명 사각형 단추) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 bg-transparent hover:bg-slate-500/10 dark:hover:bg-white/20 border border-slate-400/90 dark:border-slate-100 rounded-none px-4 py-2 text-xs font-black text-slate-850 dark:text-slate-50 transition-all duration-200 cursor-pointer active:scale-95 shadow-xs"
            id="title-theme-toggle-btn"
          >
            {theme === 'light' ? (
              <>
                <Moon size={14} className="text-indigo-600 dark:text-indigo-300 stroke-[2.5]" />
                <span className="text-slate-850 dark:text-slate-50 font-black">다크모드</span>
              </>
            ) : (
              <>
                <Sun size={14} className="text-amber-300 animate-spin animate-duration-[10000ms] stroke-[2.5]" />
                <span className="text-slate-850 dark:text-slate-50 font-black">라이트모드</span>
              </>
            )}
          </button>
        </motion.div>
      </header>

      {/* Dashboard completion analytics block */}
      <TodoStats 
        todos={todos} 
        selectedCategory={selectedCategory} 
        setSelectedCategory={setSelectedCategory} 
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Input adding panel trigger */}
      <AddTodoForm 
        onAddTodo={handleAddTodo} 
        prefilledDate={prefilledCalendarDate}
        onClearPrefilledDate={() => setPrefilledCalendarDate('')}
      />

      {/* Active Filter Indicators Bar */}
      <AnimatePresence>
        {(selectedCategory !== 'All' || statusFilter !== 'All') && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-600/5 to-transparent border border-emerald-500/20 backdrop-blur-md shadow-sm overflow-hidden"
            id="active-filters-info-bar"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex flex-wrap gap-1.5 items-center">
                <span className="font-bold text-slate-800 dark:text-white">필터 적용됨:</span>
                {selectedCategory !== 'All' && (
                  <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-lg text-[10px]">
                    {selectedCategory === 'Work' ? '업무' :
                     selectedCategory === 'Personal' ? '개인' :
                     selectedCategory === 'Shopping' ? '쇼핑' :
                     selectedCategory === 'Creative' ? '크리에이티브' : '건강'} 분류
                  </span>
                )}
                {statusFilter !== 'All' && (
                  <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-lg text-[10px]">
                    {statusFilter === 'Completed' ? '완료됨' : '진행중'} 상태
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-mono">({filteredTodos.length}개 작업 표시 중)</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setSelectedCategory('All');
                setStatusFilter('All');
              }}
              className="px-3 py-1 text-[10px] font-black text-rose-650 hover:text-white bg-rose-50 border border-rose-100 hover:bg-rose-550 hover:border-transparent rounded-lg transition-all duration-300 cursor-pointer shadow-2xs active:scale-95 shrink-0"
              id="clear-all-filters-btn"
            >
              모든 필터 해제
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📋 등록된 일정 헤더 영역 */}
      <div className="w-full flex items-center justify-between px-2 pt-1" id="registered-todos-header-title">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
          <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
            <span>📋 등록된 일정</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300/60 dark:border-emerald-700/50 px-2.5 py-0.5 rounded-full">
              총 {todos.length}개
            </span>
          </h2>
        </div>
      </div>

      {mainViewMode === 'calendar' ? (
        <CalendarView
          todos={todos}
          onToggleTodo={handleToggleTodo}
          onToggleSubtask={handleToggleSubtask}
          onDeleteTodo={handleDeleteTodo}
          onEditClick={handleEditClick}
          onAddTodoForDate={handleAddTodoForCalendarDate}
          theme={theme}
          onSwitchToList={() => setMainViewMode('list')}
        />
      ) : (
        <>
          {/* Search, filters & sorts controls row */}
          <div 
            className="flex flex-col sm:flex-row gap-3 items-center justify-between overflow-visible relative z-30 rounded-2xl border border-white/40 bg-white/40 p-4 backdrop-blur-md shadow-lg shadow-emerald-555/5"
            id="filtering-controls-row"
          >
            {/* Glass Search Input */}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="작업 제목 또는 설명 검색..."
                className="w-full rounded-xl border border-slate-250/60 bg-white/70 py-2 pl-10 pr-4 text-xs font-bold text-slate-800 placeholder-slate-500 outline-none transition-all duration-300 focus:border-emerald-400 focus:bg-white focus:ring-1 focus:ring-emerald-500/10 shadow-sm"
                id="search-input-field"
              />
            </div>

            {/* Sorter Selector options via Dropdown & Month/Week View Button */}
            <div className="relative flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end" id="sort-selector-dropdown-container">
              <div className="flex items-center gap-1.5">
                <ListFilter size={14} className="text-slate-600 dark:text-slate-400 mr-0.5" />
                <span className="text-[11px] text-slate-705 dark:text-slate-300 font-bold uppercase">정렬 기준:</span>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold leading-none text-slate-755 dark:text-slate-200 bg-white/70 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-300/70 dark:border-slate-705 rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
                    id="sort-by-dropdown-trigger"
                  >
                    {/* Icon of selected sorting option */}
                    {(() => {
                      const activeLabels = {
                        latest: { text: '최신순', icon: ArrowDownAZ },
                        dueDate: { text: '기한순', icon: CalendarDays },
                        priority: { text: '중요순', icon: FlameKindling },
                        custom: { text: '직접 정렬', icon: Move }
                      };
                      const ActiveIcon = activeLabels[sortBy].icon;
                      return (
                        <>
                          <ActiveIcon size={12} className="text-emerald-600 dark:text-emerald-400" />
                          <span>{activeLabels[sortBy].text}</span>
                        </>
                      );
                    })()}
                    <ChevronDown size={11} className={`text-slate-500 transition-transform duration-250 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown element with motion */}
                  <AnimatePresence>
                    {isSortDropdownOpen && (
                      <>
                        {/* Backdrop overlay to close when clicked outside */}
                        <div 
                          className="fixed inset-0 z-[90]" 
                          onClick={() => setIsSortDropdownOpen(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-1 w-30 bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 rounded-xl shadow-xl p-1 z-[100] flex flex-col gap-0.5 text-left"
                          id="sort-by-dropdown-menu"
                        >
                          {([
                            { key: 'latest', text: '최신순', icon: ArrowDownAZ },
                            { key: 'dueDate', text: '기한순', icon: CalendarDays },
                            { key: 'priority', text: '중요순', icon: FlameKindling },
                            { key: 'custom', text: '직접 정렬', icon: Move }
                          ] as const).map((opt) => {
                            const isSelected = sortBy === opt.key;
                            const OptIcon = opt.icon;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => {
                                  setSortBy(opt.key);
                                  setIsSortDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2 py-1.2 text-left text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-emerald-650 text-white shadow-sm shadow-emerald-500/10' 
                                    : 'text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                                }`}
                                id={`sort-dropdown-option-${opt.key}`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <OptIcon size={11} className={isSelected ? 'text-white' : 'text-slate-500'} />
                                  <span>{opt.text}</span>
                                </span>
                                {isSelected && (
                                  <span className="h-1 w-1 rounded-full bg-white font-mono" />
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 📅 월/주로 보기 단추 */}
              <button
                type="button"
                onClick={() => setMainViewMode('calendar')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/50 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
                id="btn-switch-to-calendar-view"
              >
                <CalendarDays size={13} />
                <span>월/주로 보기</span>
              </button>
            </div>
          </div>

          {/* Dynamic Interactive Tasks Grid Container */}
          <div className="flex flex-col gap-4" id="todos-grid-container">
            <AnimatePresence mode="popLayout">
              {filteredTodos.length > 0 ? (
                filteredTodos.map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onToggleTodo={handleToggleTodo}
                    onToggleSubtask={handleToggleSubtask}
                    onDeleteTodo={handleDeleteTodo}
                    onSyncToCalendar={handleManualSyncToCalendar}
                    onEditClick={handleEditClick}
                    onCategoryClick={setSelectedCategory}
                    draggableProps={{
                      draggable: true,
                      onDragStart: (e) => handleDragStart(e, todo.id),
                      onDragOver: (e) => handleDragOver(e, todo.id),
                      onDrop: (e) => handleDrop(e, todo.id),
                      onDragEnd: handleDragEnd,
                    }}
                    isDragging={draggedTodoId === todo.id}
                    isDragOver={draggedOverTodoId === todo.id}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-slate-300 bg-white/30 backdrop-blur-sm"
                  id="empty-todos-fallback"
                >
                  <div className="p-4 rounded-full bg-emerald-50 border border-emerald-100 mb-4 text-emerald-600">
                    <CheckCircle size={32} className="opacity-80" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">검색된 할 일이 없습니다</h3>
                  <p className="text-xs text-slate-700 max-w-xs text-center leading-relaxed font-bold">
                    필터를 변경하거나 새로운 할 일을 보드에 추가해서 일과를 채워보세요.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Elegantly styled Bottom Anchor area for Healing & Consultations with soft horizontal divider */}
      <div className="w-full pt-8 pb-2 border-t border-dashed border-slate-300/65 dark:border-slate-800/60 mt-4" id="bottom-healing-services-divider">
        <div className="flex items-center gap-2 px-2 mb-2 justify-center sm:justify-start">
          <div className="h-6 w-1 rounded-full bg-emerald-500" />
          <div className="text-left">
            <h4 className="text-xs font-black tracking-widest text-emerald-800 dark:text-emerald-400 uppercase">AI 정밀 진단 & 마음 힐링 저널</h4>
            <p className="text-[10px] text-slate-500 font-bold dark:text-slate-400">일정 기반 AI 피드백 모델 및 오늘의 감사 일기장</p>
          </div>
        </div>

        {/* Interactive Mind Healing Journal & AI Productivity Diagnosis Section */}
        <HealingJournalSection
          todos={todos}
          onAddTodoFromAI={handleAddTodoFromAI}
          showToast={showToast}
          theme={theme}
        />
      </div>

    </div>
  );

  return (
    <div className={`relative min-h-screen font-sans transition-all duration-500 isolate ${theme === 'dark' ? 'text-slate-100 dark bg-transparent' : 'text-slate-800 bg-transparent'}`}>
      {/* Background blobs applied globally behind everything if NOT in simulated mobile view */}
      {!isMobileSimulator && <BackgroundBlobs theme={theme} />}

      {/* Canvas Confetti renderer at the absolute root */}
      <ConfettiEffect 
        particles={particles} 
        onComplete={() => setParticles([])} 
      />

      {deviceViewMode === 'mobile' ? (
        <div className={`hidden sm:flex min-h-screen items-center justify-center p-4 relative select-none transition-colors duration-500 ${theme === 'dark' ? 'bg-[#18100b]' : 'bg-[#eef2ff]'}`}>
          {/* Dynamic glowing workspace ambient points */}
          <div className={`absolute top-[10%] left-[20%] w-72 h-72 rounded-full blur-3xl animate-pulse transition-colors duration-500 ${theme === 'dark' ? 'bg-orange-500/10' : 'bg-emerald-500/10'}`} />
          <div className={`absolute bottom-[10%] right-[25%] w-96 h-96 rounded-full blur-3xl animate-pulse transition-colors duration-500 ${theme === 'dark' ? 'bg-amber-500/10' : 'bg-teal-500/10'}`} />

          {/* Floating simulator action helper head banner */}
          <div className={`absolute top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 backdrop-blur-md px-4 py-1.5 rounded-full border shadow-lg transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-900/90 border-slate-700 text-slate-200' : 'bg-white/90 border-slate-200 text-slate-800'}`}>
            <span className="flex h-2 w-2 rounded-full animate-ping bg-emerald-400" />
            <span className="text-[11px] font-black tracking-wide font-mono mr-1">📱 모바일 뷰 모드</span>
            <button
              onClick={() => setDeviceViewMode('pc')}
              className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              💻 PC
            </button>
            <button
              onClick={() => setDeviceViewMode('tablet')}
              className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              📟 태블릿
            </button>
          </div>

          {/* iPhone 15 style smartphone mock bezel container */}
          <div className="relative w-[385px] h-[815px] rounded-[52px] bg-slate-950 p-[11px] shadow-[0_20px_50px_rgba(0,0,0,0.85)] border-4 border-slate-800 flex flex-col overflow-hidden transition-all duration-300 hover:scale-[1.005]">
            
            {/* Dynamic island notch capsule */}
            <div className="absolute top-[15px] left-1/2 -translate-x-1/2 w-[110px] h-[28px] rounded-full bg-black z-50 flex items-center justify-between px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-950/40" />
            </div>

            {/* Dynamic Speaker strip */}
            <div className="absolute top-[7px] left-1/2 -translate-x-1/2 w-[36px] h-[3px] rounded-full bg-neutral-800 z-50" />

            {/* Simulated iOS status indicator head */}
            <div className={`relative w-full h-full rounded-[42px] border flex flex-col overflow-hidden select-text transition-all duration-500 ${
              theme === 'dark' ? 'bg-[#18100b] border-amber-950/30' : 'bg-[#f4f7fb] border-slate-200/80'
            }`}>
              <div className={`h-[43px] shrink-0 border-b flex items-end justify-between px-6 pb-2.5 text-[9px] font-extrabold font-mono z-40 select-none transition-all duration-500 ${
                theme === 'dark' ? 'bg-[#221710]/70 text-amber-200/90 border-amber-950/30 backdrop-blur-md' : 'bg-white/75 text-slate-800 border-slate-100 backdrop-blur-md'
              }`}>
                <span>{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })} 📅</span>
                <div className="flex items-center gap-1.5">
                  <span>5G</span>
                  <div className="w-3.5 h-2 border border-slate-850 rounded-2xs flex items-center p-0.5">
                    <div className="w-full h-full bg-emerald-600 rounded-3xs" />
                  </div>
                </div>
              </div>

              {/* actual app body container */}
              <div className="flex-1 overflow-y-auto [scrollbar-width:none] transition-colors duration-500 relative bg-transparent isolate">
                <BackgroundBlobs theme={theme} isAbsolute={true} />
                {renderCorePlannerContent()}
              </div>

              {/* iOS bottom safebar home strip */}
              <div className="h-[21px] shrink-0 bg-white/55 flex items-center justify-center pb-2 z-40 select-none">
                <div className="w-[125px] h-[4px] rounded-full bg-slate-400" />
              </div>
            </div>
          </div>
        </div>
      ) : deviceViewMode === 'tablet' ? (
        <div className={`hidden sm:flex min-h-screen items-center justify-center p-4 relative select-none transition-colors duration-500 ${theme === 'dark' ? 'bg-[#18100b]' : 'bg-[#eef2ff]'}`}>
          {/* Dynamic glowing workspace ambient points */}
          <div className={`absolute top-[10%] left-[20%] w-80 h-80 rounded-full blur-3xl animate-pulse transition-colors duration-500 ${theme === 'dark' ? 'bg-orange-500/10' : 'bg-emerald-500/10'}`} />
          <div className={`absolute bottom-[10%] right-[25%] w-96 h-96 rounded-full blur-3xl animate-pulse transition-colors duration-500 ${theme === 'dark' ? 'bg-amber-500/10' : 'bg-teal-500/10'}`} />

          {/* Floating simulator action helper head banner */}
          <div className={`absolute top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 backdrop-blur-md px-4 py-1.5 rounded-full border shadow-lg transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-900/90 border-slate-700 text-slate-200' : 'bg-white/90 border-slate-200 text-slate-800'}`}>
            <span className="flex h-2 w-2 rounded-full animate-ping bg-emerald-400" />
            <span className="text-[11px] font-black tracking-wide font-mono mr-1">📟 태블릿 뷰 모드</span>
            <button
              onClick={() => setDeviceViewMode('pc')}
              className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              💻 PC
            </button>
            <button
              onClick={() => setDeviceViewMode('mobile')}
              className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              📱 모바일
            </button>
          </div>

          {/* iPad style tablet mock bezel container */}
          <div className="relative w-[768px] max-w-[95vw] h-[860px] rounded-[38px] bg-slate-950 p-[12px] shadow-[0_20px_50px_rgba(0,0,0,0.85)] border-4 border-slate-800 flex flex-col overflow-hidden transition-all duration-300 hover:scale-[1.005]">
            {/* Tablet Camera dot */}
            <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-800 z-50" />

            <div className={`relative w-full h-full rounded-[28px] border flex flex-col overflow-hidden select-text transition-all duration-500 ${
              theme === 'dark' ? 'bg-[#18100b] border-amber-950/30' : 'bg-[#f4f7fb] border-slate-200/80'
            }`}>
              {/* actual app body container */}
              <div className="flex-1 overflow-y-auto [scrollbar-width:thin] transition-colors duration-500 relative bg-transparent isolate p-2">
                <BackgroundBlobs theme={theme} isAbsolute={true} />
                {renderCorePlannerContent()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        renderCorePlannerContent()
      )}

      {/* Quick view switcher floating on bottom right during PC view */}
      {deviceViewMode === 'pc' && (
        <div className="hidden sm:flex fixed bottom-4 right-4 z-40 items-center gap-1.5 p-1 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md rounded-full border border-slate-700/80 shadow-xl">
          <button
            onClick={() => {
              setDeviceViewMode('tablet');
              showToast('📟 태블릿 뷰로 전환되었습니다.', 'info');
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-full hover:bg-slate-800 transition-all cursor-pointer"
            title="태블릿 뷰 전환"
          >
            <Tablet size={12} />
            <span>태블릿 뷰</span>
          </button>
          <button
            onClick={() => {
              setDeviceViewMode('mobile');
              showToast('📱 모바일 뷰로 전환되었습니다.', 'info');
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-full hover:bg-slate-800 transition-all cursor-pointer"
            title="모바일 뷰 전환"
          >
            <Smartphone size={12} />
            <span>모바일 뷰</span>
          </button>
        </div>
      )}

      {/* 3D Glassmorphic Alarm Overlay Modal */}
      <AnimatePresence>
        {activeAlarmTodo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="alarm-fixed-overlay">
            {/* Dark glass backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => handleDismissAlarm(activeAlarmTodo.id)}
            />

            {/* Glowing red accent backdrop spot */}
            <div className="absolute w-72 h-72 rounded-full bg-rose-500/10 blur-3xl" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30, rotateX: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30, rotateX: 10 }}
              transition={{ type: 'spring', damping: 15 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-300/40 bg-white/75 p-6 shadow-2xl backdrop-blur-2xl [transform-style:preserve-3d] [perspective:1000px] text-center"
              id="alarm-modal-body"
            >
              {/* Core visual alarm bell */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-rose-500/15 blur-md" />
                  <motion.div 
                    animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, repeatType: 'loop' }}
                    className="h-14 w-14 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 relative z-10 shadow-inner shadow-rose-500/20"
                  >
                    <Bell size={28} />
                  </motion.div>
                </div>
              </div>

              {/* Title and texts */}
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-105 border border-rose-250 px-2.5 py-0.5 text-[10px] font-black text-rose-800 uppercase tracking-widest mb-2 font-mono animate-pulse">
                ALARM TRIGGERED
              </span>

              <h2 className="text-xl font-black text-slate-950 leading-tight mb-2 tracking-tight">
                {activeAlarmTodo.title}
              </h2>

              {activeAlarmTodo.description && (
                <p className="text-xs text-slate-700 leading-relaxed max-h-24 overflow-y-auto mb-4 font-medium px-2">
                  {activeAlarmTodo.description}
                </p>
              )}

              {/* Alarm Time tracker */}
              <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold text-slate-650 font-mono mb-6 bg-slate-150/60 border border-slate-200 py-1.5 rounded-xl">
                <Clock size={12} />
                <span>알람 설정 시간: {activeAlarmTodo.alarmTime ? new Date(activeAlarmTodo.alarmTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSnoozeAlarm(activeAlarmTodo.id)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-3 text-xs transition-colors duration-205 cursor-pointer shadow-sm active:scale-95"
                  id="alarm-snooze-btn"
                >
                  <Clock size={14} className="text-slate-500" />
                  <span>5분 뒤 알람 (스누즈)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDismissAlarm(activeAlarmTodo.id)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold px-4 py-3 text-xs transition-colors duration-205 shadow-md hover:shadow-rose-500/10 active:scale-95 cursor-pointer"
                  id="alarm-dismiss-btn"
                >
                  <CheckCircle size={14} />
                  <span>알람 해제 완료</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🛠️ DEVELOPER TOOLS MODAL (개발자 전용 도구함: 모바일 뷰 시뮬레이터, 3D 아이콘 테마, 배포/다운로드 센터, 백업/복원) */}
      <AnimatePresence>
        {showDevTools && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 shadow-2xl overflow-y-auto" id="developer-tools-modal-overlay">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
              onClick={() => setShowDevTools(false)}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-300/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 p-5 sm:p-7 shadow-2xl backdrop-blur-2xl text-slate-800 dark:text-slate-100 z-10 max-h-[90vh] overflow-y-auto [scrollbar-width:thin]"
              id="developer-tools-modal-body"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowDevTools(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-250 dark:border-slate-700/50 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                id="dev-tools-close-btn"
              >
                ✕
              </button>

              {/* Title Section */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400">
                  <SlidersHorizontal size={22} className="stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                      개발자 전용 도구함 (Developer Studio)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      개발 / 테스트 전용
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    실제 사용자 화면에는 노출되지 않으며, 개발 단계에서 테스트·아이콘 변경·배포 패키지 추출을 위해 제공됩니다.
                  </p>
                </div>
              </div>

              <div className="space-y-6 text-left">
                {/* 1. 🎨 3D 글래스모피즘 앱 아이콘 선택 및 다운로드 */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-amber-500" />
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">3D 글래스모피즘 앱 아이콘 테마 선택 & 소장</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                    선택한 아이콘이 앱 헤더 브랜딩 및 PWA 파비콘으로 즉시 적용됩니다.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { 
                        key: 'original', 
                        name: '오리지널 클래식', 
                        url: '/icon_original.png', 
                        desc: '단정하고 직관적인 오리지널 파스텔 글래스모피즘',
                        badge: '기본 테마'
                      },
                      { 
                        key: 'emerald_lotus', 
                        name: '에메랄드 로터스', 
                        url: '/icon_emerald_lotus.jpg', 
                        desc: '네온 에메랄드 & 아쿠아마린 로터스 플라워 모티브',
                        badge: '차분함 & 치유'
                      },
                      { 
                        key: 'cosmic_nebula', 
                        name: '코스믹 네뷸라', 
                        url: '/icon_cosmic_nebula.jpg', 
                        desc: '무한 자색 은하의 깊은 오로라 질감과 3D 기하학',
                        badge: '창의성 & 몰입'
                      },
                      { 
                        key: 'polar_aurora', 
                        name: '폴라 오로라', 
                        url: '/icon_polar_aurora.jpg', 
                        desc: '아이스 코발트 블루와 민트 크리스탈의 하이테크 질감',
                        badge: '생산성'
                      }
                    ].map((candidate) => {
                      const isSelected = selectedIconKey === candidate.key;
                      return (
                        <div
                          key={candidate.key}
                          className={`p-3 rounded-xl border bg-white dark:bg-slate-900 flex flex-col justify-between transition-all ${
                            isSelected 
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' 
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="mb-2">
                            <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 mb-2">
                              <img
                                src={`${candidate.url}?v=${iconVersion}`}
                                alt={candidate.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute top-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full">
                                {candidate.badge}
                              </span>
                            </div>
                            <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-100">{candidate.name}</h5>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{candidate.desc}</p>
                          </div>
                          
                          <div className="space-y-1 mt-2">
                            <button
                              type="button"
                              onClick={() => handleSetIcon(candidate.key)}
                              className={`w-full py-1.5 rounded-lg text-[9px] font-black cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {isSelected ? '✓ 현재 적용됨' : '앱에 적용'}
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadIconAsFile(candidate.key)}
                              className="w-full py-1 rounded-lg text-[8.5px] font-bold bg-slate-200/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-300 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Download size={9} />
                              <span>PNG 다운로드</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. 📦 GitHub 배포 및 단독 실행용 파일 다운로드 센터 */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-2 mb-2">
                    <Download size={16} className="text-indigo-500" />
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">GitHub Pages PWA 자동 배포 & 다운로드 센터</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    GitHub Actions 자동 배포 워크플로우(.github), PWA 매니페스트, 서비스워커, 404 리다이렉트가 완비된 Vite 프로젝트 압축 파일 또는 무설치 단독 실행 HTML을 다운로드합니다.
                  </p>

                  <div className="space-y-2 mb-3">
                    {/* Primary Option: Vite GitHub Pages PWA Auto-Deploy Bundle */}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          showToast('📦 Vite PWA + GitHub Pages 자동 배포 패키지를 준비 중입니다...', 'info');
                          await downloadViteGitHubPagesPwaZip();
                          showToast('📦 GitHub Pages PWA 패키지 다운로드가 완료되었습니다!', 'success');
                        } catch (err) {
                          showToast('❌ PWA 패키지 다운로드 중 오류가 발생했습니다.', 'error');
                        }
                      }}
                      className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white shadow-md flex items-center justify-between gap-2 cursor-pointer transition-all active:scale-95 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                          <Download size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-black flex items-center gap-1.5">
                            <span>🚀 Vite PWA + GitHub Pages 자동 배포 패키지 (.ZIP)</span>
                            <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full">추천</span>
                          </div>
                          <div className="text-[9.5px] opacity-90">.github/workflows 자동 배포 + manifest + sw.js + 404.html 완비</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-white/15 px-2.5 py-1 rounded-lg shrink-0">다운로드</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Option 1: Standalone HTML */}
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          showToast('📄 단독 실행 HTML 파일을 생성 중입니다...', 'info');
                          downloadStandaloneHtmlFile();
                          showToast('📄 index.html 다운로드가 완료되었습니다!', 'success');
                        } catch (err) {
                          showToast('❌ 파일 다운로드 중 오류가 발생했습니다.', 'error');
                        }
                      }}
                      className="p-3 rounded-xl bg-slate-700 hover:bg-slate-800 text-white shadow-sm flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-center"
                    >
                      <Download size={16} />
                      <span className="text-[11px] font-black">단독 실행용 HTML</span>
                      <span className="text-[8.5px] opacity-80">더블클릭 즉시 실행</span>
                    </button>

                    {/* Option 2: Full Source Zip */}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          showToast('📦 전체 소스코드 ZIP을 생성 중입니다...', 'info');
                          await downloadSourceCodeZip();
                          showToast('📦 전체 소스코드 ZIP 다운로드가 완료되었습니다!', 'success');
                        } catch (err) {
                          showToast('❌ 프로젝트 압축 다운로드 중 오류가 발생했습니다.', 'error');
                        }
                      }}
                      className="p-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-sm flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-center"
                    >
                      <Download size={16} />
                      <span className="text-[11px] font-black">전체 소스코드 (.ZIP)</span>
                      <span className="text-[8.5px] opacity-80">TypeScript 프로젝트</span>
                    </button>

                    {/* Option 3: Modified Files Zip */}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          showToast('📦 변경된 핵심 파일 압축본을 생성 중입니다...', 'info');
                          await downloadModifiedFilesZip();
                          showToast('📦 변경 파일 압축 다운로드가 완료되었습니다!', 'success');
                        } catch (err) {
                          showToast('❌ 변경 파일 압축 다운로드 중 오류가 발생했습니다.', 'error');
                        }
                      }}
                      className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-center"
                    >
                      <Download size={16} />
                      <span className="text-[11px] font-black">핵심 파일 모음 (.ZIP)</span>
                      <span className="text-[8.5px] opacity-80">패치/업데이트용</span>
                    </button>
                  </div>
                </div>

                {/* 4. 💾 데이터 백업 및 복원 */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload size={16} className="text-emerald-500" />
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">플래너 데이터 백업 (JSON) & 복원</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    등록된 모든 일정 및 카테고리 데이터를 JSON 파일로 내보내거나 이전 백업본에서 복원합니다.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="py-2.5 px-3 rounded-xl border border-emerald-500 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] bg-white dark:bg-slate-900 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Download size={12} />
                      <span>데이터 백업 내보내기 (JSON)</span>
                    </button>

                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackup}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                      />
                      <button
                        type="button"
                        className="w-full h-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] bg-white dark:bg-slate-900 shadow-sm transition-all flex items-center justify-center gap-1.5 pointer-events-none"
                      >
                        <Upload size={12} />
                        <span>백업 파일 복원하기</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Footer Action */}
              <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDevTools(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black text-xs hover:opacity-90 transition-all cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3D Glassmorphic PWA Installation Help & Direct Installer Modal */}
      <AnimatePresence>
        {showInstallGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 shadow-2xl" id="pwa-install-overlay">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setShowInstallGuide(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 22 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-3xl backdrop-blur-2xl z-10 text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto"
              id="pwa-install-body"
            >
              {/* Header Close Trigger */}
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-250 dark:border-slate-700/50 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                id="pwa-install-close-btn"
              >
                ✕
              </button>

              <div className="flex flex-col items-center text-center">
                
                {/* Immersive Glassmorphic Floating Icon Housing */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative p-5 bg-gradient-to-tr from-slate-100 to-slate-200/50 dark:from-slate-850 dark:to-slate-900/50 rounded-full border border-slate-300/40 dark:border-slate-700/30 shadow-inner mb-4 flex items-center justify-center group"
                >
                  {/* Glowing neon shadow circle backboard */}
                  <div className="absolute inset-0 rounded-full blur-xl bg-emerald-500/10 group-hover:bg-emerald-500/25 transition-all duration-500" />
                  
                  {/* Glass shell holding favicon icon */}
                  <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 shadow-lg flex items-center justify-center bg-white/70 dark:bg-slate-950/70 p-1 backdrop-blur-xs">
                    <img
                      src="./icon-512x512/"
                      alt="3D Glassmorphic App Icon"
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </motion.div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
                  바탕화면 & 모바일 앱 다운로드
                </h2>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed max-w-sm">
                  입체 글래스모피즘 플래너를 바탕화면이나 스마트폰 홈 화면에 전용 앱으로 즐기세요! 인터넷 연결이 느려도 매끄럽게 동작합니다.
                </p>

                {/* ⚠️ CRITICAL ENVIRONMENT WARNING FOR RELIABLE PWA DEPLOYMENT */}
                <div className="w-full mb-5 p-4 bg-amber-50/90 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-500/30 rounded-2xl text-left shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-400">
                    <AlertCircle size={18} className="animate-pulse shrink-0" />
                    <span className="text-xs font-black tracking-tight uppercase">⚠️ [핵심 필독] 구글 AI 스튜디오 앱 오클릭 방지 안내!</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-bold leading-relaxed mb-3">
                    현재 보고 계신 브라우저는 <span className="text-rose-600 dark:text-rose-400 font-extrabold">AI Studio 개발용 프레임(iframe)</span>으로 감싸져 있습니다. <br />
                    이 상태에서 그냥 화면 우측 상단의 <strong>모니터 아이콘(앱 설치)</strong>을 누르시면, 이 플래너 앱이 아니라 <span className="text-indigo-600 dark:text-indigo-400 font-black">AI Studio 개발 도구(Google AI Studio) 자체가 PC에 앱으로 다운로드 설치</span>되어 버려 오동작하게 됩니다!
                  </p>
                  
                  {/* Glowing, high-impact CTA button to break out of iframe */}
                  <div className="flex flex-col items-center p-3 bg-white/70 dark:bg-slate-900/80 rounded-xl border border-amber-200 dark:border-amber-900/50">
                    <p className="text-[10px] text-slate-550 dark:text-slate-400 text-center font-bold mb-2.5">
                      아래 안전 단추를 클릭해 **전용 단독 창**으로 이동 후 바탕화면 다운로드를 실행해 주세요!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        window.open(window.location.href, '_blank');
                      }}
                      className="w-full max-w-xs py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md shadow-amber-500/15 cursor-pointer transform hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
                      id="break-out-iframe-btn"
                    >
                      <ExternalLink size={13} className="stroke-[2.5]" />
                      <span>💡 3D 플래너 단독 새 창으로 열기 (최고 권장)</span>
                    </button>
                  </div>
                </div>

                {/* Direct Instant Action Button: If browser supports direct prompt installer */}
                {deferredPrompt ? (
                  <div className="w-full mb-5 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-500/30 rounded-2xl text-center flex flex-col items-center">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 mb-2">
                      💡 원클릭 다운로드가 활성화되었습니다!
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleInstallClick();
                        setShowInstallGuide(false);
                      }}
                      className="w-full max-w-xs py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/15 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      id="pwa-direct-install-btn"
                    >
                      <Download size={14} />
                      <span>내 기기에 전용 플래너 앱 설치하기</span>
                    </button>
                  </div>
                ) : null}

                {/* Grid layout for structured instructions per device */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  
                  {/* Laptop / PC Guide frame */}
                  <div className="bg-slate-50/70 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-xl" id="guide-desktop-frame">
                    <div className="flex items-center gap-2 mb-2">
                      <Laptop size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-black text-slate-900 dark:text-white">💻 데스크톱 (PC) 완벽 설치</span>
                    </div>

                    <ol className="space-y-1.5 text-[11px] text-slate-650 dark:text-slate-350 font-semibold leading-relaxed">
                      <li className="flex gap-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400 shrink-0 font-bold">1.</span>
                        <span>먼저 위의 <strong>'3D 플래너 단독 새 창으로 열기'</strong> 버튼을 클릭하여 새 창으로 이동합니다.</span>
                      </li>
                      <li className="flex gap-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400 shrink-0 font-bold">2.</span>
                        <span>이동된 새 독립 브라우저 주소창 우측에서 <strong>'앱 설치' 버튼</strong>(모니터 모양 아이콘)을 발견하고 클릭합니다.</span>
                      </li>
                      <li className="flex gap-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400 shrink-0 font-bold">3.</span>
                        <span>상단 설치 동의 팝업창에서 <strong>'적용 및 설치'</strong>를 클릭해 주시면 바탕화면에 전용 고화질 3D 글래스 아이콘 앱으로 완벽히 생성됩니다!</span>
                      </li>
                    </ol>
                  </div>

                  {/* Smartphone Mobile Guide frame */}
                  <div className="bg-slate-50/70 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-xl flex flex-col justify-between" id="guide-mobile-frame">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Smartphone size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-black text-slate-900 dark:text-white">📱 모바일 (아이폰/안드로이드)</span>
                      </div>

                      <div className="space-y-2">
                        {/* iOS Safari */}
                        <div>
                          <div className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">아이폰 (Safari)</div>
                          <p className="text-[11px] text-slate-650 dark:text-slate-450 leading-normal">
                            하단 <strong>공유 버튼</strong>(네모+화살표) 클릭 후, 메뉴의 <strong>'홈 화면에 추가'</strong>(➕)를 누르세요.
                          </p>
                        </div>

                        {/* Android Chrome */}
                        <div className="border-t border-slate-250/30 pt-1.5 animate-pulse">
                          <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest font-mono">안드로이드 (Chrome)</div>
                          <p className="text-[11px] text-slate-650 dark:text-slate-450 leading-normal">
                            우측 상단 <strong>메뉴(점 3개)</strong>에서 <strong>'앱 설치'</strong> 또는 <strong>'홈 화면에 추가'</strong>를 누르세요.
                          </p>
                        </div>

                        {/* 🔥 CRITICAL WEBVIEW / IN-APP BROWSER WARNING BOX */}
                        <div className="mt-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-left flex gap-1.5 items-start">
                          <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400">⚠️ 카카오톡/네이버 앱 등 인앱브라우저 설치 금지</span>
                            <span className="text-[9px] text-slate-650 dark:text-slate-400 font-bold leading-relaxed">
                              카카오톡이나 네이버 앱 내부에서 열린 경우, 우측 상/하단의 [점 3개] 혹은 [나침반] 메뉴를 눌러 <strong>[다른 브라우저로 열기] (Chrome 혹은 Safari)</strong>를 선택한 뒤에 설치해야만 주소창이 사라진 <strong>'완벽한 독립형 모바일 앱'</strong>으로 다운로드됩니다!
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic QR Code scanner component */}
                    <div className="mt-4 p-3 rounded-xl bg-white/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center">
                      <div className="flex items-center gap-1 mb-2">
                        <QrCode size={11} className="text-emerald-500 animate-spin animate-duration-[10000ms]" />
                        <span className="text-[9px] font-black text-slate-700 dark:text-slate-350 uppercase">스마트폰 스캔 모바일 즉시 다운로드</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-md inline-block">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin)}`} 
                          alt="Mobile App PWA QR Code" 
                          className="w-24 h-24"
                        />
                      </div>
                      <p className="text-[8px] text-slate-500 dark:text-slate-450 font-bold leading-normal mt-1.5 max-w-[180px]">
                        스마트폰 카메라로 스캔하면 전용 주소로 즉시 이동하여 모바일 화면에 완벽 설치(다운로드)가 가능합니다!
                      </p>
                    </div>
                  </div>

                </div>

                {/* 📦 COMPLETE CUSTOM APP PACKAGE & HARDWARE RESTORE CENTER */}
                <div className="w-full mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-950/20 dark:to-teal-950/20 border-2 border-emerald-500/20 dark:border-emerald-500/30 text-left shadow-md" id="app-package-backup-center">
                  <div className="flex items-center gap-2 mb-3 text-emerald-800 dark:text-emerald-400">
                    <Database size={16} className="shrink-0 animate-bounce" />
                    <span className="text-xs font-black tracking-tight uppercase">📦 [완제품 다운로드 & 데이터 백업/복구 센터]</span>
                  </div>
                  
                  {/* Option A: Download Full App Bundle with Custom Icon Dressed */}
                  <div className="mb-4 pb-4 border-b border-slate-250 dark:border-slate-800">
                    <h4 className="text-[11px] font-black text-slate-850 dark:text-slate-200 mb-1 flex items-center gap-1">
                      <span>✓</span>
                      <span>192x192 & 512x512 아이콘 파일 직접 다운로드</span>
                    </h4>
                    <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold leading-relaxed mb-2.5">
                      GitHub Pages 배포 및 PWA 설치에 필요한 정비율 아이콘 이미지 파일(PNG)과 전체 아이콘 압축팩을 원클릭으로 바로 다운로드합니다.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                      <a href="icon-192x192.png"
                        download="icon-192x192.png"
                        className="py-2 px-2.5 rounded-lg border border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-black text-[9.5px] bg-white dark:bg-slate-900 shadow-xs transition-all flex items-center justify-center gap-1 active:scale-95 text-center no-underline"
                        id="download-btn-192"
                      >
                        <Download size={10} className="stroke-[2.5]" />
                        <span>icon-192x192.png</span>
                      </a>
                      <a href="icon-512x512.png"
                        download="icon-512x512.png"
                        className="py-2 px-2.5 rounded-lg border border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-black text-[9.5px] bg-white dark:bg-slate-900 shadow-xs transition-all flex items-center justify-center gap-1 active:scale-95 text-center no-underline"
                        id="download-btn-512"
                      >
                        <Download size={10} className="stroke-[2.5]" />
                        <span>icon-512x512.png</span>
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            showToast('📦 아이콘 압축팩 생성 중...', 'info');
                            await downloadIconsBundleZip();
                            showToast('📦 아이콘 전체 압축팩 다운로드가 완료되었습니다!', 'success');
                          } catch (e) {
                            showToast('아이콘 다운로드 중 오류가 발생했습니다.', 'error');
                          }
                        }}
                        className="py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9.5px] shadow-xs transition-all flex items-center justify-center gap-1 active:scale-95 text-center cursor-pointer"
                        id="download-btn-icons-zip"
                      >
                        <Download size={10} className="stroke-[2.5]" />
                        <span>📦 아이콘 전체(.zip)</span>
                      </button>
                    </div>

                    <h4 className="text-[11px] font-black text-slate-850 dark:text-slate-200 mb-1 flex items-center gap-1 mt-4">
                      <span>✓</span>
                      <span>GitHub Pages PWA 배포 및 소스코드 / 완제품 파일 다운로드</span>
                    </h4>
                    <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold leading-relaxed mb-2.5">
                      GitHub에 바로 배포하거나 내 컴퓨터에서 소스코드 개발 및 무설치 단독 실행이 가능한 파일들입니다.
                    </p>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            showToast('📦 Vite PWA + GitHub Pages 자동 배포 패키지를 준비 중입니다...', 'info');
                            await downloadViteGitHubPagesPwaZip();
                            showToast('📦 GitHub Pages PWA 패키지(.zip) 다운로드가 완료되었습니다!', 'success');
                          } catch (err) {
                            showToast('❌ 완제품 앱 패키지 다운로드 도중 오류가 발생했습니다.', 'error');
                          }
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-650 to-indigo-650 hover:from-emerald-700 hover:to-indigo-700 text-white font-black text-[10px] uppercase tracking-wider shadow-md hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                        id="download-full-pwa-bundle-btn"
                      >
                        <Download size={11} className="stroke-[2.5]" />
                        <span>🚀 Vite PWA + GitHub Pages 자동 배포 패키지 (.ZIP) 다운로드</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            showToast('📄 단독 실행용 HTML 파일을 생성 중입니다...', 'info');
                            await downloadStandaloneHtmlFile();
                            showToast('📄 단독 실행 HTML 파일 다운로드가 완료되었습니다!', 'success');
                          } catch (err) {
                            showToast('❌ HTML 파일 다운로드 도중 오류가 발생했습니다.', 'error');
                          }
                        }}
                        className="w-full py-2.5 px-3 rounded-xl border-2 border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-black text-[10px] uppercase tracking-wider shadow-xs hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                        id="download-single-html-btn"
                      >
                        <Download size={11} className="stroke-[2.5]" />
                        <span>⚡ 무설치 단독 실행용 단일 파일 (.HTML) 즉시 다운로드</span>
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              showToast('📦 전체 프로젝트 소스코드 압축본을 생성 중입니다...', 'info');
                              await downloadSourceCodeZip();
                              showToast('📦 전체 소스코드(.zip) 다운로드가 완료되었습니다!', 'success');
                            } catch (err) {
                              showToast('❌ 소스코드 압축 다운로드 중 오류가 발생했습니다.', 'error');
                            }
                          }}
                          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-[9.5px] shadow-sm hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                          id="download-all-source-zip-btn"
                        >
                          <Download size={10} className="stroke-[2.5]" />
                          <span>📁 전체 소스코드 패키지 (.ZIP)</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              showToast('📦 변경된 핵심 파일 압축본을 생성 중입니다...', 'info');
                              await downloadModifiedFilesZip();
                              showToast('📦 변경 파일 압축(.zip) 다운로드가 완료되었습니다!', 'success');
                            } catch (err) {
                              showToast('❌ 변경 파일 압축 다운로드 중 오류가 발생했습니다.', 'error');
                            }
                          }}
                          className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9.5px] shadow-sm hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                          id="download-modified-files-zip-btn"
                        >
                          <Download size={10} className="stroke-[2.5]" />
                          <span>✨ 변경된 핵심 파일 모음 (.ZIP)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Option B: Windows Restore / Account Change Backup */}
                  <div>
                    <h4 className="text-[11px] font-black text-slate-850 dark:text-slate-200 mb-1 flex items-center gap-1">
                      <span>✓</span>
                      <span>윈도우 포맷, 기기 복구, 계정 변경 완벽 데이터 복원</span>
                    </h4>
                    <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold leading-relaxed mb-3">
                      컴퓨터를 초기화(복구)하거나 계정을 변경해도 사용 내역이 유실되지 않도록 내 플래너의 모든 할 일 정보를 JSON 백업본으로 안전히 생성·복구합니다.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {/* Export Button */}
                      <button
                        type="button"
                        onClick={handleExportBackup}
                        className="py-2.5 px-2.5 rounded-lg border border-emerald-500 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold text-[9px] tracking-tight bg-white dark:bg-slate-900 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                        id="backup-export-trigger-btn"
                      >
                        <Download size={10} className="stroke-[2.5]" />
                        <span>데이터 백업본 받기 (JSON)</span>
                      </button>

                      {/* Import Button with Styled Wrapper */}
                      <div className="relative">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportBackup}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                          id="backup-import-file-input"
                        />
                        <button
                          type="button"
                          className="w-full h-full py-2.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-extrabold text-[9px] tracking-tight bg-white dark:bg-slate-900 shadow-sm transition-all flex items-center justify-center gap-1 pointer-events-none"
                          id="backup-import-label-btn"
                        >
                          <Upload size={10} className="stroke-[2.5]" />
                          <span>백업본 복원/가져오기</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <button
                  type="button"
                  onClick={() => setShowInstallGuide(false)}
                  className="w-full mt-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-55 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all duration-200 shadow-2xs active:scale-98 cursor-pointer"
                  id="pwa-guide-confirm-btn"
                >
                  가이드 닫기
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Glassmorphic Edit Todo details overlay modal */}
      <EditTodoModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        todo={editingTodo}
        onEditTodo={handleEditTodo}
      />

      {/* 3D Glassmorphic Custom Confirmation Dialog */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 shadow-2xl" id="custom-confirm-overlay">
            {/* Dark glass backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-2xl backdrop-blur-xl text-center z-10"
              id="custom-confirm-body"
            >
              <div className="flex justify-center mb-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center border shadow-inner ${
                  confirmModal.isDestructive 
                    ? 'bg-rose-50 border-rose-200 text-rose-500' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-500'
                }`}>
                  <AlertCircle size={22} />
                </div>
              </div>

              <h2 className="text-base font-black text-slate-950 mb-2 tracking-tight">
                {confirmModal.title}
              </h2>

              <p className="text-xs text-slate-705 leading-relaxed mb-6 font-semibold px-2">
                {confirmModal.message}
              </p>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-705 font-black py-2.5 text-xs transition-all duration-200 cursor-pointer shadow-2xs active:scale-95"
                  id="custom-confirm-cancel-btn"
                >
                  {confirmModal.cancelText || '취소'}
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 rounded-xl text-white font-black py-2.5 text-xs transition-all duration-200 shadow-md active:scale-95 cursor-pointer ${
                    confirmModal.isDestructive
                      ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-500/10'
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-600/10'
                  }`}
                  id="custom-confirm-action-btn"
                >
                  {confirmModal.confirmText || '확인'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Glassmorphic Toast Alert Notifications popups */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3.5 shadow-xl border backdrop-blur-xl ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50/90 border-emerald-300 shadow-emerald-500/5 text-emerald-950'
                : toastMessage.type === 'error'
                ? 'bg-rose-50/90 border-rose-300 shadow-rose-500/5 text-rose-950'
                : 'bg-emerald-50/90 border-emerald-300 shadow-emerald-500/5 text-emerald-950'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle size={15} className="text-emerald-600" />}
            {toastMessage.type === 'error' && <AlertCircle size={15} className="text-rose-600 animate-pulse" />}
            {toastMessage.type === 'info' && <Bell size={15} className="text-emerald-600 animate-bounce" />}
            <span className="text-xs font-extrabold leading-none">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
