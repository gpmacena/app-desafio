import { useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { formatDateKey, addDays, formatDisplayDate, isToday, getWeekDates, WEEKDAY_LABELS } from '@/lib/dateUtils';
import { getChallengeValue, setChallengeValue } from '@/lib/storage';
import { toast } from 'sonner';

interface ChallengeState {
  fastfood: boolean | undefined;
  water: number;
  running: boolean | undefined;
  gym: boolean | undefined;
  steps: number;
}

function loadChallenges(userId: string, dateKey: string, waterGoal: number): ChallengeState {
  return {
    fastfood: getChallengeValue(userId, dateKey, 'fastfood'),
    water: getChallengeValue(userId, dateKey, 'water') ?? 0,
    running: getChallengeValue(userId, dateKey, 'running'),
    gym: getChallengeValue(userId, dateKey, 'gym'),
    steps: getChallengeValue(userId, dateKey, 'steps') ?? 0,
  };
}

function getStreak(userId: string, challengeId: string, currentDate: Date, waterGoal?: number): number {
  let streak = 0;
  let d = new Date(currentDate);
  d.setDate(d.getDate() - 1);
  while (true) {
    const dk = formatDateKey(d);
    const val = getChallengeValue(userId, dk, challengeId);
    if (challengeId === 'water') {
      if (typeof val === 'number' && val >= (waterGoal ?? 3)) streak++;
      else break;
    } else if (challengeId === 'steps') {
      if (typeof val === 'number' && val >= 10) streak++;
      else break;
    } else {
      if (val === true) streak++;
      else break;
    }
    d.setDate(d.getDate() - 1);
  }
  // Check today too
  const todayKey = formatDateKey(currentDate);
  const todayVal = getChallengeValue(userId, todayKey, challengeId);
  if (challengeId === 'water') {
    if (typeof todayVal === 'number' && todayVal >= (waterGoal ?? 3)) streak++;
  } else if (challengeId === 'steps') {
    if (typeof todayVal === 'number' && todayVal >= 10) streak++;
  } else {
    if (todayVal === true) streak++;
  }
  return streak;
}

function getWeekStats(userId: string, selectedDate: Date) {
  const weekDates = getWeekDates(selectedDate);
  let runs = 0, gyms = 0;
  weekDates.forEach(d => {
    const dk = formatDateKey(d);
    if (getChallengeValue(userId, dk, 'running') === true) runs++;
    if (getChallengeValue(userId, dk, 'gym') === true) gyms++;
  });
  return { runs, gyms };
}

function getWeekChartData(userId: string, selectedDate: Date, waterGoal: number) {
  const weekDates = getWeekDates(selectedDate);
  return weekDates.map((d, i) => {
    const dk = formatDateKey(d);
    let completed = 0;
    if (getChallengeValue(userId, dk, 'fastfood') === true) completed++;
    const water = getChallengeValue(userId, dk, 'water') ?? 0;
    if (water >= waterGoal) completed++;
    if (getChallengeValue(userId, dk, 'running') === true) completed++;
    if (getChallengeValue(userId, dk, 'gym') === true) completed++;
    const steps = getChallengeValue(userId, dk, 'steps') ?? 0;
    if (steps >= 10) completed++;
    return { label: WEEKDAY_LABELS[i], value: completed, isToday: isToday(d) };
  });
}

export default function Challenge() {
  const { currentUser } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate(n => n + 1);

  if (!currentUser) return null;

  const dateKey = formatDateKey(selectedDate);
  const state = loadChallenges(currentUser.id, dateKey, currentUser.waterGoal);

  const set = (challengeId: string, value: any) => {
    setChallengeValue(currentUser.id, dateKey, challengeId, value);
    refresh();
    toast.success('Atualizado!', { duration: 1500 });
  };

  const weekStats = getWeekStats(currentUser.id, selectedDate);
  const chartData = getWeekChartData(currentUser.id, selectedDate, currentUser.waterGoal);
  const currentStreak = getStreak(currentUser.id, 'fastfood', selectedDate);
  const userColor = currentUser.color;

  const challenges = [
    {
      id: 'fastfood',
      icon: '🚫',
      title: 'Zero Fast Food',
      type: 'boolean' as const,
      value: state.fastfood,
      streak: getStreak(currentUser.id, 'fastfood', selectedDate),
    },
    {
      id: 'water',
      icon: '💧',
      title: `Água (meta: ${currentUser.waterGoal}L)`,
      type: 'counter' as const,
      value: state.water,
      step: 0.25,
      unit: 'L',
      goal: currentUser.waterGoal,
      streak: getStreak(currentUser.id, 'water', selectedDate, currentUser.waterGoal),
    },
    {
      id: 'running',
      icon: '🏃',
      title: 'Sessão de Corrida',
      type: 'boolean' as const,
      value: state.running,
      streak: getStreak(currentUser.id, 'running', selectedDate),
    },
    {
      id: 'gym',
      icon: '🏋️',
      title: 'Academia',
      type: 'boolean' as const,
      value: state.gym,
      streak: getStreak(currentUser.id, 'gym', selectedDate),
    },
    {
      id: 'steps',
      icon: '👟',
      title: '10k Passos',
      type: 'counter' as const,
      value: state.steps,
      step: 1,
      unit: 'k',
      goal: 10,
      streak: getStreak(currentUser.id, 'steps', selectedDate),
    },
  ];

  const getStatus = (c: typeof challenges[0]): 'done' | 'failed' | 'pending' => {
    if (c.type === 'boolean') {
      if (c.value === true) return 'done';
      if (c.value === false) return 'failed';
      return 'pending';
    }
    if (c.type === 'counter') {
      if ((c.value as number) >= (c.goal ?? 0)) return 'done';
      if ((c.value as number) > 0) return 'pending';
      return 'pending';
    }
    return 'pending';
  };

  // Calculate all-challenge streak
  let bestStreak = 0;
  let tempStreak = 0;
  for (let i = 30; i >= 0; i--) {
    const d = addDays(selectedDate, -i);
    const dk = formatDateKey(d);
    let allDone = true;
    if (getChallengeValue(currentUser.id, dk, 'fastfood') !== true) allDone = false;
    if ((getChallengeValue(currentUser.id, dk, 'water') ?? 0) < currentUser.waterGoal) allDone = false;
    if (getChallengeValue(currentUser.id, dk, 'running') !== true) allDone = false;
    if (getChallengeValue(currentUser.id, dk, 'gym') !== true) allDone = false;
    if ((getChallengeValue(currentUser.id, dk, 'steps') ?? 0) < 10) allDone = false;
    if (allDone) { tempStreak++; bestStreak = Math.max(bestStreak, tempStreak); }
    else tempStreak = 0;
  }

  return (
    <div className="pb-24 px-4 max-w-[680px] mx-auto">
      {/* Date Navigation */}
      <div className="flex items-center justify-between py-4">
        <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="w-10 h-10 rounded-full surface-2 flex items-center justify-center text-foreground hover:bg-accent transition-colors">
          ←
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-foreground">{formatDisplayDate(selectedDate)}</div>
          {isToday(selectedDate) && <div className="text-xs text-primary font-medium">Hoje</div>}
        </div>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="w-10 h-10 rounded-full surface-2 flex items-center justify-center text-foreground hover:bg-accent transition-colors">
          →
        </button>
      </div>

      {!isToday(selectedDate) && (
        <button onClick={() => setSelectedDate(new Date())} className="w-full mb-4 py-2 rounded-lg surface-2 text-sm text-primary font-medium hover:bg-accent transition-colors">
          ← Ir para Hoje
        </button>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="stat-card">
          <div className="text-lg font-bold" style={{ color: userColor }}>{tempStreak}</div>
          <div className="text-[10px] text-muted-foreground">Streak</div>
        </div>
        <div className="stat-card">
          <div className="text-lg font-bold" style={{ color: userColor }}>{bestStreak}</div>
          <div className="text-[10px] text-muted-foreground">Melhor</div>
        </div>
        <div className="stat-card">
          <div className="text-lg font-bold" style={{ color: userColor }}>{weekStats.runs}</div>
          <div className="text-[10px] text-muted-foreground">Corridas</div>
        </div>
        <div className="stat-card">
          <div className="text-lg font-bold" style={{ color: userColor }}>{weekStats.gyms}</div>
          <div className="text-[10px] text-muted-foreground">Academia</div>
        </div>
      </div>

      {/* Challenge Cards */}
      <div className="flex flex-col gap-3 mb-6">
        {challenges.map((c) => {
          const status = getStatus(c);
          return (
            <div key={c.id} className={`challenge-card ${status}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{c.icon}</span>
                  <span className="font-medium text-sm text-foreground">{c.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {c.streak > 0 && (
                    <span className="text-xs text-muted-foreground">🔥 {c.streak}d</span>
                  )}
                  <span className={`badge-${status}`}>
                    {status === 'done' ? 'Feito' : status === 'failed' ? 'Não feito' : 'Pendente'}
                  </span>
                </div>
              </div>

              {c.type === 'boolean' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => set(c.id, true)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${c.value === true ? 'text-success-foreground' : 'surface-2 text-muted-foreground hover:text-foreground'}`}
                    style={c.value === true ? { backgroundColor: 'hsl(142 76% 36% / 0.3)' } : {}}
                  >
                    ✓ Sim
                  </button>
                  <button
                    onClick={() => set(c.id, false)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${c.value === false ? 'text-destructive-foreground' : 'surface-2 text-muted-foreground hover:text-foreground'}`}
                    style={c.value === false ? { backgroundColor: 'hsl(0 72% 51% / 0.3)' } : {}}
                  >
                    ✗ Não
                  </button>
                </div>
              )}

              {c.type === 'counter' && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => set(c.id, Math.max(0, (c.value as number) - c.step!))}
                    className="w-10 h-10 rounded-full surface-2 flex items-center justify-center text-lg font-bold text-foreground hover:bg-accent transition-colors"
                  >
                    −
                  </button>
                  <div className="text-center min-w-[80px]">
                    <div className="text-3xl font-extrabold" style={{ color: (c.value as number) >= c.goal! ? 'hsl(142 76% 36%)' : userColor }}>
                      {c.value as number}
                    </div>
                    <div className="text-xs text-muted-foreground">{c.unit}</div>
                  </div>
                  <button
                    onClick={() => set(c.id, (c.value as number) + c.step!)}
                    className="w-10 h-10 rounded-full surface-2 flex items-center justify-center text-lg font-bold text-foreground hover:bg-accent transition-colors"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Week Chart */}
      <div className="surface-1 rounded-xl p-4 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Semana Atual</h3>
        <div className="flex items-end justify-between gap-1 h-24">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center h-16">
                <div
                  className="w-full max-w-[28px] rounded-t-md animate-bar-grow origin-bottom"
                  style={{
                    height: `${(d.value / 5) * 100}%`,
                    backgroundColor: d.isToday ? userColor : userColor + '60',
                    minHeight: d.value > 0 ? '4px' : '0',
                  }}
                />
              </div>
              <span className={`text-[10px] ${d.isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
