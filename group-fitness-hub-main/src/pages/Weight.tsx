import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getWeightValue, setWeightValue } from '@/lib/storage';
import { toast } from 'sonner';

function generateWeeks(): { date: string; dateKey: string; label: string }[] {
  const weeks = [];
  const start = new Date(2026, 3, 6); // April 6, 2026 (Monday)
  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i * 7);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    weeks.push({
      date: `${day}/${month}`,
      dateKey: `${day}/${month}`,
      label: `Semana ${i + 1}`,
    });
  }
  return weeks;
}

const FIELDS = [
  { key: 'weight', label: 'Peso (kg)', type: 'number' },
  { key: 'waist', label: 'Cintura (cm)', type: 'number' },
  { key: 'hip', label: 'Quadril (cm)', type: 'number' },
  { key: 'arm', label: 'Braço (cm)', type: 'number' },
  { key: 'thigh', label: 'Coxa (cm)', type: 'number' },
  { key: 'notes', label: 'Observações', type: 'text' },
];

export default function Weight() {
  const { currentUser } = useUser();
  const [, refresh] = useState(0);

  if (!currentUser) return null;

  const weeks = generateWeeks();
  const userColor = currentUser.color;

  const get = (dateKey: string, field: string) => getWeightValue(currentUser.id, dateKey, field);
  const set = (dateKey: string, field: string, value: any) => {
    setWeightValue(currentUser.id, dateKey, field, value);
    refresh(n => n + 1);
    toast.success('Salvo!', { duration: 1000 });
  };

  const getVariation = (weekIdx: number, field: string): { value: number; color: string } | null => {
    if (weekIdx === 0) return null;
    const current = get(weeks[weekIdx].dateKey, field);
    const prev = get(weeks[weekIdx - 1].dateKey, field);
    if (current == null || prev == null || current === '' || prev === '') return null;
    const diff = Number(current) - Number(prev);
    if (diff === 0) return { value: 0, color: 'hsl(240 5% 55%)' };
    // For weight/waist: losing = green, gaining = red
    return { value: diff, color: diff < 0 ? 'hsl(142 76% 36%)' : 'hsl(0 72% 51%)' };
  };

  return (
    <div className="pb-24 px-4 max-w-[680px] mx-auto">
      <h2 className="text-lg font-bold py-4 text-foreground">⚖️ Peso & Medidas</h2>

      <div className="flex flex-col gap-3">
        {weeks.map((w, wi) => (
          <div key={w.dateKey} className="surface-1 rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm" style={{ color: userColor }}>{w.label}</span>
              <span className="text-xs text-muted-foreground">{w.date}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FIELDS.map(f => {
                const variation = f.type === 'number' ? getVariation(wi, f.key) : null;
                return (
                  <div key={f.key} className={f.key === 'notes' ? 'col-span-2' : ''}>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">{f.label}</label>
                    <div className="flex items-center gap-1">
                      <input
                        type={f.type}
                        step={f.type === 'number' ? '0.1' : undefined}
                        value={get(w.dateKey, f.key) ?? ''}
                        onChange={e => set(w.dateKey, f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                        className="w-full surface-2 rounded-lg px-2 py-1.5 text-sm text-foreground outline-none"
                      />
                      {variation && variation.value !== 0 && (
                        <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: variation.color }}>
                          {variation.value > 0 ? '+' : ''}{variation.value.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
