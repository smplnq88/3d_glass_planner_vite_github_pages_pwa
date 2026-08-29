/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlarmRepeatType } from '../types';

/**
 * Calculates the next trigger date-time for a recurring alarm that is strictly in the future compared to referenceTime.
 * @param originalAlarmTime The original/start date-time (e.g. "2026-06-02T19:00")
 * @param repeatType Type of recurrence
 * @param repeatDays Days of the week for weekly recurrence (0 = Sun, 1 = Mon, ..., 6 = Sat)
 * @param referenceTime Reference time cutoff (defaults to now)
 * @returns Format "YYYY-MM-DDTHH:MM" or null if non-repeating or invalid
 */
export function getNextAlarmTime(
  originalAlarmTime: string,
  repeatType: AlarmRepeatType,
  repeatDays: number[] = [],
  referenceTime: Date = new Date(),
  repeatInterval?: number
): string | null {
  if (!originalAlarmTime || repeatType === 'none' || !repeatType) {
    return null;
  }

  const start = new Date(originalAlarmTime);
  if (isNaN(start.getTime())) {
    return null;
  }

  const originalHours = start.getHours();
  const originalMinutes = start.getMinutes();

  // Working copy
  let candidate = new Date(start.getTime());
  if (repeatType !== 'minute' && repeatType !== 'hour') {
    candidate.setHours(originalHours, originalMinutes, 0, 0);
  } else {
    candidate.setSeconds(0, 0);
  }

  const interval = repeatInterval && repeatInterval > 0 ? repeatInterval : 1;

  // Define how to advance candidate date by 1 step according to repetition rule
  const advanceOneStep = (date: Date) => {
    if (repeatType === 'minute') {
      date.setMinutes(date.getMinutes() + interval);
    } else if (repeatType === 'hour') {
      date.setHours(date.getHours() + interval);
    } else if (repeatType === 'daily') {
      date.setDate(date.getDate() + 1);
    } else if (repeatType === 'weekly') {
      const daysToTry = repeatDays.length > 0 ? repeatDays : [start.getDay()];
      let found = false;
      // Loop safe up to 1 year
      for (let i = 1; i <= 366; i++) {
        date.setDate(date.getDate() + 1);
        if (daysToTry.includes(date.getDay())) {
          found = true;
          break;
        }
      }
      if (!found) {
        date.setDate(date.getDate() + 1);
      }
    } else if (repeatType === 'monthly_lastday') {
      const currentYear = date.getFullYear();
      const currentMonth = date.getMonth();
      // Month index + 2, date = 0 sets it to the last day of the following month
      date.setFullYear(currentYear, currentMonth + 2, 0);
    } else if (repeatType === 'monthly_day') {
      const targetDay = start.getDate();
      const currentYear = date.getFullYear();
      const currentMonth = date.getMonth();
      
      // Calculate last day of next month to handle overflow issues (e.g., 31st of month)
      const nextMonthMaxDays = new Date(currentYear, currentMonth + 2, 0).getDate();
      const actualDay = Math.min(targetDay, nextMonthMaxDays);
      
      date.setFullYear(currentYear, currentMonth + 1, actualDay);
    }

    if (repeatType !== 'minute' && repeatType !== 'hour') {
      date.setHours(originalHours, originalMinutes, 0, 0);
    } else {
      date.setSeconds(0, 0);
    }
  };

  // Fast-forward candidate if candidate is well behind referenceTime
  if (candidate <= referenceTime) {
    if (repeatType === 'minute') {
      const diffMs = referenceTime.getTime() - candidate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const steps = Math.floor(diffMins / interval);
      if (steps > 0) {
        candidate.setMinutes(candidate.getMinutes() + (steps * interval));
      }
    } else if (repeatType === 'hour') {
      const diffMs = referenceTime.getTime() - candidate.getTime();
      const diffHours = Math.floor(diffMs / 3600000);
      const steps = Math.floor(diffHours / interval);
      if (steps > 0) {
        candidate.setHours(candidate.getHours() + (steps * interval));
      }
    }
  }

  // If candidate is already in the future relative to referenceTime, we first check if it aligns
  if (candidate > referenceTime) {
    if (repeatType === 'weekly' && repeatDays.length > 0) {
      if (repeatDays.includes(candidate.getDay())) {
        return toLocalISOString(candidate);
      }
    } else {
      return toLocalISOString(candidate);
    }
  }

  // Keep advancing until it's strictly in the future compared to referenceTime
  let attempts = 0;
  while (candidate <= referenceTime && attempts < 400) {
    advanceOneStep(candidate);
    attempts++;
  }

  return toLocalISOString(candidate);
}

/**
 * Formats a Date object into "YYYY-MM-DDTHH:MM" for HTML input format.
 */
export function toLocalISOString(date: Date): string {
  const pad = (num: number) => (num < 10 ? '0' : '') + num;
  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes());
}

/**
 * Returns a human-readable Korean label for the repetition setting
 */
export function getRepeatLabel(repeatType: AlarmRepeatType, repeatDays: number[] = [], originalTime?: string, repeatInterval?: number): string {
  if (!repeatType || repeatType === 'none') return '반복 없음';
  
  const interval = repeatInterval && repeatInterval > 1 ? repeatInterval : null;

  if (repeatType === 'minute') {
    return interval ? `${interval}분마다 반복` : '매 분 반복';
  }
  if (repeatType === 'hour') {
    return interval ? `${interval}시간마다 반복` : '매 시간 반복';
  }
  if (repeatType === 'daily') return '매일 반복';
  if (repeatType === 'monthly_lastday') return '매월 말일 반복';
  
  if (repeatType === 'monthly_day') {
    if (originalTime) {
      const d = new Date(originalTime);
      if (!isNaN(d.getTime())) {
        return `매월 ${d.getDate()}일 반복`;
      }
    }
    return '매월 지정일 반복';
  }

  if (repeatType === 'weekly') {
    const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];
    if (!repeatDays || repeatDays.length === 0) return '매주 반복';
    if (repeatDays.length === 7) return '매일 반복';
    
    // Sort so Sun is 0 or Mon is 1. We sort 0..6
    const sortedDays = [...repeatDays].sort((a, b) => a - b);
    const dayNames = sortedDays.map(d => weekdayLabels[d]).join(', ');
    return `매주 [${dayNames}] 반복`;
  }

  return '반복 설정됨';
}
