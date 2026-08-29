import { Todo } from '../types';

// Helper to add days to a date string (YYYY-MM-DD)
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// Get system local timezone
const getLocalTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (e) {
    return 'UTC';
  }
};

/**
 * Syncs a todo to Google Calendar.
 * Returns the event ID from Google Calendar if successful.
 */
export async function syncTodoToGoogleCalendar(todo: Todo, accessToken: string): Promise<string> {
  if (!todo.dueDate) {
    throw new Error('마감일(Due Date)이 지정되지 않은 계획은 캘린더에 연동할 수 없습니다.');
  }

  const url = todo.calendarEventId
    ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${todo.calendarEventId}`
    : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  const method = todo.calendarEventId ? 'PUT' : 'POST';

  const localTz = getLocalTimeZone();
  const eventBody: any = {
    summary: todo.title,
    description: todo.description || 'Glassmorphic 3D Planner에서 등록된 계획',
    reminders: {
      useDefault: true,
    },
  };

  // If we have alarmTime, make it a timed event, otherwise keep it as an all-day event
  if (todo.alarmTime) {
    const startDateTime = new Date(todo.alarmTime);
    // End time is 1 hour after start time
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    eventBody.start = {
      dateTime: startDateTime.toISOString(),
      timeZone: localTz,
    };
    eventBody.end = {
      dateTime: endDateTime.toISOString(),
      timeZone: localTz,
    };
  } else {
    // All-day event
    eventBody.start = {
      date: todo.dueDate,
    };
    // The end date of an all-day event is exclusive.
    // So for a single day event, start: "2026-06-02", end: "2026-06-03"
    eventBody.end = {
      date: addDays(todo.dueDate, 1),
    };
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Calendar Sync Error response:', errorText);
    throw new Error(`Google Calendar 연동 실패: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return result.id;
}

/**
 * Deletes a todo event from Google Calendar.
 */
export async function deleteTodoFromGoogleCalendar(eventId: string, accessToken: string): Promise<boolean> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // 404 means already deleted by the user or doesn't exist, which is fine
    if (response.ok || response.status === 404) {
      return true;
    }

    const errorText = await response.text();
    console.error('Google Calendar Delete Error:', errorText);
    return false;
  } catch (error) {
    console.error('Failed to contact Google Calendar for deletion:', error);
    return false;
  }
}
