import { PARTICIPANTS } from '@/lib/participants';
import { getChallengeValue } from '@/lib/storage';
import { formatDateKey, addDays } from '@/lib/dateUtils';

interface ParticipantStats {
  id: string;
  name: string;
  color: string;
  streak: number;
  perfectDays: number;
  completion: number;
  runs: number;
  gyms: number;
  totalSteps: number;
  totalWater: number;
}

function calcStats(): ParticipantStats[] {
  const today = new Date();
  return PARTICIPANTS.map(p => {
    let streak = 0, perfectDays = 0, totalChallenges = 0, completedChallenges = 0;
    let runs = 0, gyms = 0, totalSteps = 0, totalWater = 0;
    let currentStreak = 0;

    for (let i = 60; i >= 0; i--) {
      const d = addDays(today, -i);
      const dk = formatDateKey(d);
      let dayComplete = 0;
      let dayTotal = 5;

      const ff = getChallengeValue(p.id, dk, 'fastfood');
      if (ff === true) dayComplete++;
      const water = getChallengeValue(p.id, dk, 'water') ?? 0;
      if (water >= p.waterGoal) dayComplete++;
      totalWater += water;
      const run = getChallengeValue(p.id, dk, 'running');
      if (run === true) { dayComplete++; runs++; }
      const gym = getChallengeValue(p.id, dk, 'gym');
      if (gym === true) { dayComplete++; gyms++; }
      const steps = getChallengeValue(p.id, dk, 'steps') ?? 0;
      if (steps >= 10) dayComplete++;
      totalSteps += steps;

      // Only count days that have any data
      const hasData = ff !== undefined || water > 0 || run !== undefined || gym !== undefined || steps > 0;
      if (hasData) {
        totalChallenges += dayTotal;
        completedChallenges += dayComplete;
        if (dayComplete === dayTotal) { perfectDays++; currentStreak++; }
        else currentStreak = 0;
      }
    }

    return {
      id: p.id,
      name: p.name,
      color: p.color,
      streak: currentStreak,
      perfectDays,
      completion: totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0,
      runs, gyms, totalSteps, totalWater,
    };
  });
}

export default function Ranking() {
  const stats = calcStats().sort((a, b) => {
    if (b.completion !== a.completion) return b.completion - a.completion;
    return b.perfectDays - a.perfectDays;
  });

  const metrics = [
    { label: '🏃 Corridas', key: 'runs' as const },
    { label: '🏋️ Academia', key: 'gyms' as const },
    { label: '👟 Passos (k)', key: 'totalSteps' as const },
    { label: '💧 Água (L)', key: 'totalWater' as const },
  ];

  return (
    <div className="pb-24 px-4 max-w-[680px] mx-auto">
      <h2 className="text-lg font-bold py-4 text-foreground">Ranking</h2>

      <div className="flex flex-col gap-2 mb-6">
        {stats.map((s, i) => (
          <div
            key={s.id}
            className={`surface-1 rounded-xl p-4 border transition-all animate-fade-in ${i === 0 ? 'border-warning/40' : 'border-border'}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="text-xl font-extrabold w-8 text-center" style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'hsl(240 5% 55%)' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: s.color + '20', color: s.color }}
              >
                {s.name[0]}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-foreground">{s.name}</div>
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>🔥 {s.streak}d</span>
                  <span>⭐ {s.perfectDays} perfeitos</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.completion}%</div>
                <div className="text-[10px] text-muted-foreground">conclusão</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Metric comparisons */}
      <h3 className="text-sm font-semibold text-foreground mb-3">Comparativos</h3>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(m => {
          const maxVal = Math.max(...stats.map(s => s[m.key]), 1);
          return (
            <div key={m.key} className="surface-1 rounded-xl p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-2">{m.label}</div>
              {stats.map(s => (
                <div key={s.id} className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-medium w-5" style={{ color: s.color }}>{s.name[0]}</span>
                  <div className="flex-1 h-2 rounded-full surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(s[m.key] / maxVal) * 100}%`, backgroundColor: s.color }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{s[m.key]}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
