import {
  calendarCells,
  combineLocalDateAndTime,
  dateKey,
  monthRange,
} from '../src/features/agenda/utils/date';

describe('agenda date helpers', () => {
  test('builds a Monday-first calendar grid', () => {
    const cells = calendarCells(new Date(2026, 7, 1));
    const firstDate = cells.find(Boolean);

    expect(firstDate).not.toBeNull();
    expect(firstDate?.getDate()).toBe(1);
    expect(cells.length % 7).toBe(0);
  });

  test('combines local day and HH:mm safely', () => {
    const result = combineLocalDateAndTime(new Date(2026, 7, 19), '09:30');

    expect(result?.getHours()).toBe(9);
    expect(result?.getMinutes()).toBe(30);
    expect(dateKey(result as Date)).toBe('2026-08-19');
    expect(combineLocalDateAndTime(new Date(), '25:00')).toBeNull();
  });

  test('returns an exclusive next-month range', () => {
    const range = monthRange(new Date(2026, 7, 20));
    const start = new Date(range.startIso);
    const end = new Date(range.endIso);

    expect(start.getMonth()).toBe(7);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(8);
    expect(end.getDate()).toBe(1);
  });
});
