/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubTodo {
  id: string;
  text: string;
  completed: boolean;
}

export type Category = 'Work' | 'Personal' | 'Shopping' | 'Creative' | 'Health' | 'All';

export type Priority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  category: Exclude<Category, 'All'>;
  priority: Priority;
  dueDate?: string;
  subtasks: SubTodo[];
  createdAt: string;
  completedAt?: string;
  alarmTime?: string; // Format: "YYYY-MM-DDTHH:MM" or similar
  alarmActive?: boolean;
  alarmDismissed?: boolean;
  alarmRepeat?: AlarmRepeatType;
  alarmRepeatDays?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  alarmRepeatInterval?: number; // Custom interval (e.g., 30 for 30 minutes, 5 for 5 hours)
  alarmSound?: AlarmSoundType;
  calendarEventId?: string;
  calendarSynced?: boolean;
}

export type AlarmRepeatType = 'none' | 'minute' | 'hour' | 'daily' | 'weekly' | 'monthly_lastday' | 'monthly_day';
export type AlarmSoundType = 'zen_bell' | 'digital_beep' | 'morning_harp' | 'cosmic_synth';

export interface ConfettiParticle {
  id: string;
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
  size: number;
  spin: number;
}

export type MoodType = 'great' | 'good' | 'calm' | 'tired' | 'stressed';

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mood: MoodType;
  content: string;
  gratitude?: string;
  createdAt: string;
}

export interface AIDiagnosisTip {
  title: string;
  description: string;
}

export interface AIDiagnosisSuggestion {
  title: string;
  description: string;
  category: Exclude<Category, 'All'>;
  priority: Priority;
  dueDateOffset: number;
  subtasks: string[];
}

export interface AIDiagnosisData {
  feedback: string;
  tips: AIDiagnosisTip[];
  suggestions: AIDiagnosisSuggestion[];
  analyzedAt: string;
  isOfflineFallback?: boolean;
}
