import {
  formatHomeDate,
  formatHomeTime,
  getHomeGreeting,
} from '../src/features/home/utils/homeDate';

describe('Home date helpers', () => {
  test.each([
    [5, 'Selamat pagi'],
    [10, 'Selamat pagi'],
    [11, 'Selamat siang'],
    [14, 'Selamat siang'],
    [15, 'Selamat sore'],
    [18, 'Selamat sore'],
    [19, 'Selamat malam'],
    [23, 'Selamat malam'],
  ])('returns the right greeting for hour %s', (hour, expected) => {
    expect(getHomeGreeting(hour)).toBe(expected);
  });

  it('formats Indonesian date without the year for the compact hero row', () => {
    const date = new Date('2026-09-08T09:26:44+07:00');
    expect(formatHomeDate(date)).toMatch(/Sel|8|Sep/i);
  });

  it('formats time with seconds', () => {
    const date = new Date('2026-09-08T09:26:44+07:00');
    expect(formatHomeTime(date)).toMatch(/^\d{2}[.:]\d{2}[.:]\d{2}$/);
  });
});
