import { useUser } from '@/contexts/UserContext';
import { PARTICIPANTS } from '@/lib/participants';

export default function TopBar() {
  const { currentUser, logout } = useUser();

  if (!currentUser) return null;

  return (
    <div className="sticky top-0 z-40 surface-1 border-b border-border">
      <div className="max-w-[680px] mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: currentUser.color + '20', color: currentUser.color }}
          >
            {currentUser.name[0]}
          </div>
          <span className="font-semibold text-sm">{currentUser.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {PARTICIPANTS.filter(p => p.id !== currentUser.id).map(p => (
              <div key={p.id} className="flex items-center gap-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: p.color + '20', color: p.color }}
                >
                  {p.name[0]}
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-success opacity-60" />
              </div>
            ))}
          </div>
          <button
            onClick={logout}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
