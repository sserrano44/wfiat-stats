// Date utilities for dashboard

export function getDateRangeDays(range: string): number {
  const match = range.match(/^(\d+)d$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 30; // default
}

export function getDateRange(range: string): { startDate: Date; endDate: Date } {
  const days = getDateRangeDays(range);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  return { startDate, endDate };
}

// Get the Monday of the week containing the given date (ISO week)
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Format date as YYYY-MM-DD for database queries
export function formatDateForDb(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Get list of weeks between two dates
export function getWeeksBetween(startDate: Date, endDate: Date): Date[] {
  const weeks: Date[] = [];
  let current = getWeekStart(startDate);
  const end = getWeekStart(endDate);

  while (current <= end) {
    weeks.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}
