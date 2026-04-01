import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getRunningValue, setRunningValue } from '@/lib/storage';
import { toast } from 'sonner';

interface Session {
  date: string;
  dateKey: string;
  weekday: string;
  phase: number;
  protocol: string;
}

const PHASE_COLORS: Record<number, string> = {
  1: '#3b82f6',
  2: '#8b5cf6',
  3: '#f59e0b',
  4: '#ef4444',
};

const PHASE_LABELS: Record<number, string> = {
  1: 'Fase 1',
  2: 'Fase 2',
  3: 'Fase 3',
  4: 'Fase 4',
};

function generateSessions(): Session[] {
  const sessions: Session[] = [];
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // 24 sessions, 3x per week, starting April 1 2026
  const startDate = new Date(2026, 3, 1); // April 1, 2026
  const runDays = [1, 3, 5]; // Mon, Wed, Fri

  const protocols: { phase: number; protocol: string }[] = [
    // Sem 1-2: 6 sessions
    ...Array(6).fill({ phase: 1, protocol: '6x (1min corrida + 2min caminhada)' }),
    // Sem 3-4: 6 sessions
    ...Array(6).fill({ phase: 2, protocol: '4x (3min corrida + 1min caminhada)' }),
    // Sem 5-6: 6 sessions
    ...Array(6).fill({ phase: 3, protocol: '3x (8min corrida + 1min caminhada)' }),
    // Sem 7-8: 6 sessions
    ...Array(6).fill({ phase: 4, protocol: '20-30min corrida contínua' }),
  ];

  let sessionIdx = 0;
  const d = new Date(startDate);
  while (sessionIdx < 24) {
    if (runDays.includes(d.getDay())) {
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      sessions.push({
        date: `${day}/${month}`,
        dateKey: `${day}/${month}`,
        weekday: weekdays[d.getDay()],
        ...protocols[sessionIdx],
      });
      sessionIdx++;
    }
    d.setDate(d.getDate() + 1);
  }

  return sessions;
}

export default function Running() {
  const { currentUser } = useUser();
  const [, refresh] = useState(0);

  if (!currentUser) return null;

  const sessions = generateSessions();
  const userColor = currentUser.color;

  const get = (dateKey: string, field: string) => getRunningValue(currentUser.id, dateKey, field);
  const set = (dateKey: string, field: string, value: any) => {
    setRunningValue(currentUser.id, dateKey, field, value);
    refresh(n => n + 1);
    toast.success('Salvo!', { duration: 1000 });
  };

  // Stats
  const doneSessions = sessions.filter(s => get(s.dateKey, 'done') === true).length;
  const totalKm = sessions.reduce((sum, s) => sum + (get(s.dateKey, 'km') ?? 0), 0);
  const progress = Math.round((doneSessions / 24) * 100);
  const avgKm = doneSessions > 0 ? (totalKm / doneSessions).toFixed(1) : '0';

  return (
    <div className="pb-24 px-4 max-w-[680px] mx-auto">
      <h2 className="text-lg font-bold py-4 text-foreground">🏃 Corrida 8 Semanas</h2>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="stat-card"><div className="text-lg font-bold" style={{ color: userColor }}>{doneSessions}/24</div><div className="text-[10px] text-muted-foreground">Sessões</div></div>
        <div className="stat-card"><div className="text-lg font-bold" style={{ color: userColor }}>{totalKm.toFixed(1)}</div><div className="text-[10px] text-muted-foreground">Km total</div></div>
        <div className="stat-card"><div className="text-lg font-bold" style={{ color: userColor }}>{progress}%</div><div className="text-[10px] text-muted-foreground">Progresso</div></div>
        <div className="stat-card"><div className="text-lg font-bold" style={{ color: userColor }}>{avgKm}</div><div className="text-[10px] text-muted-foreground">Km médio</div></div>
      </div>

      {/* Sessions */}
      <div className="flex flex-col gap-2">
        {sessions.map((s, i) => {
          const done = get(s.dateKey, 'done');
          return (
            <div key={i} className={`surface-1 rounded-xl p-3 border ${done === true ? 'border-success/30' : 'border-border'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground w-12">{s.date}</span>
                <span className="text-xs text-muted-foreground w-8">{s.weekday}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: PHASE_COLORS[s.phase] + '20', color: PHASE_COLORS[s.phase] }}>
                  {PHASE_LABELS[s.phase]}
                </span>
                <span className="text-xs text-secondary-foreground flex-1 truncate">{s.protocol}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => set(s.dateKey, 'done', done === true ? undefined : true)} className="px-2 py-1 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: done === true ? 'hsl(142 76% 36% / 0.3)' : 'hsl(240 14% 14%)', color: done === true ? 'hsl(142 76% 36%)' : 'hsl(240 5% 55%)' }}>
                  {done === true ? '✓ Feito' : 'Marcar'}
                </button>
                <input type="number" placeholder="min" value={get(s.dateKey, 'minutes') ?? ''} onChange={e => set(s.dateKey, 'minutes', Number(e.target.value))} className="w-14 surface-2 rounded-lg px-2 py-1 text-xs text-foreground text-center outline-none" />
                <input type="number" step="0.1" placeholder="km" value={get(s.dateKey, 'km') ?? ''} onChange={e => set(s.dateKey, 'km', Number(e.target.value))} className="w-14 surface-2 rounded-lg px-2 py-1 text-xs text-foreground text-center outline-none" />
                <input type="number" placeholder="bpm" value={get(s.dateKey, 'hr') ?? ''} onChange={e => set(s.dateKey, 'hr', Number(e.target.value))} className="w-14 surface-2 rounded-lg px-2 py-1 text-xs text-foreground text-center outline-none" />
                <input type="text" placeholder="sensação" value={get(s.dateKey, 'feeling') ?? ''} onChange={e => set(s.dateKey, 'feeling', e.target.value)} className="flex-1 min-w-[60px] surface-2 rounded-lg px-2 py-1 text-xs text-foreground outline-none" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
