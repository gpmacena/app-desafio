import { useUser } from '@/contexts/UserContext';
import { getChallengeValue } from '@/lib/storage';

function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export default function CalendarPage() {
  const { currentUser } = useUser();
  if (!currentUser) return null;

  const months = [
    { year: 2026, month: 3, label: 'Abril 2026' },
    { year: 2026, month: 4, label: 'Maio 2026' },
  ];

  const today = new Date();
  const userColor = currentUser.color;

  return (
    <div className="pb-24 px-4 max-w-[680px] mx-auto">
      <h2 className="text-lg font-bold py-4 text-foreground">📅 Calendário</h2>

      {months.map(({ year, month, label }) => {
        const days = getMonthDays(year, month);
        const firstDayOfWeek = days[0].getDay();
        const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        return (
          <div key={label} className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">{label}</h3>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
                <div key={i} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array(offset).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
              {days.map(d => {
                const dk = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                const isFuture = d > today;

                let completed = 0;
                if (!isFuture) {
                  if (getChallengeValue(currentUser.id, dk, 'fastfood') === true) completed++;
                  if ((getChallengeValue(currentUser.id, dk, 'water') ?? 0) >= currentUser.waterGoal) completed++;
                  if (getChallengeValue(currentUser.id, dk, 'running') === true) completed++;
                  if (getChallengeValue(currentUser.id, dk, 'gym') === true) completed++;
                  if ((getChallengeValue(currentUser.id, dk, 'steps') ?? 0) >= 10) completed++;
                }

                let bg: string;
                if (isFuture) bg = 'hsl(240 14% 11%)';
                else if (completed === 5) bg = userColor;
                else if (completed > 0) bg = userColor + '50';
                else bg = '#f59e0b40';

                const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();

                return (
                  <div
                    key={d.getDate()}
                    className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs transition-colors ${isToday ? 'ring-2 ring-primary' : ''}`}
                    style={{ backgroundColor: bg }}
                  >
                    <span className={`font-medium ${isFuture ? 'text-muted-foreground' : completed === 5 ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {d.getDate()}
                    </span>
                    {!isFuture && completed > 0 && (
                      <span className="text-[8px] font-bold" style={{ color: completed === 5 ? 'hsl(0 0% 0%)' : 'hsl(0 0% 95%)' }}>{completed}/5</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
