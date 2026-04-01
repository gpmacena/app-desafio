import { useUser } from '@/contexts/UserContext';
import { PARTICIPANTS } from '@/lib/participants';

export default function Login() {
  const { login } = useUser();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            <span className="text-primary">Fit</span>Challenge
          </h1>
          <p className="text-muted-foreground text-sm">Quem é você hoje?</p>
        </div>
        <div className="flex flex-col gap-3">
          {PARTICIPANTS.map((p) => (
            <button
              key={p.id}
              onClick={() => login(p.id)}
              className="flex items-center gap-4 w-full p-4 rounded-xl surface-1 border border-border hover:border-opacity-80 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ borderColor: p.color + '40' }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                style={{ backgroundColor: p.color + '20', color: p.color }}
              >
                {p.name[0]}
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">Meta água: {p.waterGoal}L/dia</div>
              </div>
              <div className="ml-auto text-muted-foreground">→</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
