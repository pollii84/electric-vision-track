import { getTenantCollection } from '@/lib/firestore';

const DAILY_STANDARD_CAP = 8;

// dateStr: 'YYYY-MM-DD'
export function isWeekendDate(dateStr) {
  if (!dateStr) return false;
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

// Splits a newly-approved task's hours into standard/overtime/weekend buckets.
// existingWeekdayHoursForDate is the worker's already-approved standard+overtime
// hours on that same calendar date (from OTHER timesheets), so the 8h/day
// threshold accumulates across tasks rather than resetting per task.
export function splitHoursByRule(workDate, newHours, existingWeekdayHoursForDate = 0) {
  const hours = Number(newHours) || 0;

  if (isWeekendDate(workDate)) {
    return { standardHours: 0, overtimeHours: 0, weekendHours: hours };
  }

  const remaining = Math.max(0, DAILY_STANDARD_CAP - existingWeekdayHoursForDate);
  const standardHours = Math.min(remaining, hours);
  const overtimeHours = hours - standardHours;
  return { standardHours, overtimeHours, weekendHours: 0 };
}

// Sums this worker's existing standard+overtime hours already logged for a
// given date, across all their (approved or manually-entered) timesheets.
export async function getExistingWeekdayHoursForDate(tenantId, workerId, workDate) {
  if (!tenantId || !workerId || !workDate) return 0;
  const entries = await getTenantCollection(tenantId, 'timesheets', {
    filters: [
      { field: 'workerId', op: '==', value: workerId },
      { field: 'date', op: '==', value: workDate },
    ],
  });
  return entries.reduce(
    (sum, e) => sum + (Number(e.standardHours) || 0) + (Number(e.overtimeHours) || 0),
    0
  );
}

export async function getTenantManagerUids(tenantId) {
  if (!tenantId) return [];
  const members = await getTenantCollection(tenantId, 'members', {
    filters: [{ field: 'role', op: 'in', value: ['owner', 'manager'] }],
  });
  return members.map((m) => m.id);
}
