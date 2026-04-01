import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { formatDateKey, addDays, formatDisplayDate, isToday } from '@/lib/dateUtils';
import { getDiaryValue, setDiaryValue } from '@/lib/storage';
import { toast } from 'sonner';

export default function Diary() {
  const { currentUser } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ workout: true, core: false, run: false });
  const [, refresh] = useState(0);

  if (!currentUser) return null;

  const dateKey = formatDateKey(selectedDate);

  const get = (field: string) => getDiaryValue(currentUser.id, dateKey, field);
  const set = (field: string, value: any) => {
    setDiaryValue(currentUser.id, dateKey, field, value);
    refresh(n => n + 1);
    toast.success('Salvo!', { duration: 1000 });
  };

  const toggle = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const userColor = currentUser.color;

  return (
    <div className="pb-24 px-4 max-w-[680px] mx-auto">
      {/* Date Nav */}
      <div className="flex items-center justify-between py-4">
        <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="w-10 h-10 rounded-full surface-2 flex items-center justify-center text-foreground">←</button>
        <div className="text-center">
          <div className="text-sm font-semibold text-foreground">{formatDisplayDate(selectedDate)}</div>
          {isToday(selectedDate) && <div className="text-xs text-primary font-medium">Hoje</div>}
        </div>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="w-10 h-10 rounded-full surface-2 flex items-center justify-center text-foreground">→</button>
      </div>

      {/* Workout Section */}
      <div className="surface-1 rounded-xl border border-border mb-3 overflow-hidden">
        <button onClick={() => toggle('workout')} className="w-full flex items-center justify-between p-4">
          <span className="font-semibold text-sm text-foreground">🏋️ Treino Geral</span>
          <span className="text-muted-foreground text-sm">{openSections.workout ? '▾' : '▸'}</span>
        </button>
        {openSections.workout && (
          <div className="px-4 pb-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-foreground">Fez treino?</span>
              <div className="flex gap-2">
                <button onClick={() => set('workout_done', true)} className="px-3 py-1 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: get('workout_done') === true ? userColor + '30' : 'hsl(240 14% 14%)', color: get('workout_done') === true ? userColor : 'hsl(240 5% 55%)' }}>Sim</button>
                <button onClick={() => set('workout_done', false)} className="px-3 py-1 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: get('workout_done') === false ? 'hsl(0 72% 51% / 0.3)' : 'hsl(240 14% 14%)', color: get('workout_done') === false ? 'hsl(0 72% 51%)' : 'hsl(240 5% 55%)' }}>Não</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-foreground">Duração (min)</span>
              <input type="number" value={get('workout_duration') ?? ''} onChange={e => set('workout_duration', Number(e.target.value))} className="w-20 bg-surface-2 surface-2 rounded-lg px-2 py-1 text-sm text-foreground text-center outline-none" />
            </div>
            <div>
              <span className="text-sm text-secondary-foreground mb-1 block">Energia (1-5)</span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => set('workout_energy', n)} className="w-9 h-9 rounded-lg text-sm font-bold transition-all" style={{ backgroundColor: get('workout_energy') === n ? userColor + '30' : 'hsl(240 14% 14%)', color: get('workout_energy') === n ? userColor : 'hsl(240 5% 55%)' }}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sm text-secondary-foreground mb-1 block">Observações</span>
              <textarea value={get('workout_notes') ?? ''} onChange={e => set('workout_notes', e.target.value)} className="w-full surface-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none resize-none" rows={2} />
            </div>
          </div>
        )}
      </div>

      {/* Core Section */}
      <div className="surface-1 rounded-xl border border-border mb-3 overflow-hidden">
        <button onClick={() => toggle('core')} className="w-full flex items-center justify-between p-4">
          <span className="font-semibold text-sm text-foreground">🧘 Lombar & Core</span>
          <span className="text-muted-foreground text-sm">{openSections.core ? '▾' : '▸'}</span>
        </button>
        {openSections.core && (
          <div className="px-4 pb-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-foreground">Bird-dog?</span>
              <div className="flex gap-2">
                <button onClick={() => set('core_birddog', true)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: get('core_birddog') === true ? userColor + '30' : 'hsl(240 14% 14%)', color: get('core_birddog') === true ? userColor : 'hsl(240 5% 55%)' }}>Sim</button>
                <button onClick={() => set('core_birddog', false)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: get('core_birddog') === false ? 'hsl(0 72% 51% / 0.3)' : 'hsl(240 14% 14%)', color: get('core_birddog') === false ? 'hsl(0 72% 51%)' : 'hsl(240 5% 55%)' }}>Não</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-foreground">Prancha (seg)</span>
              <input type="number" value={get('core_plank') ?? ''} onChange={e => set('core_plank', Number(e.target.value))} className="w-20 surface-2 rounded-lg px-2 py-1 text-sm text-foreground text-center outline-none" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-foreground">Dead bug?</span>
              <div className="flex gap-2">
                <button onClick={() => set('core_deadbug', true)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: get('core_deadbug') === true ? userColor + '30' : 'hsl(240 14% 14%)', color: get('core_deadbug') === true ? userColor : 'hsl(240 5% 55%)' }}>Sim</button>
                <button onClick={() => set('core_deadbug', false)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: get('core_deadbug') === false ? 'hsl(0 72% 51% / 0.3)' : 'hsl(240 14% 14%)', color: get('core_deadbug') === false ? 'hsl(0 72% 51%)' : 'hsl(240 5% 55%)' }}>Não</button>
              </div>
            </div>
            <div>
              <span className="text-sm text-secondary-foreground mb-1 block">Dor lombar (0-10)</span>
              <div className="flex gap-1 flex-wrap">
                {Array.from({length: 11}, (_, i) => (
                  <button key={i} onClick={() => set('core_pain', i)} className="w-8 h-8 rounded-lg text-xs font-bold transition-all" style={{ backgroundColor: get('core_pain') === i ? (i <= 3 ? userColor + '30' : i <= 6 ? '#f59e0b30' : '#ef444430') : 'hsl(240 14% 14%)', color: get('core_pain') === i ? (i <= 3 ? userColor : i <= 6 ? '#f59e0b' : '#ef4444') : 'hsl(240 5% 55%)' }}>{i}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Running Section */}
      <div className="surface-1 rounded-xl border border-border mb-3 overflow-hidden">
        <button onClick={() => toggle('run')} className="w-full flex items-center justify-between p-4">
          <span className="font-semibold text-sm text-foreground">🏃 Corrida</span>
          <span className="text-muted-foreground text-sm">{openSections.run ? '▾' : '▸'}</span>
        </button>
        {openSections.run && (
          <div className="px-4 pb-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-foreground">Fez corrida?</span>
              <div className="flex gap-2">
                <button onClick={() => set('run_done', true)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: get('run_done') === true ? userColor + '30' : 'hsl(240 14% 14%)', color: get('run_done') === true ? userColor : 'hsl(240 5% 55%)' }}>Sim</button>
                <button onClick={() => set('run_done', false)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: get('run_done') === false ? 'hsl(0 72% 51% / 0.3)' : 'hsl(240 14% 14%)', color: get('run_done') === false ? 'hsl(0 72% 51%)' : 'hsl(240 5% 55%)' }}>Não</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-foreground">Tempo (min)</span>
              <input type="number" value={get('run_time') ?? ''} onChange={e => set('run_time', Number(e.target.value))} className="w-20 surface-2 rounded-lg px-2 py-1 text-sm text-foreground text-center outline-none" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-foreground">Distância (km)</span>
              <input type="number" step="0.1" value={get('run_distance') ?? ''} onChange={e => set('run_distance', Number(e.target.value))} className="w-20 surface-2 rounded-lg px-2 py-1 text-sm text-foreground text-center outline-none" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
